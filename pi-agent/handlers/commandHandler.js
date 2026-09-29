class CommandHandler {
  constructor(motorController, safetyHandler) {
    this.motors = motorController;
    this.safety = safetyHandler;
  }

  async handleCommand(commandStr) {
    const cmd = commandStr.toUpperCase().trim();
    console.log(`[COMMAND HANDLER] Processing command: ${cmd}`);

    // Emergency Stop bypasses normal state checks
    if (cmd === "EMERGENCY_STOP") {
      return await this.safety.triggerEmergencyStop("Command: EMERGENCY_STOP");
    }

    if (this.safety.emergencyStopActive) {
      if (cmd === "RESET" || cmd === "START") {
        await this.safety.resetSafety();
      } else {
        throw new Error("Cannot execute command: System is in EMERGENCY STOP lock state.");
      }
    }

    switch (cmd) {
      case "START":
        await this.motors.moveForward(30);
        return { status: "Active", task: "Navigating" };

      case "STOP":
        await this.motors.stop();
        return { status: "Stopped", task: "Idle" };

      case "MOVE_FORWARD":
        await this.motors.moveForward(70);
        return { status: "Moving", task: "Moving Forward" };

      case "MOVE_BACKWARD":
        await this.motors.moveBackward(50);
        return { status: "Moving", task: "Moving Backward" };

      case "TURN_LEFT":
        await this.motors.turnLeft(60);
        return { status: "Turning", task: "Turning Left" };

      case "TURN_RIGHT":
        await this.motors.turnRight(60);
        return { status: "Turning", task: "Turning Right" };

      case "RETURN_HOME":
        await this.motors.moveBackward(40);
        return { status: "Returning Home", task: "Returning to Dock" };

      default:
        throw new Error(`Unknown command "${cmd}"`);
    }
  }
}

module.exports = CommandHandler;
