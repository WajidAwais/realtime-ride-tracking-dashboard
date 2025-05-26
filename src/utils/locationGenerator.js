const config = require('../config/config');

/**
 * Generates a random latitude and longitude within NYC bounds
 * Used for simulating driver movement in the ride-sharing system
 * 
 * @returns {Object} Object containing lat and lng coordinates
 */
function generateRandomNYCLocation() {
  const { north, south, east, west } = config.nycBounds;
  
  const lat = Math.random() * (north - south) + south;
  const lng = Math.random() * (east - west) + west;
  
  return {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6))
  };
}

/**
 * @param {number} baseLat 
 * @param {number} baseLng 
 * @param {number} radiusKm -
 * @returns {Object}
 */
function generateNearbyLocation(baseLat, baseLng, radiusKm = 5) {
  const earthRadiusKm = 6371;
  const radiusInDegrees = radiusKm / earthRadiusKm * (180 / Math.PI);
  
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;
  
  const deltaLat = distance * Math.cos(angle);
  const deltaLng = distance * Math.sin(angle) / Math.cos(baseLat * Math.PI / 180);
  
  const newLat = baseLat + deltaLat;
  const newLng = baseLng + deltaLng;
  
  const { north, south, east, west } = config.nycBounds;
  const clampedLat = Math.max(south, Math.min(north, newLat));
  const clampedLng = Math.max(west, Math.min(east, newLng));
  
  return {
    lat: parseFloat(clampedLat.toFixed(6)),
    lng: parseFloat(clampedLng.toFixed(6))
  };
}

function isWithinNYCBounds(lat, lng) {
  const { north, south, east, west } = config.nycBounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

module.exports = {
  generateRandomNYCLocation,
  generateNearbyLocation,
  isWithinNYCBounds
}; 