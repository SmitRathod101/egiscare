import { useState, useEffect } from "react";
import { History as HistoryIcon, ShieldCheck, Clock, FileText, RefreshCw } from "lucide-react";
import { api } from "../services/api";

function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      if (res && res.audit_logs) setLogs(res.audit_logs);
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="history-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MONITORING</p>
          <h2>Audit Trail & System History</h2>
          <p className="page-description">
            Immutable log of system actions, operator commands, security events, and task state transitions.
          </p>
        </div>

        <button className="secondary-action" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} /> Refresh Logs
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "20px" }}>{error}</div>}

      <div style={{ background: "#f8fafc", padding: "14px 20px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#334155", fontSize: "13px" }}>
        <ShieldCheck size={18} color="#2563eb" />
        <span>Audit history is <strong>immutable</strong> and append-only. Logs cannot be modified or deleted by users.</span>
      </div>

      <div className="users-card">
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Operator</th>
                <th>Action</th>
                <th>Resource Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>
                    <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                    {new Date(log.created_at || Date.now()).toLocaleString()}
                  </td>
                  <td>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>{log.user_name}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: "11px", fontWeight: "700", background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "4px" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: "13px", color: "#334155" }}>
                    {log.resource}
                  </td>
                  <td style={{ fontSize: "13px", color: "#64748b" }}>
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default History;
