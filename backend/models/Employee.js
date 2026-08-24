const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.VIRTUAL,
    get() {
      return 'client-sanna';
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'full_name'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  designation: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.STRING,
  },
  roleId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'role_id'
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'password_hash'
  },
  plainPassword: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'plain_password'
  },
  avatar: {
    type: DataTypes.TEXT,
  },
  baseSalary: {
    type: DataTypes.INTEGER,
    defaultValue: 50000,
    field: 'base_salary'
  },
  stipend: {
    type: DataTypes.REAL,
    defaultValue: 0,
    field: 'stipend'
  },
  mustChangePassword: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'must_change_password'
  },
  birthday: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  }
}, {
  tableName: 'users',
  timestamps: false,
});

module.exports = Employee;
