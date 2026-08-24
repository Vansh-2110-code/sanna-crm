const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

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

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function fixAndReseedEmployees() {
  const conn = new Client();
  console.log('Connecting to 103.160.144.225...');

  conn.on('ready', async () => {
    console.log('Connected to server.');

    conn.sftp(async (err, sftp) => {
      if (err) throw err;

      try {
        console.log('Uploading updated models and services to /var/www/sanna-crm/backend...');
        await uploadFile(sftp, path.join(__dirname, 'models', 'Employee.js'), '/var/www/sanna-crm/backend/models/Employee.js');
        await uploadFile(sftp, path.join(__dirname, 'repositories', 'EmployeeRepository.js'), '/var/www/sanna-crm/backend/repositories/EmployeeRepository.js');
        await uploadFile(sftp, path.join(__dirname, 'services', 'AuthService.js'), '/var/www/sanna-crm/backend/services/AuthService.js');
        await uploadFile(sftp, path.join(__dirname, 'controllers', 'authController.js'), '/var/www/sanna-crm/backend/controllers/authController.js');

        const reseedScript = `
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const Employee = require('./models/Employee');
const Role = require('./models/Role');
const Tenant = require('./models/Tenant');

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
  await sequelize.sync({ alter: true });
  
  // Ensure tenant exists
  await Tenant.upsert({
    id: "client-sanna",
    name: "Sanna Innovations Pvt Ltd",
    subdomain: "sannainnovations",
    plan: "Enterprise Suite",
    status: "Active",
    maxSeats: 100,
    currency: "INR (₹)"
  });

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
      console.log('Updated user:', u.username);
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
      console.log('Created user:', u.username);
    }
  }
  console.log('ALL_USERS_SYNCED_SUCCESSFULLY');
})();
`;
        console.log('Executing user update on server...');
        const b64 = Buffer.from(reseedScript).toString('base64');
        const res = await runSSH(conn, `cd /var/www/sanna-crm/backend && node -e "eval(Buffer.from('${b64}', 'base64').toString('utf8'))"`);
        console.log('Sync Output:\n', res.stdout, res.stderr);

        console.log('Restarting sanna-crm-api in PM2...');
        await runSSH(conn, 'pm2 restart sanna-crm-api');

        console.log('✅ DATABASE USER ACCOUNTS UPDATED.');
      } catch (e) {
        console.error('Error during execution:', e);
      } finally {
        conn.end();
      }
    });
  }).connect({
    host: '103.160.144.225',
    port: 22,
    username: 'root',
    password: passBuffer,
    tryKeyboard: true
  });
}

fixAndReseedEmployees().catch(console.error);
