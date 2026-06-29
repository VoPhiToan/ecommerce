const {
  getAllWarehouses,
  getWarehouseById,
  createNewWarehouse,
  updateWarehouseDetails,
  removeWarehouse,
} = require('../services/warehouse.service');

async function getAll(req, res, next) {
  try {
    const warehouses = await getAllWarehouses();
    res.json({ success: true, data: warehouses });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const warehouse = await getWarehouseById(parseInt(req.params.id));
    res.json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const warehouse = await createNewWarehouse(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const warehouse = await updateWarehouseDetails(parseInt(req.params.id), req.body);
    res.json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await removeWarehouse(parseInt(req.params.id));
    res.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
