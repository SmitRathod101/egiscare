const API_BASE = "/api";

export function getToken() {
  return localStorage.getItem("egiscare_token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("egiscare_token", token);
  } else {
    localStorage.removeItem("egiscare_token");
  }
}

export function removeToken() {
  localStorage.removeItem("egiscare_token");
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    // If unauthorized, clear token
    removeToken();
    localStorage.removeItem("egiscare_user");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    localStorage.setItem("egiscare_user", JSON.stringify(data.user));
    return data;
  },

  getMe: async () => {
    return await request("/auth/me");
  },

  // Users
  getUsers: async () => request("/users"),
  createUser: async (userData) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  updateUser: async (id, updates) =>
    request(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  deleteUser: async (id) =>
    request(`/users/${id}`, {
      method: "DELETE",
    }),

  // Tasks
  getTasks: async () => request("/tasks"),
  createTask: async (taskData) =>
    request("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    }),
  updateTaskStatus: async (id, status) =>
    request(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteTask: async (id) =>
    request(`/tasks/${id}`, {
      method: "DELETE",
    }),

  // Medicines
  getMedicines: async () => request("/medicines"),
  createMedicine: async (medData) =>
    request("/medicines", {
      method: "POST",
      body: JSON.stringify(medData),
    }),
  updateMedicineStatus: async (id, status) =>
    request(`/medicines/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deliverMedicine: async (id) =>
    request(`/medicines/${id}/deliver`, {
      method: "PATCH",
    }),

  // Residents
  getResidents: async () => request("/residents"),
  createResident: async (data) =>
    request("/residents", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Rovers
  getRover: async () => request("/rover"),
  getRovers: async () => request("/rovers"),
  getRoverStatus: async (id = "RVR-001") => request(`/rovers/${id}/status`),
  sendRoverCommand: async (id = "RVR-001", command) =>
    request(`/rovers/${id}/commands`, {
      method: "POST",
      body: JSON.stringify({ command }),
    }),
  getRoverActivity: async (limit = 10) => request(`/rover/activity?limit=${limit}`),

  // Alerts & Audit Logs
  getAlerts: async () => request("/alerts"),
  acknowledgeAlert: async (id) =>
    request(`/alerts/${id}/acknowledge`, {
      method: "PATCH",
    }),
  getAuditLogs: async () => request("/audit-logs"),
};
