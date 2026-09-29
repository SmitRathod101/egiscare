const EventEmitter = require("events");
const { Aedes } = require("aedes");
const net = require("net");
const mqtt = require("mqtt");
const roverService = require("./RoverService");
const db = require("../db/database");

class MqttService extends EventEmitter {
  constructor() {
    super();
    this.broker = null;
    this.server = null;
    this.client = null;
    this.connected = false;
  }

  async init() {
    const brokerUrl = process.env.MQTT_BROKER_URL;

    if (brokerUrl) {
      // Connect to external MQTT broker
      console.log(`[MQTT] Connecting to external broker: ${brokerUrl}`);
      this.client = mqtt.connect(brokerUrl, {
        clientId: `egiscare_backend_${Math.random().toString(16).substring(2, 8)}`,
        username: process.env.MQTT_USERNAME || undefined,
        password: process.env.MQTT_PASSWORD || undefined,
        reconnectPeriod: 3000,
      });

      this.setupClientListeners();
    } else {
      // Launch embedded Aedes MQTT broker for local development / simulation
      console.log("[MQTT] Launching embedded Aedes MQTT broker on port 1883");
      this.broker = new Aedes();
      await this.broker.listen();

      this.server = net.createServer(this.broker.handle);

      const port = parseInt(process.env.MQTT_PORT) || 1883;
      this.server.listen(port, () => {
        console.log(`[MQTT] Embedded broker listening on port ${port}`);
        // Connect internal backend client to embedded broker
        this.client = mqtt.connect(`mqtt://127.0.0.1:${port}`);
        this.setupClientListeners();
      });

      this.broker.on("client", (client) => {
        console.log(`[MQTT Broker] Client connected: ${client ? client.id : "unknown"}`);
      });

      this.broker.on("clientDisconnect", (client) => {
        console.log(`[MQTT Broker] Client disconnected: ${client ? client.id : "unknown"}`);
      });
    }
  }

  setupClientListeners() {
    if (!this.client) return;

    this.client.on("connect", () => {
      this.connected = true;
      console.log("[MQTT] Backend client connected to broker");

      // Subscribe to all rover topics
      this.client.subscribe("egiscare/rover/+/status");
      this.client.subscribe("egiscare/rover/+/telemetry");
      this.client.subscribe("egiscare/rover/+/heartbeat");
      this.client.subscribe("egiscare/rover/+/alert");
    });

    this.client.on("message", (topic, payload) => {
      this.handleMessage(topic, payload);
    });

    this.client.on("error", (err) => {
      console.error("[MQTT] Client error:", err.message);
    });

    this.client.on("offline", () => {
      this.connected = false;
      console.warn("[MQTT] Client offline");
    });
  }

  handleMessage(topic, payload) {
    try {
      const parts = topic.split("/"); // egiscare / rover / {rover_id} / {type}
      if (parts.length < 4) return;

      const roverId = parts[2];
      const messageType = parts[3];
      const data = JSON.parse(payload.toString());

      if (messageType === "telemetry" || messageType === "status" || messageType === "heartbeat") {
        const updated = roverService.updateTelemetry(roverId, {
          status: data.status,
          battery: data.battery,
          uptime_sec: data.uptime_sec,
          location: data.location,
          current_task: data.current_task,
        });

        this.emit("rover_update", { rover_id: roverId, type: messageType, data: updated });
      } else if (messageType === "alert") {
        const { type, severity, title, message } = data;
        if (type && severity && title && message) {
          const res = db
            .prepare(`
              INSERT INTO alerts (rover_id, type, severity, title, message)
              VALUES (?, ?, ?, ?, ?)
            `)
            .run(roverId, type, severity, title, message);

          const alertObj = db.prepare("SELECT * FROM alerts WHERE id = ?").get(res.lastInsertRowid);
          this.emit("alert", alertObj);
        }
      }
    } catch (err) {
      console.error("[MQTT] Failed to process payload:", err.message);
    }
  }

  publishCommand(roverId, command) {
    if (!this.client || !this.connected) {
      console.warn(`[MQTT] Cannot publish command "${command}" to ${roverId}: client not connected`);
      return false;
    }

    const topic = `egiscare/rover/${roverId}/command`;
    const payload = JSON.stringify({
      rover_id: roverId,
      command: command,
      timestamp: new Date().toISOString(),
    });

    this.client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) console.error(`[MQTT] Error publishing command to ${topic}:`, err);
      else console.log(`[MQTT] Command "${command}" published to ${topic}`);
    });
    return true;
  }
}

module.exports = new MqttService();
