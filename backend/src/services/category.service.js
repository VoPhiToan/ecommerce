const {
  findCategoryById,
  findAllCategories,
  findCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../repositories/category.repository');

async function getAllCategories() {
  return findAllCategories();
}

async function getCategoryById(id) {
  const category = await findCategoryById(id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  return category;
}

async function createNewCategory({ name, description }) {
  if (!name || name.trim().length === 0) {
    const error = new Error('Category name is required');
    error.statusCode = 422;
    throw error;
  }

  const existingCategory = await findCategoryByName(name);
  if (existingCategory) {
    const error = new Error('Category with this name already exists');
    error.statusCode = 409;
    throw error;
  }

  return createCategory({ name, description });
}

async function updateCategoryDetails(id, { name, description, isActive }) {
  const category = await getCategoryById(id);

  if (name && name !== category.name) {
    const existingCategory = await findCategoryByName(name);
    if (existingCategory) {
      const error = new Error('Category with this name already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  return updateCategory(id, {
    name: name || category.name,
    description: description !== undefined ? description : category.description,
    isActive: isActive !== undefined ? isActive : category.isActive,
  });
}

async function removeCategory(id) {
  await getCategoryById(id);
  return deleteCategory(id);
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createNewCategory,
  updateCategoryDetails,
  removeCategory,
};