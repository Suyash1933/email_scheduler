import { createRedisConnection } from '../config/redis';
import { config } from '../config/index';

const redis = createRedisConnection();

const getHourWindow = (): string => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
};

export const checkRateLimit = async (): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}> => {
  const hourWindow = getHourWindow();
  const key = `rate_limit:global:${hourWindow}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 3600);
  }

  const maxPerHour = config.rateLimit.maxEmailsPerHour;

  if (count > maxPerHour) {
    await redis.decr(key);
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0);
    const retryAfterMs = nextHour.getTime() - now.getTime();

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  return {
    allowed: true,
    remaining: maxPerHour - count,
    retryAfterMs: 0,
  };
};

export const enforceDelay = async (): Promise<void> => {
  const delay = config.rateLimit.minDelayBetweenEmails;
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};
