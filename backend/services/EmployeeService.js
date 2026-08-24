const EmployeeRepository = require('../repositories/EmployeeRepository');
const TenantRepository = require('../repositories/TenantRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'unified_sanna_crm.db');

function queryUsersFromDb() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return resolve([]);
    });
    db.all('SELECT * FROM users ORDER BY id ASC', [], (err, rows) => {
      db.close();
      if (err || !rows) return resolve([]);
      resolve(rows.map(u => ({
        id: u.id,
        clientId: 'client-sanna',
        tenantId: 'client-sanna',
        name: u.full_name || u.name || u.username,
        username: u.username,
        email: u.email,
        designation: u.designation || u.role || 'Corporate Staff',
        role: u.role || 'Staff Member',
        roleId: u.role_id || (u.role?.includes('Admin') ? 'role-admin' : (u.role?.includes('Manager') ? 'role-mgr' : 'role-exec')),
        baseSalary: parseInt(u.base_salary || u.stipend || 50000, 10),
        salary: parseInt(u.base_salary || u.stipend || 50000, 10),
        birthday: u.birthday || null,
        avatar: u.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        status: u.status || 'Active',
        isIntern: u.is_intern ? true : false,
        createdAt: u.created_at || new Date().toISOString()
      })));
    });
  });
}

class EmployeeService {
  async getEmployeesByTenant(tenantId) {
    try {
      const dbUsers = await queryUsersFromDb();
      if (dbUsers && dbUsers.length > 0) {
        return dbUsers;
      }
      return EmployeeRepository.findByTenant(tenantId);
    } catch (e) {
      console.warn('EmployeeService getEmployees fallback:', e.message);
      return queryUsersFromDb();
    }
  }

