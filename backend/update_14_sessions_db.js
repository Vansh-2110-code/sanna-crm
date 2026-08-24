const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

const EMPLOYEES = [
  {
    id: "SES-SANNA-001",
    user_id: "EMP-SANNA-001",
    user_name: "Srinivas (Admin)",
    email: "admin@sannainnovations.com",
    role: "Super Admin / Org Admin",
    staff_type: "Employee",
    work_mode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome 127.0 (Desktop)",
    ip_address: "103.21.144.92 (Office Fiber)"
  },
  {
    id: "SES-SANNA-004",
    user_id: "EMP-SANNA-004",
    user_name: "Jyothi",
    email: "empsi02@sannainnovations.com",
    role: "Operations Head",
    staff_type: "Employee",
    work_mode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "macOS Sonoma · Chrome (Desktop)",
    ip_address: "103.21.144.92 (Office Fiber)"
  },
  {
    id: "SES-SANNA-005",
    user_id: "EMP-SANNA-005",
    user_name: "Sowmya",
    email: "empsi03@sannainnovations.com",
    role: "Software Developer",
    staff_type: "Employee",
    work_mode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Desktop)",
    ip_address: "103.21.144.92 (Office Fiber)"
  },
  {
    id: "SES-SANNA-008",
    user_id: "EMP-SANNA-008",
    user_name: "Mavuri Anand Kumar",
    email: "empsi06@sannainnovations.com",
    role: "Video Editor",
    staff_type: "Employee",
    work_mode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Premiere Pro Workstation",
    ip_address: "103.21.144.92 (Office Fiber)"
  },
  {
    id: "SES-SANNA-009",
    user_id: "EMP-SANNA-009",
    user_name: "Riya Biswas Dasgupta",
    email: "empsi07@sannainnovations.com",
    role: "Graphic Designer",
    staff_type: "Employee",
    work_mode: "Remote / Hybrid",
    location: "Kolkata, India (Asia/Kolkata)",
    device: "macOS Sonoma · Illustrator Studio",
    ip_address: "152.58.18.204 (Jio Fiber)"
  },
  {
    id: "SES-SANNA-012",
    user_id: "EMP-SANNA-012",
    user_name: "Bhuvan Sai Adithya",
    email: "btia23001@joyuniversity.edu.in",
    role: "Intern / Engineering Trainee",
    staff_type: "Intern",
    work_mode: "Remote / Hybrid",
    location: "Tamil Nadu, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ip_address: "49.36.112.45 (Campus Wi-Fi)"
  },
  {
    id: "SES-SANNA-013",
    user_id: "EMP-SANNA-013",
    user_name: "M.Shalini Sree",
    email: "shalinisree17@gmail.com",
    role: "Intern / Engineering Trainee",
    staff_type: "Intern",
    work_mode: "Remote / Hybrid",
    location: "Tamil Nadu, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ip_address: "49.36.112.50 (Campus Wi-Fi)"
  },
  {
    id: "SES-SANNA-014",
    user_id: "EMP-SANNA-014",
    user_name: "Vansh Goyal",
    email: "vanshgoyal.cc12345@gmail.com",
    role: "Software Developer",
    staff_type: "Employee",
    work_mode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · VS Code Dev (Desktop)",
    ip_address: "103.21.144.92 (Office Fiber)"
  },
  {
    id: "SES-SANNA-015",
    user_id: "EMP-SANNA-015",
    user_name: "Srikakula Anirudh",
    email: "btai23026@joyuniversity.edu.in",
    role: "Intern / Engineering Trainee",
    staff_type: "Intern",
    work_mode: "Remote / Hybrid",
    location: "Tamil Nadu, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ip_address: "49.36.112.55 (Campus Wi-Fi)"
  },
  {
    id: "SES-SANNA-021",
    user_id: "EMP-SANNA-021",
    user_name: "YASH DESHMUKH",
    email: "yashdesh191@gmail.com",
    role: "Software Developer",
    staff_type: "Employee",
    work_mode: "Remote / Hybrid",
    location: "Pune, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Desktop)",
    ip_address: "152.58.18.210 (Jio Fiber)"
  },
  {
    id: "SES-SANNA-022",
    user_id: "EMP-SANNA-022",
    user_name: "Karthik",
    email: "karthik@sannainnovations.com",
    role: "Digital Marketer",
    staff_type: "Employee",
    work_mode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome Ads Manager",
    ip_address: "103.21.144.92 (Office Fiber)"
  },
  {
    id: "SES-SANNA-023",
    user_id: "EMP-SANNA-023",
    user_name: "Mohana Priya Sakthivel",
    email: "Priyadigitaldm@gmail.com",
    role: "Digital Marketer",
    staff_type: "Employee",
    work_mode: "Remote / Hybrid",
    location: "Chennai, India (Asia/Kolkata)",
    device: "macOS Sonoma · Chrome (MacBook Pro)",
    ip_address: "152.58.18.225 (Airtel 5G)"
  },
  {
    id: "SES-SANNA-038",
    user_id: "EMP-SANNA-038",
    user_name: "Vidhurshan",
    email: "vidhurshan@sannainnovations.com",
    role: "Intern / Engineering Trainee",
    staff_type: "Intern",
    work_mode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ip_address: "103.21.144.92 (Office Fiber)"
  },
  {
    id: "SES-SANNA-039",
    user_id: "EMP-SANNA-039",
    user_name: "Smitesh Porkhar",
    email: "smitesh@sannainnovations.com",
    role: "Intern / Engineering Trainee",
    staff_type: "Intern",
    work_mode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ip_address: "103.21.144.92 (Office Fiber)"
  }
];

const today9AM = new Date();
today9AM.setHours(9, 0, 0, 0);
const today9AMIso = today9AM.toISOString();

db.serialize(() => {
  // Clear any old dummy sessions from SQLite
  db.run("DELETE FROM sessions WHERE email LIKE '%apex.io%' OR email LIKE '%apexglobal.io%' OR user_name IN ('Sarah Jenkins', 'Aarav Sharma', 'Marcus Vance', 'Alex Rivera', 'Priya Sundaram')");

  // Upsert all 14 employee active sessions
  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, punch_out_time, ip_address, device, location, status, work_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?, '09:00 AM', NULL, ?, ?, ?, 'Active', ?)
    ON CONFLICT(id) DO UPDATE SET
      user_name = excluded.user_name,
      email = excluded.email,
      role = excluded.role,
      staff_type = excluded.staff_type,
      login_time = excluded.login_time,
      punch_in_time = '09:00 AM',
      punch_out_time = NULL,
      status = 'Active',
      work_mode = excluded.work_mode,
      location = excluded.location,
      device = excluded.device,
      ip_address = excluded.ip_address
  `);

  EMPLOYEES.forEach(emp => {
    stmt.run(
      emp.id,
      emp.user_id,
      emp.user_name,
      emp.email,
      emp.role,
      emp.staff_type,
      today9AMIso,
      emp.ip_address,
      emp.device,
      emp.location,
      emp.work_mode
    );
  });

  stmt.finalize((err) => {
    if (err) throw err;
    console.log(`✅ Successfully updated all 14 active sessions in unified_sanna_crm.db`);
    db.all("SELECT id, user_name, role, punch_in_time, status FROM sessions WHERE status = 'Active'", [], (err, rows) => {
      if (err) throw err;
      console.log('Active Sessions in DB:', rows);
      db.close();
    });
  });
});
