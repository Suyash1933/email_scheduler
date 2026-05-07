import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/emailQueue';
import { v4 as uuidv4 } from 'uuid';

interface ScheduleEmailBody {
  subject: string;
  body: string;
  recipients: string[];
  scheduledTime: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
}

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const { subject, body, recipients, scheduledTime, delayBetweenEmails = 2000 } =
      req.body as ScheduleEmailBody;
    const user = req.user as any;

    if (!subject || !body || !recipients?.length || !scheduledTime) {
      return res.status(400).json({ error: 'Missing required fields: subject, body, recipients, scheduledTime' });
    }

    const baseTime = new Date(scheduledTime).getTime();
    const now = Date.now();

    if (baseTime < now) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const createdJobs = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i].trim();
      if (!recipientEmail) continue;

      const jobScheduledTime = new Date(baseTime + i * delayBetweenEmails);
      const delay = jobScheduledTime.getTime() - now;

      const emailJob = await prisma.emailJob.create({
        data: {
          id: uuidv4(),
          recipientEmail,
          subject,
          body,
          scheduledTime: jobScheduledTime,
          status: 'scheduled',
          senderId: user.id,
        },
      });

      const bullJob = await emailQueue.add(
        'send-email',
        {
          emailJobId: emailJob.id,
          recipientEmail,
          subject,
          body,
          senderEmail: user.email,
          senderName: user.name,
        },
        {
          delay: Math.max(delay, 0),
          jobId: emailJob.id,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: { bullmqJobId: bullJob.id },
      });

      createdJobs.push(emailJob);
    }

    return res.status(201).json({
      message: `${createdJobs.length} emails scheduled successfully`,
      jobs: createdJobs,
    });
  } catch (error) {
    console.error('Schedule error:', error);
    return res.status(500).json({ error: 'Failed to schedule emails' });
  }
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const emails = await prisma.emailJob.findMany({
      where: {
        senderId: user.id,
        status: { in: ['scheduled', 'queued'] },
      },
      orderBy: { scheduledTime: 'asc' },
    });
    return res.json({ emails });
  } catch (error) {
    console.error('Get scheduled error:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const emails = await prisma.emailJob.findMany({
      where: {
        senderId: user.id,
        status: { in: ['sent', 'failed'] },
      },
      orderBy: { sentTime: 'desc' },
    });
    return res.json({ emails });
  } catch (error) {
    console.error('Get sent error:', error);
    return res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
};

export const getEmailById = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const email = await prisma.emailJob.findFirst({
      where: { id, senderId: user.id },
    });
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    return res.json({ email });
  } catch (error) {
    console.error('Get email error:', error);
    return res.status(500).json({ error: 'Failed to fetch email' });
  }
};
