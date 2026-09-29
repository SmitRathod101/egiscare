/**
 * Seed script — run once to populate initial data.
 * Usage: npm run seed
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./database");

// ── Users ──────────────────────────────────────────────────────────────────

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password, role, status)
  VALUES (@name, @email, @password, @role, @status)
`);

const users = [
  {
    name: "Admin User",
    email: "admin@egiscare.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin",
    status: "active",
  },
  {
    name: "Caretaker",
    email: "caretaker@egiscare.com",
    password: bcrypt.hashSync("caretaker123", 10),
    role: "caretaker",
    status: "active",
  },
  {
    name: "System Viewer",
    email: "viewer@egiscare.com",
    password: bcrypt.hashSync("viewer123", 10),
    role: "viewer",
    status: "pending",
  },
];

const seedUsers = db.transaction(() => {
  for (const user of users) insertUser.run(user);
});
seedUsers();

// ── Rover ──────────────────────────────────────────────────────────────────

db.prepare(`
  INSERT OR IGNORE INTO rovers (rover_id, name, status, battery, uptime_sec, firmware)
  VALUES ('RVR-001', 'EGISCARE Rover', 'Offline', 0, 0, 'v1.0.4')
`).run();

// ── Tasks ──────────────────────────────────────────────────────────────────

const insertTask = db.prepare(`
  INSERT OR IGNORE INTO tasks (id, title, resident, type, scheduled_time, priority, status)
  VALUES (@id, @title, @resident, @type, @scheduled_time, @priority, @status)
`);

const tasks = [
  { id: 1, title: "Morning Medicine Delivery", resident: "Mr. Rajesh Patel",   type: "Medicine", scheduled_time: "09:30 AM", priority: "High",   status: "Pending"     },
  { id: 2, title: "Assist with Breakfast",     resident: "Mrs. Meena Shah",    type: "Care",     scheduled_time: "10:00 AM", priority: "Medium", status: "In Progress" },
  { id: 3, title: "Afternoon Medicine",         resident: "Mr. Rajesh Patel",   type: "Medicine", scheduled_time: "01:00 PM", priority: "High",   status: "Completed"   },
  { id: 4, title: "Room Safety Check",          resident: "Mrs. Anita Desai",   type: "Safety",   scheduled_time: "02:30 PM", priority: "Low",    status: "Pending"     },
  { id: 5, title: "Evening Wellness Check",     resident: "Mr. Mahesh Shah",    type: "Care",     scheduled_time: "05:00 PM", priority: "Medium", status: "Pending"     },
];

const seedTasks = db.transaction(() => {
  for (const task of tasks) insertTask.run(task);
});
seedTasks();

// ── Medicines ──────────────────────────────────────────────────────────────

const insertMed = db.prepare(`
  INSERT OR IGNORE INTO medicines (id, medicine, resident, dosage, scheduled_time, status)
  VALUES (@id, @medicine, @resident, @dosage, @scheduled_time, @status)
`);

const medicines = [
  { id: 1, medicine: "Amlodipine 5mg",    resident: "Mr. Rajesh Patel", dosage: "1 tablet", scheduled_time: "09:30 AM", status: "Pending"   },
  { id: 2, medicine: "Metformin 500mg",   resident: "Mrs. Meena Shah",  dosage: "1 tablet", scheduled_time: "12:30 PM", status: "Delivered" },
  { id: 3, medicine: "Atorvastatin 10mg", resident: "Mr. Rajesh Patel", dosage: "1 tablet", scheduled_time: "08:00 PM", status: "Scheduled" },
];

const seedMeds = db.transaction(() => {
  for (const med of medicines) insertMed.run(med);
});
seedMeds();

// ── Activity log ───────────────────────────────────────────────────────────

const insertActivity = db.prepare(`
  INSERT OR IGNORE INTO activity_log (id, type, title, description)
  VALUES (@id, @type, @title, @description)
`);

const activities = [
  { id: 1, type: "medicine",  title: "Medicine delivered",       description: "Delivered medication to Room 203"         },
  { id: 2, type: "location",  title: "Rover reached destination", description: "Arrived at Care Wing A"                   },
  { id: 3, type: "completed", title: "Task completed",            description: "Morning medicine delivery completed"      },
  { id: 4, type: "rover",     title: "Rover started",             description: "RVR-001 started its morning operation"    },
];

const seedActivity = db.transaction(() => {
  for (const a of activities) insertActivity.run(a);
});
seedActivity();

// ── Residents ──────────────────────────────────────────────────────────────

const insertResident = db.prepare(`
  INSERT OR IGNORE INTO residents (id, name, room_number, care_level, notes)
  VALUES (@id, @name, @room_number, @care_level, @notes)
`);

const residents = [
  { id: 1, name: "Mr. Rajesh Patel", room_number: "201", care_level: "High", notes: "Requires assistance with mobility and medicine delivery." },
  { id: 2, name: "Mrs. Meena Shah", room_number: "203", care_level: "Standard", notes: "Daily medication checks." },
  { id: 3, name: "Mrs. Anita Desai", room_number: "105", care_level: "High", notes: "Safety checks every afternoon." },
  { id: 4, name: "Mr. Mahesh Shah", room_number: "108", care_level: "Standard", notes: "Evening wellness check." },
];

const seedResidents = db.transaction(() => {
  for (const r of residents) insertResident.run(r);
});
seedResidents();

// ── Alerts ─────────────────────────────────────────────────────────────────

const insertAlert = db.prepare(`
  INSERT OR IGNORE INTO alerts (id, rover_id, type, severity, title, message)
  VALUES (@id, @rover_id, @type, @severity, @title, @message)
`);

const sampleAlerts = [
  { id: 1, rover_id: "RVR-001", type: "battery", severity: "warning", title: "Battery Low", message: "Rover battery reached 20%" },
  { id: 2, rover_id: "RVR-001", type: "connection", severity: "info", title: "System Ready", message: "Rover initialized successfully" },
];

const seedAlerts = db.transaction(() => {
  for (const al of sampleAlerts) insertAlert.run(al);
});
seedAlerts();

console.log("✅ Database seeded successfully.");
