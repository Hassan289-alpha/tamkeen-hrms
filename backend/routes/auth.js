const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// HR & CEO ONLY: Register a new employee (With optional Document upload & Compulsory DOB)
router.post('/register', authenticateToken, requireRole('HR', 'CEO'), upload.single('document'), async (req, res) => {
  try {
    const { name, email, password, role, department, position, base_salary, date_of_birth } = req.body;
    
    if (!name || !email || !password || !date_of_birth) {
      return res.status(400).json({ error: 'Name, email, password, and date of birth are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const document_url = req.file ? `/uploads/${req.file.filename}` : null;

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Employee',
      department: department || 'Engineering',
      position: position || 'Staff Member',
      base_salary: base_salary ? Number(base_salary) : 75000,
      date_of_birth, // Saved to database
      sick_leave_balance: 10,
      casual_leave_balance: 10,
      annual_leave_balance: 15,
      document_url
    });

    res.status(201).json({ message: 'Employee added successfully', user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration: ' + err.message });
  }
});

// HR & CEO ONLY: Delete an employee
router.delete('/users/:id', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'CEO') return res.status(403).json({ error: 'Cannot delete CEO account' });
    
    await user.destroy();
    res.json({ message: 'Employee removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// PUBLIC: Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Invalid credentials.' });
    
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.password);
    } else {
        isMatch = (password === user.password); // Fallback for hardcoded seed users
    }

    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
  }
});

// PROTECTED: Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] }});
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// HR & CEO ONLY: Get all users
router.get('/users', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['id', 'DESC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// HR & CEO ONLY: Update an employee & Handle Password Reset
router.put('/users/:id', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const { name, email, department, base_salary, date_of_birth, password } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.department = department || user.department;
    user.base_salary = base_salary !== undefined ? Number(base_salary) : user.base_salary;
    user.date_of_birth = date_of_birth || user.date_of_birth;

    // Check if a new password was provided in the update form
    if (password && password.trim() !== '') {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({ message: 'Employee updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});
// PROTECTED: Employee/HR Self-Service Password Change
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(currentPassword, user.password);
    } else {
        isMatch = (currentPassword === user.password); 
    }

    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password.' });

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});
module.exports = router;