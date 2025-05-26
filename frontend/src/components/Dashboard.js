import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Dashboard.css';


function Dashboard({ user, onLogout }) {
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedDriverData, setSelectedDriverData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  const socketRef = useRef(null);

 
  useEffect(() => {
    initializeSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);


  const initializeSocket = () => {
    try {
      socketRef.current = io('http://localhost:3001/dashboard', {
        transports: ['websocket', 'polling']
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Connected to dashboard service');
        setConnectionStatus('connected');
        setError('');
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from dashboard service:', reason);
        setConnectionStatus('disconnected');
        setError('Connection lost. Attempting to reconnect...');
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnectionStatus('error');
        setError('Failed to connect to server. Please check your connection.');
      });

      socket.on('connected', (data) => {
        console.log('Dashboard service ready:', data);
        addNotification('Connected to dashboard service', 'success');
      });

      socket.on('online_drivers', (data) => {
        console.log('Received online drivers:', data);
        setOnlineDrivers(data.drivers || []);
        setLastUpdate(new Date().toISOString());
      });

      socket.on('driver_data', (data) => {
        console.log('Received driver data:', data);
        setSelectedDriverData(data);
        setLastUpdate(new Date().toISOString());
        setError('');
      });

      socket.on('driver_offline', (data) => {
        console.log('Driver offline:', data);
        setSelectedDriverData(null);
        addNotification(`Driver ${data.driverId} is offline`, 'warning');
      });

      socket.on('OFFLINE_DRIVER', (data) => {
        console.log('Offline driver notification:', data);
        addNotification(`Driver ${data.driverId} is offline - no recent location data`, 'error');
      });

      socket.on('subscribed', (data) => {
        console.log('Subscribed to driver:', data);
        addNotification(`Subscribed to driver ${data.driverId}`, 'success');
      });

      socket.on('unsubscribed', (data) => {
        console.log('Unsubscribed from driver:', data);
        addNotification(`Unsubscribed from driver ${data.driverId}`, 'info');
      });

      socket.on('error', (data) => {
        console.error('Socket error:', data);
        setError(data.message || 'An error occurred');
        addNotification(data.message || 'An error occurred', 'error');
      });

      socket.on('driver_disconnected', (data) => {
        console.log('Driver disconnected:', data);
        addNotification(`Driver ${data.profile?.name || data.driverId} went offline`, 'warning');
        
        if (selectedDriverId === data.driverId) {
          setSelectedDriverData(null);
          setSelectedDriverId('');
        }
      });

      socket.on('driver_connected', (data) => {
        console.log('Driver connected:', data);
        addNotification(`Driver ${data.profile?.name || data.driverId} came online`, 'success');
      });

    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setError('Failed to initialize connection');
    }
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep last 5 notifications
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  
  const handleDriverSelection = (driverId) => {
    if (!socketRef.current) return;

    if (selectedDriverId) {
      socketRef.current.emit('unsubscribe');
    }

    setSelectedDriverId(driverId);
    setSelectedDriverData(null);
    setError('');

    if (driverId) {
      socketRef.current.emit('subscribe', { driverId });
    }
  };

  
  const refreshDriversList = () => {
    if (socketRef.current) {
      socketRef.current.emit('get_online_drivers');
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };


  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#28a745';
      case 'disconnected': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">🚗 Ride Share Dashboard</h1>
          <div className="header-info">
            <span className="user-info">Welcome, {user.username}</span>
            <div className="connection-status">
              <span 
                className="status-dot" 
                style={{ backgroundColor: getConnectionStatusColor() }}
              ></span>
              {connectionStatus}
            </div>
            <button className="btn btn-danger" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Drivers List */}
          <div className="card drivers-card">
            <div className="card-header">
              <h2 className="card-title">Online Drivers</h2>
              <button 
                className="btn btn-secondary refresh-btn"
                onClick={refreshDriversList}
                disabled={connectionStatus !== 'connected'}
              >
                🔄 Refresh
              </button>
            </div>
            
            <div className="drivers-list">
              {onlineDrivers.length === 0 ? (
                <div className="no-drivers">
                  <p>No drivers online</p>
                  <small>Drivers will appear here when they start sharing location</small>
                </div>
              ) : (
                onlineDrivers.map(driver => (
                  <div 
                    key={driver.driverId} 
                    className={`driver-item ${selectedDriverId === driver.driverId ? 'selected' : ''}`}
                    onClick={() => handleDriverSelection(driver.driverId)}
                  >
                    <div className="driver-info">
                      <span className="status-dot online"></span>
                      <div>
                        <div className="driver-name">{driver.profile?.name || driver.driverId}</div>
                        <div className="driver-vehicle">{driver.profile?.vehicle || 'Unknown Vehicle'}</div>
                      </div>
                    </div>
                    <div className="driver-status">
                      <span className="status-online">Online</span>
                      <small>Last seen: {formatTimestamp(driver.lastSeen)}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Driver Selection */}
          <div className="card selection-card">
            <div className="card-header">
              <h2 className="card-title">Select Driver</h2>
            </div>
            
            <div className="form-group">
              <label htmlFor="driverSelect" className="form-label">
                Choose a driver to track:
              </label>
              <select
                id="driverSelect"
                className="form-select"
                value={selectedDriverId}
                onChange={(e) => handleDriverSelection(e.target.value)}
                disabled={connectionStatus !== 'connected'}
              >
                <option value="">-- Select a driver --</option>
                {onlineDrivers.map(driver => (
                  <option key={driver.driverId} value={driver.driverId}>
                    🟢 {driver.profile?.name || driver.driverId} ({driver.profile?.vehicle || 'Unknown'})
                  </option>
                ))}
              </select>
            </div>

            {selectedDriverId && (
              <div className="selected-driver-info">
                <h3>Tracking: {selectedDriverData?.profile?.name || selectedDriverId}</h3>
                <p>Real-time location updates will appear below</p>
              </div>
            )}
          </div>

          {/* Location Data */}
          <div className="card location-card">
            <div className="card-header">
              <h2 className="card-title">Driver Location</h2>
              {lastUpdate && (
                <small>Last update: {formatTimestamp(lastUpdate)}</small>
              )}
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {!selectedDriverId ? (
              <div className="no-selection">
                <p>Select a driver to view their location</p>
              </div>
            ) : selectedDriverData ? (
              <div className="location-data">
                <div className="location-grid">
                  <div className="location-item">
                    <label>Driver Name:</label>
                    <span>{selectedDriverData.profile?.name || 'Unknown'}</span>
                  </div>
                  <div className="location-item">
                    <label>Vehicle:</label>
                    <span>{selectedDriverData.profile?.vehicle || 'Unknown'}</span>
                  </div>
                  <div className="location-item">
                    <label>Latitude:</label>
                    <span className="coordinate">{selectedDriverData.location?.lat?.toFixed(6) || 'N/A'}</span>
                  </div>
                  <div className="location-item">
                    <label>Longitude:</label>
                    <span className="coordinate">{selectedDriverData.location?.lng?.toFixed(6) || 'N/A'}</span>
                  </div>
                  <div className="location-item">
                    <label>Status:</label>
                    <span className={selectedDriverData.isOnline ? 'status-online' : 'status-offline'}>
                      {selectedDriverData.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </span>
                  </div>
                  <div className="location-item">
                    <label>Last Update:</label>
                    <span>{formatTimestamp(selectedDriverData.location?.timestamp)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-location">
                <span className="loading-spinner"></span>
                <p>Loading driver location...</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="notifications">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification notification-${notification.type}`}
              >
                <span>{notification.message}</span>
                <small>{formatTimestamp(notification.timestamp)}</small>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard; 