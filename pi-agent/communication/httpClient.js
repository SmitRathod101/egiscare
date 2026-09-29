const http = require("http");

class HttpAgentClient {
  constructor(config) {
    this.config = config;
  }

  async sendTelemetry(telemetry) {
    const url = new URL(`${this.config.backend_url}/api/rover/telemetry`);
    const payload = JSON.stringify({
      rover_id: this.config.rover_id,
      ...telemetry,
    });

    return new Promise((resolve, reject) => {
      const req = http.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Rover-Secret": this.config.rover_secret || "default_rover_secret",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(data || "{}"));
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            }
          });
        }
      );

      req.on("error", (err) => reject(err));
      req.write(payload);
      req.end();
    });
  }

  async pollCommand() {
    const url = new URL(`${this.config.backend_url}/api/rover/command`);

    return new Promise((resolve, reject) => {
      const req = http.request(
        url,
        {
          method: "GET",
          headers: {
            "X-Rover-Secret": this.config.rover_secret || "default_rover_secret",
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                resolve(parsed.command);
              } catch {
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        }
      );

      req.on("error", () => resolve(null));
      req.end();
    });
  }
}

module.exports = HttpAgentClient;
