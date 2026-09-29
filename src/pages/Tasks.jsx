import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock3,
  ClipboardList,
  Pill,
  Play,
  PackageCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

function Tasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, medsRes] = await Promise.all([
        api.getTasks(),
        api.getMedicines(),
      ]);

      const formattedTasks = (tasksRes.tasks || []).map((t) => ({
        ...t,
        scheduledTime: t.scheduled_time || t.scheduledTime,
      }));

      const formattedMeds = (medsRes.medicines || []).map((m) => ({
        ...m,
        scheduledTime: m.scheduled_time || m.scheduledTime,
        caretaker: m.caretaker_name || "Caretaker",
      }));

      setTasks(formattedTasks);
      setMedicines(formattedMeds);
    } catch (err) {
      setError(err.message || "Failed to load tasks and medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;

  const handleUpdateTaskStatus = async (id, newStatus) => {
    setActionLoading((prev) => ({ ...prev, [`task_${id}`]: true }));
    try {
      const res = await api.updateTaskStatus(id, newStatus);
      if (res && res.task) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...res.task,
                  scheduledTime: res.task.scheduled_time || t.scheduledTime,
                }
              : t
          )
        );
      }
    } catch (err) {
      alert(`Error updating task status: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`task_${id}`]: false }));
    }
  };

  const handleDeliverMedicine = async (id) => {
    setActionLoading((prev) => ({ ...prev, [`med_${id}`]: true }));
    try {
      const res = await api.deliverMedicine(id);
      if (res && res.medicine) {
        setMedicines((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...res.medicine,
                  scheduledTime: res.medicine.scheduled_time || m.scheduledTime,
                  caretaker: res.medicine.caretaker_name || m.caretaker,
                }
              : m
          )
        );
      }
    } catch (err) {
      alert(`Error updating medicine delivery: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`med_${id}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="tasks-page" style={{ padding: "40px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={28} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "12px", color: "#64748b" }}>Loading care tasks & medication schedule...</p>
      </div>
    );
  }

  return (
    <div className="tasks-page">
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">CARE & LOGISTICS</p>
          <h2>Tasks & Medicine Delivery</h2>
          <p className="page-description">
            Manage caretaker tasks and medicine deliveries for EGISCARE care recipients.
          </p>
        </div>

        <div className="tasks-role-badge">
          {user?.role === "admin"
            ? "Administrator"
            : user?.role === "caretaker"
            ? "Caretaker"
            : "System Viewer"}
        </div>
      </div>

      {error && (
        <div className="login-error" style={{ marginBottom: "20px" }}>
          {error} <button onClick={fetchData} style={{ marginLeft: "10px", textDecoration: "underline" }}>Retry</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="task-summary-grid">
        <div className="task-summary-card">
          <div className="task-summary-icon blue">
            <ClipboardList size={19} />
          </div>
          <div>
            <span>Total Tasks</span>
            <strong>{totalTasks}</strong>
            <small>Assigned tasks</small>
          </div>
        </div>

        <div className="task-summary-card">
          <div className="task-summary-icon orange">
            <Clock3 size={19} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{pendingTasks}</strong>
            <small>Waiting to start</small>
          </div>
        </div>

        <div className="task-summary-card">
          <div className="task-summary-icon purple">
            <Play size={19} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{inProgressTasks}</strong>
            <small>Currently active</small>
          </div>
        </div>

        <div className="task-summary-card">
          <div className="task-summary-icon green">
            <CheckCircle2 size={19} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedTasks}</strong>
            <small>Finished today</small>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <section className="tasks-section">
        <div className="tasks-section-header">
          <div>
            <p className="section-label">TASK MANAGEMENT</p>
            <h3>Care Tasks</h3>
          </div>
          <span className="task-count">{tasks.length} tasks</span>
        </div>

        <div className="tasks-table-wrapper">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Resident</th>
                <th>Type</th>
                <th>Scheduled</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <div className="task-name">
                      <div className="task-type-icon">
                        <ClipboardList size={15} />
                      </div>
                      <strong>{task.title}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="resident-name">{task.resident}</span>
                  </td>
                  <td>
                    <span className="task-type">{task.type}</span>
                  </td>
                  <td>
                    <span className="scheduled-time">
                      <Clock3 size={13} />
                      {task.scheduledTime}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${(task.priority || 'medium').toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`task-status ${(task.status || 'pending').toLowerCase().replace(/\s+/g, "-")}`}>
                      <span></span>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    {user?.role !== "viewer" && task.status === "Pending" && (
                      <button
                        className="task-action-button start"
                        disabled={actionLoading[`task_${task.id}`]}
                        onClick={() => handleUpdateTaskStatus(task.id, "In Progress")}
                      >
                        <Play size={13} />
                        {actionLoading[`task_${task.id}`] ? "Starting..." : "Start"}
                      </button>
                    )}

                    {user?.role !== "viewer" && task.status === "In Progress" && (
                      <button
                        className="task-action-button complete"
                        disabled={actionLoading[`task_${task.id}`]}
                        onClick={() => handleUpdateTaskStatus(task.id, "Completed")}
                      >
                        <CheckCircle2 size={13} />
                        {actionLoading[`task_${task.id}`] ? "Completing..." : "Complete"}
                      </button>
                    )}

                    {task.status === "Completed" && (
                      <span className="completed-label">
                        <CheckCircle2 size={14} />
                        Done
                      </span>
                    )}

                    {user?.role === "viewer" && task.status !== "Completed" && (
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>Read only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Medicine Delivery Section */}
      <section className="tasks-section medicine-section">
        <div className="tasks-section-header">
          <div>
            <p className="section-label">MEDICINE DELIVERY</p>
            <h3>Medication Schedule</h3>
          </div>
          <span className="task-count">{medicines.length} deliveries</span>
        </div>

        <div className="medicine-grid">
          {medicines.map((medicine) => (
            <div className="medicine-card" key={medicine.id}>
              <div className="medicine-card-top">
                <div className="medicine-icon">
                  <Pill size={20} />
                </div>
                <span className={`medicine-status ${(medicine.status || 'pending').toLowerCase().replace(/\s+/g, "-")}`}>
                  {medicine.status}
                </span>
              </div>

              <h3>{medicine.medicine}</h3>

              <div className="medicine-details">
                <div>
                  <span>Resident</span>
                  <strong>{medicine.resident}</strong>
                </div>
                <div>
                  <span>Dosage</span>
                  <strong>{medicine.dosage}</strong>
                </div>
                <div>
                  <span>Scheduled</span>
                  <strong>{medicine.scheduledTime}</strong>
                </div>
                <div>
                  <span>Caretaker</span>
                  <strong>{medicine.caretaker}</strong>
                </div>
              </div>

              {user?.role !== "viewer" && medicine.status === "Pending" && (
                <button
                  className="deliver-button"
                  disabled={actionLoading[`med_${medicine.id}`]}
                  onClick={() => handleDeliverMedicine(medicine.id)}
                >
                  <PackageCheck size={15} />
                  {actionLoading[`med_${medicine.id}`] ? "Updating..." : "Mark as Delivered"}
                </button>
              )}

              {medicine.status === "Delivered" && (
                <div className="medicine-delivered">
                  <CheckCircle2 size={15} />
                  Medicine delivered successfully
                </div>
              )}

              {medicine.status === "Scheduled" && user?.role !== "viewer" && (
                <button
                  className="deliver-button"
                  style={{ background: "#2563eb" }}
                  disabled={actionLoading[`med_${medicine.id}`]}
                  onClick={() => handleDeliverMedicine(medicine.id)}
                >
                  <PackageCheck size={15} />
                  {actionLoading[`med_${medicine.id}`] ? "Updating..." : "Deliver Now"}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Tasks;