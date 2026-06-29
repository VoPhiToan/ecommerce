const supertest = require('supertest');
const app       = require('../../app');
const { cleanDatabase, seedRolesAndPermissions, createTestUser } = require('../helpers/db.helper');
const { pool }  = require('../../config/db');

const api = supertest(app);

let adminToken, customerToken, categoryId;

beforeAll(async () => {
  await cleanDatabase();
  await seedRolesAndPermissions();

  const admin    = await createTestUser(app, { email: 'admin@test.com', role: 'admin' });
  const customer = await createTestUser(app, { email: 'customer@test.com' });

  adminToken    = admin.accessToken;
  customerToken = customer.accessToken;

  const [catResult] = await pool.execute(
    'INSERT INTO categories (name) VALUES (?)', ['Test Category']
  );
  categoryId = catResult.insertId;
});

afterAll(async () => {
  await cleanDatabase();
});

describe('GET /api/products', () => {
  it('should return product list — public route', async () => {
    const res = await api.get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should support pagination', async () => {
    const res = await api.get('/api/products?page=1&limit=5');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/products', () => {
  it('should return 401 when not authenticated', async () => {
    const res = await api.post('/api/products').send({
      sku: 'SP001', name: 'Test', categoryId, price: 100000,
    });
    expect(res.status).toBe(401);
  });

  it('should return 403 when customer tries to create', async () => {
    const res = await api
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .field('sku', 'SP001')
      .field('name', 'Test Product')
      .field('categoryId', String(categoryId))
      .field('price', '100000');
    expect(res.status).toBe(403);
  });

  it('should create product when admin', async () => {
    const res = await api
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('sku', 'SP001')
      .field('name', 'Test Product')
      .field('categoryId', String(categoryId))
      .field('price', '100000');
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Product');
  });

  it('should return 422 when missing required fields', async () => {
  const res = await api
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('name', 'No SKU');
  expect(res.status).toBe(422); // đổi 400 → 422
  });
});