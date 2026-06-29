// KHÔNG import jest từ @jest/globals nữa — Jest 30 inject global tự động
const authService            = require('../../services/auth.service');
const userRepository         = require('../../repositories/user.repository');
const refreshTokenRepository = require('../../repositories/refreshToken.repository');

// Mock dependencies
jest.mock('../../repositories/user.repository');
jest.mock('../../repositories/refreshToken.repository');

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('login()', () => {
    it('should throw error when user not found', async () => {
      userRepository.findUserByEmail.mockResolvedValue(null);

      await expect(authService.login('notfound@test.com', 'password'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error when user is inactive', async () => {
      userRepository.findUserByEmail.mockResolvedValue({
        id: 1, email: 'test@test.com',
        passwordHash: '$2b$10$test', isActive: false,
      });

      await expect(authService.login('test@test.com', 'password'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should return tokens on successful login', async () => {
      const bcrypt = require('bcrypt');
      const hash   = await bcrypt.hash('password123', 10);

      userRepository.findUserByEmail.mockResolvedValue({
        id: 1, email: 'test@test.com',
        passwordHash: hash, isActive: true, role: 'customer',
      });
      refreshTokenRepository.save.mockResolvedValue(true);

      const result = await authService.login('test@test.com', 'password123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('refreshAccessToken()', () => {
    it('should throw when refresh token invalid', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue(null);

      await expect(authService.refreshAccessToken('invalid_token'))
        .rejects.toThrow('Invalid or expired refresh token');
    });

    it('should rotate refresh token on success', async () => {
      refreshTokenRepository.findByToken.mockResolvedValue({
        user_id: 1, token: 'old_token',
      });
      userRepository.findUserById.mockResolvedValue({
        id: 1, email: 'test@test.com', role: 'customer', isActive: true,
      });
      refreshTokenRepository.deleteByToken.mockResolvedValue(true);
      refreshTokenRepository.save.mockResolvedValue(true);

      const result = await authService.refreshAccessToken('old_token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith('old_token');
    });
  });
});