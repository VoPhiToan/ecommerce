const {
  findWarehouseById,
  findAllWarehouses,
  findWarehouseByName,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} = require('../repositories/warehouse.repository');

async function getAllWarehouses() {
  return findAllWarehouses();
}

async function getWarehouseById(id) {
  const warehouse = await findWarehouseById(id);
  if (!warehouse) {
    const error = new Error('Warehouse not found');
    error.statusCode = 404;
    throw error;
  }
  return warehouse;
}

async function createNewWarehouse({ name, address, city, state, postalCode, country, managerId }) {
  if (!name || name.trim().length === 0) {
    const error = new Error('Warehouse name is required');
    error.statusCode = 422;
    throw error;
  }

  if (!address || address.trim().length === 0) {
    const error = new Error('Address is required');
    error.statusCode = 422;
    throw error;
  }

  if (!country || country.trim().length === 0) {
    const error = new Error('Country is required');
    error.statusCode = 422;
    throw error;
  }

  const existingWarehouse = await findWarehouseByName(name);
  if (existingWarehouse) {
    const error = new Error('Warehouse with this name already exists');
    error.statusCode = 409;
    throw error;
  }

  return createWarehouse({ name, address, city, state, postalCode, country, managerId });
}

async function updateWarehouseDetails(id, { name, address, city, state, postalCode, country, managerId }) {
  const warehouse = await getWarehouseById(id);

  if (name && name !== warehouse.name) {
    const existingWarehouse = await findWarehouseByName(name);
    if (existingWarehouse) {
      const error = new Error('Warehouse with this name already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  return updateWarehouse(id, {
    name: name || warehouse.name,
    address: address || warehouse.address,
    city: city !== undefined ? city : warehouse.city,
    state: state !== undefined ? state : warehouse.state,
    postalCode: postalCode !== undefined ? postalCode : warehouse.postalCode,
    country: country || warehouse.country,
    managerId: managerId !== undefined ? managerId : warehouse.managerId,
  });
}

async function removeWarehouse(id) {
  await getWarehouseById(id);
  return deleteWarehouse(id);
}

module.exports = {
  getAllWarehouses,
  getWarehouseById,
  createNewWarehouse,
  updateWarehouseDetails,
  removeWarehouse,
};
