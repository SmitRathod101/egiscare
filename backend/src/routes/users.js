const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db/database");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

// GET /api/users — admin only
router.get("/", requireRole("admin"), (req, res) => {
  const users = db
    .prepare("SELECT id, name, email, role, status, created_at FROM users ORDER BY id")
    .all();
  res.json({ users });
});

// POST /api/users — admin only
router.post("/", requireRole("admin"), (req, res) => {
  const { name, email, password, role, status = "active" } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password, and role are required" });
  }

  const validRoles = ["admin", "caretaker", "viewer"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const hashed = bcrypt.hashSync(password, 10);

  try {
    const result = db
      .prepare("INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)")
      .run(name, email.toLowerCase().trim(), hashed, role, status);

    const user = db
      .prepare("SELECT id, name, email, role, status FROM users WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json({ user });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already in use" });
    }
    throw err;
  }
});

// PATCH /api/users/:id — admin only
router.patch("/:id", requireRole("admin"), (req, res) => {
  const { id } = req.params;
  const { name, email, role, status, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Prevent removing the last admin
  if (role && role !== "admin" && user.role === "admin") {
    const adminCount = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      .get();
    if (adminCount.count <= 1) {
      return res.status(400).json({ error: "Cannot demote the last admin" });
    }
  }

  const updates = {
    name: name ?? user.name,
    email: email ? email.toLowerCase().trim() : user.email,
    role: role ?? user.role,
    status: status ?? user.status,
    password: password ? bcrypt.hashSync(password, 10) : user.password,
  };

  db.prepare(`
    UPDATE users SET name=?, email=?, role=?, status=?, password=? WHERE id=?
  `).run(updates.name, updates.email, updates.role, updates.status, updates.password, id);

  const updated = db
    .prepare("SELECT id, name, email, role, status FROM users WHERE id = ?")
    .get(id);

  res.json({ user: updated });
});

// DELETE /api/users/:id — admin only
router.delete("/:id", requireRole("admin"), (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
  if (result.changes === 0) return res.status(404).json({ error: "User not found" });

  res.json({ success: true });
});

module.exports = router;
