const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const User = require('./User');

const Attendance = sequelize.define('Attendance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false }, // YYYY-MM-DD
  check_in_time: { type: DataTypes.STRING, allowNull: false }, // HH:mm:ss
  check_out_time: { type: DataTypes.STRING }, // HH:mm:ss
  total_hours: { type: DataTypes.FLOAT, defaultValue: 0 }, // in hours (e.g. 8.5)
  total_hours_formatted: { type: DataTypes.STRING, defaultValue: '0h 0m' }, // '8h 30m'
  extra_time: { type: DataTypes.STRING, defaultValue: '-' }, // Extra time logged after 7:30 PM
  client_ip: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Present' } // Present, Half-Day, Late
});

User.hasMany(Attendance, { foreignKey: 'userId', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

module.exports = Attendance;