const config = require("./config.json");
const {
  MockMotorController,
  MockSensorController,
  MockCameraController,
  MockBatteryController,
} = require("./hardware/mockControllers");
const {
  RpiMotorController,
  RpiSensorController,
  RpiCameraController,
  RpiBatteryController,
} = require("./hardware/rpiControllers");
const SafetyHandler = require("./handlers/safetyHandler");
const CommandHandler = require("./handlers/commandHandler");
const MqttAgentClient = require("./communication/mqttClient");
const HttpAgentClient = require("./communication/httpClient");

const isMock = process.env.SIMULATION_MODE !== "false" || config.mode === "mock";

console.log("=========================================");
console.log(`EGISCARE Raspberry Pi Rover Agent v1.0.0`);
console.log(`Rover ID: ${config.rover_id}`);
console.log(`Mode: ${isMock ? "MOCK / SIMULATED HARDWARE" : "PHYSICAL RASPBERRY PI HARDWARE"}`);
console.log("=========================================");

// Initialize HAL controllers based on execution environment
const motorController = isMock ? new MockMotorController(config) : new RpiMotorController(config);
const sensorController = isMock ? new MockSensorController() : new RpiSensorController();
const cameraController = isMock ? new MockCameraController() : new RpiCameraController();
const batteryController = isMock ? new MockBatteryController() : new RpiBatteryController();

const safetyHandler = new SafetyHandler(motorController, sensorController);
const commandHandler = new CommandHandler(motorController, safetyHandler);

const httpClient = new HttpAgentClient(config);

let currentStatus = "Online";
let currentTask = "Idle";
let uptimeSec = 0;

// Handle incoming commands
const handleIncomingCommand = async (command) => {
  if (!command) return;
  console.log(`🤖 [PI AGENT] Received command: "${command}"`);
  try {
    const res = await commandHandler.handleCommand(command);
    currentStatus = res.status || currentStatus;
    currentTask = res.task || currentTask;
  } catch (err) {
    console.error(`❌ [PI AGENT] Command execution failed:`, err.message);
  }
};

const mqttClient = new MqttAgentClient(config, handleIncomingCommand);
mqttClient.connect();

// Periodic telemetry & heartbeat reporting
setInterval(async () => {
  uptimeSec += Math.round(config.telemetry_interval_ms / 1000);
  const batteryPct = await batteryController.getPercentage();
  const obstacle = await safetyHandler.checkObstacles();

  const telemetry = {
    status: currentStatus,
    battery: batteryPct,
    uptime_sec: uptimeSec,
    location: "Care Wing A",
    current_task: currentTask,
    obstacle_detected: obstacle,
    timestamp: new Date().toISOString(),
  };

  // Push via MQTT primary, fallback to HTTP REST
  const publishedMqtt = mqttClient.publishTelemetry(telemetry);
  if (!publishedMqtt) {
    try {
      await httpClient.sendTelemetry(telemetry);
    } catch (err) {
      // Backend not reachable yet
    }
  }

  // Also check HTTP poll queue if MQTT is disconnected
  if (!mqttClient.connected) {
    const pollCmd = await httpClient.pollCommand();
    if (pollCmd) {
      await handleIncomingCommand(pollCmd);
    }
  }
}, config.telemetry_interval_ms || 3000);
