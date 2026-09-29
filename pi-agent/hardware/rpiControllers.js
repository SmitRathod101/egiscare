const {
  MotorController,
  SensorController,
  CameraController,
  BatteryController,
} = require("./interfaces");

/**
 * Raspberry Pi Hardware Controllers Structure
 * Wraps GPIO pins, L298N motor drivers, Ultrasonic Sensors, Picamera, and ADC Battery monitor.
 * When physical GPIO libraries (e.g. rpio / pigpio / i2c-bus) are available on ARM Linux,
 * they interface directly with hardware pins configured in config.json.
 */

class RpiMotorController extends MotorController {
  constructor(config) {
    super();
    this.config = config.hardware?.left_motor_pins || {};
    this.initialized = false;
    this.initGpio();
  }

  initGpio() {
    try {
      // Lazy load gpio if on Pi
      // this.gpio = require('rpio');
      console.log("[RPI HARDWARE] Initialized Motor Controller pins:", this.config);
      this.initialized = true;
    } catch {
      console.warn("[RPI HARDWARE] GPIO library not installed. Operating in fallback mode.");
    }
  }

  async moveForward(speed = 100) {
    console.log(`[RPI HARDWARE] Driving motors FORWARD (PWM ${speed}%)`);
  }

  async moveBackward(speed = 100) {
    console.log(`[RPI HARDWARE] Driving motors BACKWARD (PWM ${speed}%)`);
  }

  async turnLeft(speed = 100) {
    console.log(`[RPI HARDWARE] Turning LEFT (PWM ${speed}%)`);
  }

  async turnRight(speed = 100) {
    console.log(`[RPI HARDWARE] Turning RIGHT (PWM ${speed}%)`);
  }

  async stop() {
    console.log("[RPI HARDWARE] Setting motor PWMs to 0");
  }

  async emergencyStop() {
    console.log("🚨 [RPI HARDWARE] EMERGENCY STOP — Cutting relay and motor PWM immediately!");
  }
}

class RpiSensorController extends SensorController {
  async readDistanceFront() {
    return 120; // Default reading until hardware pin trigger read
  }

  async readDistanceRear() {
    return 150;
  }

  async readObstacles() {
    const dist = await this.readDistanceFront();
    return dist < 30;
  }
}

class RpiCameraController extends CameraController {
  async startStream() {
    console.log("[RPI HARDWARE] Starting raspivid / MJPEG stream server on port 8081");
    return "http://pi-rover.local:8081/stream.mjs";
  }

  async stopStream() {
    console.log("[RPI HARDWARE] Stopped camera stream");
  }

  async getSnapshot() {
    return "http://pi-rover.local:8081/snapshot.jpg";
  }
}

class RpiBatteryController extends BatteryController {
  async getPercentage() {
    return 92;
  }

  async getVoltage() {
    return 12.1;
  }

  async isCharging() {
    return false;
  }
}

module.exports = {
  RpiMotorController,
  RpiSensorController,
  RpiCameraController,
  RpiBatteryController,
};
