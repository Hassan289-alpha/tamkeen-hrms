const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const User = require('./User');

const Leave = sequelize.define('Leave', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  leave_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isIn: [['Sick', 'Casual', 'Annual']] }
  },
  start_date: { type: DataTypes.STRING, allowNull: false },
  end_date: { type: DataTypes.STRING, allowNull: false },
  days: { type: DataTypes.FLOAT, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending',
    validate: { isIn: [['Pending', 'Approved', 'Rejected']] }
  },
  proof_document: { type: DataTypes.STRING, allowNull: true },
  approved_by: { type: DataTypes.INTEGER, allowNull: true },
  approved_at: { type: DataTypes.DATE, allowNull: true },
  rejection_reason: { type: DataTypes.STRING, allowNull: true }
});

User.hasMany(Leave, { foreignKey: 'userId', onDelete: 'CASCADE' });
Leave.belongsTo(User, { foreignKey: 'userId' });

module.exports = Leave;