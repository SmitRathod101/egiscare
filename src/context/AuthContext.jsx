import { createContext, useContext, useState, useEffect } from "react";
import { ROLE_PERMISSIONS } from "../data/permissions";
import { api, getToken, removeToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("egiscare_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res && res.user) {
          setUser(res.user);
          localStorage.setItem("egiscare_user", JSON.stringify(res.user));
        } else {
          removeToken();
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to verify user token:", err);
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    verifyAuth();
  }, []);

  // Login user using backend API
  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    return data;
  };

  // Logout user
  const logout = () => {
    removeToken();
    localStorage.removeItem("egiscare_user");
    setUser(null);
  };

  // Check whether the logged-in user has a permission
  const hasPermission = (permission) => {
    if (!user) {
      return false;
    }
    return ROLE_PERMISSIONS[user.role]?.[permission] ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook to access authentication
export function useAuth() {
  return useContext(AuthContext);
}