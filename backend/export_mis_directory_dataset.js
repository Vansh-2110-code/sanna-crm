const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(path.join(__dirname, 'unified_sanna_crm.db'));

db.all('SELECT * FROM clients_projects ORDER BY id ASC', (err, clients) => {
  if (err) {
    console.error('Error reading clients_projects:', err);
    return;
  }

  db.all('SELECT * FROM project_credentials ORDER BY id ASC', (err2, creds) => {
    if (err2) {
      console.error('Error reading project_credentials:', err2);
      return;
    }

    db.all('SELECT * FROM server_details ORDER BY id ASC', (err3, servers) => {
      if (err3) {
        console.error('Error reading server_details:', err3);
        return;
      }

      const fileContent = `// Auto-generated full MIS Client Directory, Credentials, and Servers dataset
// 57 Clients, 94 Credentials, 8 Servers from MIS Production Database

export const MIS_CLIENTS_DATA = ${JSON.stringify(clients, null, 2)};

export const MIS_CREDENTIALS_DATA = ${JSON.stringify(creds, null, 2)};

export const MIS_SERVERS_DATA = ${JSON.stringify(servers, null, 2)};
`;

      const targetPath = path.join(__dirname, '..', 'src', 'data', 'misClientsDirectoryData.js');
      fs.writeFileSync(targetPath, fileContent, 'utf8');
      console.log(`✅ Successfully exported ${clients.length} clients, ${creds.length} credentials, and ${servers.length} servers to ${targetPath}`);
      db.close();
    });
  });
});
