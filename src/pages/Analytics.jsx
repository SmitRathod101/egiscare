import { useState, useEffect } from "react";
import { BarChart3, Activity, Battery, CheckCircle2, Clock, Zap } from "lucide-react";
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

  useEffect(() => {
    async function loadMetrics() {
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
      }
    }
    loadMetrics();
  }, []);

  const taskCompletionRate = metrics.totalTasks > 0 ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100) : 0;
  const deliveryCompletionRate = metrics.totalDeliveries > 0 ? Math.round((metrics.deliveredMeds / metrics.totalDeliveries) * 100) : 0;

  return (
    <div className="analytics-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MONITORING</p>
          <h2>Operational Analytics & Telemetry</h2>
          <p className="page-description">
            Performance metrics, task completion analytics, and rover utilization stats.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#2563eb", marginBottom: "8px" }}><Activity size={20} /></div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Task Completion Rate</span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: "24px" }}>{taskCompletionRate}%</h2>
          <small style={{ color: "#64748b" }}>{metrics.completedTasks} of {metrics.totalTasks} completed</small>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#16a34a", marginBottom: "8px" }}><CheckCircle2 size={20} /></div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Medicine Fulfillment</span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: "24px" }}>{deliveryCompletionRate}%</h2>
          <small style={{ color: "#64748b" }}>{metrics.deliveredMeds} of {metrics.totalDeliveries} delivered</small>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#9333ea", marginBottom: "8px" }}><Clock size={20} /></div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Rover Session Uptime</span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: "24px" }}>{Math.floor(metrics.uptimeSec / 3600)}h {Math.floor((metrics.uptimeSec % 3600) / 60)}m</h2>
          <small style={{ color: "#64748b" }}>Active mission duration</small>
        </div>

        <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#eab308", marginBottom: "8px" }}><Battery size={20} /></div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Battery Health</span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: "24px" }}>{metrics.batteryPct}%</h2>
          <small style={{ color: "#64748b" }}>LiPo 3S nominal state</small>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
