export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  googleId: string;
  createdAt: string;
}

export interface EmailJob {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  scheduledTime: string;
  sentTime: string | null;
  status: 'scheduled' | 'queued' | 'sent' | 'failed';
  senderId: string;
  retryCount: number;
  bullmqJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEmailRequest {
  subject: string;
  body: string;
  recipients: string[];
  scheduledTime: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}
