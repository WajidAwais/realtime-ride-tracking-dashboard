import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './DriverApp.css';


function DriverApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [driverProfile, setDriverProfile] = useState(null);
  const [token, setToken] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('offline');
  
  const socketRef = useRef(null);
  const locationIntervalRef = useRef(null);

 
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3001/api/login', credentials);
      
      if (response.data.success) {
        setToken(response.data.token);
        setDriverProfile(response.data.profile);
        setIsLoggedIn(true);
        setStatus('online');
        console.log('Driver logged in:', response.data.profile.name);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };


  const generateRandomLocation = () => {
    const nycBounds = {
      north: 40.9176,
      south: 40.4774,
      east: -73.7004,
      west: -74.2591
    };
    
    const lat = Math.random() * (nycBounds.north - nycBounds.south) + nycBounds.south;
    const lng = Math.random() * (nycBounds.east - nycBounds.west) + nycBounds.west;
    
    return {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6))
    };
  };

 
  const startSharing = () => {
    if (!token) return;

    setIsSharing(true);
    setStatus('sharing location');

    socketRef.current = io('http://localhost:3001/driver/update', {
      auth: { token }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to driver service');
      setStatus('connected - sharing location');
    });

    socket.on('location_updated', (data) => {
      console.log('Location updated:', data);
      setCurrentLocation(data.location);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    locationIntervalRef.current = setInterval(() => {
      const location = generateRandomLocation();
      
      socket.emit('location_update', location);
      
      axios.post('http://localhost:3001/api/driver/update', location, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.error('REST update failed:', err));
      
    }, 10000);

    const initialLocation = generateRandomLocation();
    socket.emit('location_update', initialLocation);
    
    axios.post('http://localhost:3001/api/driver/update', initialLocation, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(err => console.error('Initial location failed:', err));
  };


  const stopSharing = async () => {
    setIsSharing(false);
    setStatus('online - not sharing');
    
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      await axios.post('http://localhost:3001/api/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Driver removed from online status');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };


  const handleLogout = async () => {
    // Stop sharing first
    if (isSharing) {
      stopSharing();
    }

    try {
      await axios.post('http://localhost:3001/api/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Driver logged out and removed from online status');
    } catch (err) {
      console.error('Failed to logout:', err);
    }

    setIsLoggedIn(false);
    setDriverProfile(null);
    setToken('');
    setCurrentLocation(null);
    setStatus('offline');
    setCredentials({ username: '', password: '' });
  };

 
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="driver-app">
        <div className="driver-login">
          <h1>🚗 Driver Login</h1>
          <p>Sign in to start sharing your location</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                placeholder="driver1, driver2, or driver3"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                placeholder="password1, password2, or password3"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary">
              Sign In as Driver
            </button>
          </form>
          
          <div className="demo-credentials">
            <h3>Demo Credentials:</h3>
            <ul>
              <li>driver1 / password1</li>
              <li>driver2 / password2</li>
              <li>driver3 / password3</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-app">
      <div className="driver-dashboard">
        <div className="driver-header">
          <h1>🚗 Driver: {driverProfile.name}</h1>
          <div className="driver-info">
            <p><strong>Vehicle:</strong> {driverProfile.vehicle}</p>
            <p><strong>License:</strong> {driverProfile.license}</p>
            <p><strong>Status:</strong> <span className={`status ${status.includes('sharing') ? 'active' : 'inactive'}`}>{status}</span></p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="location-controls">
          {!isSharing ? (
            <button onClick={startSharing} className="btn btn-primary btn-large">
              🟢 Start Sharing Location
            </button>
          ) : (
            <button onClick={stopSharing} className="btn btn-secondary btn-large">
              🔴 Stop Sharing Location
            </button>
          )}
        </div>

        {currentLocation && (
          <div className="current-location">
            <h3>Current Location</h3>
            <div className="location-display">
              <p><strong>Latitude:</strong> {currentLocation.lat}</p>
              <p><strong>Longitude:</strong> {currentLocation.lng}</p>
              <p><strong>Last Update:</strong> {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        <div className="instructions">
          <h3>Instructions:</h3>
          <ol>
            <li>Click "Start Sharing Location" to go online</li>
            <li>Your location will update every 10 seconds</li>
            <li>You'll appear in the dashboard as an online driver</li>
            <li>Open the dashboard in another tab to see yourself listed</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default DriverApp; 