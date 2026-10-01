import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@egiscare.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password. Try admin@egiscare.com");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">
            <Bot size={28} />
          </div>

          <div>
            <h1>EGISCARE</h1>
            <p>ROBOTICS CARE SYSTEM</p>
          </div>
        </div>

        <div className="login-card">
          <div className="login-heading">
            <h2>Welcome to EGISCARE</h2>
            <p>
              Sign in with your authorized credentials to access the autonomous care management portal.
            </p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className="password-input">
                <Mail size={16} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@egiscare.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  className="forgot-button"
                  onClick={() => alert("Demo Password Reset: Use credentials below")}
                >
                  Forgot password?
                </button>
              </div>

              <div className="password-input">
                <Lock size={16} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="remember-row">
              <label>
                <input type="checkbox" defaultChecked />
                <span>Keep me signed in</span>
              </label>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                "Authenticating..."
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  Sign In to System <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="demo-credentials">
            <div className="demo-credentials-title">Quick Demo Logins</div>
            <div className="demo-chips">
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoFill("admin@egiscare.com", "admin123")}
              >
                Admin
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoFill("caretaker@egiscare.com", "caretaker123")}
              >
                Caretaker
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => handleDemoFill("viewer@egiscare.com", "viewer123")}
              >
                Viewer
              </button>
            </div>
          </div>

          <div className="login-security">
            <ShieldCheck size={16} />
            <span>Encrypted Session • Role Based Access Active</span>
          </div>
        </div>

        <p className="login-footer">
          EGISCARE Robotics Operations • Portfolio Production Demo
        </p>
      </div>
    </div>
  );
}

export default Login;