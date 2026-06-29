const cron = require('node-cron');
const refreshTokenRepository = require('../repositories/refreshToken.repository');

// Chạy lúc 2:00 AM mỗi ngày
cron.schedule('0 2 * * *', async () => {
  console.log('[CronJob] Cleaning up expired tokens...');
  const deleted = await refreshTokenRepository.deleteExpired();
  console.log(`[CronJob] Removed ${deleted} expired refresh tokens`);
});