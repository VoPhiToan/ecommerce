class Product {
  constructor({ id, sku, name, description, category_id, price, weight, image_url, is_active, created_at, updated_at }) {
    this.id = id;
    this.sku = sku;
    this.name = name;
    this.description = description;
    this.categoryId = category_id;
    this.price = price;
    this.weight = weight;
    this.imageUrl = image_url ?? null;
    this.isActive = Boolean(is_active);
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }
}

module.exports = Product;
