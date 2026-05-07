import IORedis from 'ioredis';
import { config } from './index';

export const redisConnection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

export const createRedisConnection = () =>
  new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
  });
