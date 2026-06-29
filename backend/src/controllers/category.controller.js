const {
  getAllCategories,
  getCategoryById,
  createNewCategory,
  updateCategoryDetails,
  removeCategory,
} = require('../services/category.service');

async function getAll(req, res, next) {
  try {
    const categories = await getAllCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const category = await getCategoryById(parseInt(req.params.id));
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const category = await createNewCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const category = await updateCategoryDetails(parseInt(req.params.id), req.body);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await removeCategory(parseInt(req.params.id));
    res.json({ success: true, message: 'Category deleted successfully' });
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
