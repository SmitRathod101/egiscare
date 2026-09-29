# EGISCARE — Deployment Guide

## Environment Configuration

Copy `.env.example` to `.env` in `backend/` and configure secure environment variables:

```env
PORT=4000
JWT_SECRET=use_a_strong_random_jwt_secret_here
JWT_EXPIRES_IN=8h
DB_PATH=./data/egiscare.db
ROVER_AGENT_SECRET=use_a_strong_rover_agent_secret
FRONTEND_ORIGIN=http://localhost:5173
MQTT_PORT=1883
SIMULATION_MODE=true
```

> [!IMPORTANT]
> Never commit production `.env` files or secrets to git repositories.

---

## Quick Start (Local Development)

### 1. Backend Server & Database:
```bash
cd backend
npm install
npm run seed
npm start
```
Starts Express REST server, embedded Aedes MQTT broker (port 1883), WebSocket server (port 4000), and SQLite DB.

### 2. React Frontend:
```bash
# In workspace root
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Raspberry Pi Agent (Mock Mode):
```bash
cd pi-agent
npm install
npm run mock
```

---

## Production Build Verification

### Build Frontend:
```bash
npm run build
```

### Run End-to-End Integration Suite:
```bash
cd backend
node test_integration.js
```
