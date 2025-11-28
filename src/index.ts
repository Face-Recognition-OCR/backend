import './utils/config.util';
import { createApp } from './app';
import { RedisClient } from './services/redis.service';

const PORT = process.env.PORT || 1300;
const NODE_ENV = process.env.NODE_ENV || 'development';

void (async () => {
  try {
    // Connect to Redis
    const redisClient = RedisClient.getInstance();
    await redisClient.connect();
    console.log('✓ Redis connected');

    // Create vector index
    await redisClient.createVectorIndex();
    console.log('✓ Vector index created');

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${NODE_ENV}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();
