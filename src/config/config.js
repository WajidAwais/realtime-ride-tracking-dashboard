require('dotenv').config();

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiry: '5m',
  dashboardUpdateInterval: 5000,
  offlineDriverNotificationInterval: 60000,
  driverDataRetentionMs: 10 * 60 * 1000,
  nycBounds: {
    north: 40.9176,
    south: 40.4774,
    east: -73.7004,
    west: -74.2591
  }
};

module.exports = config; 