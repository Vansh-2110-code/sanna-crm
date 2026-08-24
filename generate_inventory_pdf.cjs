const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  margin: 36,
  size: 'A4',
  autoFirstPage: true,
  bufferPages: true
});

const outputPath = path.join(__dirname, 'Server_Deployment_Inventory_Report.pdf');
const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Primary Palette
const PRIMARY = '#1e293b';      // Slate dark
const ACCENT_BLUE = '#2563eb';  // Royal Blue
const GREEN_ACTIVE = '#16a34a'; // Emerald active
const TEXT_MUTED = '#64748b';
const BG_CARD = '#f8fafc';
const BORDER_COLOR = '#e2e8f0';

function drawHeader(isFirstPage = false) {
  // Title & Server Banner
  doc.rect(36, 36, 523, 44).fill('#0f172a');
  
  doc.fillColor('#ffffff')
     .font('Helvetica-Bold')
     .fontSize(15)
     .text('Server Deployment & Infrastructure Inventory', 48, 46);
     
  doc.fillColor('#94a3b8')
     .font('Helvetica')
     .fontSize(8)
     .text('Server Hostname: server.sannainnovations.com  |  Primary IP: 103.160.144.225  |  OS: Ubuntu Linux 20.04 LTS (x86_64)', 48, 64);

  // Top Metrics Ribbon (Only on first page)
  if (isFirstPage) {
    const ribbonY = 88;
    const boxW = 124;
    const boxH = 42;
    const gap = 9;

    const metrics = [
      { label: 'Total Active Projects', val: '15 Applications', color: '#2563eb' },
      { label: 'Docker Stack Containers', val: '34 Containers', color: '#16a34a' },
      { label: 'PM2 Managed Apps', val: '4 Online Services', color: '#d97706' },
      { label: 'Nginx Virtual Hosts', val: '17 Enabled Sites', color: '#7c3aed' }
    ];

    metrics.forEach((m, idx) => {
      const x = 36 + idx * (boxW + gap);
      doc.rect(x, ribbonY, boxW, boxH).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor(TEXT_MUTED).font('Helvetica-Bold').fontSize(7.5).text(m.label.toUpperCase(), x + 8, ribbonY + 8);
      doc.fillColor(m.color).font('Helvetica-Bold').fontSize(11).text(m.val, x + 8, ribbonY + 22);
    });

    doc.y = 138;
  } else {
    doc.y = 90;
  }
}

function drawAppCard(app) {
  const cardW = 523;
  const startY = doc.y;

  // Measure card height
  let estHeight = 88;

  // Check page overflow
  if (startY + estHeight > 770) {
    doc.addPage();
    drawHeader(false);
  }

  const y = doc.y;

  // Background Box
  doc.rect(36, y, cardW, estHeight).fillAndStroke(BG_CARD, BORDER_COLOR);

  // Card Header Ribbon
  doc.rect(36, y, cardW, 19).fill('#f1f5f9');
  doc.rect(36, y, 4, estHeight).fill(app.accentColor || ACCENT_BLUE);

  // App Title
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(app.title, 48, y + 4.5);

  // Status Badge
  doc.circle(520, y + 9.5, 3.5).fill(GREEN_ACTIVE);
  doc.fillColor(GREEN_ACTIVE).font('Helvetica-Bold').fontSize(7.5).text('RUNNING (ACTIVE)', 436, y + 5.5);

  // Content Rows
  let curY = y + 23.5;
  const col1 = 48;
  const col2 = 142;
  const lineSpacing = 12.5;

  const addRow = (label, val, isCode = false) => {
    doc.fillColor(TEXT_MUTED).font('Helvetica-Bold').fontSize(7.5).text(label, col1, curY, { width: 90 });
    if (isCode) {
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7.5).text(val, col2, curY, { width: 405 });
    } else {
      doc.fillColor('#334155').font('Helvetica').fontSize(7.5).text(val, col2, curY, { width: 405 });
    }
    curY += lineSpacing;
  };

  if (app.domains) addRow('Domain / Access:', app.domains, true);
  if (app.containers) addRow('Containers / PM2:', app.containers);
  if (app.ports) addRow('Ports & Bindings:', app.ports, true);
  if (app.paths) addRow('Volumes & Paths:', app.paths);
  if (app.description) addRow('Description & Notes:', app.description);

  doc.y = y + estHeight + 6;
}

