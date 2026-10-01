import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Battery,
  Wifi,
  MapPin,
  Clock3,
  Activity,
  Navigation,
  RefreshCw,
  Play,
  Square,
  Home,
  ShieldAlert,
  Cpu,
  Radio,
  Sliders,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useWebSocket } from "../hooks/useWebSocket";
import { useToast } from "../context/ToastContext";

function RoverManagement() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [rover, setRover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commandLoading, setCommandLoading] = useState(false);

  const fetchRoverStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRover();
      if (res && res.rover) {
        setRover(res.rover);
      }
    } catch (err) {
      setError(err.message || "Failed to load rover telematics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoverStatus();
  }, [fetchRoverStatus]);

  // Live WebSocket updates
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "ROVER_TELEMETRY" || msg.type === "ROVER_UPDATE" || msg.type === "INIT") {
      const updatedRover = msg.rover || msg.data;
      if (updatedRover) {
        setRover((prev) => ({
          ...(prev || {}),
          ...updatedRover,
        }));
      }
    }
  }, []);

  const { connected: wsConnected } = useWebSocket(handleWsMessage);

  const handleCommand = async (command) => {
    if (!rover) return;
    setCommandLoading(true);
    try {
      const res = await api.sendRoverCommand(rover.rover_id || "RVR-001", command);
      showSuccess(`Command '${command}' dispatched successfully.`);
      if (res && res.rover) {
        setRover(res.rover);
      }
    } catch (err) {
      showError(`Command error: ${err.message}`);
    } finally {
      setCommandLoading(false);
    }
  };

  const formatUptime = (secs) => {
    if (!secs) return "0m";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (loading && !rover) {
    return (
      <div className="rover-management-page" style={{ padding: "60px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={32} color="var(--primary-600)" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "16px", color: "var(--slate-600)", fontWeight: 500 }}>
          Connecting to EGISCARE telemetry stream...
        </p>
      </div>
    );
  }

  const isOnline = rover?.status !== "Offline" && rover?.connection_status !== "Disconnected";

  return (
    <div className="rover-management-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">ROVER OPERATIONS</p>
          <h2>Rover Management & Telematics</h2>
          <p className="page-description">
            Monitor hardware health, connection status, motor parameters, and real-time mission state.
          </p>
        </div>

        <div className="page-actions">
          <button
            className="btn btn-secondary"
            onClick={fetchRoverStatus}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            Sync Telemetry
          </button>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "24px" }}>{error}</div>}

      {/* Rover Overview Card */}
      <div className="rover-overview-card">
        <div className="rover-main-info">
          <div className="large-rover-icon">
            <Bot size={32} />
          </div>

          <div>
            <div className="rover-title-row">
              <h3>{rover?.name || "EGISCARE Rover"}</h3>
              <span className={`badge ${isOnline ? "badge-success" : "badge-danger"}`}>
                <span className="status-dot"></span>
                {rover?.status || "Offline"}
              </span>
            </div>

            <p style={{ margin: "2px 0 0 0", color: "var(--slate-500)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
              ID: {rover?.rover_id || "RVR-001"}
            </p>

            <span className="connection-text" style={{ color: wsConnected ? "var(--success-text)" : "var(--warning-text)" }}>
              <Wifi size={13} />
              {wsConnected ? "WebSocket Telemetry Active (3000ms heartbeat)" : "REST Polling Endpoint Active (WS Offline)"}
            </span>
          </div>
        </div>

        <div className="rover-overview-actions">
          {user?.role !== "viewer" && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn btn-primary btn-sm"
                disabled={commandLoading}
                onClick={() => handleCommand("START")}
              >
                <Play size={14} /> Start
              </button>

              <button
                className="btn btn-secondary btn-sm"
                disabled={commandLoading}
                onClick={() => handleCommand("STOP")}
              >
                <Square size={14} /> Hold
              </button>

              <button
                className="btn btn-secondary btn-sm"
                disabled={commandLoading}
                onClick={() => handleCommand("RETURN_HOME")}
              >
                <Home size={14} /> Dock
              </button>

              <button
                className="btn btn-danger btn-sm"
                disabled={commandLoading}
                onClick={() => handleCommand("EMERGENCY_STOP")}
              >
                <ShieldAlert size={14} /> EMERGENCY STOP
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rover Metrics */}
      <div className="rover-metrics">
        <div className="rover-metric-card">
          <div className="metric-icon green">
            <Battery size={20} />
          </div>
          <div>
            <span>Battery Level</span>
            <strong>{rover?.battery ?? 0}%</strong>
            <small>{rover?.battery < 20 ? "Low Battery Warning" : "LiPo 3S Nominal"}</small>
          </div>
        </div>

        <div className="rover-metric-card">
          <div className="metric-icon blue">
            <Wifi size={20} />
          </div>
          <div>
            <span>Connection</span>
            <strong>{rover?.connection_status || (isOnline ? "Connected" : "Offline")}</strong>
            <small>{wsConnected ? "Live Socket Link" : "MQTT / HTTP"}</small>
          </div>
        </div>

        <div className="rover-metric-card">
          <div className="metric-icon purple">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Active Uptime</span>
            <strong>{formatUptime(rover?.uptime_sec)}</strong>
            <small>Current Session</small>
          </div>
        </div>

        <div className="rover-metric-card">
          <div className="metric-icon orange">
            <Activity size={20} />
          </div>
          <div>
            <span>Current Mission</span>
            <strong>{rover?.current_task || "Idle"}</strong>
            <small>Autonomous Dispatch</small>
          </div>
        </div>
      </div>

      {/* Rover Panels */}
      <div className="rover-management-grid">
        <section className="rover-panel">
          <div className="section-heading">
            <div>
              <p className="section-label">NAVIGATION ROUTE</p>
              <h3>Current Path & Location</h3>
            </div>
            <span className="badge badge-info">{rover?.status || "Idle"}</span>
          </div>

          <div className="operation-route">
            <div className="route-point">
              <div className="route-icon start">
                <MapPin size={18} />
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>Current Node</span>
                <strong style={{ fontSize: "14px", color: "var(--slate-900)" }}>
                  {rover?.location || "Care Wing A — Corridor 1"}
                </strong>
              </div>
            </div>

            <div className="route-line"></div>

            <div className="route-point">
              <div className="route-icon destination">
                <Navigation size={18} />
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>Target Waypoint</span>
                <strong style={{ fontSize: "14px", color: "var(--slate-900)" }}>
                  Room 203 (Medication Delivery)
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="rover-panel">
          <div className="section-heading">
            <div>
              <p className="section-label">SYSTEM HARDWARE</p>
              <h3>Specifications & Subsystems</h3>
            </div>
          </div>

          <div className="system-info-list">
            <div>
              <span>Rover Unit Identifier</span>
              <strong>{rover?.rover_id || "RVR-001"}</strong>
            </div>

            <div>
              <span>Controller Platform</span>
              <strong>Raspberry Pi Agent (Python HAL)</strong>
            </div>

            <div>
              <span>Firmware Version</span>
              <strong>{rover?.firmware || "v1.0.4-prod"}</strong>
            </div>

            <div>
              <span>Telematics Protocol</span>
              <strong>MQTT + WebSocket Broker</strong>
            </div>

            <div>
              <span>Camera Optics</span>
              <strong>Front Optical Cam (640x480)</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RoverManagement;