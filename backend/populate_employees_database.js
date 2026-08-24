const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'unified_sanna_crm.db');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

const EMPLOYEES = [
  { id: "EMP-SANNA-001", username: "admin", email: "admin@sannainnovations.com", password: "admin", name: "Srinivas (Admin)", role: "Super Admin / Org Admin", designation: "Chief Executive Officer (CEO)", dept: "Executive Leadership", is_intern: 0 },
  { id: "EMP-SANNA-002", username: "manager", email: "manager@sannainnovations.com", password: "manager123", name: "Operations Manager", role: "Operations Head", designation: "Operations Head", dept: "Operations", is_intern: 0 },
  { id: "EMP-SANNA-003", username: "empsi01", email: "empsi01@sannainnovations.com", password: "empsi01", name: "Srinivas", role: "Super Admin / Org Admin", designation: "Chief Executive Officer (CEO)", dept: "Executive Leadership", is_intern: 0 },
  { id: "EMP-SANNA-004", username: "empsi02", email: "empsi02@sannainnovations.com", password: "empsi02", name: "Jyothi", role: "Operations Head", designation: "Chief Commercial Officer (CCO)", dept: "Commercial & Delivery", is_intern: 0 },
  { id: "EMP-SANNA-005", username: "empsi03", email: "empsi03@sannainnovations.com", password: "empsi03", name: "Sowmya", role: "Sales Executive", designation: "Lead Frontend Engineer", dept: "Engineering", is_intern: 0 },
  { id: "EMP-SANNA-006", username: "empsi04", email: "naveen@sannainnovations.com", password: "empsi04", name: "Naveen Kumar", role: "Operations Head", designation: "Head Of Operations & Full Stack", dept: "Operations & Engineering", is_intern: 0 },
  { id: "EMP-SANNA-007", username: "empsi05", email: "empsi05@sannainnovations.com", password: "empsi05", name: "Nikki", role: "Sales Manager", designation: "Digital Marketing Lead", dept: "Marketing", is_intern: 0 },
  { id: "EMP-SANNA-008", username: "empsi06", email: "empsi06@sannainnovations.com", password: "empsi06", name: "Mavuri Anand Kumar", role: "Sales Executive", designation: "Lead Video Editor & Motion Artist", dept: "Creative Media", is_intern: 0 },
  { id: "EMP-SANNA-009", username: "empsi07", email: "empsi07@sannainnovations.com", password: "empsi07", name: "Riya Biswas Dasgupta", role: "Sales Executive", designation: "Sr. Graphic Designer", dept: "Design", is_intern: 0 },
  { id: "EMP-SANNA-010", username: "empsi08", email: "empsi08@sannainnovations.com", password: "empsi08", name: "Adarsh", role: "Sales Executive", designation: "SEO Specialist", dept: "Search & Growth", is_intern: 0 },
  { id: "EMP-SANNA-011", username: "empsi09", email: "balaji@gamil.com", password: "empsi09", name: "Jakka Balaji Mahendra", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern", dept: "Analytics", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-012", username: "empsi10", email: "btia23001@joyuniversity.edu.in", password: "empsi10", name: "Bhuvan Sai Adithya", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern", dept: "Analytics", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-013", username: "empsi11", email: "shalinisree17@gmail.com", password: "empsi11", name: "M.Shalini Sree", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern", dept: "Analytics", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-014", username: "empsi12", email: "vanshgoyal.cc12345@gmail.com", password: "empsi12", name: "Vansh Goyal", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern / Dev", dept: "Analytics & Engineering", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-015", username: "empsi13", email: "btai23026@joyuniversity.edu.in", password: "empsi13", name: "Srikakula Anirudh", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern", dept: "Analytics", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-016", username: "empsi14", email: "btai23004@joyuniversity.edu.in", password: "empsi14", name: "Anas", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern", dept: "Analytics", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-017", username: "empsi15", email: "btai23028@joyuniversity.edu.in", password: "empsi15", name: "K.Sujan", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern", dept: "Analytics", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-018", username: "empsi16", email: "btai23010@joyuniversity.edu.in", password: "empsi16", name: "Gunavantha", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern", dept: "Analytics", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-019", username: "empsi17", email: "empsi17@sannainnovations.com", password: "empsi17", name: "Prajwal", role: "Intern / Engineering Trainee", designation: "Data Analyst Intern", dept: "Analytics", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-020", username: "empsi18", email: "empsi18@sannainnovations.com", password: "empsi18", name: "Deepak", role: "Intern / Engineering Trainee", designation: "Full Stack Intern", dept: "Engineering", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-021", username: "empsi19", email: "yashdesh191@gmail.com", password: "empsi19", name: "YASH DESHMUKH", role: "Intern / Engineering Trainee", designation: "Full Stack Developer", dept: "Engineering", is_intern: 1, college: "Joy University" },
  { id: "EMP-SANNA-022", username: "karthik", email: "karthik@sannainnovations.com", password: "karthik123", name: "Karthik", role: "Sales Manager", designation: "Performance Marketer", dept: "Performance Marketing", is_intern: 0 },
  { id: "EMP-SANNA-023", username: "mohana", email: "Priyadigitaldm@gmail.com", password: "mohana123", name: "Mohana Priya Sakthivel", role: "Sales Manager", designation: "Performance Marketer", dept: "Performance Marketing", is_intern: 0 },
  { id: "EMP-SANNA-024", username: "koushik", email: "koushikshet2401@gmail.com", password: "koushik123", name: "Koushik D Shet", role: "Sales Executive", designation: "Full-Stack Developer", dept: "Engineering", is_intern: 0 }
];

async function populateUsers() {
  console.log('[POPULATE] Clearing existing users and inserting 24 employees...');
  await run('DELETE FROM users');

  for (const u of EMPLOYEES) {
    await run(
      `INSERT INTO users (id, username, email, password_hash, plain_password, full_name, role, designation, department, college, degree, cohort, mentor, stipend, start_date, end_date, status, is_intern, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        u.username,
        u.email,
        u.password,
        u.password,
        u.name,
        u.role,
        u.designation,
        u.dept,
        u.college || 'Sanna Innovations HQ',
        u.is_intern ? 'B.Tech Data Science & AI' : 'Professional',
        '2026',
        'Srinivas (CEO)',
        u.is_intern ? 12000 : 45000,
        '2026-01-01',
        '2026-12-31',
        'Active',
        u.is_intern ? 1 : 0,
        0
      ]
    );
  }

  console.log(`✅ [POPULATED] Successfully inserted ${EMPLOYEES.length} employees into users table.`);
  db.close();
}

populateUsers().catch(err => {
  console.error('Error populating users:', err);
  process.exit(1);
});
