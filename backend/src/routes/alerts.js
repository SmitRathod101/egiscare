const express = require("express");
const db = require("../db/database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/alerts — list all active/past system and rover alerts
router.get("/", (_req, res) => {
  const alerts = db.prepare("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50").all();
  res.json({ alerts });
});

// POST /api/alerts — create an alert (admin, caretaker, or system token)
router.post("/", requireRole("admin", "caretaker"), (req, res) => {
  const { rover_id, type, severity, title, message } = req.body;

  if (!type || !severity || !title || !message) {
    return res.status(400).json({ error: "type, severity, title, message are required" });
  }

  const validSeverities = ["info", "warning", "critical"];
  if (!validSeverities.includes(severity)) {
    return res.status(400).json({ error: "severity must be info, warning, or critical" });
  }

  const result = db
    .prepare(`
      INSERT INTO alerts (rover_id, type, severity, title, message)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(rover_id || "RVR-001", type, severity, title, message);

  const alert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ alert });
});

// PATCH /api/alerts/:id/acknowledge — acknowledge alert (admin or caretaker)
router.patch("/:id/acknowledge", requireRole("admin", "caretaker"), (req, res) => {
  const { id } = req.params;

  const alert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  db.prepare("UPDATE alerts SET acknowledged = 1 WHERE id = ?").run(id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'ACKNOWLEDGE_ALERT', ?, ?)
  `).run(req.user.id, req.user.name, `Alert #${id}`, `Acknowledged alert "${alert.title}"`);

  const updated = db.prepare("SELECT * FROM alerts WHERE id = ?").get(id);
  res.json({ alert: updated });
});

module.exports = router;
