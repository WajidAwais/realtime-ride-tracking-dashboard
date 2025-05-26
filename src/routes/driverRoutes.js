const express = require('express');
const { updateLocation, getOnlineDrivers, getDriverLocation, getStats } = require('../controllers/driverController');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

router.post('/update', authenticateToken, updateLocation);

router.get('/online', getOnlineDrivers);

router.get('/:driverId/location', getDriverLocation);

router.get('/stats', getStats);

module.exports = router; 