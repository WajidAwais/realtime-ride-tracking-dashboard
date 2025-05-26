const driverStore = require('../models/driverStore');
const { DRIVERS } = require('../utils/auth');


async function updateLocation(req, res) {
  try {
    const { lat, lng } = req.body;
    const driverId = req.user.driverId;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        error: 'Invalid location data: lat and lng must be numbers'
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        error: 'Invalid coordinates: lat must be -90 to 90, lng must be -180 to 180'
      });
    }

    const driverProfile = Object.values(DRIVERS)
      .find(driver => driver.profile.id === driverId)?.profile;

    if (!driverProfile) {
      return res.status(404).json({
        error: 'Driver profile not found'
      });
    }

    const wasOnlineBefore = driverStore.isDriverOnline(driverId);

    driverStore.updateDriverLocation(driverId, lat, lng, driverProfile);

    const { io } = require('../server');
    if (io) {
      const dashboardNamespace = io.of('/dashboard');
      
      dashboardNamespace.emit('driver_location_update', {
        driverId,
        profile: driverProfile,
        location: { lat, lng },
        timestamp: new Date().toISOString()
      });

      if (!wasOnlineBefore) {
        const onlineDrivers = driverStore.getOnlineDrivers();
        dashboardNamespace.emit('online_drivers', {
          drivers: onlineDrivers,
          count: onlineDrivers.length,
          timestamp: new Date().toISOString()
        });

        dashboardNamespace.emit('driver_connected', {
          driverId,
          profile: driverProfile,
          location: { lat, lng },
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`Location updated for driver ${driverProfile.name} (${driverId}): ${lat}, ${lng}`);

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: { lat, lng },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      error: 'Internal server error while updating location'
    });
  }
}


async function getLocation(req, res) {
  try {
    const driverId = req.user.driverId;
    const locationData = driverStore.getDriverLocation(driverId);

    if (!locationData) {
      return res.status(404).json({
        error: 'No location data found for this driver'
      });
    }

    res.json({
      success: true,
      location: {
        lat: locationData.lat,
        lng: locationData.lng,
        timestamp: locationData.timestamp
      },
      isOnline: driverStore.isDriverOnline(driverId)
    });

  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching location'
    });
  }
}


async function getOnlineDrivers(req, res) {
  try {
    const onlineDrivers = driverStore.getOnlineDrivers();
    
    res.json({
      success: true,
      drivers: onlineDrivers,
      count: onlineDrivers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get online drivers error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching online drivers'
    });
  }
}


async function getDriverLocation(req, res) {
  try {
    const { driverId } = req.params;
    
    if (!driverId) {
      return res.status(400).json({
        error: 'Driver ID is required'
      });
    }

    const locationData = driverStore.getDriverLocation(driverId);
    const isOnline = driverStore.isDriverOnline(driverId);

    if (!locationData) {
      return res.status(404).json({
        error: 'Driver location not found',
        driverId
      });
    }

    res.json({
      success: true,
      driverId,
      profile: locationData.profile,
      location: {
        lat: locationData.lat,
        lng: locationData.lng,
        timestamp: locationData.timestamp
      },
      isOnline,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get driver location error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching driver location'
    });
  }
}


async function getStats(req, res) {
  try {
    const stats = driverStore.getStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching statistics'
    });
  }
}

module.exports = {
  updateLocation,
  getLocation,
  getOnlineDrivers,
  getDriverLocation,
  getStats
}; 