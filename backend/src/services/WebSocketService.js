const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const roverService = require("./RoverService");
const mqttService = require("./MqttService");

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  init(server) {
    this.wss = new WebSocket.Server({ server, path: "/ws" });

    this.wss.on("connection", (ws, req) => {
      // Optional JWT authentication from URL search params: ?token=xxx
      const urlParams = new URLSearchParams(req.url.replace(/^[^?]*\?/, ""));
      const token = urlParams.get("token");

      let user = null;
      if (token) {
        try {
          user = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");
        } catch {
          ws.close(4001, "Unauthorized token");
          return;
        }
      }

      ws.isAlive = true;
      ws.user = user;
      this.clients.add(ws);

      console.log(`[WebSocket] Client connected (${this.clients.size} total)`);

      // Send initial state on connection
      ws.send(
        JSON.stringify({
          type: "INIT",
          rover: roverService.getRoverById("RVR-001"),
          timestamp: new Date().toISOString(),
        })
      );

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "PING") {
            ws.send(JSON.stringify({ type: "PONG" }));
          }
        } catch {}
      });

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected (${this.clients.size} total)`);
      });

      ws.on("error", (err) => {
        console.error("[WebSocket] Connection error:", err.message);
      });
    });

    // Heartbeat ping interval
    setInterval(() => {
      for (const ws of this.clients) {
        if (!ws.isAlive) {
          this.clients.delete(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, 30000);

    // Subscribe to RoverService events
    roverService.on("telemetry", (rover) => {
      this.broadcast({ type: "ROVER_TELEMETRY", rover });
    });

    roverService.on("command", (payload) => {
      this.broadcast({ type: "ROVER_COMMAND", ...payload });
      // Also publish via MQTT
      mqttService.publishCommand(payload.rover_id, payload.command);
    });

    // Subscribe to MqttService events
    mqttService.on("rover_update", (update) => {
      this.broadcast({ type: "ROVER_UPDATE", ...update });
    });

    mqttService.on("alert", (alert) => {
      this.broadcast({ type: "ALERT", alert });
    });
  }

  broadcast(data) {
    const payload = JSON.stringify(data);
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

module.exports = new WebSocketService();
