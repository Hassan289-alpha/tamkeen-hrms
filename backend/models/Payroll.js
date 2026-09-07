const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const User = require('./User');

const Payroll = sequelize.define('Payroll', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  month: { type: DataTypes.STRING, allowNull: false }, // Format: "YYYY-MM"
  base_salary: { type: DataTypes.INTEGER, allowNull: false },
  unpaid_leaves: { type: DataTypes.INTEGER, defaultValue: 0 },
  deductions: { type: DataTypes.INTEGER, defaultValue: 0 },
  bonus: { type: DataTypes.INTEGER, defaultValue: 0 },
  net_payable: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('Draft', 'Pending CEO Approval', 'Approved & Paid'),
    defaultValue: 'Draft'
  }
});

// Set up relationships
User.hasMany(Payroll, { foreignKey: 'userId' });
Payroll.belongsTo(User, { foreignKey: 'userId' });

module.exports = Payroll;