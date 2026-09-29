import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts();
      if (res && res.alerts) setAlerts(res.alerts);
    } catch (err) {
      setError(err.message || "Failed to load system alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      const res = await api.acknowledgeAlert(id);
      if (res && res.alert) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? res.alert : a)));
      }
    } catch (err) {
      alert(`Error acknowledging alert: ${err.message}`);
    }
  };

  return (
    <div className="alerts-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MONITORING</p>
          <h2>System & Rover Alerts</h2>
          <p className="page-description">
            Real-time notifications, safety events, and operational warnings across the EGISCARE platform.
          </p>
        </div>

        <button className="secondary-action" onClick={fetchAlerts} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} /> Refresh Alerts
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "20px" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {alerts.map((al) => {
          const isCritical = al.severity === "critical";
          const isWarning = al.severity === "warning";
          const bgColor = isCritical ? "#fef2f2" : isWarning ? "#fffbe6" : "#f0f9ff";
          const borderColor = isCritical ? "#fca5a5" : isWarning ? "#ffe58f" : "#bae6fd";
          const textColor = isCritical ? "#991b1b" : isWarning ? "#d48806" : "#0369a1";

          return (
            <div
              key={al.id}
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                padding: "16px 20px",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {isCritical ? <ShieldAlert size={22} color="#dc2626" /> : isWarning ? <AlertTriangle size={22} color="#d97706" /> : <Info size={22} color="#0284c7" />}

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "15px", color: textColor }}>{al.title}</strong>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", padding: "1px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.06)", fontWeight: 700 }}>
                      {al.severity}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#334155" }}>{al.message}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {new Date(al.created_at || Date.now()).toLocaleTimeString()}
                </span>

                {user?.role !== "viewer" && !al.acknowledged && (
                  <button
                    className="secondary-action"
                    style={{ background: "#fff", borderColor: "#cbd5e1" }}
                    onClick={() => handleAcknowledge(al.id)}
                  >
                    Acknowledge
                  </button>
                )}

                {al.acknowledged === 1 && (
                  <span style={{ fontSize: "12px", color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={14} /> Acknowledged
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Alerts;
