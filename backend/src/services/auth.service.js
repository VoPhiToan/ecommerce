const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/token.util');
const refreshTokenRepository = require('../repositories/refreshToken.repository');
const { findUserByEmail, findUserById, createUser } = require('../repositories/user.repository');
const { getRoleIdByName } = require('../utils/permissionCache');
const createLogger = require('../utils/logger.util');

const log = createLogger('AuthService');

const getRefreshTokenExpiry = () => {
  const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};

const authService = {
  async register({ email, password, firstName, lastName, phone }) {
    const existing = await findUserByEmail(email);
    if (existing) {
      log.warn('Register failed — email already exists', { email });
      const error = new Error('Email is already registered');
      error.statusCode = 409;
      throw error;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash, firstName, lastName, phone });
    log.info('New user registered', { userId: user.id, email });
    return user;
  },

  async login(email, password) {
    const user = await findUserByEmail(email);
    if (!user || !user.isActive) {
      log.warn('Login failed — user not found or inactive', { email });
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      log.warn('Login failed — wrong password', { email, userId: user.id });
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const payload = { id: user.id, email: user.email, role: user.role, role_id: getRoleIdByName(user.role) };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken();

    await refreshTokenRepository.save(user.id, refreshToken, getRefreshTokenExpiry());

    log.info('User logged in', { userId: user.id, email });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  },

  async refreshAccessToken(refreshToken) {
    const record = await refreshTokenRepository.findByToken(refreshToken);
    if (!record) {
      log.warn('Refresh token invalid or expired');
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    const user = await findUserById(record.user_id || record.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    await refreshTokenRepository.deleteByToken(refreshToken);

    const payload         = { id: user.id, email: user.email, role: user.role, role_id: getRoleIdByName(user.role) };
    const newAccessToken  = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken();

    await refreshTokenRepository.save(user.id, newRefreshToken, getRefreshTokenExpiry());

    log.info('Token refreshed', { userId: user.id });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(accessToken, refreshToken) {
    if (accessToken)  await refreshTokenRepository.blacklistToken(accessToken);
    if (refreshToken) await refreshTokenRepository.deleteByToken(refreshToken);
    log.info('User logged out');
  },

  async logoutAll(userId, accessToken) {
    if (accessToken) await refreshTokenRepository.blacklistToken(accessToken);
    await refreshTokenRepository.deleteAllByUserId(userId);
    log.info('User logged out from all devices', { userId });
  },
};

module.exports = authService;