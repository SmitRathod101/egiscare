const jwt = require("jsonwebtoken");

/**
 * Verify JWT from Authorization: Bearer <token>
 * Attaches req.user = { id, email, role, name }
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Require the logged-in user to have one of the given roles.
 * Must be used after requireAuth.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
