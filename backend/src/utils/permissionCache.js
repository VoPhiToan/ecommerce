const { pool } = require('../config/db');

// Map<roleId, Set<permissionName>>
let permissionCache = new Map();
// Map<roleName, roleId>
let roleNameMap = new Map();

const loadPermissions = async () => {
  const [rows] = await pool.execute(`
    SELECT r.id AS role_id, r.name AS role_name, p.name AS permission_name
    FROM roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
    LEFT JOIN permissions p ON p.id = rp.permission_id
  `);

  permissionCache.clear();
  roleNameMap.clear();

  for (const row of rows) {
    roleNameMap.set(row.role_name, row.role_id);
    if (!permissionCache.has(row.role_id)) {
      permissionCache.set(row.role_id, new Set());
    }
    if (row.permission_name) {
      permissionCache.get(row.role_id).add(row.permission_name);
    }
  }

  console.log(`[RBAC] Loaded permissions for ${permissionCache.size} roles`);
};

const hasPermission = (roleId, permission) => {
  const perms = permissionCache.get(roleId);
  if (!perms) return false;
  return perms.has(permission);
};

const getRoleIdByName = (roleName) => roleNameMap.get(roleName) ?? null;

const reloadPermissions = async () => {
  await loadPermissions();
};

module.exports = { loadPermissions, hasPermission, reloadPermissions, getRoleIdByName };
