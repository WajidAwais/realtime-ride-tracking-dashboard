import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import DriverApp from './components/DriverApp';
import './App.css';

function App() {
  const [mode, setMode] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isLoggedIn && mode === 'dashboard') {
    return (
      <div className="App">
        <div className="mode-selector">
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${mode === 'dashboard' ? 'active' : ''}`}
              onClick={() => switchMode('dashboard')}
            >
              📊 Dashboard (Client View)
            </button>
            <button 
              className={`mode-btn ${mode === 'driver' ? 'active' : ''}`}
              onClick={() => switchMode('driver')}
            >
              🚗 Driver App
            </button>
          </div>
        </div>
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  if (mode === 'driver') {
    return (
      <div className="App">
        <div className="mode-selector">
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${mode === 'dashboard' ? 'active' : ''}`}
              onClick={() => switchMode('dashboard')}
            >
              📊 Dashboard (Client View)
            </button>
            <button 
              className={`mode-btn ${mode === 'driver' ? 'active' : ''}`}
              onClick={() => switchMode('driver')}
            >
              🚗 Driver App
            </button>
          </div>
        </div>
        <DriverApp />
      </div>
    );
  }

  return (
    <div className="App">
      <Dashboard user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;
