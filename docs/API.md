# EGISCARE — API Documentation

Base URL: `http://localhost:4000/api`

---

## Authentication & Authorization

All endpoints except `POST /api/auth/login`, `GET /health`, and agent telemetry endpoints require a valid JWT token in the `Authorization` header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Roles & RBAC Matrix

| Endpoint / Feature | Admin | Caretaker | Viewer |
|---|:---:|:---:|:---:|
| `POST /api/auth/login` | Public | Public | Public |
| `GET /api/auth/me` | ✅ | ✅ | ✅ |
| `GET /api/tasks` | ✅ | ✅ | ✅ |
| `POST /api/tasks` | ✅ | ✅ | ❌ |
| `PATCH /api/tasks/:id/status` | ✅ | ✅ | ❌ |
| `DELETE /api/tasks/:id` | ✅ | ❌ | ❌ |
| `GET /api/medicines` | ✅ | ✅ | ✅ |
| `POST /api/medicines` | ✅ | ✅ | ❌ |
| `PATCH /api/medicines/:id/status` | ✅ | ✅ | ❌ |
| `PATCH /api/medicines/:id/deliver` | ✅ | ✅ | ❌ |
| `DELETE /api/medicines/:id` | ✅ | ❌ | ❌ |
| `GET /api/residents` | ✅ | ✅ | ✅ |
| `POST /api/residents` | ✅ | ✅ | ❌ |
| `GET /api/rovers` | ✅ | ✅ | ✅ |
| `POST /api/rovers/:id/commands` | ✅ | ✅ | ❌ |
| `GET /api/users` | ✅ | ❌ | ❌ |
| `POST /api/users` | ✅ | ❌ | ❌ |
| `PATCH /api/users/:id` | ✅ | ❌ | ❌ |
| `DELETE /api/users/:id` | ✅ | ❌ | ❌ |
| `GET /api/alerts` | ✅ | ✅ | ✅ |
| `PATCH /api/alerts/:id/acknowledge` | ✅ | ✅ | ❌ |
| `GET /api/audit-logs` | ✅ | ✅ | ✅ |

---

## Endpoint Details

### Auth Endpoints
- `POST /api/auth/login`: Accepts `{ email, password }`, returns `{ token, user }`.
- `GET /api/auth/me`: Returns verified current user profile `{ user }`.

### Rover Command Endpoint
- `POST /api/rovers/:id/commands`: Accepts `{ command }`. Valid commands: `START`, `STOP`, `MOVE_FORWARD`, `MOVE_BACKWARD`, `TURN_LEFT`, `TURN_RIGHT`, `RETURN_HOME`, `EMERGENCY_STOP`. Returns updated rover state.
