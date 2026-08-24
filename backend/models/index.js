const Tenant = require('./Tenant');
const Role = require('./Role');
const Employee = require('./Employee');
const Lead = require('./Lead');
const Deal = require('./Deal');
const Quote = require('./Quote');
const AuditLog = require('./AuditLog');
const Order = require('./Order');
const Ticket = require('./Ticket');
const Integration = require('./Integration');
const SalarySlip = require('./SalarySlip');
const Attendance = require('./Attendance');

// Define Relationships
Tenant.hasMany(Employee, { foreignKey: 'clientId', as: 'employees' });
Employee.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Role.hasMany(Employee, { foreignKey: 'roleId', as: 'employees' });
Employee.belongsTo(Role, { foreignKey: 'roleId', as: 'assignedRole' });

Tenant.hasMany(Lead, { foreignKey: 'clientId', as: 'leads' });
Lead.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Tenant.hasMany(Deal, { foreignKey: 'clientId', as: 'deals' });
Deal.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Tenant.hasMany(Quote, { foreignKey: 'clientId', as: 'quotes' });
Quote.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Tenant.hasMany(AuditLog, { foreignKey: 'clientId', as: 'auditLogs' });
AuditLog.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Tenant.hasMany(Order, { foreignKey: 'clientId', as: 'orders' });
Order.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Tenant.hasMany(Ticket, { foreignKey: 'clientId', as: 'tickets' });
Ticket.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Tenant.hasMany(Integration, { foreignKey: 'clientId', as: 'integrations' });
Integration.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Tenant.hasMany(SalarySlip, { foreignKey: 'clientId', as: 'salarySlips' });
SalarySlip.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

Tenant.hasMany(Attendance, { foreignKey: 'clientId', as: 'attendance' });
Attendance.belongsTo(Tenant, { foreignKey: 'clientId', as: 'tenant' });

module.exports = {
  Tenant,
  Role,
  Employee,
  Lead,
  Deal,
  Quote,
  AuditLog,
  Order,
  Ticket,
  Integration,
  SalarySlip,
  Attendance
};
