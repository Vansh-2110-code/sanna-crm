const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const password = Buffer.from([0x4B, 0x42, 0x36, 0x56, 0x6E, 0x37, 0x32, 0x70, 0x32, 0x67, 0x53, 0x60, 0x28, 0x5C, 0x46]).toString('utf8');

conn.on('ready', () => {
  console.log('SSH Connection ready. Uploading unified database and backend routes...');

  conn.sftp((err, sftp) => {
    if (err) throw err;

    const filesToUpload = [
      { local: path.join(__dirname, 'unified_sanna_crm.db'), remote: '/var/www/sanna-crm/backend/unified_sanna_crm.db' },
      { local: path.join(__dirname, 'astra_crm_dev.sqlite'), remote: '/var/www/sanna-crm/backend/astra_crm_dev.sqlite' },
      { local: path.join(__dirname, 'routes', 'misRoutes.js'), remote: '/var/www/sanna-crm/backend/routes/misRoutes.js' },
      { local: path.join(__dirname, 'routes', 'index.js'), remote: '/var/www/sanna-crm/backend/routes/index.js' },
      { local: path.join(__dirname, 'services', 'EmployeeService.js'), remote: '/var/www/sanna-crm/backend/services/EmployeeService.js' },
      { local: path.join(__dirname, 'controllers', 'employeeController.js'), remote: '/var/www/sanna-crm/backend/controllers/employeeController.js' }
    ];

    let count = 0;
    filesToUpload.forEach(f => {
      sftp.fastPut(f.local, f.remote, (pErr) => {
        if (pErr) console.error(`Error uploading ${f.local}:`, pErr);
        else console.log(`Uploaded ${f.local} -> ${f.remote}`);
        count++;
        if (count === filesToUpload.length) {
          console.log('Restarting PM2 backend sanna-crm-api...');
          conn.exec('pm2 restart sanna-crm-api ; pm2 list', (rErr, stream) => {
            if (rErr) throw rErr;
            stream.on('close', () => {
              console.log('✅ Backend API restarted.');
              conn.end();
            }).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
          });
        }
      });
    });
  });
}).connect({
  host: '103.160.144.225',
  port: 22,
  username: 'root',
  password
});
