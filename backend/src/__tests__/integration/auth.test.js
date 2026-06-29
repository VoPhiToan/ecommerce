const supertest = require('supertest');
const app       = require('../../app');
const { cleanDatabase, seedRolesAndPermissions } = require('../helpers/db.helper');

const api = supertest(app);

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedRolesAndPermissions();
  });

  it('should register successfully with valid data', async () => {
    const res = await api.post('/api/auth/register').send({
      email: 'newuser@test.com', password: 'password123',
      firstName: 'New', lastName: 'User',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('should return 409 when email already exists', async () => {
    const userData = {
      email: 'dup@test.com', password: 'password123',
      firstName: 'Dup', lastName: 'User',
    };
    await api.post('/api/auth/register').send(userData);
    const res = await api.post('/api/auth/register').send(userData);
    expect(res.status).toBe(409);
  });

  it('should return 422 when email invalid', async () => {
  const res = await api.post('/api/auth/register').send({
    email: 'not-an-email', password: 'password123',
    firstName: 'Test', lastName: 'User',
  });
  expect(res.status).toBe(422); // đổi 400 → 422
});

it('should return 422 when password too short', async () => {
  const res = await api.post('/api/auth/register').send({
    email: 'test@test.com', password: '123',
    firstName: 'Test', lastName: 'User',
  });
  expect(res.status).toBe(422); // đổi 400 → 422
});
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedRolesAndPermissions();
    await api.post('/api/auth/register').send({
      email: 'login@test.com', password: 'password123',
      firstName: 'Login', lastName: 'User',
    });
  });

  it('should login successfully and return tokens', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'login@test.com', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 401 with wrong password', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'login@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 with non-existent email', async () => {
    const res = await api.post('/api/auth/login').send({
      email: 'ghost@test.com', password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('should return new access token with valid refresh token', async () => {
    await cleanDatabase();
    await seedRolesAndPermissions();
    await api.post('/api/auth/register').send({
      email: 'refresh@test.com', password: 'password123',
      firstName: 'Refresh', lastName: 'User',
    });
    const loginRes = await api.post('/api/auth/login').send({
      email: 'refresh@test.com', password: 'password123',
    });
    const cookie = loginRes.headers['set-cookie'];
    const res    = await api.post('/api/auth/refresh').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 401 without refresh token', async () => {
    const res = await api.post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout and blacklist token', async () => {
    await cleanDatabase();
    await seedRolesAndPermissions();
    await api.post('/api/auth/register').send({
      email: 'logout@test.com', password: 'password123',
      firstName: 'Logout', lastName: 'User',
    });
    const loginRes = await api.post('/api/auth/login').send({
      email: 'logout@test.com', password: 'password123',
    });
    const { accessToken } = loginRes.body;
    const cookie          = loginRes.headers['set-cookie'];

    const logoutRes = await api
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);

    const protectedRes = await api
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(protectedRes.status).toBe(401);
  });
});