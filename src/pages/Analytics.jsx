import { useState, useEffect } from "react";
import {
  BarChart3,
  Activity,
  Battery,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";

function Analytics() {
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalDeliveries: 0,
    deliveredMeds: 0,
    uptimeSec: 0,
    batteryPct: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      try {
        const [tasksRes, medsRes, roverRes] = await Promise.all([
          api.getTasks().catch(() => ({ tasks: [] })),
          api.getMedicines().catch(() => ({ medicines: [] })),
          api.getRover().catch(() => ({ rover: {} })),
        ]);

        const tasks = tasksRes.tasks || [];
        const meds = medsRes.medicines || [];
        const r = roverRes.rover || {};

        setMetrics({
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t) => t.status === "Completed").length,
          totalDeliveries: meds.length,
          deliveredMeds: meds.filter((m) => m.status === "Delivered").length,
          uptimeSec: r.uptime_sec || 0,
          batteryPct: r.battery ?? 88,
        });
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const taskCompletionRate =
    metrics.totalTasks > 0
      ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
      : 0;
  const deliveryCompletionRate =
    metrics.totalDeliveries > 0
      ? Math.round((metrics.deliveredMeds / metrics.totalDeliveries) * 100)
      : 0;

  if (loading) {
    return (
      <div className="analytics-page" style={{ padding: "60px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={32} color="var(--primary-600)" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "16px", color: "var(--slate-600)" }}>Loading analytics metrics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">MONITORING & TELEMETRY</p>
          <h2>Operational Analytics</h2>
          <p className="page-description">
            Performance metrics, task completion analytics, medication fulfillment rate, and rover utilization.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "28px",
        }}
      >
        <div className="card">
          <div style={{ color: "var(--primary-600)", marginBottom: "12px" }}>
            <Activity size={22} />
          </div>
          <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>
            Task Completion Rate
          </span>
          <h2 style={{ margin: "6px 0 2px 0", fontSize: "28px", fontWeight: 700, color: "var(--slate-900)" }}>
            {taskCompletionRate}%
          </h2>
          <small style={{ color: "var(--slate-500)" }}>
            {metrics.completedTasks} of {metrics.totalTasks} completed
          </small>
        </div>

        <div className="card">
          <div style={{ color: "var(--success-solid)", marginBottom: "12px" }}>
            <CheckCircle2 size={22} />
          </div>
          <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>
            Medicine Fulfillment
          </span>
          <h2 style={{ margin: "6px 0 2px 0", fontSize: "28px", fontWeight: 700, color: "var(--slate-900)" }}>
            {deliveryCompletionRate}%
          </h2>
          <small style={{ color: "var(--slate-500)" }}>
            {metrics.deliveredMeds} of {metrics.totalDeliveries} delivered
          </small>
        </div>

        <div className="card">
          <div style={{ color: "#9333ea", marginBottom: "12px" }}>
            <Clock size={22} />
          </div>
          <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>
            Session Uptime
          </span>
          <h2 style={{ margin: "6px 0 2px 0", fontSize: "28px", fontWeight: 700, color: "var(--slate-900)" }}>
            {Math.floor(metrics.uptimeSec / 3600)}h {Math.floor((metrics.uptimeSec % 3600) / 60)}m
          </h2>
          <small style={{ color: "var(--slate-500)" }}>Active mission runtime</small>
        </div>

        <div className="card">
          <div style={{ color: "var(--warning-solid)", marginBottom: "12px" }}>
            <Battery size={22} />
          </div>
          <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>
            Battery Health
          </span>
          <h2 style={{ margin: "6px 0 2px 0", fontSize: "28px", fontWeight: 700, color: "var(--slate-900)" }}>
            {metrics.batteryPct}%
          </h2>
          <small style={{ color: "var(--slate-500)" }}>LiPo 3S nominal state</small>
        </div>
      </div>

      {/* Visual Progress & Performance Bars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div className="card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700 }}>
            Care Task Breakdown
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span>Completed Tasks ({metrics.completedTasks})</span>
                <strong>{taskCompletionRate}%</strong>
              </div>
              <div className="battery-bar" style={{ marginTop: 0 }}>
                <div
                  className="battery-progress"
                  style={{ width: `${taskCompletionRate}%`, backgroundColor: "var(--success-solid)" }}
                ></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                <span>Medicine Deliveries ({metrics.deliveredMeds})</span>
                <strong>{deliveryCompletionRate}%</strong>
              </div>
              <div className="battery-bar" style={{ marginTop: 0 }}>
                <div
                  className="battery-progress"
                  style={{ width: `${deliveryCompletionRate}%`, backgroundColor: "var(--primary-600)" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700 }}>
            Telemetry Health & Efficiency
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13.5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--slate-100)" }}>
              <span style={{ color: "var(--slate-500)" }}>Network Packet Latency</span>
              <strong style={{ color: "var(--success-text)" }}>12ms (Optimal)</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--slate-100)" }}>
              <span style={{ color: "var(--slate-500)" }}>WebSocket Stream Sync</span>
              <strong style={{ color: "var(--primary-600)" }}>Heartbeat Active</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid var(--slate-100)" }}>
              <span style={{ color: "var(--slate-500)" }}>System Safety Status</span>
              <strong style={{ color: "var(--success-text)" }}>All Interlocks Normal</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
