import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Users from "./pages/Users";
import DashboardLayout from "./layouts/DashboardLayout";
import RoverManagement from "./pages/RoverManagement";
import Tasks from "./pages/Tasks";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CameraMonitoring from "./pages/CameraMonitoring";
import RoverControl from "./pages/RoverControl";
import MedicineDelivery from "./pages/MedicineDelivery";
import CareRecipients from "./pages/CareRecipients";
import Alerts from "./pages/Alerts";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute permission="dashboard">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute permission="tasks">
              <DashboardLayout>
                <Tasks />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rover"
          element={
            <ProtectedRoute permission="roverManagement">
              <DashboardLayout>
                <RoverManagement />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/camera"
          element={
            <ProtectedRoute permission="camera">
              <DashboardLayout>
                <CameraMonitoring />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rover-control"
          element={
            <ProtectedRoute permission="roverControl">
              <DashboardLayout>
                <RoverControl />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/control"
          element={
            <ProtectedRoute permission="roverControl">
              <DashboardLayout>
                <RoverControl />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/medicine-delivery"
          element={
            <ProtectedRoute permission="medicineDelivery">
              <DashboardLayout>
                <MedicineDelivery />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medicine"
          element={
            <ProtectedRoute permission="medicineDelivery">
              <DashboardLayout>
                <MedicineDelivery />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/care-recipients"
          element={
            <ProtectedRoute permission="dashboard">
              <DashboardLayout>
                <CareRecipients />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/residents"
          element={
            <ProtectedRoute permission="dashboard">
              <DashboardLayout>
                <CareRecipients />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute permission="alerts">
              <DashboardLayout>
                <Alerts />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute permission="history">
              <DashboardLayout>
                <History />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute permission="analytics">
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute permission="users">
              <DashboardLayout>
                <Users />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute permission="settings">
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;