import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Battery,
  Clock3,
  Wifi,
  ArrowRight,
  Gamepad2,
  Camera,
  Pill,
  RefreshCw,
  Play,
  Home,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Server,
  Radio,
  MapPin,
  ClipboardList,
  PackageCheck,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../services/api";
import { useWebSocket } from "../hooks/useWebSocket";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function formatUptime(secs) {
  if (!secs) return "0m";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [rover, setRover] = useState({
    name: "EGISCARE Rover",
    id: "RVR-001",
    status: "Online",
    battery: 88,
    uptime: "14h 32m",
    current_task: "Patrol Care Wing A",
    location: "Care Wing A Corridor",
  });

  const [activities, setActivities] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [tasksCount, setTasksCount] = useState({ total: 0, pending: 0, completed: 0 });
  const [medCount, setMedCount] = useState({ total: 0, delivered: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [roverRes, actRes, tasksRes, medRes, alertRes] = await Promise.all([
        api.getRover().catch(() => null),
        api.getRoverActivity(6).catch(() => null),
        api.getTasks().catch(() => null),
        api.getMedicines().catch(() => null),
        api.getAlerts().catch(() => null),
      ]);

      if (roverRes && roverRes.rover) {
        setRover({
          name: roverRes.rover.name || "EGISCARE Rover",
          id: roverRes.rover.rover_id || "RVR-001",
          status: roverRes.rover.status || "Offline",
          battery: roverRes.rover.battery ?? 0,
          uptime: formatUptime(roverRes.rover.uptime_sec),
          current_task: roverRes.rover.current_task || "Idle",
          location: roverRes.rover.location || "Care Wing A",
        });
      }

      if (actRes && actRes.activities) {
        const formattedActs = actRes.activities.map((a) => ({
          id: a.id,
          type: a.type || "rover",
          title: a.title,
          description: a.description,
          time: new Date(a.created_at || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setActivities(formattedActs);
      }

      if (tasksRes && tasksRes.tasks) {
        const allTasks = tasksRes.tasks;
        setTasks(allTasks.slice(0, 4));
        const total = allTasks.length;
        const pending = allTasks.filter((t) => t.status === "Pending").length;
        const completed = allTasks.filter((t) => t.status === "Completed").length;
        setTasksCount({ total, pending, completed });
      }

      if (medRes && medRes.medicines) {
        const allMeds = medRes.medicines;
        setMedicines(allMeds.slice(0, 4));
        const total = allMeds.length;
        const delivered = allMeds.filter((m) => m.status === "Delivered").length;
        const pending = allMeds.filter((m) => m.status === "Pending" || m.status === "Scheduled").length;
        setMedCount({ total, delivered, pending });
      }

      if (alertRes && alertRes.alerts) {
        setAlerts(alertRes.alerts.slice(0, 3));
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Live WebSocket Updates
  const handleWsMessage = useCallback(
    (msg) => {
      if (msg.type === "ROVER_TELEMETRY" || msg.type === "ROVER_UPDATE" || msg.type === "INIT") {
        const r = msg.rover || msg.data;
        if (r) {
          setRover((prev) => ({
            ...prev,
            name: r.name || prev.name,
            id: r.rover_id || prev.id,
            status: r.status || prev.status,
            battery: r.battery ?? prev.battery,
            uptime: formatUptime(r.uptime_sec || 0),
            current_task: r.current_task || prev.current_task,
            location: r.location || prev.location,
          }));
        }
      } else if (msg.type === "ALERT" || msg.type === "ROVER_COMMAND") {
        fetchDashboardData();
      }
    },
    [fetchDashboardData]
  );

  const { connected: wsConnected } = useWebSocket(handleWsMessage);

  const handleRoverCommand = async (cmd) => {
    setActionLoading(true);
    try {
      const res = await api.sendRoverCommand(rover.id, cmd);
      showSuccess(`Rover Command '${cmd}' dispatched successfully.`);
      if (res && res.rover) {
        setRover((prev) => ({
          ...prev,
          status: res.rover.status || prev.status,
          battery: res.rover.battery ?? prev.battery,
          current_task: res.rover.current_task || prev.current_task,
        }));
      }
    } catch (err) {
      showError(`Command failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverMedicineQuick = async (id) => {
    try {
      const res = await api.deliverMedicine(id);
      showSuccess("Medication marked as delivered!");
      fetchDashboardData();
    } catch (err) {
      showError(`Delivery error: ${err.message}`);
    }
  };

  const isEmergencyStopped =
    rover?.status === "Emergency Stop" || rover?.current_task === "EMERGENCY_STOP_ACTIVE";
  const criticalAlertsCount = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;

  return (
    <div className="dashboard-page" style={{ paddingBottom: "36px" }}>
      {/* 1. HEADER */}
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">EGISCARE OPERATIONS</p>
          <h2>Operations Dashboard</h2>
          <p className="page-description">
            Real-time command overview of rover telemetry, care activity, deliveries, and system health.
          </p>
        </div>

        <div className="page-actions">
          <div
            className="system-status"
            style={{
              borderColor: wsConnected ? "var(--success-border)" : "var(--warning-border)",
              backgroundColor: wsConnected ? "var(--success-bg)" : "var(--warning-bg)",
              color: wsConnected ? "var(--success-text)" : "var(--warning-text)",
            }}
          >
            <span
              className={wsConnected ? "online-dot" : "status-dot"}
              style={{ background: wsConnected ? "var(--success-solid)" : "var(--warning-solid)" }}
            ></span>
            {wsConnected ? "WebSocket Live Stream" : "REST Polling Active"}
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
            Sync Dashboard
          </button>
        </div>
      </div>

      {/* 2. PRIMARY SYSTEM STATUS METRICS (Compact Row) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "14px",
          marginBottom: "24px",
        }}
        className="dashboard-metrics-row"
      >
        <div className="status-card" style={{ padding: "14px 16px" }}>
          <div className="status-card-top">
            <span className="status-card-title">Rover Status</span>
            <div
              className={`status-card-icon ${
                isEmergencyStopped ? "error" : rover.status === "Offline" ? "warning" : "success"
              }`}
              style={{ width: "32px", height: "32px" }}
            >
              <Wifi size={16} />
            </div>
          </div>
          <div className="status-card-value" style={{ fontSize: "20px", marginTop: "8px" }}>
            {rover.status}
          </div>
          <div className="status-card-subtitle" style={{ fontSize: "11px", marginTop: "4px" }}>
            Unit: {rover.id}
          </div>
        </div>

        <div className="status-card" style={{ padding: "14px 16px" }}>
          <div className="status-card-top">
            <span className="status-card-title">Battery Level</span>
            <div
              className={`status-card-icon ${rover.battery < 20 ? "warning" : "success"}`}
              style={{ width: "32px", height: "32px" }}
            >
              <Battery size={16} />
            </div>
          </div>
          <div className="status-card-value" style={{ fontSize: "20px", marginTop: "8px" }}>
            {rover.battery}%
          </div>
          <div className="status-card-subtitle" style={{ fontSize: "11px", marginTop: "4px" }}>
            LiPo 3S Nominal
          </div>
        </div>

        <div className="status-card" style={{ padding: "14px 16px" }}>
          <div className="status-card-top">
            <span className="status-card-title">Active Tasks</span>
            <div className="status-card-icon" style={{ width: "32px", height: "32px", background: "var(--primary-50)", color: "var(--primary-600)" }}>
              <ClipboardList size={16} />
            </div>
          </div>
          <div className="status-card-value" style={{ fontSize: "20px", marginTop: "8px" }}>
            {tasksCount.total}
          </div>
          <div className="status-card-subtitle" style={{ fontSize: "11px", marginTop: "4px" }}>
            {tasksCount.pending} pending tasks
          </div>
        </div>

        <div className="status-card" style={{ padding: "14px 16px" }}>
          <div className="status-card-top">
            <span className="status-card-title">Medicine Schedule</span>
            <div className="status-card-icon" style={{ width: "32px", height: "32px", background: "var(--warning-bg)", color: "var(--warning-solid)" }}>
              <Pill size={16} />
            </div>
          </div>
          <div className="status-card-value" style={{ fontSize: "20px", marginTop: "8px" }}>
            {medCount.total}
          </div>
          <div className="status-card-subtitle" style={{ fontSize: "11px", marginTop: "4px" }}>
            {medCount.pending} upcoming
          </div>
        </div>

        <div className="status-card" style={{ padding: "14px 16px" }}>
          <div className="status-card-top">
            <span className="status-card-title">System Alerts</span>
            <div
              className={`status-card-icon ${criticalAlertsCount > 0 ? "error" : "success"}`}
              style={{ width: "32px", height: "32px" }}
            >
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="status-card-value" style={{ fontSize: "20px", marginTop: "8px" }}>
            {alerts.length}
          </div>
          <div className="status-card-subtitle" style={{ fontSize: "11px", marginTop: "4px" }}>
            {criticalAlertsCount > 0 ? `${criticalAlertsCount} critical alert` : "Normal operation"}
          </div>
        </div>
      </div>

      {/* 3. HERO / ACTIVE ROVER COMMAND CENTER CARD */}
      <div
        className="card"
        style={{
          marginBottom: "24px",
          padding: "24px",
          background: isEmergencyStopped
            ? "linear-gradient(135deg, #ffffff 0%, var(--danger-bg) 100%)"
            : "linear-gradient(135deg, #ffffff 0%, var(--primary-50) 100%)",
          borderColor: isEmergencyStopped ? "var(--danger-border)" : "var(--primary-200)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", color: "var(--primary-700)", textTransform: "uppercase" }}>
              ACTIVE ROVER COMMAND CENTER
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className={`badge ${rover.status === "Offline" ? "badge-danger" : "badge-success"}`}>
              <span className="status-dot"></span>
              {rover.status}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: "10px" }}>
              {wsConnected ? "LIVE WS" : "REST"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--slate-900)" }}>
              {rover.name} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--slate-500)", fontFamily: "var(--font-mono)" }}>({rover.id})</span>
            </h3>

            {/* Quick Metrics Strip inside Active Rover */}
            <div style={{ display: "flex", gap: "24px", marginTop: "16px", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--slate-500)", display: "block" }}>Battery Charge</span>
                <strong style={{ fontSize: "15px", color: rover.battery < 20 ? "var(--danger-solid)" : "var(--slate-900)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Battery size={15} /> {rover.battery}%
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--slate-500)", display: "block" }}>Telemetry Link</span>
                <strong style={{ fontSize: "15px", color: wsConnected ? "var(--success-text)" : "var(--warning-text)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Wifi size={15} /> {wsConnected ? "Strong (Socket)" : "REST Sync"}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--slate-500)", display: "block" }}>Session Uptime</span>
                <strong style={{ fontSize: "15px", color: "var(--slate-900)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock3 size={15} /> {rover.uptime}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--slate-500)", display: "block" }}>Current State</span>
                <strong style={{ fontSize: "15px", color: "var(--primary-600)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Activity size={15} /> {rover.current_task || "Idle"}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "var(--slate-500)", display: "block" }}>Current Node</span>
                <strong style={{ fontSize: "15px", color: "var(--slate-900)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={15} /> {rover.location || "Care Wing A"}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-primary" onClick={() => navigate("/rover-control")}>
              <Gamepad2 size={16} /> Open Rover Controls
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/rover")}>
              View Full Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTIONS BAR & SAFETY E-STOP */}
      <div className="card" style={{ marginBottom: "24px", padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              Quick Actions:
            </span>

            {user?.role !== "viewer" && (
              <button
                className="btn btn-sm btn-outline"
                disabled={actionLoading}
                onClick={() => handleRoverCommand("START")}
              >
                <Play size={14} /> Start Mission
              </button>
            )}

            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/rover-control")}>
              <Gamepad2 size={14} /> Open Controls
            </button>

            {user?.role !== "viewer" && (
              <button
                className="btn btn-sm btn-secondary"
                disabled={actionLoading}
                onClick={() => handleRoverCommand("RETURN_HOME")}
              >
                <Home size={14} /> Dock Rover
              </button>
            )}

            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/camera")}>
              <Camera size={14} /> View Camera
            </button>

            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/medicine-delivery")}>
              <Pill size={14} /> Schedule Medicine
            </button>

            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/alerts")}>
              <AlertTriangle size={14} /> View Alerts
            </button>
          </div>

          {/* SAFETY CRITICAL EMERGENCY STOP */}
          {user?.role !== "viewer" && (
            <button
              className="btn btn-danger"
              style={{
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
                fontWeight: 700,
                letterSpacing: "0.5px",
              }}
              disabled={actionLoading}
              onClick={() => handleRoverCommand("EMERGENCY_STOP")}
            >
              <ShieldAlert size={18} /> EMERGENCY STOP
            </button>
          )}
        </div>
      </div>

      {/* 5. OPERATIONS OVERVIEW (2 Columns: Tasks & Medicines) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Active Care Tasks */}
        <section className="card" style={{ padding: "20px" }}>
          <div className="section-heading" style={{ marginBottom: "16px" }}>
            <div>
              <p className="section-label">ROSTER</p>
              <h3>Active Care Tasks</h3>
            </div>
            <button className="text-button" onClick={() => navigate("/tasks")}>
              View all tasks <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {tasks.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--slate-500)", fontSize: "13px" }}>
                No active care tasks currently scheduled.
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--slate-50)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "13.5px", color: "var(--slate-900)", display: "block" }}>
                      {task.title}
                    </strong>
                    <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                      Resident: {task.resident} • Scheduled {task.scheduled_time || task.scheduledTime}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className={`priority-badge ${(task.priority || "medium").toLowerCase()}`}>
                      {task.priority || "Medium"}
                    </span>
                    <span className={`task-status ${(task.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Medicine Deliveries */}
        <section className="card" style={{ padding: "20px" }}>
          <div className="section-heading" style={{ marginBottom: "16px" }}>
            <div>
              <p className="section-label">DISPATCH</p>
              <h3>Upcoming Medicine Deliveries</h3>
            </div>
            <button className="text-button" onClick={() => navigate("/medicine-delivery")}>
              View deliveries <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {medicines.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--slate-500)", fontSize: "13px" }}>
                No medicine deliveries currently queued.
              </div>
            ) : (
              medicines.map((med) => (
                <div
                  key={med.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--slate-50)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-md)", background: "var(--warning-bg)", color: "var(--warning-solid)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Pill size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: "13.5px", color: "var(--slate-900)", display: "block" }}>
                        {med.medicine}
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                        {med.resident} • {med.scheduled_time || med.scheduledTime}
                      </span>
                    </div>
                  </div>

                  <div>
                    {med.status === "Delivered" ? (
                      <span className="badge badge-success" style={{ fontSize: "11px" }}>Delivered</span>
                    ) : user?.role !== "viewer" ? (
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ padding: "4px 10px", fontSize: "11px" }}
                        onClick={() => handleDeliverMedicineQuick(med.id)}
                      >
                        <PackageCheck size={12} /> Deliver
                      </button>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: "11px" }}>{med.status}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 6. ALERTS & LIVE CAMERA PREVIEW (2 Columns) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* System Alerts */}
        <section className="card" style={{ padding: "20px" }}>
          <div className="section-heading" style={{ marginBottom: "16px" }}>
            <div>
              <p className="section-label">SAFETY MONITOR</p>
              <h3>Active System Alerts</h3>
            </div>
            <button className="text-button" onClick={() => navigate("/alerts")}>
              View all alerts <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {alerts.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px" }}>
                <CheckCircle2 size={28} color="var(--success-solid)" style={{ margin: "0 auto 8px" }} />
                <h4 style={{ fontSize: "14px", margin: "0 0 4px 0" }}>All Systems Operational</h4>
                <p style={{ margin: 0, fontSize: "12px" }}>No active security or low battery warnings detected.</p>
              </div>
            ) : (
              alerts.map((al) => {
                const isCritical = al.severity === "critical";
                return (
                  <div
                    key={al.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "var(--radius-lg)",
                      background: isCritical ? "var(--danger-bg)" : "var(--warning-bg)",
                      border: `1px solid ${isCritical ? "var(--danger-border)" : "var(--warning-border)"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {isCritical ? <ShieldAlert size={18} color="var(--danger-solid)" /> : <AlertTriangle size={18} color="var(--warning-solid)" />}
                      <div>
                        <strong style={{ fontSize: "13px", color: isCritical ? "var(--danger-text)" : "var(--warning-text)", display: "block" }}>
                          {al.title}
                        </strong>
                        <span style={{ fontSize: "11.5px", color: "var(--slate-700)" }}>{al.message}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--slate-500)", whiteSpace: "nowrap" }}>
                      {new Date(al.created_at || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Live Camera Preview */}
        <section className="card" style={{ padding: "20px" }}>
          <div className="section-heading" style={{ marginBottom: "16px" }}>
            <div>
              <p className="section-label">OPTICAL FEED</p>
              <h3>Camera View (CAM-01)</h3>
            </div>
            <button className="text-button" onClick={() => navigate("/camera")}>
              Open Camera Feed <ArrowRight size={14} />
            </button>
          </div>

          <div
            style={{
              height: "170px",
              borderRadius: "var(--radius-lg)",
              background: "radial-gradient(circle, #1e293b 0%, #0f172a 100%)",
              border: "1px solid var(--slate-800)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              color: "var(--slate-400)",
            }}
          >
            <div style={{ position: "absolute", top: "10px", left: "12px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#38bdf8" }}>
              CAM-01 • 640x480 @ 30FPS
            </div>

            <div style={{ position: "absolute", top: "10px", right: "12px" }}>
              <span className="badge badge-success" style={{ fontSize: "9px", padding: "2px 6px" }}>LIVE OPTICAL STREAM</span>
            </div>

            <Radio size={32} color="#38bdf8" style={{ opacity: 0.8, marginBottom: "8px" }} />
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#f8fafc", fontWeight: 500 }}>
              Front Optical Feed Connected
            </p>

            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/camera")}>
              <Camera size={13} /> View Fullstream & Controls
            </button>
          </div>
        </section>
      </div>

      {/* 7. RECENT ACTIVITY & SYSTEM HEALTH DIAGNOSTICS (2 Columns) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Recent Activity */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="section-label">REAL-TIME LOGS</p>
              <h3>Recent Activity</h3>
            </div>
            <button className="text-button" onClick={() => navigate("/history")}>
              View full history <ArrowRight size={14} />
            </button>
          </div>

          <div className="activity-list">
            {activities.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--slate-500)", fontSize: "13px" }}>
                No recent activity recorded.
              </div>
            ) : (
              activities.map((activity) => (
                <div className="activity-item" key={activity.id}>
                  <div className={`activity-icon ${activity.type}`}>
                    {activity.type === "medicine" && <Pill size={16} />}
                    {activity.type === "location" && <MapPin size={16} />}
                    {activity.type === "rover" && <Gamepad2 size={16} />}
                    {activity.type === "completed" && <CheckCircle2 size={16} />}
                  </div>

                  <div className="activity-content">
                    <strong>{activity.title}</strong>
                    <span>{activity.description}</span>
                  </div>

                  <time>{activity.time}</time>
                </div>
              ))
            )}
          </div>
        </section>

        {/* System Health Diagnostics */}
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <p className="section-label">SYSTEM DIAGNOSTICS</p>
              <h3>Subsystem Health</h3>
            </div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--slate-100)" }}>
                <span style={{ fontSize: "13px", color: "var(--slate-700)", fontWeight: 500 }}>Backend API Service</span>
                <span className="badge badge-success" style={{ fontSize: "11px" }}>
                  <span className="status-dot"></span> Operational (http://localhost:4000)
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--slate-100)" }}>
                <span style={{ fontSize: "13px", color: "var(--slate-700)", fontWeight: 500 }}>WebSocket Real-Time Stream</span>
                <span className={`badge ${wsConnected ? "badge-success" : "badge-warning"}`} style={{ fontSize: "11px" }}>
                  <span className="status-dot" style={{ background: wsConnected ? "var(--success-solid)" : "var(--warning-solid)" }}></span>
                  {wsConnected ? "Connected (3000ms)" : "REST Fallback Active"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--slate-100)" }}>
                <span style={{ fontSize: "13px", color: "var(--slate-700)", fontWeight: 500 }}>Rover Telemetry (RVR-001)</span>
                <span className={`badge ${rover.status === "Offline" ? "badge-danger" : "badge-success"}`} style={{ fontSize: "11px" }}>
                  <span className="status-dot"></span> {rover.status}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid var(--slate-100)" }}>
                <span style={{ fontSize: "13px", color: "var(--slate-700)", fontWeight: 500 }}>Camera Subsystem (CAM-01)</span>
                <span className="badge badge-info" style={{ fontSize: "11px" }}>
                  ● Optical Feed Ready
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--slate-700)", fontWeight: 500 }}>Audit Trail Logging</span>
                <span className="badge badge-success" style={{ fontSize: "11px" }}>
                  <ShieldCheck size={12} /> Append-Only Active
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;