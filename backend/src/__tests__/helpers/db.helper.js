const { pool } = require('../../config/db');

const cleanDatabase = async () => {
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  await pool.execute('TRUNCATE TABLE token_blacklist');
  await pool.execute('TRUNCATE TABLE refresh_tokens');
  await pool.execute('TRUNCATE TABLE order_items');
  await pool.execute('TRUNCATE TABLE orders');
  await pool.execute('TRUNCATE TABLE cart_items');
  await pool.execute('TRUNCATE TABLE carts');
  await pool.execute('TRUNCATE TABLE inventory');
  await pool.execute('TRUNCATE TABLE products');
  await pool.execute('TRUNCATE TABLE categories');
  await pool.execute('TRUNCATE TABLE users');
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
};

const seedRolesAndPermissions = async () => {
  await pool.execute(`
    INSERT IGNORE INTO roles (id, name) VALUES
    (1, 'admin'), (2, 'staff'), (3, 'customer')
  `);
  await pool.execute(`
    INSERT IGNORE INTO permissions (id, name) VALUES
    (1, 'product:create'), (2, 'product:update'),
    (3, 'product:delete'), (4, 'product:read'),
    (5, 'order:read'),     (6, 'order:update'),
    (7, 'user:read'),      (8, 'user:delete'),
    (9, 'dashboard:read'), (10, 'warehouse:read'),
    (11, 'warehouse:update'), (12, 'category:create'),
    (13, 'category:update'),  (14, 'category:delete')
  `);
  await pool.execute(`
    INSERT IGNORE INTO role_permissions (role_id, permission_id)
    SELECT 1, id FROM permissions
  `);
};

const createTestUser = async (app, overrides = {}) => {
  const supertest = require('supertest');

  const userData = {
    email:     overrides.email     || 'test@example.com',
    password:  overrides.password  || 'password123',
    firstName: overrides.firstName || 'Test',
    lastName:  overrides.lastName  || 'User',
  };

  await supertest(app).post('/api/auth/register').send(userData);

  // Chỉ update role string — RBAC middleware bypass theo role === 'admin'
  if (overrides.role === 'admin') {
    await pool.execute(
      "UPDATE users SET role = 'admin' WHERE email = ?",
      [userData.email]
    );
  }

  // Reload permissions cache
  const { loadPermissions } = require('../../utils/permissionCache');
  await loadPermissions();

  const loginRes = await supertest(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password });

  return {
    user:        loginRes.body.user,
    accessToken: loginRes.body.accessToken,
    cookie:      loginRes.headers['set-cookie'],
  };
};

module.exports = { cleanDatabase, seedRolesAndPermissions, createTestUser };