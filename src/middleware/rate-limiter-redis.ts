import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '@config/redis';

export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 20, // max 20 requests mỗi IP 1 phút
  message: '⚠️ Bạn đã gửi quá nhiều request!',
  headers: true,
});
