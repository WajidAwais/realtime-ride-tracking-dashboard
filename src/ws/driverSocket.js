const { authenticateSocketToken } = require('../utils/auth');
const driverStore = require('../models/driverStore');
const { DRIVERS } = require('../utils/auth');

/**
 * Driver WebSocket namespace handler
 * Handles real-time location updates from drivers
 * 
 * Namespace: /driver/update
 * Authentication: Required via JWT token
 * Events:
 * - connection: Driver connects and authenticates
 * - location_update: Driver sends location data
 * - disconnect: Driver disconnects
 */
function setupDriverSocket(io) {
  const driverNamespace = io.of('/driver/update');

  // Authentication middleware for driver namespace
  driverNamespace.use(authenticateSocketToken);

  driverNamespace.on('connection', (socket) => {
    const driverId = socket.user.driverId;
    const driverName = socket.user.name;

    console.log(`Driver ${driverName} (${driverId}) connected via WebSocket`);

    // Store socket connection for this driver
    driverStore.setDriverSocket(driverId, socket.id);

    // Handle location updates from driver
    socket.on('location_update', (data) => {
      try {
        const { lat, lng } = data;

        // Validate location data
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          socket.emit('error', { 
            message: 'Invalid location data: lat and lng must be numbers' 
          });
          return;
        }

        // Validate coordinate ranges
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          socket.emit('error', { 
            message: 'Invalid coordinates: lat must be -90 to 90, lng must be -180 to 180' 
          });
          return;
        }

        // Get driver profile
        const driverProfile = Object.values(DRIVERS)
          .find(driver => driver.profile.id === driverId)?.profile;

        if (!driverProfile) {
          socket.emit('error', { 
            message: 'Driver profile not found' 
          });
          return;
        }

        const wasOnlineBefore = driverStore.isDriverOnline(driverId);

        // Update driver location in store
        driverStore.updateDriverLocation(driverId, lat, lng, driverProfile);

        // Confirm location update to driver
        socket.emit('location_updated', {
          success: true,
          location: { lat, lng },
          timestamp: new Date().toISOString()
        });

        // Broadcast to dashboard clients (handled by dashboard socket)
        const dashboardNamespace = socket.nsp.server.of('/dashboard');
        
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

        console.log(`Real-time location update from ${driverName} (${driverId}): ${lat}, ${lng}`);

      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { 
          message: 'Failed to process location update' 
        });
      }
    });

    // Handle driver requesting to start location sharing
    socket.on('start_sharing', () => {
      socket.emit('sharing_started', {
        message: 'Location sharing started',
        driverId,
        timestamp: new Date().toISOString()
      });
      console.log(`Driver ${driverName} (${driverId}) started location sharing`);
    });

    // Handle driver requesting to stop location sharing
    socket.on('stop_sharing', () => {
      socket.emit('sharing_stopped', {
        message: 'Location sharing stopped',
        driverId,
        timestamp: new Date().toISOString()
      });
      console.log(`Driver ${driverName} (${driverId}) stopped location sharing`);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle driver disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Driver ${driverName} (${driverId}) disconnected: ${reason}`);
      
      // Remove driver from online status completely
      driverStore.removeDriver(driverId);
      
      // Notify dashboard clients that driver went offline
      const dashboardNamespace = socket.nsp.server.of('/dashboard');
      dashboardNamespace.emit('driver_disconnected', {
        driverId,
        profile: { id: driverId, name: driverName },
        timestamp: new Date().toISOString(),
        reason
      });

      // Also broadcast updated online drivers list
      const onlineDrivers = driverStore.getOnlineDrivers();
      dashboardNamespace.emit('online_drivers', {
        drivers: onlineDrivers,
        count: onlineDrivers.length,
        timestamp: new Date().toISOString()
      });
    });

    // Handle authentication errors during connection
    socket.on('connect_error', (error) => {
      console.error(`Driver connection error for ${driverId}:`, error.message);
    });

    // Send welcome message to driver
    socket.emit('connected', {
      message: 'Successfully connected to driver location service',
      driverId,
      name: driverName,
      timestamp: new Date().toISOString()
    });
  });

  return driverNamespace;
}

module.exports = { setupDriverSocket }; 