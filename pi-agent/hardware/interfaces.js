/**
 * Hardware Abstraction Layer (HAL) Interfaces
 * Defines abstract controller contracts for motors, sensors, camera, and battery.
 */

class MotorController {
  async moveForward(speed = 100) { throw new Error("Method not implemented"); }
  async moveBackward(speed = 100) { throw new Error("Method not implemented"); }
  async turnLeft(speed = 100) { throw new Error("Method not implemented"); }
  async turnRight(speed = 100) { throw new Error("Method not implemented"); }
  async stop() { throw new Error("Method not implemented"); }
  async emergencyStop() { throw new Error("Method not implemented"); }
}

class SensorController {
  async readDistanceFront() { throw new Error("Method not implemented"); }
  async readDistanceRear() { throw new Error("Method not implemented"); }
  async readObstacles() { throw new Error("Method not implemented"); }
}

class CameraController {
  async startStream() { throw new Error("Method not implemented"); }
  async stopStream() { throw new Error("Method not implemented"); }
  async getSnapshot() { throw new Error("Method not implemented"); }
}

class BatteryController {
  async getPercentage() { throw new Error("Method not implemented"); }
  async getVoltage() { throw new Error("Method not implemented"); }
  async isCharging() { throw new Error("Method not implemented"); }
}

module.exports = {
  MotorController,
  SensorController,
  CameraController,
  BatteryController,
};
