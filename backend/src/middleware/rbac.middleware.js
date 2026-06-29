const { hasPermission } = require('../utils/permissionCache');

const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    const { role_id, role } = req.user;

    // Hỗ trợ cả role_id (mới) lẫn role string (cũ) để không break
    // Nếu user là admin theo role string thì bypass luôn
    if (role === 'admin') return next();

    const granted = requiredPermissions.some(perm =>
      hasPermission(role_id, perm)
    );

    if (!granted) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        required: requiredPermissions,
      });
    }

    next();
  };
};

const authorizeOwnerOrAdmin = (paramKey = 'id') => {
  return (req, res, next) => {
    const { id: userId, role, role_id } = req.user;
    const targetId = parseInt(req.params[paramKey]);

    if (role === 'admin' || hasPermission(role_id, 'user:read')) return next();
    if (userId === targetId) return next();

    return res.status(403).json({ success: false, message: 'Access denied' });
  };
};

module.exports = { authorize, authorizeOwnerOrAdmin };