const mqtt = require("mqtt");

class MqttAgentClient {
  constructor(config, onCommandCallback) {
    this.config = config;
    this.onCommand = onCommandCallback;
    this.client = null;
    this.connected = false;
  }

  connect() {
    const brokerUrl = this.config.mqtt_broker_url || "mqtt://localhost:1883";
    console.log(`[PI AGENT MQTT] Connecting to broker at ${brokerUrl}...`);

    this.client = mqtt.connect(brokerUrl, {
      clientId: `pi_agent_${this.config.rover_id}`,
      reconnectPeriod: 3000,
    });

    this.client.on("connect", () => {
      this.connected = true;
      console.log(`[PI AGENT MQTT] Connected as ${this.config.rover_id}`);

      const commandTopic = `egiscare/rover/${this.config.rover_id}/command`;
      this.client.subscribe(commandTopic, (err) => {
        if (!err) console.log(`[PI AGENT MQTT] Subscribed to ${commandTopic}`);
      });
    });

    this.client.on("message", (topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());
        if (msg.command && typeof this.onCommand === "function") {
          this.onCommand(msg.command);
        }
      } catch (err) {
        console.error("[PI AGENT MQTT] Error parsing command payload:", err.message);
      }
    });

    this.client.on("error", (err) => {
      console.error("[PI AGENT MQTT] Connection error:", err.message);
    });

    this.client.on("offline", () => {
      this.connected = false;
      console.warn("[PI AGENT MQTT] Disconnected from MQTT broker");
    });
  }

  publishTelemetry(telemetry) {
    if (!this.client || !this.connected) return false;
    const topic = `egiscare/rover/${this.config.rover_id}/telemetry`;
    this.client.publish(topic, JSON.stringify(telemetry));
    return true;
  }

  publishAlert(alert) {
    if (!this.client || !this.connected) return false;
    const topic = `egiscare/rover/${this.config.rover_id}/alert`;
    this.client.publish(topic, JSON.stringify(alert));
    return true;
  }
}

module.exports = MqttAgentClient;
