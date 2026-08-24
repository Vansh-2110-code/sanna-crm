const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, 'unified_sanna_crm.db');
const db = new sqlite3.Database(dbPath);

const EXACT_14_EMPLOYEES = [
  {
    id: "EMP-SANNA-001",
    username: "admin",
    email: "admin@sannainnovations.com",
    plain_password: "admin",
    full_name: "Srinivas (Admin)",
    role: "Super Admin / Org Admin",
    role_id: "role-admin",
    designation: "Chief Executive Officer (CEO)",
    base_salary: 100000,
    stipend: 100000,
    department: "Executive Management",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    badge: "CEO / Super Admin",
    is_intern: 0
  },
  {
    id: "EMP-SANNA-004",
    username: "empsi02",
    email: "empsi02@sannainnovations.com",
    plain_password: "empsi02",
    full_name: "Jyothi",
    role: "Operations Head",
    role_id: "role-ops",
    designation: "Chief Commercial Officer (CCO)",
    base_salary: 15000,
    stipend: 15000,
    department: "Operations & Commerce",
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&auto=format&fit=crop&q=80",
    badge: "CCO",
    is_intern: 0
  },
  {
    id: "EMP-SANNA-005",
    username: "empsi03",
    email: "empsi03@sannainnovations.com",
    plain_password: "empsi03",
    full_name: "Sowmya",
    role: "Software Developer",
    role_id: "role-dev",
    designation: "Lead Frontend Engineer",
    base_salary: 25000,
    stipend: 25000,
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    badge: "Software Dev",
    is_intern: 0
  },
  {
    id: "EMP-SANNA-008",
    username: "empsi06",
    email: "empsi06@sannainnovations.com",
    plain_password: "empsi06",
    full_name: "Mavuri Anand Kumar",
    role: "Video Editor",
    role_id: "role-video",
    designation: "Lead Video Editor & Motion Artist",
    base_salary: 10000,
    stipend: 10000,
    department: "Creative Media",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    badge: "Video Editor",
    is_intern: 0
  },
  {
    id: "EMP-SANNA-009",
    username: "empsi07",
    email: "empsi07@sannainnovations.com",
    plain_password: "empsi07",
    full_name: "Riya Biswas Dasgupta",
    role: "Graphic Designer",
    role_id: "role-designer",
    designation: "Sr. Graphic Designer",
    base_salary: 40000,
    stipend: 40000,
    department: "Creative Design",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    badge: "Graphic Design",
    is_intern: 0
  },
  {
    id: "EMP-SANNA-012",
    username: "empsi10",
    email: "btia23001@joyuniversity.edu.in",
    plain_password: "empsi10",
    full_name: "Bhuvan Sai Adithya",
    role: "Intern / Engineering Trainee",
    role_id: "role-intern",
    designation: "Data Analyst Intern",
    base_salary: 12000,
    stipend: 12000,
    department: "Analytics & Data",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80",
    badge: "Intern",
    is_intern: 1
  },
  {
    id: "EMP-SANNA-013",
    username: "empsi11",
    email: "shalinisree17@gmail.com",
    plain_password: "empsi11",
    full_name: "M.Shalini Sree",
    role: "Intern / Engineering Trainee",
    role_id: "role-intern",
    designation: "Data Analyst Intern",
    base_salary: 12000,
    stipend: 12000,
    department: "Analytics & Data",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    badge: "Intern",
    is_intern: 1
  },
  {
    id: "EMP-SANNA-014",
    username: "empsi12",
    email: "vanshgoyal.cc12345@gmail.com",
    plain_password: "empsi12",
    full_name: "Vansh Goyal",
    role: "Software Developer",
    role_id: "role-dev",
    designation: "Data Analyst Intern / Dev",
    base_salary: 50000,
    stipend: 50000,
    department: "Engineering & Data",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    badge: "Dev / Intern",
    is_intern: 1
  },
  {
    id: "EMP-SANNA-015",
    username: "empsi13",
    email: "btai23026@joyuniversity.edu.in",
    plain_password: "empsi13",
    full_name: "Srikakula Anirudh",
    role: "Intern / Engineering Trainee",
    role_id: "role-intern",
    designation: "Data Analyst Intern",
    base_salary: 50000,
    stipend: 50000,
    department: "Analytics & Data",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    badge: "Intern",
    is_intern: 1
  },
  {
    id: "EMP-SANNA-021",
    username: "empsi19",
    email: "yashdesh191@gmail.com",
    plain_password: "empsi19",
    full_name: "YASH DESHMUKH",
    role: "Software Developer",
    role_id: "role-dev",
    designation: "Full Stack Developer",
    base_salary: 1000,
    stipend: 1000,
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    badge: "Software Dev",
    is_intern: 1
  },
  {
    id: "EMP-SANNA-022",
    username: "karthik",
    email: "karthik@sannainnovations.com",
    plain_password: "karthik123",
    full_name: "Karthik",
    role: "Digital Marketer",
    role_id: "role-marketer",
    designation: "Performance Marketer",
    base_salary: 15000,
    stipend: 15000,
    department: "Marketing",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80",
    badge: "Digital Marketer",
    is_intern: 0
  },
  {
    id: "EMP-SANNA-023",
    username: "mohana",
    email: "Priyadigitaldm@gmail.com",
    plain_password: "mohana123",
    full_name: "Mohana Priya Sakthivel",
    role: "Digital Marketer",
    role_id: "role-marketer",
    designation: "Performance Marketer",
    base_salary: 37000,
    stipend: 37000,
    department: "Marketing",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    badge: "Digital Marketer",
    is_intern: 0
  },
  {
    id: "EMP-SANNA-038",
    username: "vidhurshan",
    email: "vidhurshan@sannainnovations.com",
    plain_password: "vidhurshan123",
    full_name: "Vidhurshan",
    role: "Intern / Engineering Trainee",
    role_id: "role-intern",
    designation: "Intern",
    base_salary: 1000,
    stipend: 1000,
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    badge: "Intern",
    is_intern: 1
  },
  {
    id: "EMP-SANNA-039",
    username: "smitesh",
    email: "smitesh@sannainnovations.com",
    plain_password: "smitesh123",
    full_name: "Smitesh Porkhar",
    role: "Intern / Engineering Trainee",
    role_id: "role-intern",
    designation: "Intern",
    base_salary: 10000,
    stipend: 10000,
    department: "Engineering",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    badge: "Intern",
    is_intern: 1
  }
];

db.serialize(() => {
  console.log('1. Resetting users table with exact 14 employees...');
  db.run('DELETE FROM users', (err) => {
    if (err) console.error(err);

    const stmt = db.prepare(`INSERT INTO users (
      id, username, email, password_hash, plain_password, full_name,
      role, role_id, designation, department, base_salary, stipend,
      status, avatar, is_intern, must_change_password, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    for (const emp of EXACT_14_EMPLOYEES) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(emp.plain_password, salt);

      stmt.run([
        emp.id,
        emp.username,
        emp.email,
        passwordHash,
        emp.plain_password,
        emp.full_name,
        emp.role,
        emp.role_id,
        emp.designation,
        emp.department,
        emp.base_salary,
        emp.stipend,
        'Active',
        emp.avatar,
        emp.is_intern,
        0,
        new Date().toISOString()
      ]);
    }
    stmt.finalize();

    console.log('✅ SQLite users table populated with exact 14 employees.');
    db.close();
  });
});
