const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.status === "inactive") {
    return res.status(403).json({ error: "Account is inactive" });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me  — verify token and return current user
router.get("/me", requireAuth, (req, res) => {
  const user = db
    .prepare("SELECT id, name, email, role, status FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

module.exports = router;
