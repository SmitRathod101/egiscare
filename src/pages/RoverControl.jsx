import { useState, useEffect, useCallback } from "react";
import {
  Gamepad2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Square,
  Home,
  ShieldAlert,
  Battery,
  Wifi,
  Activity,
  Zap,
  Info,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { useToast } from "../context/ToastContext";

function RoverControl() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  const [rover, setRover] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [speed, setSpeed] = useState(50);
  const [activeKey, setActiveKey] = useState(null);

  const fetchRover = useCallback(async () => {
    try {
      const res = await api.getRover();
      if (res && res.rover) {
        setRover(res.rover);
      }
    } catch (err) {
      setError(err.message || "Failed to load rover status");
    }
  }, []);

  useEffect(() => {
    fetchRover();
  }, [fetchRover]);

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "ROVER_TELEMETRY" || msg.type === "ROVER_UPDATE" || msg.type === "INIT") {
      const r = msg.rover || msg.data;
      if (r) setRover((prev) => ({ ...(prev || {}), ...r }));
    }
  }, []);

  useWebSocket(handleWsMessage);

  const sendCommand = useCallback(
    async (commandName) => {
      setSending(true);
      setError(null);
      try {
        const targetId = rover?.rover_id || "RVR-001";
        const res = await api.sendRoverCommand(targetId, commandName);
        showSuccess(`Executed ${commandName} successfully`);
        if (res && res.rover) {
          setRover(res.rover);
        }
      } catch (err) {
        showError(`Failed to execute ${commandName}: ${err.message}`);
      } finally {
        setSending(false);
      }
    },
    [rover?.rover_id, showSuccess, showError]
  );

  // Keyboard Navigation Bindings
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.repeat) return;

      if (e.key === "ArrowUp") {
        setActiveKey("UP");
        sendCommand("MOVE_FORWARD");
      } else if (e.key === "ArrowDown") {
        setActiveKey("DOWN");
        sendCommand("MOVE_BACKWARD");
      } else if (e.key === "ArrowLeft") {
        setActiveKey("LEFT");
        sendCommand("TURN_LEFT");
      } else if (e.key === "ArrowRight") {
        setActiveKey("RIGHT");
        sendCommand("TURN_RIGHT");
      } else if (e.key === " ") {
        setActiveKey("STOP");
        sendCommand("STOP");
      }
    };

    const handleKeyUp = () => {
      setActiveKey(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sendCommand]);

  const isEmergencyStopped =
    rover?.status === "Emergency Stop" || rover?.current_task === "EMERGENCY_STOP_ACTIVE";

  return (
    <div className="rover-control-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">ROVER OPERATIONS</p>
          <h2>Manual Teleoperation Control</h2>
          <p className="page-description">
            Direct manual teleoperation interface for directional navigation, speed throttle, and safety overrides.
          </p>
        </div>

        <div className="page-actions">
          <span className="badge badge-info">
            {user?.role === "admin" ? "Admin Operator Mode" : "Caretaker Operator Mode"}
          </span>
        </div>
      </div>

      {isEmergencyStopped && (
        <div
          className="login-error"
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger-text)",
            borderColor: "var(--danger-border)",
            marginBottom: "24px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <ShieldAlert size={20} />
          🚨 EMERGENCY STOP ACTIVE — Motors locked out. Click START or RESET to clear safety lockout.
        </div>
      )}

      {/* Keyboard Shortcut Banner */}
      <div
        className="card"
        style={{
          padding: "12px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "var(--slate-100)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <Info size={18} color="var(--primary-600)" />
        <span style={{ fontSize: "13px", color: "var(--slate-700)" }}>
          <strong>Keyboard Operator Controls Active:</strong> Use <kbd className="search-kbd">↑</kbd> <kbd className="search-kbd">↓</kbd> <kbd className="search-kbd">←</kbd> <kbd className="search-kbd">→</kbd> for directional steering, and <kbd className="search-kbd">SPACE</kbd> for instant STOP.
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
        {/* Directional Pad Container */}
        <div
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "28px",
              color: "var(--slate-800)",
            }}
          >
            <Gamepad2 size={24} color="var(--primary-600)" />
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>
              Directional Navigation D-Pad
            </h3>
          </div>

          {/* D-PAD GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 84px)",
              gridTemplateRows: "repeat(3, 84px)",
              gap: "12px",
              marginBottom: "32px",
            }}
          >
            <div></div>
            <button
              className={`btn ${activeKey === "UP" ? "btn-primary" : "btn-secondary"}`}
              style={{ width: "84px", height: "84px", padding: 0 }}
              disabled={sending}
              onClick={() => sendCommand("MOVE_FORWARD")}
              title="Move Forward (Arrow Up)"
            >
              <ArrowUp size={30} />
            </button>
            <div></div>

            <button
              className={`btn ${activeKey === "LEFT" ? "btn-primary" : "btn-secondary"}`}
              style={{ width: "84px", height: "84px", padding: 0 }}
              disabled={sending}
              onClick={() => sendCommand("TURN_LEFT")}
              title="Turn Left (Arrow Left)"
            >
              <ArrowLeft size={30} />
            </button>
            <button
              className={`btn ${activeKey === "STOP" ? "btn-danger" : "btn-secondary"}`}
              style={{ width: "84px", height: "84px", padding: 0 }}
              disabled={sending}
              onClick={() => sendCommand("STOP")}
              title="Stop (Spacebar)"
            >
              <Square size={24} />
            </button>
            <button
              className={`btn ${activeKey === "RIGHT" ? "btn-primary" : "btn-secondary"}`}
              style={{ width: "84px", height: "84px", padding: 0 }}
              disabled={sending}
              onClick={() => sendCommand("TURN_RIGHT")}
              title="Turn Right (Arrow Right)"
            >
              <ArrowRight size={30} />
            </button>

            <div></div>
            <button
              className={`btn ${activeKey === "DOWN" ? "btn-primary" : "btn-secondary"}`}
              style={{ width: "84px", height: "84px", padding: 0 }}
              disabled={sending}
              onClick={() => sendCommand("MOVE_BACKWARD")}
              title="Move Backward (Arrow Down)"
            >
              <ArrowDown size={30} />
            </button>
            <div></div>
          </div>

          {/* Speed Throttle Control */}
          <div style={{ width: "100%", maxWidth: "340px", marginBottom: "28px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                color: "var(--slate-600)",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              <span>Motor Speed / Throttle Limit</span>
              <strong style={{ color: "var(--primary-600)" }}>{speed}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary-600)" }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "440px" }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              disabled={sending}
              onClick={() => sendCommand("RETURN_HOME")}
            >
              <Home size={16} /> Dock Rover
            </button>

            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              disabled={sending}
              onClick={() => sendCommand("EMERGENCY_STOP")}
            >
              <ShieldAlert size={16} /> EMERGENCY STOP
            </button>
          </div>
        </div>

        {/* Telemetry Status Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="card">
            <h4
              style={{
                margin: "0 0 16px 0",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--slate-900)",
              }}
            >
              Live Telemetry State
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                fontSize: "13.5px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--slate-500)" }}>Rover State</span>
                <strong style={{ color: "var(--slate-900)" }}>{rover?.status || "Offline"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--slate-500)" }}>Battery Level</span>
                <strong style={{ color: "var(--success-solid)" }}>
                  <Battery size={14} style={{ display: "inline", marginRight: "4px" }} />
                  {rover?.battery ?? 0}%
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--slate-500)" }}>Active Task</span>
                <strong style={{ color: "var(--primary-600)" }}>
                  {rover?.current_task || "Idle"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--slate-500)" }}>Location Node</span>
                <strong style={{ color: "var(--slate-900)" }}>
                  {rover?.location || "Care Wing A"}
                </strong>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "var(--slate-100)",
              padding: "16px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-subtle)",
              fontSize: "12.5px",
              color: "var(--slate-600)",
              lineHeight: 1.5,
            }}
          >
            <Zap
              size={15}
              style={{ display: "inline", marginRight: "6px", color: "var(--warning-solid)" }}
            />
            Teleop commands pass through backend JWT validation, forward over MQTT to the Pi HAL motor controller, and log to audit trail.
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoverControl;
