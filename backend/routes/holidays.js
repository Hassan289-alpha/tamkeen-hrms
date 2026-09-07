const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Holiday = require('../models/Holiday');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all holidays
router.get('/', authenticateToken, async (req, res) => {
  try {
    const holidays = await Holiday.findAll({ order: [['start_date', 'DESC']] });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// POST new holiday & Auto-fill Attendance
router.post('/announce', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const { title, start_date, end_date, description } = req.body;
    const holiday = await Holiday.create({ title, start_date, end_date, description });

    const dates = [];
    let curr = new Date(start_date);
    const last = new Date(end_date);
    while (curr <= last) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const employees = await User.findAll({ where: { role: 'Employee' } });
    const attendanceRecords = [];
    for (const emp of employees) {
      for (const date of dates) {
        const existing = await Attendance.findOne({ where: { userId: emp.id, date } });
        if (!existing) {
          attendanceRecords.push({ userId: emp.id, date: date, check_in_time: 'Holiday', check_out_time: 'Holiday', status: 'Holiday', total_hours_formatted: '0h 0m' });
        } else {
          await existing.update({ status: 'Holiday', check_in_time: 'Holiday', check_out_time: 'Holiday' });
        }
      }
    }
    if (attendanceRecords.length > 0) await Attendance.bulkCreate(attendanceRecords);

    res.status(201).json({ message: 'Holiday announced & attendance updated to prevent deductions!', holiday });
  } catch (err) {
    res.status(500).json({ error: 'Failed to announce holiday' });
  }
});

// PUT update a holiday
router.put('/:id', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const { title, start_date, end_date, description } = req.body;
    const holiday = await Holiday.findByPk(req.params.id);
    if (!holiday) return res.status(404).json({ error: 'Holiday not found' });

    // 1. Remove old attendance records
    const oldDates = [];
    let currOld = new Date(holiday.start_date);
    const lastOld = new Date(holiday.end_date);
    while (currOld <= lastOld) {
      oldDates.push(currOld.toISOString().split('T')[0]);
      currOld.setDate(currOld.getDate() + 1);
    }
    await Attendance.destroy({ where: { date: { [Op.in]: oldDates }, status: 'Holiday' } });

    // 2. Update holiday
    await holiday.update({ title, start_date, end_date, description });

    // 3. Inject new attendance records
    const newDates = [];
    let currNew = new Date(start_date);
    const lastNew = new Date(end_date);
    while (currNew <= lastNew) {
      newDates.push(currNew.toISOString().split('T')[0]);
      currNew.setDate(currNew.getDate() + 1);
    }

    const employees = await User.findAll({ where: { role: 'Employee' } });
    const attendanceRecords = [];
    for (const emp of employees) {
      for (const date of newDates) {
        const existing = await Attendance.findOne({ where: { userId: emp.id, date } });
        if (!existing) {
          attendanceRecords.push({ userId: emp.id, date: date, check_in_time: 'Holiday', check_out_time: 'Holiday', status: 'Holiday', total_hours_formatted: '0h 0m' });
        } else {
          await existing.update({ status: 'Holiday', check_in_time: 'Holiday', check_out_time: 'Holiday' });
        }
      }
    }
    if (attendanceRecords.length > 0) await Attendance.bulkCreate(attendanceRecords);

    res.json({ message: 'Holiday updated successfully', holiday });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update holiday' });
  }
});

// DELETE a holiday and clean up Attendance table
router.delete('/:id', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const holiday = await Holiday.findByPk(req.params.id);
    if (!holiday) return res.status(404).json({ error: 'Holiday not found' });

    const dates = [];
    let curr = new Date(holiday.start_date);
    const last = new Date(holiday.end_date);
    while (curr <= last) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    await Attendance.destroy({ where: { date: { [Op.in]: dates }, status: 'Holiday' } });
    await holiday.destroy();

    res.json({ message: 'Holiday and associated attendance records removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

module.exports = router;