class SafetyHandler {
  constructor(motorController, sensorController) {
    this.motors = motorController;
    this.sensors = sensorController;
    this.emergencyStopActive = false;
  }

  async triggerEmergencyStop(reason = "Operator Emergency Stop") {
    this.emergencyStopActive = true;
    console.error(`🚨 [SAFETY HANDLER] EMERGENCY STOP TRIGGERED: ${reason}`);

    try {
      await this.motors.emergencyStop();
    } catch (err) {
      console.error("[SAFETY HANDLER] Failed to execute motor emergency stop:", err);
    }

    return {
      status: "EMERGENCY_STOP",
      reason: reason,
      timestamp: new Date().toISOString(),
    };
  }

  async resetSafety() {
    this.emergencyStopActive = false;
    await this.motors.stop();
    console.log("[SAFETY HANDLER] Safety state reset. System cleared for operation.");
  }

  async checkObstacles() {
    if (this.emergencyStopActive) return true;

    try {
      const obstacle = await this.sensors.readObstacles();
      if (obstacle) {
        console.warn("⚠️ [SAFETY HANDLER] Obstacle detected! Auto-stopping motors.");
        await this.motors.stop();
        return true;
      }
    } catch (err) {
      console.error("[SAFETY HANDLER] Sensor check error:", err);
    }
    return false;
  }
}

module.exports = SafetyHandler;
