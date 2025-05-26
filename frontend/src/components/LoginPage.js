import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css';


function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3001/api/login', credentials);
      
      if (response.data.success) {
        onLogin({
          username: credentials.username,
          profile: response.data.profile,
          token: response.data.token
        });
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🚗 Ride Share Dashboard</h1>
          <p>Monitor drivers and track real-time locations</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>Dashboard Login</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Enter any username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Enter any password"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Real-time Tracking</h3>
            <p>Monitor driver locations with live updates every 5 seconds</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🟢</div>
            <h3>Online Status</h3>
            <p>See which drivers are currently online and available</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Notifications</h3>
            <p>Get alerts when drivers go offline or come back online</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Dashboard Analytics</h3>
            <p>View comprehensive driver statistics and performance metrics</p>
          </div>
        </div>

        <div className="demo-note">
          <p><strong>Demo Access:</strong> Enter any username and password to access the dashboard</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 