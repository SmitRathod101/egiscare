import { useState, useEffect } from "react";
import {
  Camera,
  Video,
  Play,
  Pause,
  Maximize2,
  Sun,
  Moon,
  Wifi,
  Radio,
  Sliders,
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

function CameraMonitoring() {
  const { showSuccess, showInfo } = useToast();
  const [streaming, setStreaming] = useState(true);
  const [nightVision, setNightVision] = useState(false);
  const [rover, setRover] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function loadRoverData() {
      try {
        const res = await api.getRover();
        if (res && res.rover) {
          setRover(res.rover);
        }
      } catch (err) {
        console.error("Camera page rover load error:", err);
      }
    }
    loadRoverData();
  }, []);

  const handleTakeSnapshot = () => {
    const timestamp = new Date().toLocaleTimeString();
    showSuccess(`Snapshot captured successfully at ${timestamp} (CAM-01 saved)`);
  };

  const toggleStreaming = () => {
    setStreaming((prev) => {
      const next = !prev;
      if (next) showInfo("Camera stream resumed.");
      else showInfo("Camera stream paused.");
      return next;
    });
  };

  return (
    <div className="camera-monitoring-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">ROVER OPERATIONS</p>
          <h2>Live Camera Feed</h2>
          <p className="page-description">
            Optical monitoring and real-time video telemetry stream from the EGISCARE rover front camera assembly.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" onClick={toggleStreaming}>
            {streaming ? <Pause size={15} /> : <Play size={15} />}
            {streaming ? "Pause Stream" : "Resume Stream"}
          </button>
          <button className="btn btn-primary" onClick={handleTakeSnapshot}>
            <Camera size={15} />
            Capture Snapshot
          </button>
        </div>
      </div>

      {/* Main Stream Viewport */}
      <div
        className="card"
        style={{
          background: "#0f172a",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #1e293b",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
          position: "relative",
          padding: 0,
        }}
      >
        {/* Stream Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: "rgba(15, 23, 42, 0.9)",
            borderBottom: "1px solid #334155",
            color: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Radio size={16} color="#10b981" className={streaming ? "spin-icon" : ""} />
            <strong style={{ fontSize: "13px", letterSpacing: "0.5px" }}>
              CAM-01 • PRIMARY FRONT OPTICAL FEED
            </strong>
            <span
              className={`badge ${streaming ? "badge-success" : "badge-danger"}`}
              style={{ fontSize: "10px", padding: "2px 8px" }}
            >
              {streaming ? "LIVE 30FPS" : "PAUSED"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "12px",
              color: "#94a3b8",
            }}
          >
            <span>640 x 480 @ 30 FPS</span>
            <span>
              <Wifi size={13} style={{ display: "inline", marginRight: "4px" }} />
              {rover?.status || "Online"}
            </span>
          </div>
        </div>

        {/* Video Canvas / Viewport */}
        <div
          style={{
            height: isFullscreen ? "70vh" : "440px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            background: nightVision
              ? "radial-gradient(circle, #064e3b 0%, #022c22 100%)"
              : "radial-gradient(circle, #1e293b 0%, #0f172a 100%)",
            color: "#94a3b8",
            transition: "all 0.3s ease",
          }}
        >
          {/* HUD Overlay Elements */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: nightVision ? "#4ade80" : "#38bdf8",
              lineHeight: 1.6,
            }}
          >
            <div>OPTICS MODE: {nightVision ? "NIGHT VISION (IR ACTIVE)" : "STANDARD COLOR"}</div>
            <div>LOCATION: {rover?.location || "Care Wing A Corridor"}</div>
            <div>BATTERY: {rover?.battery ?? 88}%</div>
          </div>

          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#94a3b8",
            }}
          >
            SYS TIME: {new Date().toISOString()}
          </div>

          {/* Crosshair / Viewfinder Target */}
          <div
            style={{
              width: "130px",
              height: "130px",
              border: `2px dashed ${nightVision ? "#4ade80" : "#38bdf8"}`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.7,
            }}
          >
            <Video size={42} color={nightVision ? "#4ade80" : "#38bdf8"} />
          </div>

          <p
            style={{
              marginTop: "20px",
              fontSize: "14px",
              fontWeight: 500,
              color: nightVision ? "#4ade80" : "#cbd5e1",
            }}
          >
            {streaming
              ? "Pi Camera Module Stream Ready — Optical Pipeline Online"
              : "Camera Feed Paused by Operator"}
          </p>
          <small style={{ color: "#64748b" }}>
            WebRTC / MJPEG Stream Endpoint connected to backend video service
          </small>
        </div>

        {/* Viewport Control Bar */}
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
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setNightVision(!nightVision);
                showInfo(nightVision ? "Switched to Day Color Mode" : "Night Vision IR Mode Enabled");
              }}
              style={{
                background: nightVision ? "#065f46" : "#1e293b",
                color: "#ffffff",
                borderColor: nightVision ? "#10b981" : "#475569",
              }}
            >
              {nightVision ? <Sun size={14} /> : <Moon size={14} />}
              {nightVision ? "Day Mode" : "Night Vision (IR)"}
            </button>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{ background: "#1e293b", color: "#ffffff", borderColor: "#475569" }}
            >
              <Maximize2 size={14} /> {isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraMonitoring;
