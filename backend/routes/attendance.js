const router = require('express').Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Leave = require('../models/Leave');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper to extract clean Client IP
const getClientIp = (req) => {
  let ip = req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.socket?.remoteAddress ||
           req.connection?.remoteAddress ||
           '127.0.0.1';

  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  ip = ip.replace(/^.*:/, '').replace('::ffff:', '').trim();
  if (!ip || ip === '1' || ip === '') ip = '127.0.0.1';
  return ip;
};

// Helper: check if today is Friday or Saturday (0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat)
const isOfficialOffDay = (dateStr) => {
  const dateObj = dateStr ? new Date(dateStr) : new Date();
  const day = dateObj.getDay();
  return day === 5 || day === 6; // Friday or Saturday
};

// Helper: validate office static IP
const validateOfficeIp = (clientIp) => {
  const allowedIpsStr = process.env.OFFICE_STATIC_IP || process.env.OFFICE_IP || '192.168.1.100,127.0.0.1,::1';
  const allowedIps = allowedIpsStr.split(',').map(s => s.trim().replace(/^.*:/, '').replace('::ffff:', ''));

  const enforce = process.env.ENFORCE_OFFICE_IP !== 'false';
  if (!enforce) return { allowed: true, allowedIps };

  const isAllowed = allowedIps.includes(clientIp) || clientIp === '127.0.0.1' || clientIp === 'localhost';
  return { allowed: isAllowed, allowedIps };
};

// NEW Helper: Convert standard time string (e.g., "10:45:00 AM") to total minutes for calculation
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(/[:\s]/);
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10) || 0;
  const isPM = /PM/i.test(timeStr);
  const isAM = /AM/i.test(timeStr);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

// Network status endpoint
router.get('/network-status', authenticateToken, (req, res) => {
  const clientIp = getClientIp(req);
  const { allowed, allowedIps } = validateOfficeIp(clientIp);
  const today = new Date().toISOString().split('T')[0];
  const isWeekend = isOfficialOffDay(today);

  res.json({
    clientIp,
    allowedIps,
    isOfficeNetwork: allowed,
    isWeekendOffDay: isWeekend,
    serverTime: new Date().toLocaleTimeString(),
    todayDate: today
  });
});

// Employee Check-In
router.post('/check-in', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientIp = getClientIp(req);
    const today = new Date().toISOString().split('T')[0];

    if (isOfficialOffDay(today)) {
      return res.status(403).json({
        error: 'Check-in is disabled today: Friday and Saturday are official off-days for Tamkeen IT Services.'
      });
    }

    const { allowed, allowedIps } = validateOfficeIp(clientIp);
    if (!allowed) {
      return res.status(403).json({
        error: `Access Denied: You must be connected to office WiFi. Your IP: ${clientIp}. Allowed: ${allowedIps.join(', ')}`
      });
    }

    const existing = await Attendance.findOne({ where: { userId, date: today } });
    if (existing) {
      return res.status(400).json({ error: `You have already checked in today at ${existing.check_in_time}.` });
    }

    // Format time explicitly with en-US to guarantee AM/PM layout for regex
    const check_in_time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // --- 10:45 AM Grace Period Logic ---
    const currentTotalMinutes = parseTimeToMinutes(check_in_time);
    const GRACE_PERIOD_LIMIT = 645; // 10:45 AM = (10 * 60) + 45
    
    let checkInStatus = 'Present';
    if (currentTotalMinutes > GRACE_PERIOD_LIMIT) {
      checkInStatus = 'Half-Day';
    }

    const attendance = await Attendance.create({
      userId,
      date: today,
      check_in_time,
      client_ip: clientIp,
      status: checkInStatus
    });

    res.status(201).json({ message: `✓ Checked in successfully on Office Static Network! Status: ${checkInStatus}`, attendance });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Server error during check-in' });
  }
});

