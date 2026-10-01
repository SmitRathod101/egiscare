import { useState } from "react";
import { Settings as SettingsIcon, Shield, Wifi, Radio, Bell, Save, Server, Cpu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function Settings() {
  const { user } = useAuth();
  const { showSuccess } = useToast();

  const [form, setForm] = useState({
    mqttBroker: "mqtt://127.0.0.1:1883",
    wsEndpoint: "ws://localhost:4000/ws",
    telemetryInterval: "3000",
    lowBatteryThreshold: "20",
    notificationsEnabled: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    showSuccess("System configuration saved successfully.");
  };

  return (
    <div className="settings-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">SYSTEM CONFIGURATION</p>
          <h2>Platform Settings</h2>
          <p className="page-description">
            Configure backend network connection endpoints, telematics push intervals, and safety alert thresholds.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
        <form onSubmit={handleSave} className="card">
          <h3 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: 700, color: "var(--slate-900)" }}>
            Network & Telemetry Parameters
          </h3>

          <div className="form-group">
            <label>MQTT Broker Endpoint</label>
            <input
              value={form.mqttBroker}
              onChange={(e) => setForm({ ...form, mqttBroker: e.target.value })}
              placeholder="mqtt://127.0.0.1:1883"
            />
          </div>

          <div className="form-group">
            <label>WebSocket Real-Time Stream URL</label>
            <input
              value={form.wsEndpoint}
              onChange={(e) => setForm({ ...form, wsEndpoint: e.target.value })}
              placeholder="ws://localhost:4000/ws"
            />
          </div>

          <div className="form-group">
            <label>Telemetry Push Interval (milliseconds)</label>
            <input
              type="number"
              value={form.telemetryInterval}
              onChange={(e) => setForm({ ...form, telemetryInterval: e.target.value })}
              placeholder="3000"
            />
          </div>

          <div className="form-group">
            <label>Low Battery Alarm Threshold (%)</label>
            <input
              type="number"
              value={form.lowBatteryThreshold}
              onChange={(e) => setForm({ ...form, lowBatteryThreshold: e.target.value })}
              placeholder="20"
            />
          </div>

          <div style={{ marginTop: "24px" }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Configuration
            </button>
          </div>
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Server size={18} color="var(--primary-600)" />
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Backend Server Diagnostics</h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--slate-500)" }}>API Proxy</span>
                <strong style={{ color: "var(--slate-900)" }}>http://localhost:4000</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--slate-500)" }}>Environment</span>
                <strong style={{ color: "var(--success-text)" }}>Development / Production</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--slate-500)" }}>Frontend Engine</span>
                <strong style={{ color: "var(--slate-900)" }}>Vite + React 19</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
