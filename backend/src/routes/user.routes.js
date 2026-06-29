const express = require('express');
const router  = express.Router();

const { authenticate }                     = require('../middleware/auth.middleware');
const { authorize, authorizeOwnerOrAdmin } = require('../middleware/rbac.middleware');
const { findAllUsers, findUserById, updateUser } = require('../repositories/user.repository');

router.get('/profile', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

router.get('/', authenticate, authorize('user:read'), async (req, res, next) => {
  try {
    const users = await findAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorizeOwnerOrAdmin('id'), async (req, res, next) => {
  try {
    const user = await findUserById(parseInt(req.params.id));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, authorize('user:update'), async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await updateUser(parseInt(req.params.id), { role, isActive });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, authorize('user:delete'), async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    await pool.execute('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
