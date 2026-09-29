const db = require("../db/database");
const EventEmitter = require("events");

class RoverService extends EventEmitter {
  constructor() {
    super();
    this.simulationInterval = null;
    this.simulatedState = {
      status: "Idle",
      battery: 88,
      location: "Care Wing A - Room 101",
      current_task: "Idle",
      uptime_sec: 14200,
      mode: "Simulated",
    };
  }

  getRovers() {
    const rovers = db.prepare("SELECT * FROM rovers ORDER BY id").all();
    return rovers.map((r) => this.formatRover(r));
  }

  getRoverById(roverId) {
    const rover = db.prepare("SELECT * FROM rovers WHERE rover_id = ? OR id = ?").get(roverId, roverId);
    return rover ? this.formatRover(rover) : null;
  }

  getRoverStatus(roverId) {
    const rover = this.getRoverById(roverId);
    if (!rover) return null;
    return {
      rover_id: rover.rover_id,
      name: rover.name,
      status: rover.status,
      battery: rover.battery,
      location: rover.location,
      current_task: rover.current_task,
      last_seen: rover.last_seen,
      connection_status: this.isOnline(rover.last_seen) ? "Connected" : "Disconnected",
    };
  }

  formatRover(r) {
    const isConn = this.isOnline(r.last_seen);
    return {
      ...r,
      connection_status: isConn ? "Connected" : "Disconnected",
      status: isConn ? r.status : "Offline",
    };
  }

  isOnline(lastSeen) {
    if (!lastSeen) return false;
    const diff = (new Date().getTime() - new Date(lastSeen).getTime()) / 1000;
    return diff < 45; // Considered online if heartbeated within last 45 seconds
  }

  updateTelemetry(roverId, telemetry) {
    const { status, battery, uptime_sec, location, current_task } = telemetry;
    const existing = db.prepare("SELECT * FROM rovers WHERE rover_id = ?").get(roverId);
    if (!existing) return null;

    db.prepare(`
      UPDATE rovers
      SET status = COALESCE(?, status),
          battery = COALESCE(?, battery),
          uptime_sec = COALESCE(?, uptime_sec),
          location = COALESCE(?, location),
          current_task = COALESCE(?, current_task),
          last_seen = CURRENT_TIMESTAMP
      WHERE rover_id = ?
    `).run(
      status ?? null,
      battery !== undefined ? battery : null,
      uptime_sec !== undefined ? uptime_sec : null,
      location ?? null,
      current_task ?? null,
      roverId
    );

    const updated = this.getRoverById(roverId);
    this.emit("telemetry", updated);
    return updated;
  }

  sendCommand(roverId, commandInput, user = null) {
    const validCommands = [
      "START",
      "STOP",
      "MOVE_FORWARD",
      "MOVE_BACKWARD",
      "TURN_LEFT",
      "TURN_RIGHT",
      "RETURN_HOME",
      "EMERGENCY_STOP",
    ];

    const command = commandInput.toUpperCase().trim();
    if (!validCommands.includes(command)) {
      throw new Error(`Invalid command "${commandInput}". Valid commands: ${validCommands.join(", ")}`);
    }

    const rover = this.getRoverById(roverId);
    if (!rover) {
      throw new Error(`Rover "${roverId}" not found`);
    }

    let newStatus = rover.status;
    let newTask = rover.current_task;

    if (command === "EMERGENCY_STOP") {
      newStatus = "Emergency Stop";
      newTask = "EMERGENCY_STOP_ACTIVE";
    } else if (command === "START") {
      newStatus = "Active";
      newTask = "Navigating";
    } else if (command === "STOP") {
      newStatus = "Stopped";
      newTask = "Idle";
    } else if (command === "RETURN_HOME") {
      newStatus = "Returning Home";
      newTask = "Returning to Charging Dock";
    } else {
      newStatus = "Moving";
      newTask = `Executing ${command}`;
    }

    // Record in DB
    db.prepare(`
      UPDATE rovers
      SET status = ?, current_task = ?, last_seen = CURRENT_TIMESTAMP
      WHERE rover_id = ?
    `).run(newStatus, `CMD:${command}`, rover.rover_id);

    // Activity Log
    db.prepare(`
      INSERT INTO activity_log (type, title, description)
      VALUES ('rover', ?, ?)
    `).run(
      command === "EMERGENCY_STOP" ? "EMERGENCY STOP TRIGGERED" : `Rover Command: ${command}`,
      `Command "${command}" issued to ${rover.rover_id} by ${user ? user.name : "System"}`
    );

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource, details)
      VALUES (?, ?, 'ROVER_COMMAND', ?, ?)
    `).run(
      user ? user.id : null,
      user ? user.name : "System",
      `Rover ${rover.rover_id}`,
      `Executed command ${command}`
    );

    // Alert if emergency stop
    if (command === "EMERGENCY_STOP") {
      db.prepare(`
        INSERT INTO alerts (rover_id, type, severity, title, message)
        VALUES (?, 'emergency_stop', 'critical', 'EMERGENCY STOP', ?)
      `).run(rover.rover_id, `Emergency stop executed by ${user ? user.name : "operator"}`);
    }

    const updated = this.getRoverById(rover.rover_id);
    this.emit("command", { rover_id: rover.rover_id, command, updated });
    return updated;
  }

  startSimulation(roverId = "RVR-001") {
    if (this.simulationInterval) return;

    this.simulationInterval = setInterval(() => {
      const rover = db.prepare("SELECT * FROM rovers WHERE rover_id = ?").get(roverId);
      if (!rover) return;

      // Keep simulated rover alive with regular heartbeats
      let newBattery = rover.battery;
      if (newBattery <= 0) newBattery = 100;
      else if (rover.status === "Returning Home" || rover.status === "Charging") {
        newBattery = Math.min(100, newBattery + 2);
      } else {
        newBattery = Math.max(5, newBattery - 1);
      }

      const newUptime = (rover.uptime_sec || 0) + 5;
      const status = rover.status === "Offline" ? "Online" : rover.status;

      this.updateTelemetry(roverId, {
        status,
        battery: newBattery,
        uptime_sec: newUptime,
        location: rover.location || "Care Wing A",
        current_task: rover.current_task || "Patrolling",
      });
    }, 5000);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

module.exports = new RoverService();
