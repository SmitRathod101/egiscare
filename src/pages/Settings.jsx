import { useState } from "react";
import { Settings as SettingsIcon, Shield, Wifi, Radio, Bell, Save } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    mqttBroker: "mqtt://127.0.0.1:1883",
    wsEndpoint: "ws://localhost:4000/ws",
    telemetryInterval: "3000",
    lowBatteryThreshold: "20",
    notificationsEnabled: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="settings-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SYSTEM</p>
          <h2>System Settings</h2>
          <p className="page-description">
            Configure backend connection endpoints, telematics intervals, and system parameters.
          </p>
        </div>
      </div>

      {saved && (
        <div className="login-error" style={{ background: "#dcfce7", color: "#15803d", borderColor: "#86efac", marginBottom: "20px" }}>
          ✅ Configuration saved successfully.
        </div>
      )}

      <form onSubmit={handleSave} style={{ maxWidth: "600px", background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#0f172a" }}>Network & Telemetry Settings</h3>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>MQTT Broker URL</label>
          <input
            value={form.mqttBroker}
            onChange={(e) => setForm({ ...form, mqttBroker: e.target.value })}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>WebSocket Real-Time Stream URL</label>
          <input
            value={form.wsEndpoint}
            onChange={(e) => setForm({ ...form, wsEndpoint: e.target.value })}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Telemetry Push Interval (ms)</label>
          <input
            type="number"
            value={form.telemetryInterval}
            onChange={(e) => setForm({ ...form, telemetryInterval: e.target.value })}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Low Battery Threshold (%)</label>
          <input
            type="number"
            value={form.lowBatteryThreshold}
            onChange={(e) => setForm({ ...form, lowBatteryThreshold: e.target.value })}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          />
        </div>

        <button type="submit" className="primary-action">
          <Save size={16} /> Save Settings
        </button>
      </form>
    </div>
  );
}

export default Settings;
