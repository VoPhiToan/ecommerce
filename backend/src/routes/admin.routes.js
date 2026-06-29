const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { reloadPermissions } = require('../utils/permissionCache');
const { Role, Permission } = require('../models');

// Xem tất cả roles và permissions
router.get('/roles', authenticate, authorize('user:read'), async (req, res) => {
  const roles = await Role.findAll({
    include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
  });
  res.json({ success: true, data: roles });
});

// Gán permission cho role
router.post('/roles/:roleId/permissions', authenticate, authorize('user:update'), async (req, res) => {
  const { roleId } = req.params;
  const { permissionIds } = req.body;

  const role = await Role.findByPk(roleId);
  if (!role) return res.status(404).json({ message: 'Role not found' });

  await role.setPermissions(permissionIds); // Sequelize built-in

  // Reload cache để áp dụng ngay không cần restart
  await reloadPermissions();

  res.json({ success: true, message: 'Permissions updated' });
});

module.exports = router;