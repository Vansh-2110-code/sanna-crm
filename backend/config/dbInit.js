const fs = require('fs');
const path = require('path');
const sequelize = require('./database');
const bcrypt = require('bcryptjs');
const { Tenant, Role, Employee, Lead, Deal, Quote, AuditLog, Order, Ticket, Integration } = require('../models');

const DB_JSON_PATH = path.join(__dirname, '..', 'db.json');

async function ensureOrderColumns() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('orders');
    const requiredColumns = [
      { name: 'invoice_number', type: sequelize.Sequelize.STRING },
      { name: 'invoice_type', type: sequelize.Sequelize.STRING },
      { name: 'invoice_date', type: sequelize.Sequelize.STRING },
      { name: 'customer_address', type: sequelize.Sequelize.TEXT },
      { name: 'customer_state', type: sequelize.Sequelize.STRING },
      { name: 'customer_gstin', type: sequelize.Sequelize.STRING },
      { name: 'reverse_charge', type: sequelize.Sequelize.STRING },
      { name: 'items', type: sequelize.Sequelize.JSON },
      { name: 'subtotal', type: sequelize.Sequelize.DOUBLE },
      { name: 'cgst_amount', type: sequelize.Sequelize.DOUBLE },
      { name: 'sgst_amount', type: sequelize.Sequelize.DOUBLE },
      { name: 'tax_total', type: sequelize.Sequelize.DOUBLE },
      { name: 'shipping', type: sequelize.Sequelize.DOUBLE },
      { name: 'grand_total', type: sequelize.Sequelize.DOUBLE },
      { name: 'seller_name', type: sequelize.Sequelize.STRING },
      { name: 'seller_logo', type: sequelize.Sequelize.TEXT },
      { name: 'seller_address', type: sequelize.Sequelize.TEXT },
      { name: 'seller_website', type: sequelize.Sequelize.STRING },
      { name: 'seller_gstin', type: sequelize.Sequelize.STRING },
      { name: 'bank_name', type: sequelize.Sequelize.STRING },
      { name: 'bank_account_name', type: sequelize.Sequelize.STRING },
      { name: 'bank_account_type', type: sequelize.Sequelize.STRING },
      { name: 'bank_account_number', type: sequelize.Sequelize.STRING },
      { name: 'bank_ifsc_code', type: sequelize.Sequelize.STRING },
      { name: 'bank_branch', type: sequelize.Sequelize.STRING },
      { name: 'deal_id', type: sequelize.Sequelize.STRING },
      { name: 'payment_status', type: sequelize.Sequelize.STRING },
      { name: 'paid_amount', type: sequelize.Sequelize.DOUBLE },
      { name: 'remaining_amount', type: sequelize.Sequelize.DOUBLE },
      { name: 'past_advance_paid', type: sequelize.Sequelize.DOUBLE },
      { name: 'past_installments_paid', type: sequelize.Sequelize.DOUBLE },
      { name: 'total_paid_so_far', type: sequelize.Sequelize.DOUBLE },
      { name: 'project_contract_value', type: sequelize.Sequelize.DOUBLE },
      { name: 'remaining_project_revenue', type: sequelize.Sequelize.DOUBLE }
    ];

    for (const col of requiredColumns) {
      if (!tableInfo[col.name]) {
        await queryInterface.addColumn('orders', col.name, { type: col.type, allowNull: true });
        console.log(`➕ Added missing column '${col.name}' to orders table.`);
      }
    }
  } catch (err) {
    console.warn('Column sync check note:', err.message);
  }
}

async function ensureLeadColumns() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('leads');
    if (!tableInfo['project_type']) {
      await queryInterface.addColumn('leads', 'project_type', { type: sequelize.Sequelize.STRING, defaultValue: 'Software Development' });
      console.log("➕ Added missing column 'project_type' to leads table.");
    }
  } catch (err) {
    console.warn('Lead column sync check note:', err.message);
  }
}

