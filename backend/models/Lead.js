const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'client_id',
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  company: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'Website Forms'
  },
  referredBy: {
    type: DataTypes.STRING,
    field: 'referred_by',
    defaultValue: ''
  },
  assignedTo: {
    type: DataTypes.STRING,
    field: 'assigned_to'
  },
  notes: {
    type: DataTypes.TEXT,
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Lead',
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
  },
  potentialValue: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    field: 'potential_value'
  },
  projectCategory: {
    type: DataTypes.STRING,
    field: 'project_category',
    defaultValue: 'Software Development'
  },
  projectType: {
    type: DataTypes.STRING,
    field: 'project_type',
    defaultValue: 'One Time'
  }
}, {
  tableName: 'leads',
  timestamps: true,
});

module.exports = Lead;
