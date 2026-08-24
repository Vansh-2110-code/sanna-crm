const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SalarySlip = sequelize.define('SalarySlip', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'client_id'
  },
  employeeId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'employee_id'
  },
  employeeName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'employee_name'
  },
  designation: {
    type: DataTypes.STRING
  },
  month: {
    type: DataTypes.STRING,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  basicSalary: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'basic_salary'
  },
  hra: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  transportAllowance: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'transport_allowance'
  },
  medicalAllowance: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'medical_allowance'
  },
  specialAllowance: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'special_allowance'
  },
  bonus: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  grossSalary: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'gross_salary'
  },
  pf: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  esi: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  professionalTax: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'professional_tax'
  },
  incomeTax: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'income_tax'
  },
  lopDeduction: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'lop_deduction'
  },
  totalDeductions: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'total_deductions'
  },
  netSalary: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'net_salary'
  },
  perDayRate: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    field: 'per_day_rate'
  },
  workingDays: {
    type: DataTypes.INTEGER,
    defaultValue: 26,
    field: 'working_days'
  },
  daysWorked: {
    type: DataTypes.INTEGER,
    defaultValue: 26,
    field: 'days_worked'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Generated'
  },
  paidDate: {
    type: DataTypes.DATEONLY,
    field: 'paid_date'
  }
}, {
  tableName: 'salary_slips',
  timestamps: true,
});

module.exports = SalarySlip;
