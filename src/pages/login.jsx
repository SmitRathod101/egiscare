import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-brand">
          <div className="login-logo">
            <ShieldCheck size={30} />
          </div>

          <div>
            <h1>EGISCARE</h1>
            <p>ROBOTICS CARE SYSTEM</p>
          </div>
        </div>

        <div className="login-card">
          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>
              Sign in to access the EGISCARE control system.
            </p>
          </div>

          <form onSubmit={handleLogin}>

            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@egiscare.com"
                required
              />
            </div>

            <div className="form-group">

              <div className="password-label">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-button"
                >
                  Forgot password?
                </button>
              </div>

              <div className="password-input">
                <LockKeyhole size={17} />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="password-toggle"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="remember-row">
              <label>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          <div className="login-security">
            <ShieldCheck size={16} />

            <span>
              Authorized users only. Access is monitored and
              logged.
            </span>
          </div>
        </div>

        <p className="login-footer">
          EGISCARE • Secure Rover Management Platform
        </p>

      </div>
    </div>
  );
}

export default Login;