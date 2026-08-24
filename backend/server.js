require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');
const sequelize = require('./config/database');
const { port, frontendUrl } = require('./config/dbConfig');
const { initSocket } = require('./config/socket');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { seedDatabase } = require('./config/dbInit');
const { initCronJobs } = require('./config/cronWorker');

const app = express();

// Express Security & Parser Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration supporting credentials
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Request Logging Middleware
app.use((req, res, next) => {
  logger.info(`[HTTP ${req.method}] ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Astra CRM SaaS API Gateway', timestamp: new Date() });
});

const server = http.createServer(app);

// Mount Modular API Routes
app.use('/api', apiRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Database Sync and Seeding Initialization
async function startServer() {
  try {
    logger.info('🔌 Connecting to database...');
    try {
      await sequelize.authenticate();
      logger.info('Database connection established successfully.');
    } catch (dbErr) {
      logger.error('Database connection error:', dbErr.message);
    }
    
    // Sync tables and seed initial data in development/test
    await seedDatabase();

    // Initialize Socket.IO real-time bindings
    initSocket(server);

    // Start background cron worker routines
    initCronJobs();

    server.listen(port, () => {
      logger.info(`🚀 Astra CRM Enterprise SaaS Backend running at http://localhost:${port}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  server.close(() => {
    logger.info('Process terminated.');
  });
});
