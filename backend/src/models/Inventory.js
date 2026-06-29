class Inventory {
  constructor({ id, warehouse_id, product_id, quantity, reserved_quantity, last_updated }) {
    this.id = id;
    this.warehouseId = warehouse_id;
    this.productId = product_id;
    this.quantity = quantity;
    this.reservedQuantity = reserved_quantity;
    this.availableQuantity = quantity - reserved_quantity;
    this.lastUpdated = last_updated;
  }
}

class InventoryHistory {
  constructor({ id, warehouse_id, product_id, transaction_type, quantity, notes, created_by, created_at }) {
    this.id = id;
    this.warehouseId = warehouse_id;
    this.productId = product_id;
    this.transactionType = transaction_type;
    this.quantity = quantity;
    this.notes = notes;
    this.createdBy = created_by;
    this.createdAt = created_at;
  }
}

module.exports = {
  Inventory,
  InventoryHistory,
};
