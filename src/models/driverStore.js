const config = require('../config/config');

class DriverStore {
  constructor() {
    this.activeTokens = new Map(); 
    this.driverLocations = new Map(); 
    this.driverSockets = new Map(); 
    
    this.startCleanupInterval();
  }

  /**
   * Store active token for a driver
   * @param {string} token - JWT token
   * @param {string} driverId - Driver ID
   * @param {Date} expiresAt - Token expiration time
   */
  storeActiveToken(token, driverId, expiresAt) {
    this.activeTokens.set(token, { driverId, expiresAt });
  }

  /**
   * Check if token is active and not expired
   * @param {string} token - JWT token to check
   * @returns {Object|null} Token data or null if invalid/expired
   */
  isTokenActive(token) {
    const tokenData = this.activeTokens.get(token);
    if (!tokenData) return null;
    
    if (new Date() > tokenData.expiresAt) {
      this.activeTokens.delete(token);
      return null;
    }
    
    return tokenData;
  }

  /**
   * @param {string} token 
   */
  removeActiveToken(token) {
    this.activeTokens.delete(token);
  }

  /**
   * @param {string} driverId 
   * @param {number} lat 
   * @param {number} lng 
   * @param {Object} profile 
   */
  updateDriverLocation(driverId, lat, lng, profile = null) {
    const locationData = {
      lat,
      lng,
      timestamp: new Date(),
      profile: profile || this.getDriverProfile(driverId)
    };
    
    this.driverLocations.set(driverId, locationData);
    console.log(`Updated location for driver ${driverId}:`, { lat, lng });
  }

  /**
   * @param {string} driverId
   * @returns {Object|null}
   */
  getDriverLocation(driverId) {
    return this.driverLocations.get(driverId) || null;
  }

  /**
   * @param {string} driverId 
   * @returns {Object|null} 
   */
  getDriverProfile(driverId) {
    const locationData = this.driverLocations.get(driverId);
    return locationData ? locationData.profile : null;
  }

  /**
   * @returns {Array} 
   */
  getOnlineDrivers() {
    const now = new Date();
    const onlineDrivers = [];
    
    for (const [driverId, locationData] of this.driverLocations.entries()) {
      const timeDiff = now - locationData.timestamp;
      
      if (timeDiff <= config.driverDataRetentionMs) {
        onlineDrivers.push({
          driverId,
          profile: locationData.profile,
          lastSeen: locationData.timestamp,
          isOnline: true
        });
      }
    }
    
    return onlineDrivers;
  }

  /**
   * @param {string} driverId 
   * @returns {boolean} 
   */
  isDriverOnline(driverId) {
    const locationData = this.driverLocations.get(driverId);
    if (!locationData) return false;
    
    const timeDiff = new Date() - locationData.timestamp;
    return timeDiff <= config.driverDataRetentionMs;
  }

  /**
   * @param {string} driverId 
   * @param {string} socketId 
   */
  setDriverSocket(driverId, socketId) {
    this.driverSockets.set(driverId, socketId);
  }

  /**
   * @param {string} driverId 
   */
  removeDriverSocket(driverId) {
    this.driverSockets.delete(driverId);
  }

  /**
   * @param {string} driverId
   * @returns {string|null} 
   */
  getDriverSocket(driverId) {
    return this.driverSockets.get(driverId) || null;
  }

  /**
   * @param {string} driverId 
   */
  removeDriver(driverId) {
    this.driverLocations.delete(driverId);
    this.driverSockets.delete(driverId);
    console.log(`Driver ${driverId} removed from online status`);
  }

 
  cleanup() {
    const now = new Date();
    
   
    for (const [token, tokenData] of this.activeTokens.entries()) {
      if (now > tokenData.expiresAt) {
        this.activeTokens.delete(token);
      }
    }
    
    for (const [driverId, locationData] of this.driverLocations.entries()) {
      const timeDiff = now - locationData.timestamp;
      if (timeDiff > config.driverDataRetentionMs * 2) { 
        this.driverLocations.delete(driverId);
        this.driverSockets.delete(driverId);
      }
    }
    
    console.log(`Cleanup completed. Active tokens: ${this.activeTokens.size}, Driver locations: ${this.driverLocations.size}`);
  }


  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, 60000); 
  }

  /**
   * @returns {Object} 
   */
  getStats() {
    return {
      activeTokens: this.activeTokens.size,
      driverLocations: this.driverLocations.size,
      connectedSockets: this.driverSockets.size,
      onlineDrivers: this.getOnlineDrivers().length
    };
  }
}

module.exports = new DriverStore(); 