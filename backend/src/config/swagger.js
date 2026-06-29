const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'E-Commerce Warehouse API',
      version:     '1.0.0',
      description: 'RESTful API for E-Commerce + Warehouse Management System',
      contact: {
        name:  'Backend Team',
        email: 'admin@ecommerce.com',
      },
    },
    servers: [
      {
        url:         'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Nhập Access Token vào đây. Lấy từ POST /api/auth/login',
        },
      },
      schemas: {
        // ===== AUTH =====
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email:     { type: 'string', example: 'user@example.com' },
            password:  { type: 'string', minLength: 6, example: 'password123' },
            firstName: { type: 'string', example: 'Nguyen' },
            lastName:  { type: 'string', example: 'Van A' },
            phone:     { type: 'string', example: '0901234567' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success:     { type: 'boolean', example: true },
            accessToken: { type: 'string', example: 'eyJhbGci...' },
            user: {
              type: 'object',
              properties: {
                id:    { type: 'integer', example: 1 },
                email: { type: 'string',  example: 'user@example.com' },
                role:  { type: 'string',  example: 'customer' },
              },
            },
          },
        },

        // ===== PRODUCT =====
        Product: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            sku:         { type: 'string',  example: 'SP001' },
            name:        { type: 'string',  example: 'Áo thun nam' },
            description: { type: 'string',  example: 'Áo thun cotton 100%' },
            categoryId:  { type: 'integer', example: 1 },
            price:       { type: 'number',  example: 150000 },
            weight:      { type: 'number',  example: 0.5 },
            isActive:    { type: 'boolean', example: true },
            createdAt:   { type: 'string',  format: 'date-time' },
          },
        },
        CreateProductRequest: {
          type: 'object',
          required: ['sku', 'name', 'categoryId', 'price'],
          properties: {
            sku:         { type: 'string', example: 'SP001' },
            name:        { type: 'string', example: 'Áo thun nam' },
            description: { type: 'string', example: 'Áo thun cotton 100%' },
            categoryId:  { type: 'integer', example: 1 },
            price:       { type: 'number',  example: 150000 },
            weight:      { type: 'number',  example: 0.5 },
            image:       { type: 'string',  format: 'binary' },
          },
        },

        // ===== ORDER =====
        Order: {
          type: 'object',
          properties: {
            id:              { type: 'integer', example: 1 },
            userId:          { type: 'integer', example: 1 },
            totalAmount:     { type: 'number',  example: 500000 },
            orderStatus:     { type: 'string',  example: 'pending' },
            paymentStatus:   { type: 'string',  example: 'pending' },
            shippingAddress: { type: 'string',  example: '123 Nguyen Hue, Q1, HCM' },
            createdAt:       { type: 'string',  format: 'date-time' },
          },
        },

        // ===== COMMON =====
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Error message' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                pagination: {
                  type: 'object',
                  properties: {
                    page:       { type: 'integer', example: 1 },
                    limit:      { type: 'integer', example: 10 },
                    total:      { type: 'integer', example: 100 },
                    totalPages: { type: 'integer', example: 10 },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Áp dụng BearerAuth mặc định cho tất cả endpoints
    security: [{ BearerAuth: [] }],
  },
  // Quét JSDoc comments trong các file routes
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;