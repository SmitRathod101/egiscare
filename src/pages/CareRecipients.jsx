import { useState, useEffect } from "react";
import { Users, Plus, Home, HeartPulse, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function CareRecipients() {
  const { user } = useAuth();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", room_number: "", care_level: "Standard", notes: "" });

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const res = await api.getResidents();
      if (res && res.residents) setResidents(res.residents);
    } catch (err) {
      setError(err.message || "Failed to load residents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createResident(form);
      if (res && res.resident) {
        setResidents((prev) => [...prev, res.resident]);
        setShowModal(false);
        setForm({ name: "", room_number: "", care_level: "Standard", notes: "" });
      }
    } catch (err) {
      alert(`Error creating resident: ${err.message}`);
    }
  };

  return (
    <div className="care-recipients-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CARE & LOGISTICS</p>
          <h2>Care Recipients</h2>
          <p className="page-description">
            Directory of residents and care recipients registered in the EGISCARE logistics network.
          </p>
        </div>

        {user?.role !== "viewer" && (
          <button className="primary-action" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Register Resident
          </button>
        )}
      </div>

      {error && <div className="login-error" style={{ marginBottom: "20px" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {residents.map((r) => (
          <div key={r.id} style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                {r.name.charAt(0)}
              </div>
              <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "12px", background: r.care_level === "High" ? "#fef2f2" : "#f0fdf4", color: r.care_level === "High" ? "#991b1b" : "#166534" }}>
                {r.care_level || "Standard"} Care
              </span>
            </div>

            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a" }}>{r.name}</h3>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
              <Home size={14} /> Room {r.room_number}
            </div>

            {r.notes && (
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                {r.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Register Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "380px" }}>
            <h3 style={{ margin: "0 0 16px 0" }}>Register Care Recipient</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Full Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mrs. Anita Desai" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Room Number</label>
                <input required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} placeholder="105" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Care Level</label>
                <select value={form.care_level} onChange={(e) => setForm({ ...form, care_level: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
                  <option value="Standard">Standard</option>
                  <option value="High">High</option>
                  <option value="Intensive">Intensive</option>
                </select>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Notes / Special Instructions</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Mobility assistance required" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="secondary-action">Cancel</button>
                <button type="submit" className="primary-action">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CareRecipients;
