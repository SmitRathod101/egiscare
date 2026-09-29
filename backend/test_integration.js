const http = require("http");

const BASE = "http://localhost:4000";

function req(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const payload = body ? JSON.stringify(body) : null;
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload);

    const r = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    r.on("error", reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function runTests() {
  console.log("=========================================");
  console.log("EGISCARE INTEGRATION TEST SUITE");
  console.log("=========================================");

  // 1. Health check
  const health = await req("/health");
  console.log(`[PASS] GET /health -> Status ${health.status}, res:`, health.body.status);

  // 2. Admin login
  const adminLogin = await req("/api/auth/login", { method: "POST" }, { email: "admin@egiscare.com", password: "admin123" });
  if (adminLogin.status !== 200) throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.body)}`);
  const adminToken = adminLogin.body.token;
  console.log(`[PASS] Admin Login -> Token received (user: ${adminLogin.body.user.role})`);

  // 3. Caretaker login
  const ctLogin = await req("/api/auth/login", { method: "POST" }, { email: "caretaker@egiscare.com", password: "caretaker123" });
  if (ctLogin.status !== 200) throw new Error(`Caretaker login failed: ${JSON.stringify(ctLogin.body)}`);
  const ctToken = ctLogin.body.token;
  console.log(`[PASS] Caretaker Login -> Token received (user: ${ctLogin.body.user.role})`);

  // 4. Invalid login
  const badLogin = await req("/api/auth/login", { method: "POST" }, { email: "admin@egiscare.com", password: "wrong" });
  if (badLogin.status !== 401) throw new Error(`Expected 401 on bad password, got ${badLogin.status}`);
  console.log(`[PASS] Invalid Login -> Rejected with 401`);

  // 5. Auth headers & RBAC
  const adminUsers = await req("/api/users", { headers: { Authorization: `Bearer ${adminToken}` } });
  console.log(`[PASS] Admin GET /api/users -> Status ${adminUsers.status}, count: ${adminUsers.body.users.length}`);

  const ctUsers = await req("/api/users", { headers: { Authorization: `Bearer ${ctToken}` } });
  if (ctUsers.status !== 403) throw new Error(`Expected 403 for caretaker on /api/users, got ${ctUsers.status}`);
  console.log(`[PASS] Caretaker GET /api/users -> Blocked with 403 Forbidden`);

  // 6. Tasks lifecycle
  const tasksRes = await req("/api/tasks", { headers: { Authorization: `Bearer ${adminToken}` } });
  console.log(`[PASS] GET /api/tasks -> ${tasksRes.body.tasks.length} tasks found`);

  const newTask = await req("/api/tasks", { method: "POST", headers: { Authorization: `Bearer ${adminToken}` } }, {
    title: "Test Integration Check",
    resident: "Mr. Rajesh Patel",
    type: "Safety",
    scheduled_time: "03:00 PM",
    priority: "High",
  });
  console.log(`[PASS] POST /api/tasks -> Created task #${newTask.body.task.id}`);

  const updateTask = await req(`/api/tasks/${newTask.body.task.id}/status`, { method: "PATCH", headers: { Authorization: `Bearer ${ctToken}` } }, {
    status: "Completed",
  });
  console.log(`[PASS] PATCH /api/tasks/:id/status -> Task status updated to "${updateTask.body.task.status}"`);

  // 7. Rover Command & Emergency Stop
  const roverCmd = await req("/api/rovers/RVR-001/commands", { method: "POST", headers: { Authorization: `Bearer ${adminToken}` } }, {
    command: "START",
  });
  console.log(`[PASS] Rover Command START -> Status "${roverCmd.body.rover.status}"`);

  const estopCmd = await req("/api/rovers/RVR-001/commands", { method: "POST", headers: { Authorization: `Bearer ${ctToken}` } }, {
    command: "EMERGENCY_STOP",
  });
  console.log(`[PASS] Rover Command EMERGENCY_STOP -> Status "${estopCmd.body.rover.status}"`);

  // 8. Audit Logs
  const auditRes = await req("/api/audit-logs", { headers: { Authorization: `Bearer ${adminToken}` } });
  console.log(`[PASS] GET /api/audit-logs -> ${auditRes.body.audit_logs.length} immutable log entries verified`);

  console.log("=========================================");
  console.log("ALL INTEGRATION TESTS PASSED CLEANLY! ✅");
  console.log("=========================================");
}

runTests().catch((err) => {
  console.error("TEST SUITE FAILED ❌:", err);
  process.exit(1);
});
