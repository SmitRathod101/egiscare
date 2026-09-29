/**
 * Thin wrapper around node-sqlite3-wasm that presents an API
 * compatible with how the routes use better-sqlite3:
 *
 *   db.prepare(sql).run(paramsObject)   -> { changes, lastInsertRowid }
 *   db.prepare(sql).get(paramsObject)   -> row | undefined
 *   db.prepare(sql).all(paramsObject)   -> row[]
 *   db.exec(sql)
 *   db.transaction(fn)                  -> fn()  (BEGIN/COMMIT wrapper)
 *
 * Named parameters use the @name convention from better-sqlite3.
 * This wrapper converts @name → :name for node-sqlite3-wasm.
 */

const { Database: RawDatabase } = require("node-sqlite3-wasm");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DB_PATH || "./data/egiscare.db";
const resolvedDbPath = path.resolve(dbPath);
const dbDir = path.dirname(resolvedDbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Clean up stale VFS lock directory if present before opening
const lockPath = resolvedDbPath + ".lock";
if (fs.existsSync(lockPath)) {
  try {
    fs.rmSync(lockPath, { recursive: true, force: true });
  } catch (e) {
    console.warn("Warning: Could not remove stale lock file:", e.message);
  }
}

const raw = new RawDatabase(resolvedDbPath);

// Register process exit listeners to clean up database lock cleanly
const cleanupLock = () => {
  try {
    raw.close();
  } catch {}
  if (fs.existsSync(lockPath)) {
    try {
      fs.rmSync(lockPath, { recursive: true, force: true });
    } catch {}
  }
};

process.on("exit", cleanupLock);
process.on("SIGINT", () => { cleanupLock(); process.exit(0); });
process.on("SIGTERM", () => { cleanupLock(); process.exit(0); });

raw.exec("PRAGMA foreign_keys = ON");

// ── Schema ─────────────────────────────────────────────────────────────────

raw.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    role      TEXT    NOT NULL CHECK(role IN ('admin','caretaker','viewer')),
    status    TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','pending','inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rovers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rover_id    TEXT    NOT NULL UNIQUE,
    name        TEXT    NOT NULL,
    status      TEXT    NOT NULL DEFAULT 'Offline',
    battery     INTEGER NOT NULL DEFAULT 0,
    uptime_sec  INTEGER NOT NULL DEFAULT 0,
    location    TEXT,
    firmware    TEXT    DEFAULT 'v1.0.0',
    current_task TEXT,
    last_seen   DATETIME,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS residents (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    room_number TEXT    NOT NULL,
    care_level  TEXT    DEFAULT 'Standard',
    notes       TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    title          TEXT    NOT NULL,
    resident       TEXT    NOT NULL,
    type           TEXT    NOT NULL,
    scheduled_time TEXT    NOT NULL,
    priority       TEXT    NOT NULL CHECK(priority IN ('High','Medium','Low')),
    status         TEXT    NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','In Progress','Completed','Cancelled')),
    caretaker_id   INTEGER REFERENCES users(id),
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS medicines (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine       TEXT    NOT NULL,
    resident       TEXT    NOT NULL,
    dosage         TEXT    NOT NULL,
    scheduled_time TEXT    NOT NULL,
    status         TEXT    NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Scheduled','Assigned','In Transit','Arrived','Delivered','Cancelled')),
    caretaker_id   INTEGER REFERENCES users(id),
    delivered_at   DATETIME,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT    NOT NULL,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    rover_id     TEXT    DEFAULT 'RVR-001',
    type         TEXT    NOT NULL,
    severity     TEXT    NOT NULL CHECK(severity IN ('info','warning','critical')),
    title        TEXT    NOT NULL,
    message      TEXT    NOT NULL,
    acknowledged INTEGER NOT NULL DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    user_name  TEXT    NOT NULL,
    action     TEXT    NOT NULL,
    resource   TEXT    NOT NULL,
    details    TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── Compatibility helpers ──────────────────────────────────────────────────

function isPlainObject(val) {
  return val !== null && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date);
}

/**
 * Convert params for node-sqlite3-wasm:
 * - primitive values (string, number) -> [val]
 * - multiple arguments -> [...args]
 * - arrays -> array
 * - objects with @name or name -> object with :name keys
 */
function normalizeParams(...args) {
  if (args.length === 0) return [];
  if (args.length === 1) {
    const param = args[0];
    if (param === undefined || param === null) return [];
    if (Array.isArray(param)) return param;
    if (isPlainObject(param)) {
      const result = {};
      for (const [k, v] of Object.entries(param)) {
        const key = k.startsWith(":") || k.startsWith("@") ? k.replace(/^[@]/, ":") : `:${k}`;
        result[key] = v;
      }
      return result;
    }
    return [param];
  }
  return args;
}

/**
 * Convert @name placeholders in SQL to :name for node-sqlite3-wasm.
 */
function normalizeSql(sql) {
  // Replace @word with :word (avoid matching @@)
  return sql.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, ":$1");
}

/**
 * Wraps a raw statement with a nicer API.
 */
function wrapStatement(sql) {
  const stmt = raw.prepare(normalizeSql(sql));

  return {
    run(...args) {
      const result = stmt.run(normalizeParams(...args));
      return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
    },
    get(...args) {
      return stmt.get(normalizeParams(...args)) ?? null;
    },
    all(...args) {
      return stmt.all(normalizeParams(...args));
    },
    finalize() {
      try { stmt.finalize(); } catch { /* already finalized */ }
    },
  };
}

// ── Public db object ──────────────────────────────────────────────────────

const db = {
  exec(sql) {
    raw.exec(sql);
  },

  prepare(sql) {
    return wrapStatement(sql);
  },

  /**
   * Wrap a function in a transaction. If the function throws, ROLLBACK.
   * Returns a callable that, when invoked, runs fn inside a transaction.
   */
  transaction(fn) {
    return (...args) => {
      raw.exec("BEGIN");
      try {
        const result = fn(...args);
        raw.exec("COMMIT");
        return result;
      } catch (err) {
        raw.exec("ROLLBACK");
        throw err;
      }
    };
  },
};

module.exports = db;
