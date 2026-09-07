const { DataTypes } = require('sequelize');
const sequelize = require('./db');

const Holiday = sequelize.define('Holiday', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  start_date: { type: DataTypes.STRING, allowNull: false }, // Format: YYYY-MM-DD
  end_date: { type: DataTypes.STRING, allowNull: false },   // Format: YYYY-MM-DD
  description: { type: DataTypes.STRING, allowNull: true }
});

module.exports = Holiday;