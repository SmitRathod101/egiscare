# EGISCARE — Raspberry Pi Rover Agent

The Autonomous Rover Agent runs on the Raspberry Pi mounted on the EGISCARE Care & Logistics Rover. It communicates bidirectionally with the backend via MQTT and fallback HTTP REST APIs.

---

## 1. Architecture

```
Rover Agent (Raspberry Pi)
├── communication/
│   ├── mqttClient.js   — MQTT client (publishes telemetry/alerts, subscribes to commands)
│   └── httpClient.js   — HTTP REST fallback (pushes telemetry, polls pending commands)
├── handlers/
│   ├── commandHandler.js — Validates and dispatches commands (START, STOP, MOVE, etc.)
│   └── safetyHandler.js  — Emergency stop & ultrasonic collision prevention
├── hardware/
│   ├── interfaces.js     — Abstract HAL Controller classes
│   ├── mockControllers.js — Dev/simulation mock controllers
│   └── rpiControllers.js  — Physical Raspberry Pi GPIO/pigpio controllers
└── config.json           — Pinouts, thresholds, broker URLs, credentials
```

---

## 2. Installation on Raspberry Pi

### Prerequisites on Raspberry Pi OS (Debian 12 Bookworm / 64-bit):

```bash
# Update Pi OS packages
sudo apt update && sudo apt upgrade -y

# Install Node.js v18+ or v20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Optional: Install pigpio for hardware PWM motor control
sudo apt install -y pigpio python3-pigpio
```

### Installation Steps:

```bash
# Clone repository or copy pi-agent folder to Pi
cd /home/pi/egiscare/pi-agent

# Install dependencies
npm install

# Edit config.json with your Pi IP and backend server IP
nano config.json
```

---

## 3. Configuration (`config.json`)

```json
{
  "rover_id": "RVR-001",
  "backend_url": "http://192.168.1.100:4000",
  "mqtt_broker_url": "mqtt://192.168.1.100:1883",
  "rover_secret": "your_secure_rover_secret",
  "mode": "rpi",
  "telemetry_interval_ms": 3000,
  "hardware": {
    "motor_driver": "L298N",
    "left_motor_pins": { "en": 12, "in1": 16, "in2": 18 },
    "right_motor_pins": { "en": 13, "in3": 22, "in4": 24 }
  }
}
```

---

## 4. Running the Agent

### Mock / Simulation Mode (Development):
```bash
npm run mock
```

### Physical Hardware Mode (Raspberry Pi):
```bash
npm start
```

### Systemd Service Setup (Auto-start on Pi boot):
Create `/etc/systemd/system/egiscare-agent.service`:
```ini
[Unit]
Description=EGISCARE Raspberry Pi Rover Agent
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/egiscare/pi-agent/index.js
WorkingDirectory=/home/pi/egiscare/pi-agent
Restart=always
RestartSec=5
User=pi
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable egiscare-agent
sudo systemctl start egiscare-agent
```

---

## 5. Physical Hardware Note
> [!NOTE]
> Physical motor hardware integration must be verified on actual Raspberry Pi hardware before driving physical wheels in production. Use mock mode (`npm run mock`) for all development and automated testing.
