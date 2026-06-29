const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.errors = errors.array().map((err) => ({ field: err.param, message: err.msg }));
    return next(error);
  }
  next();
}

module.exports = validateRequest;
