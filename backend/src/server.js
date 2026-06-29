const dotenv = require('dotenv');
dotenv.config();

const app                    = require('./app');
const { initializeDatabase } = require('./config/db');
const { loadPermissions }    = require('./utils/permissionCache');
const { connectRedis }       = require('./config/redis');

require('./utils/cleanupJob');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await initializeDatabase();

    // Chỉ connect Redis khi không phải môi trường test
    if (process.env.NODE_ENV !== 'test') {
      await connectRedis();
    }

    await loadPermissions();

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();