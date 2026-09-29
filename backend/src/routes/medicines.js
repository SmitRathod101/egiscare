const express = require("express");
const db = require("../db/database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/medicines — list all medicines/deliveries
router.get("/", (_req, res) => {
  const medicines = db
    .prepare(`
      SELECT m.*, u.name AS caretaker_name
      FROM medicines m
      LEFT JOIN users u ON u.id = m.caretaker_id
      ORDER BY m.id
    `)
    .all();
  res.json({ medicines });
});

// GET /api/medicines/:id — medicine detail
router.get("/:id", (req, res) => {
  const med = db
    .prepare(`
      SELECT m.*, u.name AS caretaker_name
      FROM medicines m
      LEFT JOIN users u ON u.id = m.caretaker_id
      WHERE m.id = ?
    `)
    .get(req.params.id);

  if (!med) return res.status(404).json({ error: "Medicine record not found" });
  res.json({ medicine: med });
});

// POST /api/medicines — create medicine schedule/delivery (admin or caretaker)
router.post("/", requireRole("admin", "caretaker"), (req, res) => {
  const { medicine, resident, dosage, scheduled_time } = req.body;

  if (!medicine || !resident || !dosage || !scheduled_time) {
    return res.status(400).json({ error: "All fields (medicine, resident, dosage, scheduled_time) are required" });
  }

  const result = db
    .prepare(`
      INSERT INTO medicines (medicine, resident, dosage, scheduled_time, status, caretaker_id)
      VALUES (?, ?, ?, ?, 'Pending', ?)
    `)
    .run(medicine, resident, dosage, scheduled_time, req.user.id);

  const med = db.prepare("SELECT * FROM medicines WHERE id = ?").get(result.lastInsertRowid);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'CREATE_MEDICINE', ?, ?)
  `).run(req.user.id, req.user.name, `Medicine #${med.id}`, `Scheduled ${medicine} for ${resident}`);

  res.status(201).json({ medicine: med });
});

// PATCH /api/medicines/:id/status — update status (admin or caretaker)
router.patch("/:id/status", requireRole("admin", "caretaker"), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["Pending", "Scheduled", "Assigned", "In Transit", "Arrived", "Delivered", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed values: ${validStatuses.join(", ")}` });
  }

  const med = db.prepare("SELECT * FROM medicines WHERE id = ?").get(id);
  if (!med) return res.status(404).json({ error: "Medicine record not found" });

  const deliveredAt = status === "Delivered" ? new Date().toISOString() : med.delivered_at;

  db.prepare(`
    UPDATE medicines
    SET status = ?, delivered_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, deliveredAt, id);

  if (status === "Delivered") {
    db.prepare(`
      INSERT INTO activity_log (type, title, description)
      VALUES ('medicine', 'Medicine delivered', ?)
    `).run(`${med.medicine} delivered to ${med.resident}`);
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'UPDATE_MEDICINE_STATUS', ?, ?)
  `).run(req.user.id, req.user.name, `Medicine #${id}`, `Updated delivery status of ${med.medicine} to ${status}`);

  const updated = db.prepare("SELECT * FROM medicines WHERE id = ?").get(id);
  res.json({ medicine: updated });
});

// PATCH /api/medicines/:id/deliver — legacy mark as delivered endpoint
router.patch("/:id/deliver", requireRole("admin", "caretaker"), (req, res) => {
  const { id } = req.params;

  const med = db.prepare("SELECT * FROM medicines WHERE id = ?").get(id);
  if (!med) return res.status(404).json({ error: "Medicine record not found" });

  if (med.status === "Delivered") {
    return res.status(400).json({ error: "Already marked as delivered" });
  }

  db.prepare(`
    UPDATE medicines
    SET status = 'Delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  db.prepare(`
    INSERT INTO activity_log (type, title, description)
    VALUES ('medicine', 'Medicine delivered', ?)
  `).run(`${med.medicine} delivered to ${med.resident}`);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'DELIVER_MEDICINE', ?, ?)
  `).run(req.user.id, req.user.name, `Medicine #${id}`, `Marked ${med.medicine} delivered to ${med.resident}`);

  const updated = db.prepare("SELECT * FROM medicines WHERE id = ?").get(id);
  res.json({ medicine: updated });
});

// DELETE /api/medicines/:id — admin only
router.delete("/:id", requireRole("admin"), (req, res) => {
  const med = db.prepare("SELECT * FROM medicines WHERE id = ?").get(req.params.id);
  if (!med) return res.status(404).json({ error: "Medicine record not found" });

  db.prepare("DELETE FROM medicines WHERE id = ?").run(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'DELETE_MEDICINE', ?, ?)
  `).run(req.user.id, req.user.name, `Medicine #${req.params.id}`, `Deleted medication schedule "${med.medicine}"`);

  res.json({ success: true });
});

module.exports = router;
