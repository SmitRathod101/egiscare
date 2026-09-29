import { useState, useEffect } from "react";
import {
  Camera,
  Video,
  Play,
  Pause,
  Maximize2,
  RefreshCw,
  Sun,
  Moon,
  Wifi,
  Radio,
} from "lucide-react";
import { api } from "../services/api";

function CameraMonitoring() {
  const [streaming, setStreaming] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [nightVision, setNightVision] = useState(false);
  const [rover, setRover] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoverData() {
      try {
        const res = await api.getRover();
        if (res && res.rover) {
          setRover(res.rover);
        }
      } catch (err) {
        console.error("Camera page rover load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoverData();
  }, []);

  const handleTakeSnapshot = () => {
    const timestamp = new Date().toLocaleTimeString();
    setSnapshot(`Captured snapshot at ${timestamp}`);
    setTimeout(() => setSnapshot(null), 4000);
  };

  return (
    <div className="camera-monitoring-page" style={{ paddingBottom: "24px" }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ROVER OPERATIONS</p>
          <h2>Camera Monitoring</h2>
          <p className="page-description">
            Live video feed and optical monitoring from the EGISCARE autonomous rover camera assembly.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="secondary-action"
            onClick={() => setStreaming(!streaming)}
          >
            {streaming ? <Pause size={15} /> : <Play size={15} />}
            {streaming ? "Pause Stream" : "Resume Stream"}
          </button>
          <button className="primary-action" onClick={handleTakeSnapshot}>
            <Camera size={15} />
            Capture Snapshot
          </button>
        </div>
      </div>

      {snapshot && (
        <div
          className="login-error"
          style={{
            background: "#dcfce7",
            color: "#15803d",
            borderColor: "#86efac",
            marginBottom: "20px",
          }}
        >
          📷 {snapshot}
        </div>
      )}

      {/* Main Stream Viewport */}
      <div
        className="camera-viewport-card"
        style={{
          background: "#0f172a",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #1e293b",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
          position: "relative",
          marginBottom: "24px",
        }}
      >
        {/* Stream Top Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #334155",
            color: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Radio size={16} color="#22c55e" className="spin-icon" />
            <strong style={{ fontSize: "14px", letterSpacing: "0.5px" }}>
              CAM-01 • PRIMARY FRONT OPTICAL FEED
            </strong>
            <span
              style={{
                fontSize: "11px",
                background: streaming ? "#166534" : "#991b1b",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: 600,
              }}
            >
              {streaming ? "LIVE" : "PAUSED"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: "#94a3b8" }}>
            <span>640 x 480 @ 30 FPS</span>
            <span><Wifi size={13} style={{ display: "inline", marginRight: "4px" }} /> {rover?.status || "Online"}</span>
          </div>
        </div>

        {/* Video Frame Canvas / Placeholder */}
        <div
          style={{
            height: "420px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: nightVision
              ? "radial-gradient(circle, #064e3b 0%, #022c22 100%)"
              : "radial-gradient(circle, #1e293b 0%, #0f172a 100%)",
            color: "#94a3b8",
          }}
        >
          {/* Simulated HUD Elements */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              fontFamily: "monospace",
              fontSize: "12px",
              color: nightVision ? "#4ade80" : "#38bdf8",
            }}
          >
            <div>MODE: {nightVision ? "NIGHT VISION (IR)" : "STANDARD COLOR"}</div>
            <div>TARGET NODE: {rover?.location || "Care Wing A"}</div>
            <div>BATTERY: {rover?.battery ?? 88}%</div>
          </div>

          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              fontFamily: "monospace",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            {new Date().toISOString()}
          </div>

          {/* Center Crosshair / Video Indicator */}
          <div
            style={{
              width: "120px",
              height: "120px",
              border: `2px dashed ${nightVision ? "#4ade80" : "#38bdf8"}`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6,
            }}
          >
            <Video size={40} color={nightVision ? "#4ade80" : "#38bdf8"} />
          </div>

          <p style={{ marginTop: "16px", fontSize: "14px", color: nightVision ? "#4ade80" : "#cbd5e1" }}>
            {streaming
              ? "Development Camera Stream Active — Hardware Video Pipeline Ready"
              : "Stream Paused by Operator"}
          </p>
          <small style={{ color: "#64748b" }}>
            Raspberry Pi Camera Module ready for MJPEG / HLS stream embedding
          </small>
        </div>

        {/* Bottom Control Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            background: "#0f172a",
            borderTop: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="secondary-action"
              onClick={() => setNightVision(!nightVision)}
              style={{
                background: nightVision ? "#065f46" : "#1e293b",
                color: "#fff",
                borderColor: nightVision ? "#10b981" : "#475569",
              }}
            >
              {nightVision ? <Sun size={14} /> : <Moon size={14} />}
              {nightVision ? "Day Mode" : "Night Vision (IR)"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button className="secondary-action" style={{ background: "#1e293b", color: "#fff" }}>
              <Maximize2 size={14} /> Fullscreen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraMonitoring;