// ================= DATA INVENTORY (15 STANDALONE APPLICATIONS) =================
const applications = [
  {
    title: '#1 - Sanna CRM (Enterprise Multi-Tenant Sales & MIS Suite)',
    accentColor: '#6366f1',
    domains: 'http://103.160.144.225:8088  |  http://103.160.144.225:3050  |  crm.sannainnovations.com',
    containers: 'PM2: sanna-crm-api (PID 1135054) | Nginx Static SPA Dist',
    ports: 'Direct IP: 8088 / 3050 -> Frontend | Express API Backend: 127.0.0.1:5055 (proxied at /api/ & /health)',
    paths: 'Web Root: /var/www/sanna-crm/dist | Backend: /var/www/sanna-crm/backend | DB: /backend/db.json & SQLite',
    description: 'Sanna Innovations CRM: 57 Clients, 51 Deliverables, 155 Financial Records, 12 ML + 12 CL Leave Quotas, 9h Auto Attendance.'
  },
  {
    title: '#2 - Astra CRM (The Astra AI Enterprise SaaS Suite)',
    accentColor: '#3b82f6',
    domains: 'astracrm.theastraai.com  |  astracrm.sannainnovations.com',
    containers: 'PM2: astra-crm-api (PID 1095490) | Nginx Static SPA Dist',
    ports: 'Backend Express API: 127.0.0.1:5001 (proxied at /api/ & /health) | Frontend: Nginx (80/443 SSL)',
    paths: 'Web Root: /var/www/astra-crm/dist | Backend: /var/www/astra-crm/backend | DB: astra_crm_dev.sqlite',
    description: 'Astra AI multi-tenant SaaS CRM platform with sales pipeline, quotation engine, and billing automation.'
  },
  {
    title: '#3 - Intern Tracker App (MongoDB Isolated Backend)',
    accentColor: '#10b981',
    domains: 'tracker.sannainnovations.com  |  http://127.0.0.1:9050',
    containers: 'intern-tracker (Python Gunicorn Web App), tracker-mongodb (Mongo 4.4)',
    ports: 'Internal Gunicorn Host Port: 127.0.0.1:9050 -> 5000/tcp | DB: 27017 (Internal Docker isolated)',
    paths: 'Network: tracker-network | Volume: /root/mongodb_data | App Root: /app',
    description: 'Main intern daily/weekly work log tracker. Database firewalled inside private Docker network.'
  },
  {
    title: '#4 - Sanna LMS Microservices Platform (21 Containers)',
    accentColor: '#8b5cf6',
    domains: 'sannalms.sannainnovations.com | Admin: admin.sannalms.sannainnovations.com',
    containers: '21 Containers: sannalms-kong, sannalms-keycloak, kong-db, sannalms-user-service, auth, course, college, etc.',
    ports: '8085 (Web UI), 8086 (Admin), 8180 (Keycloak), 8010/8011 (Kong Gateway), 5433 (Postgres), 6380 (Redis)',
    paths: 'Network: sannalms_default | Path: /root/SannaLMS | Volumes: sannalms_postgres_data, minio_data',
    description: 'Full microservices enterprise Learning Management System backed by Keycloak IAM & Kong API Gateway.'
  },
  {
    title: '#5 - MIS Portal (Sanna MIS Attendance & Payroll)',
    accentColor: '#0ea5e9',
    domains: 'mis.sannainnovations.com  |  http://103.160.144.225:8000',
    containers: 'mis_portal (Python Django/FastAPI Container, Container ID: 0f21e34b04b3)',
    ports: 'Host Port: 0.0.0.0:8000 -> 8000/tcp | SQLite Database Storage',
    paths: 'Network: mis-sanna_default | Binds: /root/mis-sanna/backend & /root/mis-sanna/frontend',
    description: 'Executive Management Information System with project deliverables, ad spend, and team attendance.'
  },
  {
    title: '#6 - MedAI Healthcare Diagnosis Platform',
    accentColor: '#ec4899',
    domains: 'medai.sannainnovations.com',
    containers: 'medai_frontend_1 (Next.js), medai_backend_1 (FastAPI), medai_db_1 (Postgres 16), medai_redis_1 (Redis 7)',
    ports: 'Frontend: 0.0.0.0:3099 -> 3000 | Backend: 0.0.0.0:8099 -> 8000 | DB: 5432 (Internal) | Redis: 6379',
    paths: 'Network: medai_default | Volume: medai_medai_pgdata | Code: /var/www/medai',
    description: 'AI-assisted medical diagnosis and clinical records web application.'
  },
  {
    title: '#7 - Astra Ads / Sanna Ads Lead Ingestion Suite',
    accentColor: '#f59e0b',
    domains: 'ads.sannainnovations.com | astraads.sannainnovations.com | astraads.theastraai.com',
    containers: 'Docker: astraads-app (Container 2bc9da817b62) | PM2: sanna-lead-api (PID 1094973)',
    ports: 'App Container: 0.0.0.0:8090 -> 3000/tcp | Backend API: Port 5050 (proxied via Nginx)',
    paths: 'Network: astraads_default | Web Root: /var/www/sanna-ads-lead | Volume: astraads_astraads-data',
    description: 'Lead ingestion gateway and digital advertising campaign telemetry management suite.'
  },
  {
    title: '#8 - AI Trip Planner Web Application',
    accentColor: '#f97316',
    domains: 'travel.sannainnovations.com  |  Fallback Default Server Root',
    containers: 'Gunicorn / Python Flask Backend + Nginx Static Frontend',
    ports: 'Internal Backend API Port: 5002 (proxied via Nginx at /api/) | Frontend: Nginx (80/443)',
    paths: 'Web Root: /var/www/ai-trip-planner/frontend | Backend Code: /var/www/ai-trip-planner',
    description: 'Intelligent travel itinerary generator and hotel/flight booking recommendation web application.'
  },
  {
    title: '#9 - TradeSense Financial Portfolio Analytics',
    accentColor: '#14b8a6',
    domains: 'tradesense.theastraai.com',
    containers: 'PM2: tradesense (Next.js v16 Engine)',
    ports: 'Host Port: 127.0.0.1:3000 (proxied via Nginx 80/443 SSL)',
    paths: 'Web Root: /var/www/tradesense',
    description: 'Real-time stock market telemetry, risk metrics, and financial portfolio analytics portal.'
  },
  {
    title: '#10 - AstraFlow Workflow Engine & Team Collaboration',
    accentColor: '#6366f1',
    domains: 'astraflow.sannainnovations.com | astraflow.theastraai.com',
    containers: 'PM2: astra-flow-api (PID 1596581) + React Frontend',
    ports: 'Internal Backend Port: 9000 (proxied at /api/ and /uploads/) | Frontend: Nginx (80/443)',
    paths: 'Web Root: /var/www/astra-flow | Backend: /root/AstraFlow',
    description: 'Enterprise workflow automation builder, task lifecycle execution, and team sprint collaboration.'
  },
  {
    title: '#11 - Sanna Web (Main Corporate Official Portal)',
    accentColor: '#3b82f6',
    domains: 'sannainnovations.com | www.sannainnovations.com',
    containers: 'Node.js Express API + Nginx Static Frontend',
    ports: 'Internal API Port: 3000 (proxied at /api/) | Frontend: Nginx (80/443 SSL)',
    paths: 'Web Root: /var/www/sanna-web',
    description: 'Official corporate portal for Sanna Innovations with client lead generation & service showcasing.'
  },
  {
    title: '#12 - The Astra AI Brand Showcase & Landing Portal',
    accentColor: '#a855f7',
    domains: 'theastraai.com | www.theastraai.com',
    containers: 'Nginx Static High-Performance Host',
    ports: 'Served via Nginx Ports 80 and 443 SSL',
    paths: 'Web Root: /var/www/astra-ai',
    description: 'Official brand landing page and product ecosystem showcase for The Astra AI suite.'
  },
  {
    title: '#13 - Digital Marketing Portal & Lead Landing Pages',
    accentColor: '#e11d48',
    domains: 'digitalmarketing.sannainnovations.com',
    containers: 'Node.js Service + Nginx Static Frontend',
    ports: 'Internal API Port: 5050 (proxied at /api/) | Frontend: Nginx (80/443 SSL)',
    paths: 'Web Root: /var/www/sanna-lead-project',
    description: 'Digital marketing campaign landing pages, conversion tracking, and lead capture hooks.'
  },
  {
    title: '#14 - Bulk Messenger Application (SMS/WhatsApp Gateway)',
    accentColor: '#16a34a',
    domains: 'bulk.sannainnovations.com  |  http://103.160.144.225:8080',
    containers: 'bulk-messenger (Python Flask App, Container ID: 9a105d550a10)',
    ports: 'Host Port: 0.0.0.0:8080 -> 5000/tcp (proxied via Nginx)',
    paths: 'Web Root / App: /app',
    description: 'Bulk messaging service for automated SMS, WhatsApp, and email notification broadcasts.'
  },
  {
    title: '#15 - ALIS Technology & Hipapa Hosting Infrastructure',
    accentColor: '#475569',
    domains: '103.160.144.225 | server.sannainnovations.com | hipapa.in | www.hipapa.in',
    containers: 'Directus / Node API + Nginx Static Host',
    ports: 'API Port: 8055 (proxied at /api/) | HTTP Port 80 & HTTPS 443',
    paths: 'Web Root: /var/www/alis-technology | /var/www/hipapa-hosting',
    description: 'Infrastructure management portal and default fallback block routing.'
  }
];

// Start Rendering
drawHeader(true);

applications.forEach(app => {
  drawAppCard(app);
});

// Footer Page Numbers
const pages = doc.bufferedPageRange();
for (let i = 0; i < pages.count; i++) {
  doc.switchToPage(i);
  doc.fillColor('#94a3b8')
     .font('Helvetica')
     .fontSize(7.5);
  doc.text(
    `Server Deployment & Infrastructure Inventory Report  |  server.sannainnovations.com (103.160.144.225)  |  Page ${i + 1} of ${pages.count}`,
    36,
    795,
    { align: 'center', width: 523, lineBreak: false }
  );
}

doc.end();

writeStream.on('finish', () => {
  console.log(`[SUCCESS] Generated clean inventory report at: ${outputPath}`);
});
