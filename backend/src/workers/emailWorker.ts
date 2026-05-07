import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { config } from '../config/index';
import { prisma } from '../config/prisma';
import { sendEmail } from '../services/emailService';
import { checkRateLimit, enforceDelay } from '../services/rateLimiter';
import { emailQueue } from '../queues/emailQueue';

interface EmailJobData {
  emailJobId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
  senderName: string;
}

const processEmailJob = async (job: Job<EmailJobData>) => {
  const { emailJobId, recipientEmail, subject, body, senderName } = job.data;

  console.log(`Processing job ${emailJobId} for ${recipientEmail}`);

  // Check idempotency - don't send if already sent
  const dbJob = await prisma.emailJob.findUnique({ where: { id: emailJobId } });
  if (!dbJob || dbJob.status === 'sent') {
    console.log(`Job ${emailJobId} already sent or not found, skipping`);
    return { skipped: true };
  }

  // Check rate limit
  const rateCheck = await checkRateLimit();
  if (!rateCheck.allowed) {
    console.log(`Rate limit exceeded. Rescheduling job ${emailJobId} for ${rateCheck.retryAfterMs}ms later`);

    await emailQueue.add(
      'send-email',
      job.data,
      {
        delay: rateCheck.retryAfterMs + 1000,
        jobId: `${emailJobId}-retry-${Date.now()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { status: 'queued' },
    });

    return { rescheduled: true };
  }

  // Update status to queued (processing)
  await prisma.emailJob.update({
    where: { id: emailJobId },
    data: { status: 'queued' },
  });

  // Enforce minimum delay between sends
  await enforceDelay();

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      body,
      from: `"${senderName}" <scheduler@emailscheduler.com>`,
    });

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'sent',
        sentTime: new Date(),
      },
    });

    console.log(`Email sent successfully: ${emailJobId} -> ${recipientEmail}`);
    return { sent: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send email ${emailJobId}:`, error);

    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: {
        status: 'failed',
        retryCount: { increment: 1 },
      },
    });

    throw error;
  }
};

export const startEmailWorker = () => {
  const worker = new Worker<EmailJobData>('email-queue', processEmailJob, {
    connection: createRedisConnection(),
    concurrency: config.worker.concurrency,
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log(`Email worker started with concurrency: ${config.worker.concurrency}`);
  return worker;
};
