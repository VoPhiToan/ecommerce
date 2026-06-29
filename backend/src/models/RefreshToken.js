class RefreshToken {
  constructor({ id, user_id, token, expires_at, created_at }) {
    this.id = id;
    this.userId = user_id;
    this.token = token;
    this.expiresAt = expires_at;
    this.createdAt = created_at;
  }
}

module.exports = RefreshToken;