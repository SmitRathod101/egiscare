import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Battery,
  Clock3,
  Wifi,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import StatusCard from "../components/StatusCard";
import RoverCard from "../components/RoverCard";
import ActivityList from "../components/ActivityList";

import { api } from "../services/api";
import { useWebSocket } from "../hooks/useWebSocket";

function formatUptime(secs) {
  if (!secs) return "0m";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Dashboard() {
  const navigate = useNavigate();
  const [rover, setRover] = useState({
    name: "EGISCARE Rover",
    id: "RVR-001",
    status: "Online",
    battery: 88,
    uptime: "14h 32m",
  });
  const [activities, setActivities] = useState([]);
  const [tasksCount, setTasksCount] = useState({ total: 0, pending: 0 });

  const fetchDashboardData = useCallback(async () => {
    try {
      const [roverRes, actRes, tasksRes] = await Promise.all([
        api.getRover().catch(() => null),
        api.getRoverActivity(10).catch(() => null),
        api.getTasks().catch(() => null),
      ]);

      if (roverRes && roverRes.rover) {
        setRover({
          name: roverRes.rover.name || "EGISCARE Rover",
          id: roverRes.rover.rover_id || "RVR-001",
          status: roverRes.rover.status || "Offline",
          battery: roverRes.rover.battery ?? 0,
          uptime: formatUptime(roverRes.rover.uptime_sec),
        });
      }

      if (actRes && actRes.activities) {
        const formattedActs = actRes.activities.map((a) => ({
          id: a.id,
          type: a.type || "rover",
          title: a.title,
          description: a.description,
          time: new Date(a.created_at || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setActivities(formattedActs);
      }

      if (tasksRes && tasksRes.tasks) {
        const total = tasksRes.tasks.length;
        const pending = tasksRes.tasks.filter((t) => t.status === "Pending").length;
        setTasksCount({ total, pending });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Live WebSocket Updates
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === "ROVER_TELEMETRY" || msg.type === "ROVER_UPDATE" || msg.type === "INIT") {
      const r = msg.rover || msg.data;
      if (r) {
        setRover({
          name: r.name || "EGISCARE Rover",
          id: r.rover_id || "RVR-001",
          status: r.status || "Offline",
          battery: r.battery ?? 0,
          uptime: formatUptime(r.uptime_sec),
        });
      }
    } else if (msg.type === "ALERT" || msg.type === "ROVER_COMMAND") {
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  useWebSocket(handleWsMessage);

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        {/* Page heading */}
        <div className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h2>Rover Operations</h2>
            <p className="page-description">
              Monitor and manage your EGISCARE rover system in real time.
            </p>
          </div>

          <div className="system-status">
            <span className="online-dot"></span>
            System Operational
          </div>
        </div>

        {/* Status cards */}
        <div className="status-grid">
          <StatusCard
            title="Rover Status"
            value={rover.status}
            subtitle={`${rover.id} is ${rover.status.toLowerCase()}`}
            icon={<Wifi size={19} />}
            status={rover.status === "Offline" ? "error" : "success"}
          />

          <StatusCard
            title="Battery"
            value={`${rover.battery}%`}
            subtitle={rover.battery < 20 ? "Low battery — Dock soon" : "Normal operating level"}
            icon={<Battery size={19} />}
            status={rover.battery < 20 ? "warning" : "success"}
          />

          <StatusCard
            title="Uptime"
            value={rover.uptime}
            subtitle="Since session startup"
            icon={<Clock3 size={19} />}
          />

          <StatusCard
            title="Active Tasks"
            value={String(tasksCount.total).padStart(2, "0")}
            subtitle={`${tasksCount.pending} tasks pending`}
            icon={<Activity size={19} />}
          />
        </div>

        {/* Main dashboard grid */}
        <div className="dashboard-grid">
          {/* Rover */}
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="section-label">ROVER</p>
                <h3>Active Rover</h3>
              </div>

              <button className="text-button" onClick={() => navigate("/rover")}>
                View Details
                <ArrowRight size={15} />
              </button>
            </div>

            <RoverCard rover={rover} />
          </section>

          {/* Activity */}
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p className="section-label">ACTIVITY</p>
                <h3>Recent Activity</h3>
              </div>

              <button className="text-button" onClick={() => navigate("/tasks")}>
                View History
                <ArrowRight size={15} />
              </button>
            </div>

            <ActivityList activities={activities} />
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;