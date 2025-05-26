const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const driverRoutes = require('./routes/driverRoutes');
const { setupDriverSocket } = require('./ws/driverSocket');
const { setupDashboardSocket } = require('./ws/dashboardSocket');



const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
});
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '1.0.0'
  });
});

app.use('/api', authRoutes);
app.use('/api/driver', driverRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Ride-Sharing Dashboard API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: {
        login: 'POST /api/login',
        logout: 'POST /api/logout',
        profile: 'GET /api/profile'
      },
      driver: {
        updateLocation: 'POST /api/driver/update',
        getOnlineDrivers: 'GET /api/driver/online',
        getDriverLocation: 'GET /api/driver/:driverId/location',
        getStats: 'GET /api/driver/stats'
      }
    },
    websockets: {
      driverUpdates: 'ws://localhost:3001/driver/update',
      dashboard: 'ws://localhost:3001/dashboard'
    },
    documentation: 'See README.md for detailed API documentation'
  });
});

console.log('Setting up WebSocket namespaces...');
setupDriverSocket(io);
setupDashboardSocket(io);

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

io.on('connection', (socket) => {
  console.log(`Client connected to main namespace: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected from main namespace: ${socket.id}, reason: ${reason}`);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

const PORT = config.port || 3001;
server.listen(PORT, () => {
  console.log(`🚗 Ride-Sharing Dashboard Backend Started`);
  console.log(`=====================================`);
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket Namespaces:`);
  console.log(`   📍 Driver Updates: ws://localhost:${PORT}/driver/update`);
  console.log(`   📊 Dashboard: ws://localhost:${PORT}/dashboard`);
  console.log(`🔐 Sample Driver Credentials:`);
  console.log(`   driver1 / password1`);
  console.log(`   driver2 / password2`);
  console.log(`   driver3 / password3`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`=====================================`);
});

module.exports = { app, server, io };