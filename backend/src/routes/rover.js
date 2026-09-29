const express = require("express");
const db = require("../db/database");
const { requireAuth, requireRole } = require("../middleware/auth");
const roverService = require("../services/RoverService");

const router = express.Router();

// GET /api/rovers or /api/rover — list rovers or get primary rover
router.get("/", requireAuth, (req, res) => {
  const rovers = roverService.getRovers();
  if (req.baseUrl.endsWith("/rover") && !req.baseUrl.endsWith("/rovers")) {
    return res.json({ rover: rovers[0] || null });
  }
  res.json({ rovers });
});

// GET /api/rover/activity — recent activity log (must be above /:id)
router.get("/activity", requireAuth, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const activities = db
    .prepare("SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?")
    .all(limit);
  res.json({ activities });
});

// GET /api/rover/command & POST /api/rover/command — legacy endpoints (must be above /:id)
router.post("/command", requireAuth, requireRole("admin", "caretaker"), (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: "Command is required" });

  try {
    const updated = roverService.sendCommand("RVR-001", command, req.user);
    res.json({ success: true, command, rover: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/command", (req, res) => {
  const secret = req.headers["x-rover-secret"];
  if (!secret || secret !== (process.env.ROVER_AGENT_SECRET || "default_rover_secret")) {
    return res.status(401).json({ error: "Unauthorized rover secret" });
  }

  const rover = db.prepare("SELECT current_task FROM rovers WHERE rover_id = 'RVR-001'").get();
  const task = rover?.current_task || "";

  if (task.startsWith("CMD:")) {
    const command = task.replace("CMD:", "");
    db.prepare("UPDATE rovers SET current_task = NULL WHERE rover_id = 'RVR-001'").run();
    return res.json({ command });
  }

  res.json({ command: null });
});

// POST /api/rover/telemetry — Pi agent telemetry push
router.post("/telemetry", (req, res) => {
  const secret = req.headers["x-rover-secret"];
  if (!secret || secret !== (process.env.ROVER_AGENT_SECRET || "default_rover_secret")) {
    return res.status(401).json({ error: "Unauthorized rover secret" });
  }

  const { rover_id, status, battery, uptime_sec, location, current_task } = req.body;
  const targetId = rover_id || "RVR-001";

  const updated = roverService.updateTelemetry(targetId, {
    status,
    battery,
    uptime_sec,
    location,
    current_task,
  });

  if (!updated) return res.status(404).json({ error: "Rover not found" });
  res.json({ success: true, rover: updated });
});

// GET /api/rovers/:id — rover detail
router.get("/:id", requireAuth, (req, res) => {
  const rover = roverService.getRoverById(req.params.id);
  if (!rover) return res.status(404).json({ error: "Rover not found" });
  res.json({ rover });
});

// GET /api/rovers/:id/status — rover status endpoint
router.get("/:id/status", requireAuth, (req, res) => {
  const status = roverService.getRoverStatus(req.params.id);
  if (!status) return res.status(404).json({ error: "Rover not found" });
  res.json({ status });
});

// POST /api/rovers/:id/commands — command endpoint (Admin & Caretaker, EMERGENCY_STOP allowed)
router.post("/:id/commands", requireAuth, requireRole("admin", "caretaker"), (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: "Command is required" });

  try {
    const updated = roverService.sendCommand(req.params.id, command, req.user);
    res.json({ success: true, command, rover: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
