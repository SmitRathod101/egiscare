import {
  Search,
  Bell,
  HelpCircle,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Topbar() {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    if (!role) return "User";
    if (role === "admin") return "Administrator";
    if (role === "caretaker") return "Caretaker";
    if (role === "viewer") return "System Viewer";
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <header className="topbar">
      <div className="mobile-menu">
        <button>
          <Menu size={21} />
        </button>
      </div>

      <div className="topbar-title">
        <span>EGISCARE</span>
        <h1>Operations Dashboard</h1>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <Search size={17} />
          <input
            type="text"
            placeholder="Search..."
          />
        </div>

        <button className="icon-button">
          <HelpCircle size={19} />
        </button>

        <button className="icon-button notification-button">
          <Bell size={19} />
          <span className="notification-dot"></span>
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>

          <div>
            <strong>{user?.name || "User"}</strong>
            <span>{getRoleLabel(user?.role)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;