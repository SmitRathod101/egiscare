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
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";

function RoverControl() {
  const { user } = useAuth();
  const [rover, setRover] = useState(null);
  const [lastCommand, setLastCommand] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [speed, setSpeed] = useState(50);

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

  const sendCommand = async (commandName) => {
    setSending(true);
    setError(null);
    try {
      const targetId = rover?.rover_id || "RVR-001";
      const res = await api.sendRoverCommand(targetId, commandName);
      setLastCommand(`Executed ${commandName} successfully`);
      if (res && res.rover) {
        setRover(res.rover);
      }
    } catch (err) {
      setError(err.message || `Failed to execute ${commandName}`);
    } finally {
      setSending(false);
    }
  };

  const isEmergencyStopped = rover?.status === "Emergency Stop" || rover?.current_task === "EMERGENCY_STOP_ACTIVE";

  return (
    <div className="rover-control-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ROVER OPERATIONS</p>
          <h2>Rover Control</h2>
          <p className="page-description">
            Manual teleoperation control interface for directional navigation and safety operations.
          </p>
        </div>

        <div className="tasks-role-badge">
          {user?.role === "admin" ? "Administrator Teleop Mode" : "Caretaker Operator Mode"}
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "20px" }}>{error}</div>}
      {lastCommand && (
        <div className="login-error" style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe", marginBottom: "20px" }}>
          ✅ {lastCommand}
        </div>
      )}

      {isEmergencyStopped && (
        <div className="login-error" style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fca5a5", marginBottom: "20px", fontWeight: "bold" }}>
          🚨 EMERGENCY STOP IS ACTIVE — Rover motors locked out. Issue START or RESET to clear safety lockout.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        {/* Directional Pad Container */}
        <div
          className="control-pad-card"
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "30px",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", color: "#334155" }}>
            <Gamepad2 size={22} />
            <h3 style={{ margin: 0 }}>Teleoperation Directional Pad</h3>
          </div>

          {/* D-PAD GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 80px)",
              gridTemplateRows: "repeat(3, 80px)",
              gap: "12px",
              marginBottom: "30px",
            }}
          >
            <div></div>
            <button
              className="primary-action"
              style={{ width: "80px", height: "80px", padding: 0, justifyContent: "center" }}
              disabled={sending}
              onClick={() => sendCommand("MOVE_FORWARD")}
              title="Move Forward"
            >
              <ArrowUp size={28} />
            </button>
            <div></div>

            <button
              className="primary-action"
              style={{ width: "80px", height: "80px", padding: 0, justifyContent: "center" }}
              disabled={sending}
              onClick={() => sendCommand("TURN_LEFT")}
              title="Turn Left"
            >
              <ArrowLeft size={28} />
            </button>
            <button
              className="secondary-action"
              style={{ width: "80px", height: "80px", padding: 0, justifyContent: "center", background: "#f1f5f9" }}
              disabled={sending}
              onClick={() => sendCommand("STOP")}
              title="Stop"
            >
              <Square size={24} color="#64748b" />
            </button>
            <button
              className="primary-action"
              style={{ width: "80px", height: "80px", padding: 0, justifyContent: "center" }}
              disabled={sending}
              onClick={() => sendCommand("TURN_RIGHT")}
              title="Turn Right"
            >
              <ArrowRight size={28} />
            </button>

            <div></div>
            <button
              className="primary-action"
              style={{ width: "80px", height: "80px", padding: 0, justifyContent: "center" }}
              disabled={sending}
              onClick={() => sendCommand("MOVE_BACKWARD")}
              title="Move Backward"
            >
              <ArrowDown size={28} />
            </button>
            <div></div>
          </div>

          {/* Speed / Throttle Control */}
          <div style={{ width: "100%", maxWidth: "320px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
              <span>Motor Speed / Throttle</span>
              <strong>{speed}%</strong>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          {/* High Level Action Buttons */}
          <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "420px" }}>
            <button
              className="secondary-action"
              style={{ flex: 1, justifyContent: "center" }}
              disabled={sending}
              onClick={() => sendCommand("RETURN_HOME")}
            >
              <Home size={16} /> Return to Dock
            </button>

            <button
              className="primary-action"
              style={{ flex: 1, justifyContent: "center", background: "#ef4444", borderColor: "#ef4444" }}
              disabled={sending}
              onClick={() => sendCommand("EMERGENCY_STOP")}
            >
              <ShieldAlert size={16} /> EMERGENCY STOP
            </button>
          </div>
        </div>

        {/* Telemetry Status Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#0f172a" }}>Rover Status</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>State</span>
                <strong style={{ color: "#0f172a" }}>{rover?.status || "Offline"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Battery</span>
                <strong style={{ color: "#16a34a" }}><Battery size={13} style={{ display: "inline" }} /> {rover?.battery ?? 0}%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Current Task</span>
                <strong style={{ color: "#2563eb" }}>{rover?.current_task || "Idle"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Location</span>
                <strong style={{ color: "#0f172a" }}>{rover?.location || "Care Wing A"}</strong>
              </div>
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
            <Zap size={14} style={{ display: "inline", marginRight: "6px", color: "#eab308" }} />
            Commands are dispatched through backend authorization, forwarded over MQTT, and executed by the Pi agent HAL controller.
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoverControl;
