const jwt = require('jsonwebtoken');
const config = require('../config/config');

const DRIVERS = {
  driver1: {
    username: 'driver1',
    password: 'password1',
    profile: {
      id: 'driver1',
      name: 'John Smith',
      vehicle: 'Toyota Camry 2020',
      license: 'ABC123',
      rating: 4.8
    }
  },
  driver2: {
    username: 'driver2',
    password: 'password2',
    profile: {
      id: 'driver2',
      name: 'Sarah Johnson',
      vehicle: 'Honda Civic 2021',
      license: 'XYZ789',
      rating: 4.9
    }
  },
  driver3: {
    username: 'driver3',
    password: 'password3',
    profile: {
      id: 'driver3',
      name: 'Mike Davis',
      vehicle: 'Ford Focus 2019',
      license: 'DEF456',
      rating: 4.7
    }
  }
};

/**
 * @param {string} username 
 * @param {string} password 
 * @returns {Object|null} 
 */
function validateDriverCredentials(username, password) {
  const driver = DRIVERS[username];
  if (driver && driver.password === password) {
    return driver.profile;
  }
  return null;
}

/**
 * @param {Object} driverProfile 
 * @returns {string} 
 */
function generateToken(driverProfile) {
  return jwt.sign(
    { 
      driverId: driverProfile.id,
      name: driverProfile.name,
      vehicle: driverProfile.vehicle
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}

/**
 * @param {string} token
 * @returns {Object|null} 
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

function authenticateSocketToken(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid or expired token'));
    }

    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
}

module.exports = {
  DRIVERS,
  validateDriverCredentials,
  generateToken,
  verifyToken,
  authenticateToken,
  authenticateSocketToken
}; 