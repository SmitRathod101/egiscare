import { useState, useEffect } from "react";
import { Users, Plus, Home, HeartPulse, RefreshCw, Search } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

function CareRecipients() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    room_number: "",
    care_level: "Standard",
    notes: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const res = await api.getResidents();
      if (res && res.residents) setResidents(res.residents);
    } catch (err) {
      setError(err.message || "Failed to load residents directory");
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
      showSuccess("Care recipient registered successfully.");
      if (res && res.resident) {
        setResidents((prev) => [...prev, res.resident]);
        setShowModal(false);
        setForm({ name: "", room_number: "", care_level: "Standard", notes: "" });
      }
    } catch (err) {
      showError(`Error creating resident: ${err.message}`);
    }
  };

  const filteredResidents = residents.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      r.name.toLowerCase().includes(q) ||
      (r.room_number && r.room_number.toString().includes(q)) ||
      (r.care_level && r.care_level.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="care-recipients-page" style={{ padding: "60px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={32} color="var(--primary-600)" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "16px", color: "var(--slate-600)" }}>Loading care recipients directory...</p>
      </div>
    );
  }

  return (
    <div className="care-recipients-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">CARE & LOGISTICS</p>
          <h2>Care Recipients Directory</h2>
          <p className="page-description">
            Directory of residents and care recipients serviced by the EGISCARE logistics network.
          </p>
        </div>

        <div className="page-actions">
          {user?.role !== "viewer" && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Register Resident
            </button>
          )}
          <button className="btn btn-secondary" onClick={fetchResidents}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "24px" }}>{error}</div>}

      {/* Filter / Search Bar */}
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
            placeholder="Search name, room or care level..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "13px", color: "var(--slate-500)", fontWeight: 500 }}>
          {filteredResidents.length} registered care recipients
        </div>
      </div>

      {/* Resident Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredResidents.map((r) => (
          <div className="card" key={r.id}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--primary-50)",
                  color: "var(--primary-600)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "16px",
                }}
              >
                {r.name.charAt(0).toUpperCase()}
              </div>

              <span
                className={`badge ${
                  r.care_level === "High" || r.care_level === "Intensive"
                    ? "badge-danger"
                    : "badge-success"
                }`}
              >
                {r.care_level || "Standard"} Care
              </span>
            </div>

            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700, color: "var(--slate-900)" }}>
              {r.name}
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "var(--slate-500)",
                marginBottom: "14px",
              }}
            >
              <Home size={14} /> Room {r.room_number}
            </div>

            {r.notes && (
              <p
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  color: "var(--slate-600)",
                  background: "var(--slate-50)",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {r.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Register Resident Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Register Care Recipient"
        description="Add a new resident to the EGISCARE logistics network"
        maxWidth="440px"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Mrs. Anita Desai"
            />
          </div>

          <div className="form-group">
            <label>Room Number</label>
            <input
              required
              value={form.room_number}
              onChange={(e) => setForm({ ...form, room_number: e.target.value })}
              placeholder="105"
            />
          </div>

          <div className="form-group">
            <label>Care Level</label>
            <select
              value={form.care_level}
              onChange={(e) => setForm({ ...form, care_level: e.target.value })}
            >
              <option value="Standard">Standard Care</option>
              <option value="High">High Care</option>
              <option value="Intensive">Intensive Care</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes / Medical Instructions</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Mobility assistance required; morning medication scheduled"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Resident
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CareRecipients;