async function ensureDealColumns() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('deals');
    if (!tableInfo['project_status']) {
      await queryInterface.addColumn('deals', 'project_status', { type: sequelize.Sequelize.STRING, defaultValue: 'In Progress' });
      console.log("➕ Added missing column 'project_status' to deals table.");
    }
    if (!tableInfo['project_progress']) {
      await queryInterface.addColumn('deals', 'project_progress', { type: sequelize.Sequelize.INTEGER, defaultValue: 0 });
      console.log("➕ Added missing column 'project_progress' to deals table.");
    }
    if (!tableInfo['project_deadline']) {
      await queryInterface.addColumn('deals', 'project_deadline', { type: sequelize.Sequelize.STRING, allowNull: true });
      console.log("➕ Added missing column 'project_deadline' to deals table.");
    }
  } catch (err) {
    console.warn('Deal column sync check note:', err.message);
  }
}

async function seedDatabase() {
  try {
    console.log('🔄 Syncing database tables...');
    try {
      await sequelize.sync({ alter: true });
    } catch (alterErr) {
      await sequelize.sync({ force: false });
    }
    await ensureOrderColumns();
    await ensureLeadColumns();
    await ensureDealColumns();
    console.log('✅ Database schema synced successfully.');

    const defaultPasswordHash = bcrypt.hashSync('admin123', 10);

    let rawData = {};
    if (fs.existsSync(DB_JSON_PATH)) {
      try {
        rawData = JSON.parse(fs.readFileSync(DB_JSON_PATH, 'utf8'));
      } catch (e) {
        console.warn('Failed to parse db.json:', e.message);
      }
    }

    const isSannaMode = (process.env.APP_MODE === 'sanna') || (process.env.PORT === '5055') || (process.env.CRM_TYPE === 'sanna');

    // 1. Tenants
    const tenantCount = await Tenant.count();
    if (tenantCount === 0) {
      if (isSannaMode) {
        console.log('🌱 Seeding Sanna Innovations tenant...');
        await Tenant.bulkCreate([
          {
            id: "client-sanna",
            name: "Sanna Innovations Pvt Ltd",
            subdomain: "sanna",
            logo: "/logo.png",
            industry: "Digital Media, Technology & Enterprise IT Solutions",
            plan: "Enterprise Suite",
            status: "Active",
            maxSeats: 100,
            currency: "INR (₹)"
          }
        ], { ignoreDuplicates: true });
      } else {
        console.log('🌱 Seeding Clean Astra CRM master tenant...');
        await Tenant.bulkCreate([
          {
            id: "client-astra",
            name: "Astra CRM",
            subdomain: "astra",
            logo: "/logo.png",
            industry: "Enterprise AI & Cloud SaaS",
            plan: "Enterprise Suite",
            status: "Active",
            maxSeats: 500,
            currency: "USD ($)"
          }
        ], { ignoreDuplicates: true });
      }
    }

    // 2. Roles
    const roleCount = await Role.count();
    if (roleCount === 0) {
      console.log('🌱 Seeding roles...');
      await Role.bulkCreate([
        { id: "role-admin", name: "Super Admin / Org Admin", permissions: ["super_admin", "view_all", "edit_all", "delete_all", "approve_quotes", "export_data", "security_admin", "manage_salary", "manage_employees", "manage_tickets", "manage_customers", "manage_leads"] },
        { id: "role-mgr", name: "Sales Manager", permissions: ["view_sales", "edit_sales", "view_leads", "view_contacts", "view_pipeline", "view_products", "view_quotes", "approve_quotes", "view_orders", "view_marketing", "view_documents", "view_reports", "export_data"] },
        { id: "role-exec", name: "Sales Executive", permissions: ["view_leads", "edit_own_leads", "view_contacts", "view_pipeline", "view_products", "create_quotes", "view_quotes", "log_activities"] },
        { id: "role-dev", name: "Software Developer", permissions: ["view_projects", "view_mis", "log_attendance", "log_activities"] },
        { id: "role-marketer", name: "Digital Marketer", permissions: ["view_projects", "view_mis", "log_attendance", "log_activities"] },
        { id: "role-video", name: "Video Editor", permissions: ["view_projects", "view_mis", "view_content_calendar", "log_attendance", "log_activities"] },
        { id: "role-hr", name: "HR / HR Manager", permissions: ["view_hr", "manage_employees", "manage_salary", "manage_attendance", "view_documents", "export_data", "log_activities", "view_reports"] },
        { id: "role-ops", name: "Operations Head", permissions: ["view_ops", "manage_tickets", "manage_customers", "log_activities", "view_products", "view_contacts", "view_integrations", "view_reports"] },
        { id: "role-intern", name: "Intern / Trainee", permissions: ["view_tasks", "submit_logs", "view_attendance"] },
        { id: "role-customer", name: "Customer / Portal User", permissions: ["view_tickets", "create_tickets", "view_quotes"] }
      ], { ignoreDuplicates: true });
    }

    // 3. Employees / Admin user
    const empCount = await Employee.count();
    if (empCount === 0) {
      if (isSannaMode) {
        const realEmployees = (rawData.employees && rawData.employees.length > 0)
          ? rawData.employees.map(e => {
              const userPass = e.password || e.username || 'admin123';
              const passHash = bcrypt.hashSync(userPass, 10);
              return {
                id: e.id,
                clientId: "client-sanna",
                username: e.username || e.email.split('@')[0],
                name: e.name,
                email: e.email,
                designation: e.designation,
                roleId: e.roleId || "role-exec",
                baseSalary: e.baseSalary || 50000,
                passwordHash: passHash,
                avatar: e.avatar || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&auto=format&fit=crop&q=80'
              };
            })
          : [
              {
                id: 'EMP-SANNA-001',
                clientId: 'client-sanna',
                username: 'admin',
                name: 'Admin User',
                email: 'admin@sannainnovations.com',
                designation: 'Managing Director & Founder',
                roleId: 'role-admin',
                baseSalary: 80000,
                passwordHash: defaultPasswordHash,
                avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&auto=format&fit=crop&q=80'
              }
            ];

        console.log(`🌱 Seeding ${realEmployees.length} real Sanna employee accounts...`);
        await Employee.bulkCreate(realEmployees, { ignoreDuplicates: true });
      } else {
        console.log('🌱 Seeding Clean Astra Super Admin account (admin@astracrm.com)...');
        await Employee.create({
          id: 'EMP-ASTRA-001',
          clientId: 'client-astra',
          username: 'admin',
          name: 'Astra Administrator',
          email: 'admin@astracrm.com',
          designation: 'System Administrator',
          roleId: 'role-admin',
          baseSalary: 100000,
          passwordHash: defaultPasswordHash,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
        });
      }
    }

    // 4. Leads & Deals (ONLY for Sanna Mode — Astra CRM starts with 0 pre-fed data)
    if (isSannaMode) {
      if (rawData.leads && rawData.leads.length > 0) {
        const realLeads = rawData.leads.map(l => ({
          id: l.id,
          clientId: "client-sanna",
          name: l.name,
          company: l.company || l.name,
          email: l.email || "lead@sannainnovations.com",
          phone: l.phone || "+91 98765 43210",
          source: l.source || "Website Inbound",
          assignedTo: l.assignedTo || "Sales Desk",
          notes: l.notes || "",
          tags: ["Inbound", "Active"],
          status: l.status || "Lead",
          score: l.score || 80,
          potentialValue: l.potentialValue || 100000
        }));
        console.log(`🌱 Seeding ${realLeads.length} real leads for Sanna CRM...`);
        await Lead.bulkCreate(realLeads, { ignoreDuplicates: true });
      }

      if (rawData.clients && rawData.clients.length > 0) {
        const realDeals = rawData.clients.map(c => ({
          id: `deal-${c.id}`,
          clientId: "client-sanna",
          title: `${c.name} — ${c.projectTitle || 'Digital Engineering'}`,
          company: c.name,
          dealValue: c.budget || 180000,
          probability: c.status === 'Completed' ? 100 : 75,
          stage: c.status === 'Completed' ? 'Closed Won' : 'In Progress',
          pipelineId: "pipe-enterprise"
        }));
        console.log(`🌱 Seeding ${realDeals.length} real client deals for Sanna CRM...`);
        await Deal.bulkCreate(realDeals, { ignoreDuplicates: true });
      }
    }

    console.log(`🎉 Database initialization completed for mode: ${isSannaMode ? 'SANNA CRM' : 'ASTRA CRM (Clean)'}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

module.exports = {
  seedDatabase
};
