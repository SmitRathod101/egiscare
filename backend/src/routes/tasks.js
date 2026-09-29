const express = require("express");
const db = require("../db/database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/tasks — list all tasks
router.get("/", (_req, res) => {
  const tasks = db
    .prepare(`
      SELECT t.*, u.name AS caretaker_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.caretaker_id
      ORDER BY t.id
    `)
    .all();
  res.json({ tasks });
});

// GET /api/tasks/:id — task detail
router.get("/:id", (req, res) => {
  const task = db
    .prepare(`
      SELECT t.*, u.name AS caretaker_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.caretaker_id
      WHERE t.id = ?
    `)
    .get(req.params.id);

  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json({ task });
});

// POST /api/tasks — create task (admin or caretaker)
router.post("/", requireRole("admin", "caretaker"), (req, res) => {
  const { title, resident, type, scheduled_time, priority } = req.body;

  if (!title || !resident || !type || !scheduled_time || !priority) {
    return res.status(400).json({ error: "All fields (title, resident, type, scheduled_time, priority) are required" });
  }

  const validPriorities = ["High", "Medium", "Low"];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ error: "Priority must be High, Medium, or Low" });
  }

  const result = db
    .prepare(`
      INSERT INTO tasks (title, resident, type, scheduled_time, priority, status, caretaker_id)
      VALUES (?, ?, ?, ?, ?, 'Pending', ?)
    `)
    .run(title, resident, type, scheduled_time, priority, req.user.id);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);

  // Log activity & audit
  db.prepare(`
    INSERT INTO activity_log (type, title, description)
    VALUES ('completed', ?, ?)
  `).run("New task created", `Task "${title}" created for ${resident}`);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'CREATE_TASK', ?, ?)
  `).run(req.user.id, req.user.name, `Task #${task.id}`, `Created task "${title}" for ${resident}`);

  res.status(201).json({ task });
});

// PATCH /api/tasks/:id/status — update status (admin or caretaker)
router.patch("/:id/status", requireRole("admin", "caretaker"), (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["Pending", "In Progress", "Completed", "Cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status. Allowed values: Pending, In Progress, Completed, Cancelled" });
  }

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  db.prepare(`
    UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, id);

  if (status === "Completed") {
    db.prepare(`
      INSERT INTO activity_log (type, title, description)
      VALUES ('completed', 'Task completed', ?)
    `).run(`"${task.title}" completed for ${task.resident}`);
  }

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'UPDATE_TASK_STATUS', ?, ?)
  `).run(req.user.id, req.user.name, `Task #${id}`, `Updated status of task "${task.title}" to ${status}`);

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json({ task: updated });
});

// DELETE /api/tasks/:id — delete task (admin only)
router.delete("/:id", requireRole("admin"), (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);

  db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, resource, details)
    VALUES (?, ?, 'DELETE_TASK', ?, ?)
  `).run(req.user.id, req.user.name, `Task #${req.params.id}`, `Deleted task "${task.title}"`);

  res.json({ success: true });
});

module.exports = router;
