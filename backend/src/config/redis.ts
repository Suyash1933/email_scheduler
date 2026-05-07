import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_INTERNAL_URL || '';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

console.log('Redis config:', REDIS_URL ? `Using REDIS_URL: ${REDIS_URL.substring(0, 20)}...` : `Using host: ${REDIS_HOST}:${REDIS_PORT}`);

export const createRedisConnection = () => {
  if (REDIS_URL) {
    return new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    });
  }
  return new IORedis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
  });
};

export const redisConnection = createRedisConnection();
