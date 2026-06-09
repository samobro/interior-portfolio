const redis = require('redis');

console.log('🔌 Connecting to Redis...');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect()
  .then(() => console.log('✅ Redis Connected'))
  .catch(err => {
    console.error('❌ Redis error:', err);
    console.log('⚠️ Running without cache');
  });

redisClient.on('error', (err) => console.log('Redis Error:', err));

const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

const setCache = async (key, data, ttl = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

module.exports = { getCache, setCache, deleteCache };
