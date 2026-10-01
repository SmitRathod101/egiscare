import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Camera,
  Gamepad2,
  ClipboardList,
  Pill,
  BarChart3,
  Users,
  Bell,
  Settings,
  ShieldCheck,
  History,
  LogOut,
  X,
  Radio,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Sidebar({ isOpen, onClose }) {
  const { user, hasPermission, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <Bot size={22} />
          </div>

          <div className="logo-text">
            <h2>EGISCARE</h2>
            <span>ROBOTICS CARE SYSTEM</span>
          </div>

          {onClose && (
            <button className="mobile-close-btn" onClick={onClose} style={{ marginLeft: "auto", color: "var(--slate-400)" }}>
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {/* OPERATIONS */}
          <p className="nav-section">OPERATIONS</p>

          {hasPermission("dashboard") && (
            <Link
              to="/dashboard"
              className={`nav-item ${isActive("/dashboard") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          )}

          {hasPermission("roverManagement") && (
            <Link
              to="/rover"
              className={`nav-item ${isActive("/rover") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <Bot size={18} />
              <span>Rover Management</span>
            </Link>
          )}

          {hasPermission("camera") && (
            <Link
              to="/camera"
              className={`nav-item ${isActive("/camera") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <Camera size={18} />
              <span>Camera Feed</span>
            </Link>
          )}

          {hasPermission("roverControl") && (
            <Link
              to="/rover-control"
              className={`nav-item ${isActive("/rover-control") || isActive("/control") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <Gamepad2 size={18} />
              <span>Rover Teleop</span>
            </Link>
          )}

          {/* CARE & LOGISTICS */}
          <p className="nav-section">CARE & LOGISTICS</p>

          {hasPermission("tasks") && (
            <Link
              to="/tasks"
              className={`nav-item ${isActive("/tasks") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <ClipboardList size={18} />
              <span>Tasks & Medicine</span>
            </Link>
          )}

          {hasPermission("medicineDelivery") && (
            <Link
              to="/medicine-delivery"
              className={`nav-item ${isActive("/medicine-delivery") || isActive("/medicine") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <Pill size={18} />
              <span>Medicine Delivery</span>
            </Link>
          )}

          {hasPermission("dashboard") && (
            <Link
              to="/care-recipients"
              className={`nav-item ${isActive("/care-recipients") || isActive("/residents") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <Users size={18} />
              <span>Care Recipients</span>
            </Link>
          )}

          {/* MONITORING */}
          <p className="nav-section">MONITORING</p>

          {hasPermission("analytics") && (
            <Link
              to="/analytics"
              className={`nav-item ${isActive("/analytics") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <BarChart3 size={18} />
              <span>Analytics</span>
            </Link>
          )}

          {hasPermission("alerts") && (
            <Link
              to="/alerts"
              className={`nav-item ${isActive("/alerts") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <Bell size={18} />
              <span>System Alerts</span>
            </Link>
          )}

          {hasPermission("history") && (
            <Link
              to="/history"
              className={`nav-item ${isActive("/history") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <History size={18} />
              <span>Audit History</span>
            </Link>
          )}

          {/* SYSTEM */}
          <p className="nav-section">SYSTEM</p>

          {hasPermission("users") && (
            <Link
              to="/users"
              className={`nav-item ${isActive("/users") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <ShieldCheck size={18} />
              <span>Users & Access</span>
            </Link>
          )}

          {hasPermission("settings") && (
            <Link
              to="/settings"
              className={`nav-item ${isActive("/settings") ? "active" : ""}`}
              onClick={handleNavClick}
            >
              <Settings size={18} />
              <span>Settings</span>
            </Link>
          )}
        </nav>

        {/* USER / LOGOUT */}
        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="user-info">
              <strong>{user?.name || "User"}</strong>
              <span>
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "User"}
              </span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;