const { Client } = require('ssh2');

const passBuffer = Buffer.from([
  0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46
]).toString('utf8');

function runSSH(conn, cmd) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      }).on('data', (d) => {
        stdout += d.toString();
      }).stderr.on('data', (d) => {
        stderr += d.toString();
      });
    });
  });
}

async function fixRolesAndReseed() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('Connected to server.');

    try {
      const script = `
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const Employee = require('./models/Employee');
const Role = require('./models/Role');
const Tenant = require('./models/Tenant');

const allRoles = [
  { id: "role-admin", name: "Super Admin / Org Admin", permissions: ["super_admin", "view_all", "edit_all", "delete_all"] },
  { id: "role-mgr", name: "Sales Manager", permissions: ["view_sales", "edit_sales"] },
  { id: "role-exec", name: "Sales Executive", permissions: ["view_leads", "edit_own_leads"] },
  { id: "role-dev", name: "Software Developer", permissions: ["view_projects", "view_mis", "log_attendance", "log_activities"] },
  { id: "role-marketer", name: "Digital Marketer", permissions: ["view_projects", "view_mis", "log_attendance", "log_activities"] },
  { id: "role-video", name: "Video Editor", permissions: ["view_projects", "view_mis", "view_content_calendar", "log_attendance", "log_activities"] },
  { id: "role-hr", name: "HR / HR Manager", permissions: ["view_hr", "manage_employees"] },
  { id: "role-ops", name: "Operations Head", permissions: ["view_ops", "manage_tickets"] },
  { id: "role-intern", name: "Intern / Trainee", permissions: ["view_tasks", "submit_logs"] },
  { id: "role-customer", name: "Customer / Portal User", permissions: ["view_tickets"] }
];

const trackerUsers = [
  { username: 'admin', name: 'Admin User', email: 'admin@sannainnovations.com', roleId: 'role-admin', pass: 'admin123', designation: 'System Administrator' },
  { username: 'manager', name: 'manager123', email: 'manager123@gamil.com', roleId: 'role-ops', pass: 'manager123', designation: 'Operations Manager' },
  { username: 'empsi01', name: 'Srinivas', email: 'empsi01@sannainnovations.com', roleId: 'role-admin', pass: 'empsi01', designation: 'CEO' },
  { username: 'empsi02', name: 'Jyothi', email: 'empsi02@sannainnovations.com', roleId: 'role-ops', pass: 'empsi02', designation: 'CCO' },
  { username: 'empsi03', name: 'Sowmya', email: 'empsi03@sannainnovations.com', roleId: 'role-dev', pass: 'empsi03', designation: 'Lead Frontend Engineer' },
  { username: 'empsi04', name: 'Naveen Kumar', email: 'naveen@sannainnovations.com', roleId: 'role-ops', pass: 'empsi04', designation: 'Head Of Operations' },
  { username: 'empsi05', name: 'Nikki', email: 'empsi05@sannainnovations.com', roleId: 'role-marketer', pass: 'empsi05', designation: 'Digital Marketing Lead' },
  { username: 'empsi06', name: 'Mavuri Anand Kumar', email: 'empsi06@sannainnovations.com', roleId: 'role-video', pass: 'empsi06', designation: 'Video Editor' },
  { username: 'empsi07', name: 'Riya Biswas Dasgupta', email: 'empsi07@sannainnovations.com', roleId: 'role-exec', pass: 'empsi07', designation: 'Sr.Graphic Designer' },
  { username: 'empsi08', name: 'Adarsh', email: 'empsi08@sannainnovations.com', roleId: 'role-marketer', pass: 'empsi08', designation: 'SEO Specialist' },
  { username: 'empsi09', name: 'Jakka Balaji Mahendra', email: 'balaji@gamil.com', roleId: 'role-intern', pass: 'empsi09', designation: 'Data Analyst Intern' },
  { username: 'empsi10', name: 'Bhuvan Sai Adithya', email: 'btia23001@joyuniversity.edu.in', roleId: 'role-intern', pass: 'empsi10', designation: 'Data Analyst Intern' },
  { username: 'empsi11', name: 'M.Shalini Sree', email: 'shalinisree17@gmail.com', roleId: 'role-intern', pass: 'empsi11', designation: 'Data Analyst Intern' },
  { username: 'empsi12', name: 'Vansh Goyal', email: 'vanshgoyal.cc12345@gmail.com', roleId: 'role-intern', pass: 'empsi12', designation: 'Data Analyst Intern' },
  { username: 'empsi13', name: 'Srikakula Anirudh', email: 'btai23026@joyuniversity.edu.in', roleId: 'role-intern', pass: 'empsi13', designation: 'Data Analyst Intern' },
  { username: 'empsi14', name: 'Karthik', email: 'empsi14@sannainnovations.com', roleId: 'role-marketer', pass: 'empsi14', designation: 'Performance Marketer' },
  { username: 'empsi15', name: 'Mohana Priya Sakthivel', email: 'Priyadigitaldm@gmail.com', roleId: 'role-marketer', pass: 'empsi15', designation: 'Performance Marketer' },
  { username: 'empsi16', name: 'Koushik D Shet', email: 'koushikshet2401@gmail.com', roleId: 'role-dev', pass: 'empsi16', designation: 'Full-Stack Developer' },
  { username: 'empsi17', name: 'Vidhorssan K', email: 'vidhu4102004@gmail.com', roleId: 'role-dev', pass: 'empsi17', designation: 'Full Stack Developer' },
  { username: 'empsi18', name: 'Smitesh Pokharkar', email: 'smitesh.pokharkar28@gmail.com', roleId: 'role-dev', pass: 'empsi18', designation: 'FullStack Developer' },
  { username: 'empsi19', name: 'YASH DESHMUKH', email: 'yashdesh191@gmail.com', roleId: 'role-dev', pass: 'empsi19', designation: 'Full Stack Developer' }
];

(async () => {
  // 1. Ensure Roles Exist
  for (const r of allRoles) {
    await Role.upsert(r);
  }
  console.log('Roles seeded.');

  // 2. Ensure Tenant Exists
  await Tenant.upsert({
    id: "client-sanna",
    name: "Sanna Innovations Pvt Ltd",
    subdomain: "sannainnovations",
    plan: "Enterprise Suite",
    status: "Active",
    maxSeats: 100,
    currency: "INR (₹)"
  });
  console.log('Tenant seeded.');

  // 3. Seed/Update All 21 Users
  for (const u of trackerUsers) {
    const pHash = bcrypt.hashSync(u.pass, 10);
    const existing = await Employee.findOne({
      where: sequelize.or(
        { username: u.username },
        { email: u.email }
      )
    });

    if (existing) {
      existing.username = u.username;
      existing.name = u.name;
      existing.email = u.email;
      existing.roleId = u.roleId;
      existing.designation = u.designation;
      existing.passwordHash = pHash;
      existing.clientId = 'client-sanna';
      await existing.save();
      console.log('✅ Updated:', u.username, '-> pass:', u.pass);
    } else {
      await Employee.create({
        id: 'EMP-' + u.username.toUpperCase(),
        clientId: 'client-sanna',
        username: u.username,
        name: u.name,
        email: u.email,
        roleId: u.roleId,
        designation: u.designation,
        passwordHash: pHash,
        baseSalary: 50000,
        avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&auto=format&fit=crop&q=80'
      });
      console.log('✅ Created:', u.username, '-> pass:', u.pass);
    }
  }
  console.log('🎉 ALL_21_TRACKER_USERS_READY');
})();
`;

      const b64 = Buffer.from(script).toString('base64');
      const res = await runSSH(conn, `cd /var/www/sanna-crm/backend && node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
      console.log('Script Output:\n', res.stdout, res.stderr);

      console.log('Restarting sanna-crm-api in PM2...');
      await runSSH(conn, 'pm2 restart sanna-crm-api');
    } catch (e) {
      console.error('Error during execution:', e);
    } finally {
      conn.end();
    }
  }).connect({
    host: '103.160.144.225',
    port: 22,
    username: 'root',
    password: passBuffer,
    tryKeyboard: true
  });
}

fixRolesAndReseed().catch(console.error);
