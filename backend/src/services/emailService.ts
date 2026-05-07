import nodemailer from 'nodemailer';
import { config } from '../config/index';

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  if (config.smtp.user && config.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 465,
      secure: true,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 465,
      secure: true,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });
    console.log('Ethereal Email credentials:');
    console.log('  User:', testAccount.user);
    console.log('  Pass:', testAccount.pass);
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
