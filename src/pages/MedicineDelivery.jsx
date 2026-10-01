import { useState, useEffect } from "react";
import { Pill, PackageCheck, Clock, Plus, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

function MedicineDelivery() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    medicine: "",
    resident: "",
    dosage: "1 tablet",
    scheduled_time: "09:30 AM",
  });
  const [actionLoading, setActionLoading] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

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
      showSuccess("Medicine delivery scheduled successfully.");
      if (res && res.medicine) {
        setMedicines((prev) => [...prev, res.medicine]);
        setShowModal(false);
        setForm({ medicine: "", resident: "", dosage: "1 tablet", scheduled_time: "09:30 AM" });
      }
    } catch (err) {
      showError(`Error creating delivery: ${err.message}`);
    }
  };

  const handleDeliver = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.deliverMedicine(id);
      showSuccess("Medicine marked as delivered!");
      if (res && res.medicine) {
        setMedicines((prev) => prev.map((m) => (m.id === id ? res.medicine : m)));
      }
    } catch (err) {
      showError(`Delivery error: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredMedicines = medicines.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      m.medicine.toLowerCase().includes(q) ||
      m.resident.toLowerCase().includes(q) ||
      (m.caretaker_name && m.caretaker_name.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="medicine-delivery-page" style={{ padding: "60px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={32} color="var(--primary-600)" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "16px", color: "var(--slate-600)" }}>Loading medication schedules...</p>
      </div>
    );
  }

  return (
    <div className="medicine-delivery-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">CARE & LOGISTICS</p>
          <h2>Medicine Delivery Management</h2>
          <p className="page-description">
            Schedule, track, and verify medication dispatches carried out by the EGISCARE rover system.
          </p>
        </div>

        <div className="page-actions">
          {user?.role !== "viewer" && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Schedule Delivery
            </button>
          )}
          <button className="btn btn-secondary" onClick={fetchMedicines}>
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
            placeholder="Search medicine or resident..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "13px", color: "var(--slate-500)", fontWeight: 500 }}>
          Showing {filteredMedicines.length} of {medicines.length} medication dispatches
        </div>
      </div>

      {/* Medicine Grid */}
      <div className="medicine-grid">
        {filteredMedicines.map((med) => (
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
                <span>Scheduled Time</span>
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
                {actionLoading[med.id] ? "Updating..." : "Mark as Delivered"}
              </button>
            )}

            {med.status === "Delivered" && (
              <div className="medicine-delivered">
                <CheckCircle2 size={15} /> Delivered Successfully
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Medicine Delivery"
        description="Add a new medication dispatch to the EGISCARE rover queue"
        maxWidth="440px"
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Medication Name</label>
            <input
              required
              value={form.medicine}
              onChange={(e) => setForm({ ...form, medicine: e.target.value })}
              placeholder="e.g. Amlodipine 5mg"
            />
          </div>

          <div className="form-group">
            <label>Care Recipient Name</label>
            <input
              required
              value={form.resident}
              onChange={(e) => setForm({ ...form, resident: e.target.value })}
              placeholder="Mr. Rajesh Patel"
            />
          </div>

          <div className="form-group">
            <label>Dosage</label>
            <input
              required
              value={form.dosage}
              onChange={(e) => setForm({ ...form, dosage: e.target.value })}
              placeholder="1 tablet"
            />
          </div>

          <div className="form-group">
            <label>Scheduled Time</label>
            <input
              required
              value={form.scheduled_time}
              onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
              placeholder="09:30 AM"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MedicineDelivery;
