import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000'),
  databaseUrl: process.env.DATABASE_URL || '',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || '5000'}/auth/callback`,
  },
  session: {
    secret: process.env.SESSION_SECRET || 'default-secret',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  smtp: {
    user: process.env.ETHEREAL_USER || '',
    pass: process.env.ETHEREAL_PASS || '',
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5') || 5,
  },
  rateLimit: {
    maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '200') || 200,
    minDelayBetweenEmails: parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS || '2000') || 2000,
  },
};