  async createEmployee(tenant, employeeData) {
    const { name, email, designation, roleId, role, password, baseSalary, salary, birthday, dob, username: customUsername } = employeeData;
    const salaryVal = parseInt(baseSalary || salary || 50000, 10);
    const birthdayVal = birthday || dob || '2000-01-01';

    const ROLE_MAP = {
      'role-admin': 'Super Admin / Org Admin',
      'role-mgr': 'Sales Manager',
      'role-exec': 'Sales Executive',
      'role-dev': 'Software Developer',
      'role-marketer': 'Digital Marketer',
      'role-video': 'Video Editor',
      'role-hr': 'HR / HR Manager',
      'role-ops': 'Operations Head',
      'role-intern': 'Intern / Trainee',
      'role-customer': 'Customer / Portal User'
    };
    const roleName = role || ROLE_MAP[roleId] || 'Staff Member';
    const effectiveRoleId = roleId || 'role-exec';

    // Use admin-provided custom username, or auto-generate from email
    const username = (customUsername && customUsername.trim()) ? customUsername.trim().toLowerCase().replace(/\s+/g, '_') : (email ? email.split('@')[0] : `user_${Date.now()}`);
    const empId = `EMP-SANNA-${String(Date.now()).slice(-5)}`;

    const salt = bcrypt.genSaltSync(10);
    const plainPwd = (password && password.trim()) ? password.trim() : 'sanna123';
    const passwordHash = bcrypt.hashSync(plainPwd, salt);
    const avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80";

    // 1. Direct insert into unified_sanna_crm.db users table
    await new Promise((resolve) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) return resolve();
      });

      // Check if username already taken
      db.get('SELECT id FROM users WHERE LOWER(username) = ?', [username.toLowerCase()], (err, existing) => {
        const finalUsername = existing ? `${username}_${String(Date.now()).slice(-3)}` : username;

        const sql = `INSERT INTO users (
          id, username, email, password_hash, plain_password, full_name,
          role, role_id, designation, department, stipend, base_salary, birthday, status, avatar, is_intern, must_change_password, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const params = [
          empId,
          finalUsername,
          email,
          passwordHash,
          plainPwd,
          name,
          roleName,
          effectiveRoleId,
          designation || 'Specialist',
          'Corporate',
          salaryVal,
          salaryVal,
          birthdayVal,
          'Active',
          avatarUrl,
          effectiveRoleId === 'role-intern' ? 1 : 0,
          1,  // must_change_password = 1 so they are prompted to update on first login
          new Date().toISOString()
        ];

        db.run(sql, params, function(err) {
          db.close();
          if (err) {
            console.warn('SQLite insert into users warning:', err.message);
          }
          resolve(finalUsername);
        });
      });
    });

    // 2. Also insert into Sequelize
    try {
      await EmployeeRepository.create({
        id: empId,
        clientId: tenant?.id || 'client-sanna',
        name,
        email,
        designation: designation || 'Specialist',
        roleId: effectiveRoleId,
        baseSalary: salaryVal,
        birthday: birthdayVal,
        passwordHash,
        avatar: avatarUrl
      });
    } catch (e) {
      console.warn('Sequelize create employee fallback:', e.message);
    }

    return {
      id: empId,
      clientId: 'client-sanna',
      tenantId: 'client-sanna',
      name,
      username,
      email,
      designation: designation || 'Specialist',
      role: roleName,
      roleId: effectiveRoleId,
      baseSalary: salaryVal,
      salary: salaryVal,
      birthday: birthdayVal,
      avatar: avatarUrl,
      status: 'Active',
      kycStatus: 'Pending',
      mustChangePassword: true
    };
  }

  async updateEmployee(tenantId, id, updateData, requesterRole) {
    const { designation, roleId, role, baseSalary, salary, birthday, dob } = updateData;
    const salaryVal = parseInt(baseSalary || salary || 50000, 10);
    const birthdayVal = birthday || dob;
    const ROLE_MAP = {
      'role-admin': 'Super Admin / Org Admin',
      'role-mgr': 'Sales Manager',
      'role-exec': 'Sales Executive',
      'role-dev': 'Software Developer',
      'role-marketer': 'Digital Marketer',
      'role-video': 'Video Editor',
      'role-hr': 'HR / HR Manager',
      'role-ops': 'Operations Head',
      'role-intern': 'Intern / Trainee',
      'role-customer': 'Customer / Portal User'
    };
    const roleName = role || ROLE_MAP[roleId] || roleId || 'Staff Member';

    // 1. Direct update to unified_sanna_crm.db users table
    await new Promise((resolve) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) return resolve();
      });

      const updates = [];
      const params = [];

      if (designation !== undefined) {
        updates.push('designation = ?');
        params.push(designation);
      }
      if (roleId !== undefined) {
        updates.push('role_id = ?');
        params.push(roleId);
        updates.push('role = ?');
        params.push(roleName);
      }
      if (baseSalary !== undefined || salary !== undefined) {
        updates.push('stipend = ?');
        params.push(salaryVal);
        updates.push('base_salary = ?');
        params.push(salaryVal);
      }
      if (birthdayVal !== undefined) {
        updates.push('birthday = ?');
        params.push(birthdayVal);
      }

      if (updates.length > 0) {
        params.push(id, id, id, id, id);
        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ? OR email = ? OR username = ? OR LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)`;
        db.run(sql, params, (err) => {
          db.close();
          resolve();
        });
      } else {
        db.close();
        resolve();
      }
    });

    // 2. Direct update to Sequelize / astra_crm_dev.sqlite
    try {
      const { Op } = require('sequelize');
      const employee = await EmployeeRepository.findOne({
        where: {
          [Op.or]: [{ id }, { email: id }]
        }
      });

      if (employee) {
        const seqUpdates = {};
        if (designation !== undefined) seqUpdates.designation = designation;
        if (roleId !== undefined) seqUpdates.roleId = roleId;
        if (baseSalary !== undefined || salary !== undefined) seqUpdates.baseSalary = salaryVal;
        if (birthdayVal !== undefined) seqUpdates.birthday = birthdayVal;
        await employee.update(seqUpdates);
      }
    } catch (e) {
      console.warn('Sequelize update employee fallback:', e.message);
    }

    return {
      id,
      designation,
      roleId,
      role: roleName,
      baseSalary: salaryVal,
      birthday: birthdayVal
    };
  }

  async deleteEmployee(tenantId, id) {
    const { Op } = require('sequelize');
    try {
      const employee = await EmployeeRepository.findOne({
        where: {
          [Op.or]: [
            { id },
            { email: id },
            { username: id }
          ]
        }
      });

      if (employee) {
        await employee.destroy();
      }
    } catch (e) {
      console.warn('Sequelize delete employee:', e.message);
    }

    try {
      const sqlite3 = require('sqlite3').verbose();
      const path = require('path');
      const db = new sqlite3.Database(path.join(__dirname, '..', 'unified_sanna_crm.db'));
      db.run('DELETE FROM users WHERE id = ? OR email = ? OR username = ?', [id, id, id], (err) => {
        db.close();
      });
    } catch (e) {
      console.warn('SQLite delete employee:', e.message);
    }

    return true;
  }
}

module.exports = new EmployeeService();
