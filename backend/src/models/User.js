class User {
  constructor({ id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at }) {
    this.id = id;
    this.email = email;
    this.passwordHash = password_hash;
    this.firstName = first_name;
    this.lastName = last_name;
    this.phone = phone;
    this.role = role;
    this.isActive = Boolean(is_active);
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }
}

module.exports = User;
