const { pool } = require('../config/db');

const refreshTokenRepository = {
  async save(userId, token, expiresAt) {
    await pool.execute(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
  },

  async findByToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    return rows[0] || null;
  },

  async deleteByToken(token) {
    await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
  },

  async deleteAllByUserId(userId) {
    await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
  },

  async deleteExpired() {
    const [result] = await pool.execute(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
    );
    return result.affectedRows;
  },

  async blacklistToken(token) {
    await pool.execute(
      'INSERT IGNORE INTO token_blacklist (token) VALUES (?)',
      [token]
    );
  },

  async isBlacklisted(token) {
    const [rows] = await pool.execute(
      'SELECT id FROM token_blacklist WHERE token = ?',
      [token]
    );
    return rows.length > 0;
  },
};

module.exports = refreshTokenRepository;