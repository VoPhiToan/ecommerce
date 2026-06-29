const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

const isAllowed = (origin) => {
  if (allowedOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (isAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin} not allowed`));
    }
  },
  credentials:          true,  // cho phép gửi cookie
  methods:              ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders:       ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders:       ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge:               86400, // cache preflight 24 giờ — giảm OPTIONS request
  optionsSuccessStatus: 200,   // IE11 không hiểu 204
};

module.exports = corsOptions;