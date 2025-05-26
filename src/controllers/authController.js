const { validateDriverCredentials, generateToken } = require('../utils/auth');
const driverStore = require('../models/driverStore');
const config = require('../config/config');

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    const driverProfile = validateDriverCredentials(username, password);
    if (!driverProfile) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    const token = generateToken(driverProfile);
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); 
    
    driverStore.storeActiveToken(token, driverProfile.id, expiresAt);

    console.log(`Driver ${driverProfile.name} (${driverProfile.id}) logged in successfully`);

    res.json({
      success: true,
      token,
      profile: driverProfile,
      expiresIn: config.jwtExpiry,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error during login'
    });
  }
}

async function logout(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      driverStore.removeActiveToken(token);
      
      if (req.user && req.user.driverId) {
        driverStore.removeDriver(req.user.driverId);
      }

      console.log(`Driver ${req.user?.driverId} logged out and removed from online status`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error during logout'
    });
  }
}

async function getProfile(req, res) {
  try {
    const driverId = req.user.driverId;
    const locationData = driverStore.getDriverLocation(driverId);
    
    res.json({
      success: true,
      profile: req.user,
      location: locationData ? {
        lat: locationData.lat,
        lng: locationData.lng,
        timestamp: locationData.timestamp
      } : null,
      isOnline: driverStore.isDriverOnline(driverId)
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching profile'
    });
  }
}

module.exports = {
  login,
  logout,
  getProfile
}; 