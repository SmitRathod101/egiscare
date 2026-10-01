import { useState, useEffect } from "react";
import {
  UserPlus,
  ShieldCheck,
  Eye,
  ClipboardList,
  RefreshCw,
  Trash2,
  Search,
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";

function roleIcon(roleInput) {
  const role = (roleInput || "").toLowerCase();
  if (role === "admin") return <ShieldCheck size={14} />;
  if (role === "caretaker") return <ClipboardList size={14} />;
  return <Eye size={14} />;
}

function Users() {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      setError(err.message || "Failed to load system users");
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
      showSuccess(`User '${formData.name}' created successfully.`);
      if (res && res.user) {
        setUsers((prev) => [...prev, res.user]);
        setShowAddModal(false);
        setFormData({ name: "", email: "", password: "", role: "caretaker" });
      }
    } catch (err) {
      showError(`Error creating user: ${err.message}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusToggle = async (userObj) => {
    const newStatus = userObj.status === "active" ? "inactive" : "active";
    try {
      const res = await api.updateUser(userObj.id, { status: newStatus });
      showSuccess(`User status updated to '${newStatus}'`);
      if (res && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === userObj.id ? res.user : u)));
      }
    } catch (err) {
      showError(`Error updating status: ${err.message}`);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await api.deleteUser(deleteTargetId);
      showSuccess("User deleted from system.");
      setUsers((prev) => prev.filter((u) => u.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      showError(`Error deleting user: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="users-page" style={{ padding: "60px", textAlign: "center" }}>
        <RefreshCw className="spin-icon" size={32} color="var(--primary-600)" style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "16px", color: "var(--slate-600)" }}>Loading access control users...</p>
      </div>
    );
  }

  return (
    <div className="users-page" style={{ paddingBottom: "30px" }}>
      <div className="page-heading">
        <div className="page-heading-left">
          <p className="eyebrow">ACCESS CONTROL</p>
          <h2>User Management & Roles</h2>
          <p className="page-description">
            Manage system access accounts, role-based permissions (Admin, Caretaker, Viewer), and credentials.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={16} /> Add New User
          </button>
          <button className="btn btn-secondary" onClick={fetchUsers}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="login-error" style={{ marginBottom: "24px" }}>{error}</div>}

      <div className="permission-info">
        <ShieldCheck size={20} color="var(--primary-600)" />
        <div>
          <strong>Role-Based Access Control (RBAC) Active</strong>
          <p>
            Admins have complete control; Caretakers manage tasks and medication dispatches; Viewers have read-only telemetry monitoring access.
          </p>
        </div>
      </div>

      {/* Filter / Search */}
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
            placeholder="Search name, email or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <span style={{ fontSize: "12.5px", color: "var(--slate-500)" }}>
          {filteredUsers.length} system accounts
        </span>
      </div>

      {/* Users Card & Table */}
      <div className="users-card">
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User Account</th>
                <th>Role</th>
                <th>Status</th>
                <th>Permission Level</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--slate-500)" }}>
                    No users found matching search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
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
                          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                          title="Click to toggle status"
                        >
                          <span className={`user-status ${statusLower}`}>
                            <span></span>
                            {u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : "Active"}
                          </span>
                        </button>
                      </td>

                      <td>
                        <span style={{ fontSize: "12.5px", color: "var(--slate-600)" }}>
                          {roleLower === "admin"
                            ? "Full system administrative control"
                            : roleLower === "caretaker"
                            ? "Task dispatch & medicine delivery"
                            : "Read-only telematics monitoring"}
                        </span>
                      </td>

                      <td>
                        {u.email !== "admin@egiscare.com" ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--danger-solid)", padding: "6px" }}
                            onClick={() => setDeleteTargetId(u.id)}
                            title="Delete Account"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--slate-400)", fontWeight: 600 }}>
                            Root Admin
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New System User"
        description="Create an account and assign system access permissions"
        maxWidth="440px"
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jane@egiscare.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="admin">Administrator (Full Access)</option>
              <option value="caretaker">Caretaker (Tasks & Deliveries)</option>
              <option value="viewer">System Viewer (Read-Only)</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User Account"
        message="Are you sure you want to delete this account? This action cannot be undone."
        confirmText="Delete User"
        loading={deleteLoading}
      />
    </div>
  );
}

export default Users;