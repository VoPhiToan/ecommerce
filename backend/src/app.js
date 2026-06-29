const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');
const corsOptions  = require('./config/cors');
const { rateLimiters }            = require('./middleware/rateLimit.middleware');
const httpLogger                   = require('./middleware/httpLogger.middleware');
const requestId                    = require('./middleware/requestId.middleware');
const auditLog                     = require('./middleware/auditLog.middleware');
const {
  sanitizeInput,
  preventHpp,
  blockSuspiciousRequests,
  limitRequestSize,
} = require('./middleware/security.middleware');

const authRoutes      = require('./routes/auth.routes');
const userRoutes      = require('./routes/user.routes');
const productRoutes   = require('./routes/product.routes');
const categoryRoutes  = require('./routes/category.routes');
const cartRoutes      = require('./routes/cart.routes');
const orderRoutes     = require('./routes/order.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const paymentRoutes   = require('./routes/payment.routes');
const errorHandler    = require('./middleware/errorHandler');

const app = express();

// 1. Request ID — gắn trước tất cả
app.use(requestId);

// 2. Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://sandbox.vnpayment.vn", "https://vnpayment.vn"],
      connectSrc: ["'self'", "http://localhost:5000"],
      objectSrc:  ["'none'"],
    },
  },
  noSniff:        true,
  frameguard:     { action: 'deny' },
  hidePoweredBy:  true,
  xssFilter:      true,
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
}));

// 3. CORS
app.use(cors(corsOptions));

// 4. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 5. HTTP logging
app.use(httpLogger);

// 6. Security middleware
app.use(limitRequestSize);
app.use(blockSuspiciousRequests);
app.use(sanitizeInput);
app.use(preventHpp);

// 7. Rate limiting
app.use('/api/auth/login',   rateLimiters.auth);
app.use('/api/auth/refresh', rateLimiters.auth);
app.use('/api',              rateLimiters.api);

// 8. Audit logging
app.use(auditLog);

// 9. Swagger UI (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'E-Commerce API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: { persistAuthorization: true },
  }));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// 10. Health check
app.get('/', (req, res) => {
  res.json({
    message: 'E-Commerce Warehouse API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 11. Routes
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory',  inventoryRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/payment',    paymentRoutes);

// 12. Error handler — phải đứng cuối cùng
app.use(errorHandler);

module.exports = app;