import { useState, useEffect } from "react";
import { History as HistoryIcon, ShieldCheck, Clock, RefreshCw, Search } from "lucide-react";
import { api } from "../services/api";

function History() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (log.user_name && log.user_name.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.resource && log.resource.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="history-page" style={{ padding: "60px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={32} color="var(--primary-600)" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "16px", color: "var(--slate-600)" }}>Loading immutable audit trail...</p>
      </div>
    );
  }

  return (
    <div className="history-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">MONITORING</p>
          <h2>Audit Trail & System History</h2>
          <p className="page-description">
            Immutable log of operator actions, rover teleop dispatches, security state changes, and task transitions.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} /> Refresh Logs
          </button>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "24px" }}>{error}</div>}

      {/* Security Banner */}
      <div
        className="permission-info"
        style={{ background: "var(--primary-50)", borderColor: "var(--primary-200)", marginBottom: "24px" }}
      >
        <ShieldCheck size={20} color="var(--primary-600)" />
        <div>
          <strong>Immutable Audit System Active</strong>
          <p>Logs are cryptographically sealed, append-only, and preserved for regulatory compliance.</p>
        </div>
      </div>

      {/* Search Bar */}
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
        <div className="search-box" style={{ width: "280px" }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search action, user, or target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <span style={{ fontSize: "12.5px", color: "var(--slate-500)" }}>
          {filteredLogs.length} audit entries
        </span>
      </div>

      {/* Audit Logs Table */}
      <div className="users-card">
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / Operator</th>
                <th>Action</th>
                <th>Resource Target</th>
                <th>Event Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>
                    No audit records matching search filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: "12.5px", color: "var(--slate-500)", whiteSpace: "nowrap" }}>
                      <Clock size={13} style={{ display: "inline", marginRight: "5px", color: "var(--slate-400)" }} />
                      {new Date(log.created_at || Date.now()).toLocaleString()}
                    </td>
                    <td>
                      <strong style={{ fontSize: "13.5px", color: "var(--slate-900)" }}>{log.user_name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: "13.5px", color: "var(--slate-700)", fontWeight: 500 }}>
                      {log.resource}
                    </td>
                    <td style={{ fontSize: "13px", color: "var(--slate-500)" }}>
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default History;
