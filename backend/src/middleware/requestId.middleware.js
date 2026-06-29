const crypto = require('crypto');

/**
 * Gắn unique ID vào mỗi request
 * Dùng để trace log của 1 request xuyên suốt
 * Rất quan trọng khi debug production — tìm log theo requestId
 */
const requestId = (req, res, next) => {
  const id = crypto.randomBytes(8).toString('hex');
  req.requestId = id;
  res.setHeader('X-Request-Id', id); // trả về client để debug
  next();
};

module.exports = requestId;