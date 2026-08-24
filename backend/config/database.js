const { Sequelize } = require('sequelize');
const { url, nodeEnv } = require('./dbConfig');
const path = require('path');

let sequelize;

if (process.env.USE_SQLITE === 'true' || url.includes('sqlite') || true) {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.join(__dirname, '../unified_sanna_crm.db'),
    logging: false
  });
} else {
  sequelize = new Sequelize(url, {
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

module.exports = sequelize;
