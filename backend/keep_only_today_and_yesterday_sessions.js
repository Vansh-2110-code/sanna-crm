const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

const STAFF_MEMBERS = [
  {
    userId: "EMP-SANNA-001",
    userName: "Srinivas (Admin)",
    email: "admin@sannainnovations.com",
    role: "Super Admin / Org Admin",
    staffType: "Employee",
    workMode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome 127.0 (Desktop)",
    ipAddress: "103.21.144.92 (Office Fiber)"
  },
  {
    userId: "EMP-SANNA-004",
    userName: "Jyothi",
    email: "empsi02@sannainnovations.com",
    role: "Operations Head",
    staffType: "Employee",
    workMode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "macOS Sonoma · Chrome (Desktop)",
    ipAddress: "103.21.144.92 (Office Fiber)"
  },
  {
    userId: "EMP-SANNA-005",
    userName: "Sowmya",
    email: "empsi03@sannainnovations.com",
    role: "Software Developer",
    staffType: "Employee",
    workMode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Desktop)",
    ipAddress: "103.21.144.92 (Office Fiber)"
  },
  {
    userId: "EMP-SANNA-008",
    userName: "Mavuri Anand Kumar",
    email: "empsi06@sannainnovations.com",
    role: "Video Editor",
    staffType: "Employee",
    workMode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Premiere Pro Workstation",
    ipAddress: "103.21.144.92 (Office Fiber)"
  },
  {
    userId: "EMP-SANNA-009",
    userName: "Riya Biswas Dasgupta",
    email: "empsi07@sannainnovations.com",
    role: "Graphic Designer",
    staffType: "Employee",
    workMode: "Remote / Hybrid",
    location: "Kolkata, India (Asia/Kolkata)",
    device: "macOS Sonoma · Illustrator Studio",
    ipAddress: "152.58.18.204 (Jio Fiber)"
  },
  {
    userId: "EMP-SANNA-012",
    userName: "Bhuvan Sai Adithya",
    email: "btia23001@joyuniversity.edu.in",
    role: "Intern / Engineering Trainee",
    staffType: "Intern",
    workMode: "Remote / Hybrid",
    location: "Tamil Nadu, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ipAddress: "49.36.112.45 (Campus Wi-Fi)"
  },
  {
    userId: "EMP-SANNA-013",
    userName: "M.Shalini Sree",
    email: "shalinisree17@gmail.com",
    role: "Intern / Engineering Trainee",
    staffType: "Intern",
    workMode: "Remote / Hybrid",
    location: "Tamil Nadu, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ipAddress: "49.36.112.50 (Campus Wi-Fi)"
  },
  {
    userId: "EMP-SANNA-014",
    userName: "Vansh Goyal",
    email: "vanshgoyal.cc12345@gmail.com",
    role: "Software Developer",
    staffType: "Employee",
    workMode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · VS Code Dev Station (Desktop)",
    ipAddress: "103.21.144.92 (Office Fiber)"
  },
  {
    userId: "EMP-SANNA-015",
    userName: "Srikakula Anirudh",
    email: "btai23026@joyuniversity.edu.in",
    role: "Intern / Engineering Trainee",
    staffType: "Intern",
    workMode: "Remote / Hybrid",
    location: "Tamil Nadu, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ipAddress: "49.36.112.55 (Campus Wi-Fi)"
  },
  {
    userId: "EMP-SANNA-021",
    userName: "YASH DESHMUKH",
    email: "yashdesh191@gmail.com",
    role: "Software Developer",
    staffType: "Employee",
    workMode: "Remote / Hybrid",
    location: "Pune, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Desktop)",
    ipAddress: "152.58.18.210 (Jio Fiber)"
  },
  {
    userId: "EMP-SANNA-022",
    userName: "Karthik",
    email: "karthik@sannainnovations.com",
    role: "Digital Marketer",
    staffType: "Employee",
    workMode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome Ads Manager",
    ipAddress: "103.21.144.92 (Office Fiber)"
  },
  {
    userId: "EMP-SANNA-023",
    userName: "Mohana Priya Sakthivel",
    email: "Priyadigitaldm@gmail.com",
    role: "Digital Marketer",
    staffType: "Employee",
    workMode: "Remote / Hybrid",
    location: "Chennai, India (Asia/Kolkata)",
    device: "macOS Sonoma · Chrome (MacBook Pro)",
    ipAddress: "152.58.18.225 (Airtel 5G)"
  },
  {
    userId: "EMP-SANNA-038",
    userName: "Vidhurshan",
    email: "vidhurshan@sannainnovations.com",
    role: "Intern / Engineering Trainee",
    staffType: "Intern",
    workMode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ipAddress: "103.21.144.92 (Office Fiber)"
  },
  {
    userId: "EMP-SANNA-039",
    userName: "Smitesh Porkhar",
    email: "smitesh@sannainnovations.com",
    role: "Intern / Engineering Trainee",
    staffType: "Intern",
    workMode: "Office Campus",
    location: "Hyderabad, India (Asia/Kolkata)",
    device: "Windows 11 · Chrome (Laptop)",
    ipAddress: "103.21.144.92 (Office Fiber)"
  }
];

db.serialize(() => {
  // 1. Wipe all sessions to only keep clean today & yesterday records
  db.run("DELETE FROM sessions", [], function(err) {
    if (err) console.error(err);
    else console.log(`Cleared previous sessions (${this.changes} deleted).`);
  });

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, user_name, email, role, staff_type, login_time, punch_in_time, punch_out_time, ip_address, device, location, status, work_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // 2. Insert Yesterday's Session (2026-08-17) - 09:00 AM to 06:30 PM (Logged Out)
  STAFF_MEMBERS.forEach((staff, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    stmt.run(
      `SES-2026-0817-${num}`,
      staff.userId,
      staff.userName,
      staff.email,
      staff.role,
      staff.staffType,
      '2026-08-17T03:30:00.000Z',
      '09:00 AM',
      '06:30 PM',
      staff.ipAddress,
      staff.device,
      staff.location,
      'Logged Out',
      staff.workMode
    );
  });

  // 3. Insert Today's Session (2026-08-18) - 09:00 AM (Active)
  STAFF_MEMBERS.forEach((staff, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    stmt.run(
      `SES-2026-0818-${num}`,
      staff.userId,
      staff.userName,
      staff.email,
      staff.role,
      staff.staffType,
      '2026-08-18T03:30:00.000Z',
      '09:00 AM',
      null,
      staff.ipAddress,
      staff.device,
      staff.location,
      'Active',
      staff.workMode
    );
  });

  stmt.finalize((err) => {
    if (err) throw err;
    console.log('✅ Exactly 28 session records (14 Yesterday + 14 Today) inserted into unified_sanna_crm.db.');

    db.all("SELECT status, count(*) as count FROM sessions GROUP BY status", [], (err, rows) => {
      if (err) throw err;
      console.log('Session counts by status in DB:', rows);

      db.all("SELECT id, user_name, login_time, punch_in_time, punch_out_time, status FROM sessions ORDER BY CASE WHEN status = 'Active' THEN 0 ELSE 1 END, datetime(login_time) DESC", [], (err, allRows) => {
        if (err) throw err;
        console.log(`Total sessions in DB: ${allRows.length}`);
        console.log('Sample rows:', allRows.slice(0, 4));
        db.close();
      });
    });
  });
});
