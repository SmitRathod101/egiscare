require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const medicineRoutes = require("./routes/medicines");
const residentRoutes = require("./routes/residents");
const roverRoutes = require("./routes/rover");
const alertRoutes = require("./routes/alerts");
const auditRoutes = require("./routes/audit");

const roverService = require("./services/RoverService");
const mqttService = require("./services/MqttService");
const webSocketService = require("./services/WebSocketService");

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/rover", roverRoutes);
app.use("/api/rovers", roverRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/audit-logs", auditRoutes);

// ── Health check ───────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    mqtt: mqttService.connected ? "connected" : "disconnected",
    websocket: "active",
    simulation: roverService.simulationInterval ? "active" : "disabled",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 ────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Centralized Error Handler ───────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ── Server & Services Initialization ────────────────────────────────────────

const server = http.createServer(app);

// Initialize WebSocket & MQTT
webSocketService.init(server);
mqttService.init();

// Start simulated rover mode in dev environment
if (process.env.SIMULATION_MODE !== "false") {
  roverService.startSimulation("RVR-001");
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`EGISCARE backend server running on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
