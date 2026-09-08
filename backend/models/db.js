require('dotenv').config();
const { Sequelize } = require('sequelize');

// PostgreSQL Cloud Database Configuration (Supabase)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

module.exports = sequelize;