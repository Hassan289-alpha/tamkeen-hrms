const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'Employee', validate: { isIn: [['HR', 'Manager', 'Employee', 'CEO']] } },
  department: { type: DataTypes.STRING, defaultValue: 'Engineering' },
  position: { type: DataTypes.STRING, defaultValue: 'Staff' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  casual_leave_balance: { type: DataTypes.FLOAT, defaultValue: 10 },
  sick_leave_balance: { type: DataTypes.FLOAT, defaultValue: 10 },
  annual_leave_balance: { type: DataTypes.FLOAT, defaultValue: 15 },
  document_url: { type: DataTypes.STRING, allowNull: true },
  
  // NEW: Payroll Data (Base Salary in PKR)
  base_salary: { type: DataTypes.INTEGER, defaultValue: 75000 }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;