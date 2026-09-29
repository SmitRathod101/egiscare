import { useState, useEffect } from "react";
import {
  UserPlus,
  ShieldCheck,
  Eye,
  ClipboardList,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../services/api";

function roleIcon(roleInput) {
  const role = (roleInput || "").toLowerCase();
  if (role === "admin") return <ShieldCheck size={15} />;
  if (role === "caretaker") return <ClipboardList size={15} />;
  return <Eye size={15} />;
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "caretaker",
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getUsers();
      if (res && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await api.createUser(formData);
      if (res && res.user) {
        setUsers((prev) => [...prev, res.user]);
        setShowAddModal(false);
        setFormData({ name: "", email: "", password: "", role: "caretaker" });
      }
    } catch (err) {
      alert(`Error creating user: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusToggle = async (userObj) => {
    const newStatus = userObj.status === "active" ? "inactive" : "active";
    try {
      const res = await api.updateUser(userObj.id, { status: newStatus });
      if (res && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === userObj.id ? res.user : u)));
      }
    } catch (err) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(`Error deleting user: ${err.message}`);
    }
  };

  return (
    <div className="users-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACCESS CONTROL</p>
          <h2>Users & Permissions</h2>
          <p className="page-description">
            Manage EGISCARE users, roles and system access controls.
          </p>
        </div>

        <button className="primary-action" onClick={() => setShowAddModal(true)}>
          <UserPlus size={17} />
          Add User
        </button>
      </div>

      {error && (
        <div className="login-error" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div className="permission-info">
        <ShieldCheck size={18} />
        <div>
          <strong>Role-based access control</strong>
          <p>
            Users can only perform actions allowed by their assigned role (Admin, Caretaker, Viewer).
          </p>
        </div>
      </div>

      <div className="users-card">
        <div className="users-card-header">
          <div>
            <h3>System Users</h3>
            <span>{users.length} users</span>
          </div>
          <button className="secondary-action" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin-icon" : ""} /> Refresh
          </button>
        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => {
                const roleLower = (u.role || "").toLowerCase();
                const statusLower = (u.status || "active").toLowerCase();

                return (
                  <tr key={u.id}>
                    <td>
                      <div className="table-user">
                        <div className="table-avatar">
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <strong>{u.name}</strong>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={`role-badge ${roleLower}`}>
                        {roleIcon(u.role)}
                        {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : "User"}
                      </div>
                    </td>

                    <td>
                      <button
                        onClick={() => handleStatusToggle(u)}
                        style={{ background: "transparent", border: "none", cursor: "pointer" }}
                      >
                        <span className={`user-status ${statusLower}`}>
                          <span></span>
                          {u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : "Active"}
                        </span>
                      </button>
                    </td>

                    <td>
                      <span className="permission-text">
                        {roleLower === "admin"
                          ? "Full system access"
                          : roleLower === "caretaker"
                          ? "Tasks & deliveries"
                          : "Monitoring only"}
                      </span>
                    </td>

                    <td>
                      {u.email !== "admin@egiscare.com" && (
                        <button
                          className="more-button"
                          style={{ color: "#ef4444" }}
                          onClick={() => handleDeleteUser(u.id)}
                          title="Delete User"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="modal-card" style={{
            background: "#fff", padding: "24px", borderRadius: "12px", width: "400px", maxWidth: "90%"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Add New User</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jane Doe"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@egiscare.com"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label>Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  <option value="admin">Admin</option>
                  <option value="caretaker">Caretaker</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff" }}
                >
                  {submitLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;