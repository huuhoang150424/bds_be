import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://default:25Z92IwAIEtVvFbQP1OAxERTIY0VNVya@redis-14437.c299.asia-northeast1-1.gce.redns.redis-cloud.com:14437',
  socket: {
    connectTimeout: 5000,
    keepAlive: 5000,
  },
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Redis Connected Successfully!');
});

(async () => {
  try {
    await redisClient.connect();
    console.log('🚀 Redis is ready to use!');
  } catch (error:any) {
    console.error('❌ Redis Connection Failed:', error.message);
  }
})();

export default redisClient;
