import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://127.0.0.1:6379',
	//database: 0
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
