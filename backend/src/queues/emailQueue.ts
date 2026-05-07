import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';

export const emailQueue = new Queue('email-queue', {
  connection: createRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
});
