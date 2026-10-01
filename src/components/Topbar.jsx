import { useState } from "react";
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  Shield,
  Wifi,
  X,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import Modal from "./Modal";

function Topbar({ onToggleMobileSidebar }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleLabel = (role) => {
    if (!role) return "User";
    if (role === "admin") return "System Administrator";
    if (role === "caretaker") return "Primary Caretaker";
    if (role === "viewer") return "System Observer";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === "/dashboard") return "Operations Dashboard";
    if (p === "/rover") return "Rover Management & Telemetry";
    if (p === "/camera") return "Live Optical Stream (CAM-01)";
    if (p === "/rover-control" || p === "/control") return "Manual Rover Teleoperation";
    if (p === "/tasks") return "Care Tasks & Medication Schedule";
    if (p === "/medicine-delivery" || p === "/medicine") return "Medicine Dispatch Management";
    if (p === "/care-recipients" || p === "/residents") return "Care Recipients Directory";
    if (p === "/analytics") return "Operational Analytics & Metrics";
    if (p === "/alerts") return "Real-time System Alerts";
    if (p === "/history") return "Audit History & Log Trail";
    if (p === "/users") return "Access Control & User Management";
    if (p === "/settings") return "System & Network Settings";
    return "Operations Dashboard";
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes("rover") || q.includes("rvr")) navigate("/rover");
    else if (q.includes("task") || q.includes("care")) navigate("/tasks");
    else if (q.includes("med") || q.includes("pill")) navigate("/medicine-delivery");
    else if (q.includes("cam") || q.includes("video")) navigate("/camera");
    else if (q.includes("alert")) navigate("/alerts");
    else if (q.includes("user")) navigate("/users");
    else if (q.includes("setting")) navigate("/settings");
    else navigate("/dashboard");
    setSearchQuery("");
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-toggle" onClick={onToggleMobileSidebar} aria-label="Open sidebar menu">
          <Menu size={20} />
        </button>

        <div className="topbar-title">
          <span>EGISCARE PLATFORM</span>
          <h1>{getPageTitle()}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Search Box */}
        <form onSubmit={handleSearchSubmit} className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search pages, rovers, tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-kbd">↵</span>
        </form>

        {/* Help Button */}
        <button
          className="icon-button"
          onClick={() => setShowHelp(true)}
          title="System Documentation & Assistance"
        >
          <HelpCircle size={18} />
        </button>

        {/* Notifications Button */}
        <button
          className="icon-button notification-button"
          onClick={() => navigate("/alerts")}
          title="View Live Alerts"
        >
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        <div className="topbar-divider"></div>

        {/* User Pill */}
        <div className="topbar-user" onClick={() => navigate("/settings")}>
          <div className="topbar-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>

          <div className="topbar-user-info">
            <strong>{user?.name || "User"}</strong>
            <span>{getRoleLabel(user?.role)}</span>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="EGISCARE Help & Documentation"
        description="Quick guide to operating the autonomous robotics care platform"
        maxWidth="520px"
      >
        <div style={{ fontSize: "13.5px", color: "var(--slate-700)", lineHeight: 1.6 }}>
          <h4 style={{ margin: "0 0 8px 0", color: "var(--slate-900)" }}>🚀 Quick Operator Shortcuts</h4>
          <ul style={{ paddingLeft: "20px", margin: "0 0 16px 0" }}>
            <li><strong>Rover Teleop:</strong> Go to <i>Rover Control</i> to direct RVR-001 with D-Pad or arrow keys.</li>
            <li><strong>Emergency Stop:</strong> Click the red Emergency Stop button anytime to freeze rover motors.</li>
            <li><strong>Medication Dispatch:</strong> Mark medicine as delivered in <i>Medicine Delivery</i> or <i>Tasks</i>.</li>
            <li><strong>Role Switcher:</strong> Admins can manage users & system settings; Caretakers manage tasks.</li>
          </ul>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}

export default Topbar;