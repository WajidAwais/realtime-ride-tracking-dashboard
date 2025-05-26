# 🚗 Ride-Sharing Dashboard

A real-time ride-sharing dashboard system built with Node.js, Express, Socket.IO, and React. This project demonstrates a scalable architecture for tracking driver locations in real-time, similar to Uber's driver tracking system.

## 🏗️ Architecture Overview

### Backend (Node.js + Express + Socket.IO)
- **REST API** for driver authentication and location updates
- **WebSocket namespaces** for real-time communication
- **JWT authentication** with 5-minute token expiry
- **In-memory data storage** (easily replaceable with Redis/Database)
- **Modular structure** with controllers, routes, middleware, and utilities

### Frontend (React)
- **Login page** for dashboard access
- **Real-time driver tracking** with WebSocket connections
- **Online/offline driver status** indicators
- **Responsive design** with modern UI/UX

## 🚀 Features

### Backend Features
1. **Driver Authentication** (`POST /api/login`)
   - Hardcoded credentials for demo
   - JWT token generation (5-minute expiry)
   - Driver profile management

2. **Location Updates** (`POST /api/driver/update`)
   - Authenticated location updates
   - Real-time storage in memory
   - Coordinate validation

3. **WebSocket Namespaces**
   - `/driver/update` - Driver location streaming
   - `/dashboard` - Dashboard client connections

4. **Dashboard API**
   - Get online drivers
   - Real-time location subscriptions
   - Offline driver notifications

### Frontend Features
1. **Dashboard Login**
   - Simple authentication for dashboard access
   - Beautiful, responsive UI

2. **Driver Tracking**
   - Dropdown list of online drivers
   - Green status indicators for active drivers
   - Real-time location updates every 5 seconds

3. **Real-time Notifications**
   - Connection status indicators
   - Driver online/offline alerts
   - Error handling and reconnection


## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm

### 1. Clone and Setup Backend

```bash
cd ride-share

# Install backend dependencies
npm install

# Start the backend server
npm run dev
```

The backend will start on `http://localhost:3001`

### 2. Setup Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the React development server
npm start
```

The frontend will start on `http://localhost:3000`

## 🔐 Authentication

### Driver Credentials (for API testing)
```
Username: driver1, Password: password1
Username: driver2, Password: password2
Username: driver3, Password: password3
```

### Dashboard Access
Use any username/password combination to access the dashboard.

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/login
Authenticate a driver and receive JWT token.

