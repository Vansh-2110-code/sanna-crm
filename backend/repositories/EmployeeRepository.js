const BaseRepository = require('./BaseRepository');
const Employee = require('../models/Employee');

class EmployeeRepository extends BaseRepository {
  constructor() {
    super(Employee);
  }

  async findByEmail(email) {
    return this.findByUsernameOrEmail(email);
  }

  async findByUsernameOrEmail(identifier) {
    const { Op } = require('sequelize');
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    return this.findOne({
      where: {
        [Op.or]: [
          { email: clean },
          { email: `${clean}@sannainnovations.com` },
          { username: clean }
        ]
      }
    });
  }

  async findByTenant(clientId) {
    return this.findAll({ where: { clientId } });
  }
}

module.exports = new EmployeeRepository();
