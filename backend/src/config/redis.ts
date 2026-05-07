import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

const getRedisConfig = () => {
  if (REDIS_URL) {
    return { url: REDIS_URL };
  }
  return { host: REDIS_HOST, port: REDIS_PORT };
};

export const redisConnection = REDIS_URL
  ? new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({ host: REDIS_HOST, port: REDIS_PORT, maxRetriesPerRequest: null });

export const createRedisConnection = () =>
  REDIS_URL
    ? new IORedis(REDIS_URL, { maxRetriesPerRequest: null })
    : new IORedis({ host: REDIS_HOST, port: REDIS_PORT, maxRetriesPerRequest: null });
