const {
  MotorController,
  SensorController,
  CameraController,
  BatteryController,
} = require("./interfaces");

class MockMotorController extends MotorController {
  constructor(config) {
    super();
    this.config = config;
    this.state = "STOPPED";
  }

  async moveForward(speed = 100) {
    this.state = `FORWARD_${speed}`;
    console.log(`[MOCK MOTOR] Moving FORWARD at ${speed}%`);
  }

  async moveBackward(speed = 100) {
    this.state = `BACKWARD_${speed}`;
    console.log(`[MOCK MOTOR] Moving BACKWARD at ${speed}%`);
  }

  async turnLeft(speed = 100) {
    this.state = `LEFT_${speed}`;
    console.log(`[MOCK MOTOR] Turning LEFT at ${speed}%`);
  }

  async turnRight(speed = 100) {
    this.state = `RIGHT_${speed}`;
    console.log(`[MOCK MOTOR] Turning RIGHT at ${speed}%`);
  }

  async stop() {
    this.state = "STOPPED";
    console.log("[MOCK MOTOR] Motor STOPPED");
  }

  async emergencyStop() {
    this.state = "EMERGENCY_STOPPED";
    console.log("🚨 [MOCK MOTOR] EMERGENCY STOP EXECUTED IMMEDIATELY!");
  }
}

class MockSensorController extends SensorController {
  async readDistanceFront() {
    return Math.floor(Math.random() * 150) + 50; // cm
  }

  async readDistanceRear() {
    return Math.floor(Math.random() * 200) + 50; // cm
  }

  async readObstacles() {
    const dist = await this.readDistanceFront();
    return dist < 30; // Obstacle detected if < 30cm
  }
}

class MockCameraController extends CameraController {
  async startStream() {
    console.log("[MOCK CAMERA] Video stream started (dev placeholder stream)");
    return "http://localhost:4000/stream/mock.m3u8";
  }

  async stopStream() {
    console.log("[MOCK CAMERA] Video stream stopped");
  }

  async getSnapshot() {
    return "data:image/png;base64,mockImageBytes";
  }
}

class MockBatteryController extends BatteryController {
  constructor() {
    super();
    this.battery = 85;
  }

  async getPercentage() {
    this.battery = Math.max(10, this.battery - 0.1);
    return Math.round(this.battery);
  }

  async getVoltage() {
    return 11.8;
  }

  async isCharging() {
    return false;
  }
}

module.exports = {
  MockMotorController,
  MockSensorController,
  MockCameraController,
  MockBatteryController,
};
