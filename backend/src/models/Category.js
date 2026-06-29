class Category {
  constructor({ id, name, description, is_active, created_at, updated_at }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.isActive = Boolean(is_active);
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }
}

module.exports = Category;
