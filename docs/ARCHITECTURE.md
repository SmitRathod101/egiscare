# EGISCARE — Architecture Specification

## Overview

EGISCARE is an autonomous robotics care and logistics management system designed for healthcare facilities, assisted living centers, and residential care environments.

```
+-----------------------------------------------------------------------+
|                           React / Vite UI                             |
|          (Auth Context, Dashboard, Tasks, Rovers, Users, RBAC)        |
+-----------------------------------+-----------------------------------+
                                    |
                            REST + WebSocket
                                    v
+-----------------------------------------------------------------------+
|                       Node.js / Express Backend                       |
|  - REST Controllers (Auth, Tasks, Medicines, Residents, Rovers, Users)|
|  - SQLite Database (Users, Tasks, Medicines, Residents, Audit Logs)    |
|  - RoverService (Hardware-Independent Business & Command Abstraction) |
|  - Embedded Aedes MQTT Broker & Client Service                       |
|  - WebSocket Broadcasting Service for Real-Time Telemetry             |
+-----------------------------------+-----------------------------------+
                                    |
                               MQTT / HTTP
                                    v
+-----------------------------------------------------------------------+
|                    Raspberry Pi Rover Agent (pi-agent)                |
|  - Communication Layer (MQTT + HTTP Fallback)                         |
|  - Safety & Emergency Stop Handler (Collision & Emergency Lockout)     |
|  - Hardware Abstraction Layer (Motor, Sensor, Camera, Battery HAL)    |
|  - Mock Controllers (Simulated Mode) & Physical RPi Hardware Drivers  |
+-----------------------------------------------------------------------+
```

---

## Key Subsystems

### 1. Backend REST & Real-Time Engine
- Built with Express.js, pure-JS SQLite, `ws` WebSockets, and `aedes` MQTT.
- Full JWT authentication with password hashing using bcrypt.
- Centralized role-based access control (`admin`, `caretaker`, `viewer`).
- Hardware-independent `RoverService` manages high-level rover operations (`START`, `STOP`, `MOVE_FORWARD`, `MOVE_BACKWARD`, `TURN_LEFT`, `TURN_RIGHT`, `RETURN_HOME`, `EMERGENCY_STOP`).

### 2. Autonomous Raspberry Pi Agent
- Modular Node.js agent running directly on the Raspberry Pi SBC.
- HAL interface contracts separate hardware driver logic from control loops.
- Supports both physical GPIO pinouts (L298N motor drivers, HC-SR04 ultrasonic sensors, Picamera, ADC battery monitoring) and mock simulation mode (`npm run mock`).

### 3. Real-Time Telemetry Pipeline
- Bidirectional MQTT topics (`egiscare/rover/{rover_id}/...`) link Pi agent and backend.
- Backend forwards telemetry and alerts to browser clients over WebSocket (`/ws`).
