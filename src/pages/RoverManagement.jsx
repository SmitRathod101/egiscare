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
  AlertTriangle,
  Play,
  Square,
  Home,
  ShieldAlert,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useWebSocket } from "../hooks/useWebSocket";

function RoverManagement() {
  const { user } = useAuth();

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
      setError(err.message || "Failed to load rover data");
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
      if (res && res.rover) {
        setRover(res.rover);
      }
    } catch (err) {
      alert(`Command error: ${err.message}`);
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
      <div className="rover-management-page" style={{ padding: "40px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={28} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "12px", color: "#64748b" }}>Loading rover telematics...</p>
      </div>
    );
  }

  const isOnline = rover?.status !== "Offline" && rover?.connection_status !== "Disconnected";

  return (
    <div className="rover-management-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ROVER OPERATIONS</p>
          <h2>Rover Management</h2>
          <p className="page-description">
            Monitor real-time health, connection status, and telematics for the EGISCARE rover.
          </p>
        </div>

        <button className="secondary-action" onClick={fetchRoverStatus} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          Refresh Status
        </button>
      </div>

      {error && (
        <div className="login-error" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* Rover overview */}
      <div className="rover-overview-card">
        <div className="rover-main-info">
          <div className="large-rover-icon">
            <Bot size={32} />
          </div>

          <div>
            <div className="rover-title-row">
              <h3>{rover?.name || "EGISCARE Rover"}</h3>
              <span className={`rover-status ${isOnline ? "online" : "offline"}`}>
                <span className="status-dot"></span>
                {rover?.status || "Offline"}
              </span>
            </div>

            <p>{rover?.rover_id || "RVR-001"}</p>

            <span className="connection-text">
              <Wifi size={13} />
              {wsConnected ? "Live WebSocket Stream Active" : "Polling REST Endpoint"}
            </span>
          </div>
        </div>

        <div className="rover-overview-actions">
          {user?.role !== "viewer" && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                className="secondary-action"
                style={{ background: "#22c55e", color: "#fff", borderColor: "#22c55e" }}
                disabled={commandLoading}
                onClick={() => handleCommand("START")}
              >
                <Play size={14} /> Start
              </button>

              <button
                className="secondary-action"
                disabled={commandLoading}
                onClick={() => handleCommand("STOP")}
              >
                <Square size={14} /> Stop
              </button>

              <button
                className="secondary-action"
                disabled={commandLoading}
                onClick={() => handleCommand("RETURN_HOME")}
              >
                <Home size={14} /> Dock
              </button>

              <button
                className="secondary-action"
                style={{ background: "#ef4444", color: "#fff", borderColor: "#ef4444", fontWeight: "bold" }}
                disabled={commandLoading}
                onClick={() => handleCommand("EMERGENCY_STOP")}
              >
                <ShieldAlert size={14} /> EMERGENCY STOP
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rover metrics */}
      <div className="rover-metrics">
        <div className="rover-metric-card">
          <div className="metric-icon green">
            <Battery size={19} />
          </div>
          <div>
            <span>Battery</span>
            <strong>{rover?.battery ?? 0}%</strong>
            <small>{rover?.battery < 20 ? "Low Battery Warning" : "Good condition"}</small>
          </div>
        </div>

        <div className="rover-metric-card">
          <div className="metric-icon blue">
            <Wifi size={19} />
          </div>
          <div>
            <span>Connection</span>
            <strong>{rover?.connection_status || (isOnline ? "Connected" : "Offline")}</strong>
            <small>{wsConnected ? "WebSocket Live" : "REST Sync"}</small>
          </div>
        </div>

        <div className="rover-metric-card">
          <div className="metric-icon purple">
            <Clock3 size={19} />
          </div>
          <div>
            <span>Uptime</span>
            <strong>{formatUptime(rover?.uptime_sec)}</strong>
            <small>Active session</small>
          </div>
        </div>

        <div className="rover-metric-card">
          <div className="metric-icon orange">
            <Activity size={19} />
          </div>
          <div>
            <span>Current Task</span>
            <strong>{rover?.current_task || "Idle"}</strong>
            <small>Logistics & Patrol</small>
          </div>
        </div>
      </div>

      {/* Current operation & system info */}
      <div className="rover-management-grid">
        <section className="rover-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">CURRENT OPERATION</p>
              <h3>{rover?.current_task || "System Patrol"}</h3>
            </div>
            <span className="operation-badge">{rover?.status || "Idle"}</span>
          </div>

          <div className="operation-route">
            <div className="route-point">
              <div className="route-icon start">
                <MapPin size={16} />
              </div>
              <div>
                <span>Current Location</span>
                <strong>{rover?.location || "Care Wing A"}</strong>
              </div>
            </div>

            <div className="route-line"></div>

            <div className="route-point">
              <div className="route-icon destination">
                <Navigation size={16} />
              </div>
              <div>
                <span>Target Node</span>
                <strong>Care Room 203</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="rover-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">SYSTEM</p>
              <h3>Rover Information</h3>
            </div>
          </div>

          <div className="system-info-list">
            <div>
              <span>Rover ID</span>
              <strong>{rover?.rover_id || "RVR-001"}</strong>
            </div>

            <div>
              <span>Firmware</span>
              <strong>{rover?.firmware || "v1.0.4"}</strong>
            </div>

            <div>
              <span>Controller</span>
              <strong>Raspberry Pi Agent</strong>
            </div>

            <div>
              <span>Backend Communication</span>
              <strong>MQTT + WebSocket</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RoverManagement;