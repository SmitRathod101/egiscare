const express = require("express");
const db = require("../db/database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// GET /api/audit-logs — immutable list of audit entries (no PUT, POST, PATCH, DELETE endpoints exposed)
router.get("/", (_req, res) => {
  const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100").all();
  res.json({ audit_logs: logs });
});

module.exports = router;
