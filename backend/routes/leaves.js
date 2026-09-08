const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Employee: Submit Leave Request (With Balance Validation)
router.post('/apply', authenticateToken, upload.single('proof'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { leave_type, start_date, end_date, days, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !days || !reason) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const requestedDays = parseInt(days, 10);
    
    // 1. Fetch the user to check their current balances
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 2. Check the requested balance against the user's available balance
    let availableBalance = 0;
    if (leave_type.includes('Casual')) {
      availableBalance = user.casual_leave_balance;
    } else if (leave_type.includes('Sick')) {
      availableBalance = user.sick_leave_balance;
    } else if (leave_type.includes('Annual')) {
      availableBalance = user.annual_leave_balance;
    }

    // 3. Block submission if requesting too many days
    if (requestedDays > availableBalance) {
      return res.status(400).json({ 
        error: `Insufficient balance. You only have ${availableBalance} days of ${leave_type} remaining.` 
      });
    }

    const proof_document = req.file ? `/uploads/${req.file.filename}` : null;

    const newLeave = await Leave.create({
      userId,
      leave_type,
      start_date,
      end_date,
      days: requestedDays,
      reason,
      status: 'Pending',
      proof_document
    });

    res.status(201).json({ message: 'Leave request submitted successfully', leave: newLeave });
  } catch (err) {
    console.error('Leave application error:', err);
    res.status(500).json({ error: 'Failed to submit leave application' });
  }
});

// HR / CEO: Approve or Reject Leave Request
router.put('/:id/status', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    // Extract both status and rejection_reason from the frontend request
    const { status, rejection_reason } = req.body; 
    const leave = await Leave.findByPk(req.params.id);

    if (!leave) return res.status(404).json({ error: 'Leave request not found.' });

    if (status === 'Approved' && leave.status !== 'Approved') {
      const user = await User.findByPk(leave.userId);
      if (user) {
        if (leave.leave_type === 'Sick' && user.sick_leave_balance >= leave.days) {
          user.sick_leave_balance -= leave.days;
        } else if (leave.leave_type === 'Casual' && user.casual_leave_balance >= leave.days) {
          user.casual_leave_balance -= leave.days;
        } else if (leave.leave_type === 'Annual' && user.annual_leave_balance >= leave.days) {
          user.annual_leave_balance -= leave.days;
        }
        await user.save();
      }
    }

    leave.status = status;
    
    // If rejected, save the reason to the database
    if (status === 'Rejected' && rejection_reason) {
      leave.rejection_reason = rejection_reason;
    }

    await leave.save();

    res.json({ message: `Leave status updated to ${status}`, leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// Get user leaves or all leaves for HR
router.get('/my-leaves', authenticateToken, async (req, res) => {
  try {
    const leaves = await Leave.findAll({ where: { userId: req.user.id }, order: [['id', 'DESC']] });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personal leave history' });
  }
});

router.get('/all', authenticateToken, requireRole('HR', 'CEO', 'Manager'), async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email', 'department'] }],
      order: [['id', 'DESC']]
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch all leave applications' });
  }
});

// HR / CEO: Get all pending leave requests
router.get('/pending', authenticateToken, requireRole('HR', 'CEO', 'Manager'), async (req, res) => {
  try {
    const pendingLeaves = await Leave.findAll({
      where: { status: 'Pending' },
      include: [{ model: User, attributes: ['id', 'name', 'email', 'department'] }],
      order: [['id', 'DESC']]
    });
    res.json(pendingLeaves);
  } catch (err) {
    console.error('Pending leaves error:', err);
    res.status(500).json({ error: 'Failed to fetch pending leaves' });
  }
});
module.exports = router;