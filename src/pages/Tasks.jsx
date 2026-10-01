import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock3,
  ClipboardList,
  Pill,
  Play,
  PackageCheck,
  RefreshCw,
  Plus,
  Search,
  Filter,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

function Tasks() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [tasks, setTasks] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [filterTab, setFilterTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    resident: "",
    type: "Care",
    scheduled_time: "10:00 AM",
    priority: "Medium",
  });

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
      setError(err.message || "Failed to load care tasks and medicines");
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
      showSuccess(`Task status updated to '${newStatus}'`);
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
      showError(`Error updating task status: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`task_${id}`]: false }));
    }
  };

  const handleDeliverMedicine = async (id) => {
    setActionLoading((prev) => ({ ...prev, [`med_${id}`]: true }));
    try {
      const res = await api.deliverMedicine(id);
      showSuccess("Medication delivered and logged successfully.");
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
      showError(`Delivery error: ${err.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`med_${id}`]: false }));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createTask(taskForm);
      showSuccess("New care task scheduled.");
      if (res && res.task) {
        setTasks((prev) => [
          ...prev,
          {
            ...res.task,
            scheduledTime: res.task.scheduled_time || taskForm.scheduled_time,
          },
        ]);
        setShowTaskModal(false);
        setTaskForm({
          title: "",
          resident: "",
          type: "Care",
          scheduled_time: "10:00 AM",
          priority: "Medium",
        });
      }
    } catch (err) {
      showError(`Failed to create task: ${err.message}`);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesTab =
      filterTab === "all" ||
      (filterTab === "pending" && t.status === "Pending") ||
      (filterTab === "in-progress" && t.status === "In Progress") ||
      (filterTab === "completed" && t.status === "Completed");

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.resident.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="tasks-page" style={{ padding: "60px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={32} color="var(--primary-600)" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "16px", color: "var(--slate-600)" }}>Loading care tasks & medicine schedule...</p>
      </div>
    );
  }

  return (
    <div className="tasks-page" style={{ paddingBottom: "30px" }}>
      {/* Page heading */}
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">CARE & LOGISTICS</p>
          <h2>Care Tasks & Medicine Delivery</h2>
          <p className="page-description">
            Schedule and manage caretaker assignments, room checks, and automated rover medicine dispatches.
          </p>
        </div>

        <div className="page-actions">
          {user?.role !== "viewer" && (
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
              <Plus size={16} /> New Care Task
            </button>
          )}
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "24px" }}>{error}</div>}

      {/* Summary Cards */}
      <div className="task-summary-grid">
        <div className="task-summary-card">
          <div className="task-summary-icon blue">
            <ClipboardList size={20} />
          </div>
          <div>
            <span>Total Tasks</span>
            <strong>{totalTasks}</strong>
            <small>Assigned roster</small>
          </div>
        </div>

        <div className="task-summary-card">
          <div className="task-summary-icon orange">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Pending</span>
            <strong>{pendingTasks}</strong>
            <small>Awaiting dispatch</small>
          </div>
        </div>

        <div className="task-summary-card">
          <div className="task-summary-icon purple">
            <Play size={20} />
          </div>
          <div>
            <span>In Progress</span>
            <strong>{inProgressTasks}</strong>
            <small>Active execution</small>
          </div>
        </div>

        <div className="task-summary-card">
          <div className="task-summary-icon green">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedTasks}</strong>
            <small>Fulfilled today</small>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <section className="tasks-section">
        <div className="tasks-section-header">
          <div>
            <p className="section-label">ROSTER</p>
            <h3>Assigned Care Tasks</h3>
          </div>

          {/* Filter Tabs & Search */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-box" style={{ width: "200px" }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "4px", background: "var(--slate-100)", padding: "3px", borderRadius: "var(--radius-md)" }}>
              <button
                className={`btn btn-sm ${filterTab === "all" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFilterTab("all")}
              >
                All
              </button>
              <button
                className={`btn btn-sm ${filterTab === "pending" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFilterTab("pending")}
              >
                Pending
              </button>
              <button
                className={`btn btn-sm ${filterTab === "in-progress" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFilterTab("in-progress")}
              >
                In Progress
              </button>
              <button
                className={`btn btn-sm ${filterTab === "completed" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setFilterTab("completed")}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        <div className="tasks-table-wrapper">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Care Recipient</th>
                <th>Category</th>
                <th>Scheduled</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>
                    No care tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div className="task-name">
                        <div className="task-type-icon">
                          <ClipboardList size={16} />
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
                      <span className={`priority-badge ${(task.priority || "medium").toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`task-status ${(task.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
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
                          {actionLoading[`task_${task.id}`] ? "Starting..." : "Start Task"}
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
                          <CheckCircle2 size={14} /> Done
                        </span>
                      )}

                      {user?.role === "viewer" && task.status !== "Completed" && (
                        <span style={{ fontSize: "12px", color: "var(--slate-400)" }}>Read only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Medicine Delivery Section */}
      <section className="tasks-section medicine-section">
        <div className="tasks-section-header">
          <div>
            <p className="section-label">MEDICATION DISPATCH</p>
            <h3>Medication Schedule</h3>
          </div>
          <span className="task-count">{medicines.length} deliveries scheduled</span>
        </div>

        <div className="medicine-grid">
          {medicines.map((medicine) => (
            <div className="medicine-card" key={medicine.id}>
              <div className="medicine-card-top">
                <div className="medicine-icon">
                  <Pill size={20} />
                </div>
                <span className={`medicine-status ${(medicine.status || "pending").toLowerCase().replace(/\s+/g, "-")}`}>
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

              {user?.role !== "viewer" && medicine.status !== "Delivered" && (
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
                  <CheckCircle2 size={15} /> Medicine Delivered Successfully
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Create Task Modal */}
      <Modal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="Schedule New Care Task"
        description="Assign a care check or logistics task for care recipients"
        maxWidth="440px"
      >
        <form onSubmit={handleCreateTask}>
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="e.g. Morning Medication & Wellness Check"
            />
          </div>

          <div className="form-group">
            <label>Care Recipient / Resident</label>
            <input
              type="text"
              required
              value={taskForm.resident}
              onChange={(e) => setTaskForm({ ...taskForm, resident: e.target.value })}
              placeholder="Mr. Rajesh Patel"
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={taskForm.type}
              onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
            >
              <option value="Care">Care</option>
              <option value="Medicine">Medicine</option>
              <option value="Safety">Safety Check</option>
              <option value="Logistics">Rover Logistics</option>
            </select>
          </div>

          <div className="form-group">
            <label>Scheduled Time</label>
            <input
              type="text"
              required
              value={taskForm.scheduled_time}
              onChange={(e) => setTaskForm({ ...taskForm, scheduled_time: e.target.value })}
              placeholder="10:00 AM"
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={taskForm.priority}
              onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
            >
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowTaskModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Tasks;