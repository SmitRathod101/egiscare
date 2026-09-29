const express = require("express");
const db = require("../db/database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/residents — list all care recipients/residents
router.get("/", (_req, res) => {
  const residents = db.prepare("SELECT * FROM residents ORDER BY id").all();
  res.json({ residents });
});

// GET /api/residents/:id — resident detail
router.get("/:id", (req, res) => {
  const resident = db.prepare("SELECT * FROM residents WHERE id = ?").get(req.params.id);
  if (!resident) return res.status(404).json({ error: "Resident not found" });
  res.json({ resident });
});

// POST /api/residents — create resident (admin or caretaker)
router.post("/", requireRole("admin", "caretaker"), (req, res) => {
  const { name, room_number, care_level, notes } = req.body;

  if (!name || !room_number) {
    return res.status(400).json({ error: "Name and room_number are required" });
  }

  const result = db
    .prepare(`
      INSERT INTO residents (name, room_number, care_level, notes)
      VALUES (?, ?, ?, ?)
    `)
    .run(name, room_number, care_level || "Standard", notes || null);

  const resident = db.prepare("SELECT * FROM residents WHERE id = ?").get(result.lastInsertRowid);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'CREATE_RESIDENT', ?, ?)
  `).run(req.user.id, req.user.name, `Resident #${resident.id}`, `Added resident ${name} (Room ${room_number})`);

  res.status(201).json({ resident });
});

// PATCH /api/residents/:id — update resident (admin or caretaker)
router.patch("/:id", requireRole("admin", "caretaker"), (req, res) => {
  const { id } = req.params;
  const { name, room_number, care_level, notes } = req.body;

  const resident = db.prepare("SELECT * FROM residents WHERE id = ?").get(id);
  if (!resident) return res.status(404).json({ error: "Resident not found" });

  db.prepare(`
    UPDATE residents
    SET name = COALESCE(?, name),
        room_number = COALESCE(?, room_number),
        care_level = COALESCE(?, care_level),
        notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(name, room_number, care_level, notes, id);

  const updated = db.prepare("SELECT * FROM residents WHERE id = ?").get(id);
  res.json({ resident: updated });
});

// DELETE /api/residents/:id — delete resident (admin only)
router.delete("/:id", requireRole("admin"), (req, res) => {
  const resident = db.prepare("SELECT * FROM residents WHERE id = ?").get(req.params.id);
  if (!resident) return res.status(404).json({ error: "Resident not found" });

  db.prepare("DELETE FROM residents WHERE id = ?").run(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'DELETE_RESIDENT', ?, ?)
  `).run(req.user.id, req.user.name, `Resident #${req.params.id}`, `Deleted resident ${resident.name}`);

  res.json({ success: true });
});

module.exports = router;
