import nodemailer from 'nodemailer';
import { config } from '../config/index';

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  if (config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Ethereal Email credentials:');
    console.log('  User:', testAccount.user);
    console.log('  Pass:', testAccount.pass);
    console.log('  Preview URL: https://ethereal.email/login');
  }

  return transporter;
};

export const sendEmail = async (params: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}): Promise<{ messageId: string; previewUrl: string | false }> => {
  const transport = await getTransporter();

  const info = await transport.sendMail({
    from: params.from || '"Email Scheduler" <scheduler@example.com>',
    to: params.to,
    subject: params.subject,
    html: params.body,
    text: params.body.replace(/<[^>]*>/g, ''),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log(`Email sent to ${params.to} - Preview: ${previewUrl}`);

  return {
    messageId: info.messageId,
    previewUrl,
  };
};
