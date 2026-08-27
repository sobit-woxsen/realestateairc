require('dotenv/config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const propertyRoutes = require('./routes/property.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const agentRoutes = require('./routes/agent.routes');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Middleware order as requested
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (allow dotfiles for .well-known verification)
app.use(express.static(path.join(__dirname, '..', 'public'), { dotfiles: 'allow' }));

// MCP Hub Domain Verification route
app.get('/.well-known/mcp-hub-verification.json', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', '.well-known', 'mcp-hub-verification.json'));
});

// Swagger setup & raw OpenAPI specification endpoints
const swaggerDocument = YAML.load(path.join(__dirname, '..', 'docs', 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/openapi.json', (req, res) => {
  res.json(swaggerDocument);
});

app.get('/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'docs', 'openapi.yaml'));
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/agent', agentRoutes);

// Global error handler
app.use(errorHandler);

module.exports = app;
