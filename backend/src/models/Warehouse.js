class Warehouse {
  constructor({ id, name, address, city, state, postal_code, country, manager_id, created_at, updated_at }) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.city = city;
    this.state = state;
    this.postalCode = postal_code;
    this.country = country;
    this.managerId = manager_id;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }
}

module.exports = Warehouse;
