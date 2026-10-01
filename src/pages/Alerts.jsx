import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert, RefreshCw, Filter } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Alerts() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("all");

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
      showSuccess("Alert acknowledged successfully.");
      if (res && res.alert) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? res.alert : a)));
      }
    } catch (err) {
      showError(`Error acknowledging alert: ${err.message}`);
    }
  };

  const filteredAlerts = alerts.filter((al) => {
    if (filterSeverity === "all") return true;
    return al.severity === filterSeverity;
  });

  if (loading) {
    return (
      <div className="alerts-page" style={{ padding: "60px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={32} color="var(--primary-600)" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "16px", color: "var(--slate-600)" }}>Loading system alerts...</p>
      </div>
    );
  }

  return (
    <div className="alerts-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">MONITORING</p>
          <h2>System & Rover Alerts</h2>
          <p className="page-description">
            Real-time notifications, safety events, and operational warnings across the EGISCARE platform.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchAlerts} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} /> Refresh Alerts
          </button>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "24px" }}>{error}</div>}

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className={`btn btn-sm ${filterSeverity === "all" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilterSeverity("all")}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            className={`btn btn-sm ${filterSeverity === "critical" ? "btn-danger" : "btn-ghost"}`}
            onClick={() => setFilterSeverity("critical")}
          >
            Critical
          </button>
          <button
            className={`btn btn-sm ${filterSeverity === "warning" ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setFilterSeverity("warning")}
          >
            Warning
          </button>
          <button
            className={`btn btn-sm ${filterSeverity === "info" ? "btn-outline" : "btn-ghost"}`}
            onClick={() => setFilterSeverity("info")}
          >
            Info
          </button>
        </div>

        <span style={{ fontSize: "12.5px", color: "var(--slate-500)" }}>
          Showing {filteredAlerts.length} events
        </span>
      </div>

      {/* Alert Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {filteredAlerts.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">
              <CheckCircle2 size={28} />
            </div>
            <h4>No Active Alerts</h4>
            <p>All system components and rovers are operating within normal parameters.</p>
          </div>
        ) : (
          filteredAlerts.map((al) => {
            const isCritical = al.severity === "critical";
            const isWarning = al.severity === "warning";
            const bgColor = isCritical ? "var(--danger-bg)" : isWarning ? "var(--warning-bg)" : "var(--info-bg)";
            const borderColor = isCritical ? "var(--danger-border)" : isWarning ? "var(--warning-border)" : "var(--info-border)";
            const textColor = isCritical ? "var(--danger-text)" : isWarning ? "var(--warning-text)" : "var(--info-text)";

            return (
              <div
                key={al.id}
                style={{
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  padding: "18px 22px",
                  borderRadius: "var(--radius-xl)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {isCritical ? (
                    <ShieldAlert size={24} color="var(--danger-solid)" />
                  ) : isWarning ? (
                    <AlertTriangle size={24} color="var(--warning-solid)" />
                  ) : (
                    <Info size={24} color="var(--primary-600)" />
                  )}

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <strong style={{ fontSize: "15px", color: textColor, fontWeight: 700 }}>{al.title}</strong>
                      <span
                        className={`badge ${
                          isCritical ? "badge-danger" : isWarning ? "badge-warning" : "badge-info"
                        }`}
                        style={{ textTransform: "uppercase", fontSize: "10px" }}
                      >
                        {al.severity}
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--slate-700)" }}>{al.message}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                    {new Date(al.created_at || Date.now()).toLocaleTimeString()}
                  </span>

                  {user?.role !== "viewer" && !al.acknowledged && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleAcknowledge(al.id)}
                    >
                      Acknowledge
                    </button>
                  )}

                  {al.acknowledged === 1 && (
                    <span style={{ fontSize: "12px", color: "var(--success-text)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                      <CheckCircle2 size={15} /> Acknowledged
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Alerts;
