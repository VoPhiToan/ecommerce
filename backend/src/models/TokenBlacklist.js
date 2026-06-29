class TokenBlacklist {
  constructor({ id, token, blacklisted_at }) {
    this.id = id;
    this.token = token;
    this.blacklistedAt = blacklisted_at;
  }
}

module.exports = TokenBlacklist;