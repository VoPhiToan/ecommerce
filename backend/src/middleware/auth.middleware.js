const { verifyAccessToken } = require('../utils/token.util');
const refreshTokenRepository = require('../repositories/refreshToken.repository');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const isBlacklisted = await refreshTokenRepository.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }

    const decoded = verifyAccessToken(token);
    req.user  = decoded;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticate };