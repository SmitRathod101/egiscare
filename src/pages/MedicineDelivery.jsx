import { useState, useEffect } from "react";
import { Pill, PackageCheck, Clock, AlertCircle, Plus, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

function MedicineDelivery() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ medicine: "", resident: "", dosage: "1 tablet", scheduled_time: "09:00 AM" });
  const [actionLoading, setActionLoading] = useState({});

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.getMedicines();
      if (res && res.medicines) setMedicines(res.medicines);
    } catch (err) {
      setError(err.message || "Failed to load medicine deliveries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMedicine(form);
      if (res && res.medicine) {
        setMedicines((prev) => [...prev, res.medicine]);
        setShowModal(false);
        setForm({ medicine: "", resident: "", dosage: "1 tablet", scheduled_time: "09:00 AM" });
      }
    } catch (err) {
      alert(`Error creating delivery: ${err.message}`);
    }
  };

  const handleDeliver = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.deliverMedicine(id);
      if (res && res.medicine) {
        setMedicines((prev) => prev.map((m) => (m.id === id ? res.medicine : m)));
      }
    } catch (err) {
      alert(`Delivery error: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="medicine-delivery-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CARE & LOGISTICS</p>
          <h2>Medicine Delivery Management</h2>
          <p className="page-description">
            Schedule, track, and verify medication deliveries dispatched to care recipients.
          </p>
        </div>

        {user?.role !== "viewer" && (
          <button className="primary-action" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Schedule Delivery
          </button>
        )}
      </div>

      {error && <div className="login-error" style={{ marginBottom: "20px" }}>{error}</div>}

      <div className="medicine-grid">
        {medicines.map((med) => (
          <div className="medicine-card" key={med.id}>
            <div className="medicine-card-top">
              <div className="medicine-icon">
                <Pill size={20} />
              </div>
              <span className={`medicine-status ${(med.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
                {med.status}
              </span>
            </div>

            <h3>{med.medicine}</h3>

            <div className="medicine-details">
              <div>
                <span>Resident</span>
                <strong>{med.resident}</strong>
              </div>
              <div>
                <span>Dosage</span>
                <strong>{med.dosage}</strong>
              </div>
              <div>
                <span>Scheduled</span>
                <strong>{med.scheduled_time || med.scheduledTime}</strong>
              </div>
              <div>
                <span>Caretaker</span>
                <strong>{med.caretaker_name || "Caretaker"}</strong>
              </div>
            </div>

            {user?.role !== "viewer" && med.status !== "Delivered" && (
              <button
                className="deliver-button"
                disabled={actionLoading[med.id]}
                onClick={() => handleDeliver(med.id)}
              >
                <PackageCheck size={15} />
                {actionLoading[med.id] ? "Delivering..." : "Mark as Delivered"}
              </button>
            )}

            {med.status === "Delivered" && (
              <div className="medicine-delivered">
                <CheckCircle2 size={15} /> Delivered successfully
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "380px" }}>
            <h3 style={{ margin: "0 0 16px 0" }}>Schedule Medicine Delivery</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Medication Name</label>
                <input required value={form.medicine} onChange={(e) => setForm({ ...form, medicine: e.target.value })} placeholder="Amlodipine 5mg" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Resident Name</label>
                <input required value={form.resident} onChange={(e) => setForm({ ...form, resident: e.target.value })} placeholder="Mr. Rajesh Patel" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Dosage</label>
                <input required value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="1 tablet" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Scheduled Time</label>
                <input required value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} placeholder="09:30 AM" style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" onClick={() => setShowModal(false)} className="secondary-action">Cancel</button>
                <button type="submit" className="primary-action">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicineDelivery;
