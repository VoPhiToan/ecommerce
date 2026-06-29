const authService = require('../services/auth.service');

const authController = {
  async register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    // Xoá passwordHash trước khi trả về client
    const { passwordHash, ...safeUser } = user;
    return res.status(201).json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
},

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token required' });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({ success: true, accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      await authService.logout(req.token, refreshToken);
      res.clearCookie('refreshToken');
      return res.status(200).json({ success: true, message: 'Logged out' });
    } catch (error) {
      next(error);
    }
  },

  async logoutAll(req, res, next) {
    try {
      await authService.logoutAll(req.user.id, req.token);
      res.clearCookie('refreshToken');
      return res.status(200).json({ success: true, message: 'Logged out from all devices' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;