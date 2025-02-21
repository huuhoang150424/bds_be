import redisClient from '@config/redis';

class CacheRepository {
  async set(key: string, value: string, ttl?: number) {
		if (!redisClient.isReady) {
      console.error('❌ Redis chưa kết nối!');
      return;
    }
    if (ttl) {
      await redisClient.set(key, value, { EX: ttl });
    } else {
      await redisClient.set(key, value);
    }
  }

  async get(key: string) {
		if (!redisClient.isReady) {
      console.error('❌ Redis chưa kết nối!');
      return;
    }
    return await redisClient.get(key);
  }

  async delete(key: string) {
    await redisClient.del(key);
  }
}

export default new CacheRepository();