// Employee Check-Out
router.post('/check-out', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (isOfficialOffDay(today)) {
      return res.status(403).json({ error: 'Check-out is disabled: Friday and Saturday are official off-days.' });
    }

    const attendance = await Attendance.findOne({ where: { userId, date: today } });
    if (!attendance) {
      return res.status(400).json({ error: 'No active check-in record found for today.' });
    }

    if (attendance.check_out_time) {
      return res.status(400).json({ error: `Already checked out today at ${attendance.check_out_time}.` });
    }

    const check_out_time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let checkInMin = parseTimeToMinutes(attendance.check_in_time);
    let checkOutMin = parseTimeToMinutes(check_out_time);

    if (checkOutMin < checkInMin) checkOutMin += 24 * 60;

    const elapsedMinutes = Math.max(1, checkOutMin - checkInMin);
    const totalHoursFloat = parseFloat((elapsedMinutes / 60).toFixed(2));
    const hoursPart = Math.floor(elapsedMinutes / 60);
    const minsPart = elapsedMinutes % 60;
    const formattedHours = `${hoursPart}h ${minsPart}m`;

    // --- Extra Time Logic (After 7:30 PM) ---
    const SHIFT_END_MINUTES = 1170; // 7:30 PM = (19 * 60) + 30
    let extraTimeFormatted = "-";

    if (checkOutMin > SHIFT_END_MINUTES) {
      const extraMinutes = checkOutMin - SHIFT_END_MINUTES;
      const extraHrs = Math.floor(extraMinutes / 60);
      const extraMins = extraMinutes % 60;
      extraTimeFormatted = extraHrs > 0 ? `${extraHrs}h ${extraMins}m` : `${extraMins}m`;
    }

    attendance.check_out_time = check_out_time;
    attendance.total_hours = totalHoursFloat;
    attendance.total_hours_formatted = formattedHours;
    attendance.extra_time = extraTimeFormatted;
    await attendance.save();

    res.json({ message: `✓ Checked out! Total working time: ${formattedHours}. Extra time logged: ${extraTimeFormatted}`, attendance });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'Server error during check-out' });
  }
});

// Get today's status
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const clientIp = getClientIp(req);
    const isWeekend = isOfficialOffDay(today);

    const attendance = await Attendance.findOne({ where: { userId, date: today } });

    res.json({
      today,
      isWeekend,
      clientIp,
      attendance: attendance || null,
      isCheckedIn: !!attendance,
      isCheckedOut: !!(attendance && attendance.check_out_time)
    });
  } catch (err) {
    console.error('Today attendance error:', err);
    res.status(500).json({ error: 'Failed to retrieve today attendance' });
  }
});

// Get personal history
router.get('/my-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const records = await Attendance.findAll({
      where: { userId },
      order: [['date', 'DESC'], ['id', 'DESC']],
      limit: 30
    });
    res.json(records);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// HR / Manager / CEO Dashboard Stats Overview
router.get('/stats', authenticateToken, requireRole('HR', 'Manager', 'CEO'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalEmployees = await User.count({ where: { role: 'Employee', isActive: true } });
    const todayPresent = await Attendance.count({ where: { date: today } });
    const todayCheckedOut = await Attendance.count({
      where: {
        date: today,
        check_out_time: { [Op.ne]: null }
      }
    });

    const pendingLeaves = await Leave.count({ where: { status: 'Pending' } });

    res.json({
      totalEmployees,
      todayPresent,
      todayCheckedOut,
      pendingLeaves,
      todayDate: today,
      isWeekend: isOfficialOffDay(today)
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// HR & CEO ONLY: Edit/Update Employee Attendance Record
router.put('/update/:id', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in_time, check_out_time, status } = req.body;

    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }

    if (check_in_time !== undefined) attendance.check_in_time = check_in_time;
    if (check_out_time !== undefined) attendance.check_out_time = check_out_time;
    if (status) attendance.status = status;

    // Recalculate total hours and extra time if both check-in and check-out exist
    if (attendance.check_in_time && attendance.check_out_time) {
      let checkInMin = parseTimeToMinutes(attendance.check_in_time);
      let checkOutMin = parseTimeToMinutes(attendance.check_out_time);

      if (checkOutMin < checkInMin) checkOutMin += 24 * 60;

      const elapsedMinutes = Math.max(1, checkOutMin - checkInMin);
      attendance.total_hours = parseFloat((elapsedMinutes / 60).toFixed(2));
      const hoursPart = Math.floor(elapsedMinutes / 60);
      const minsPart = elapsedMinutes % 60;
      attendance.total_hours_formatted = `${hoursPart}h ${minsPart}m`;

      // Recalculate Extra Time for manual edits
      const SHIFT_END_MINUTES = 1170; // 7:30 PM
      let extraTimeFormatted = "-";

      if (checkOutMin > SHIFT_END_MINUTES) {
        const extraMinutes = checkOutMin - SHIFT_END_MINUTES;
        const extraHrs = Math.floor(extraMinutes / 60);
        const extraMins = extraMinutes % 60;
        extraTimeFormatted = extraHrs > 0 ? `${extraHrs}h ${extraMins}m` : `${extraMins}m`;
      }
      attendance.extra_time = extraTimeFormatted;
    }

    await attendance.save();
    res.json({ message: 'Attendance record updated successfully!', attendance });
  } catch (err) {
    console.error('Update attendance error:', err);
    res.status(500).json({ error: 'Failed to update attendance record' });
  }
});

module.exports = router;