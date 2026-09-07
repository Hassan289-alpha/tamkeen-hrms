const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// Paginated monthly attendance & leave query for HR / Manager Dashboard
router.get('/monthly', authenticateToken, requireRole('HR', 'Manager', 'CEO'), async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = (page - 1) * limit;
    const month = req.query.month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const search = req.query.search ? req.query.search.trim() : '';

    // Hide future dates (e.g., announced holidays in advance) from the attendance log
    const today = new Date().toISOString().split('T')[0];

    const whereClause = {
      date: { 
        [Op.like]: `${month}%`,
        [Op.lte]: today // Restricts output to today or earlier
      }
    };

    const userWhere = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows: attendanceRecords } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        where: userWhere,
        attributes: ['id', 'name', 'email', 'department', 'position']
      }],
      order: [['date', 'DESC'], ['id', 'DESC']],
      limit,
      offset
    });

    // Also get monthly leave summary for the month
    const leavesThisMonth = await Leave.findAll({
      where: {
        start_date: { [Op.like]: `${month}%` },
        status: 'Approved'
      },
      include: [{ model: User, attributes: ['name', 'department'] }]
    });

    res.json({
      records: attendanceRecords,
      totalCount: count,
      totalPages: Math.ceil(count / limit) || 1,
      currentPage: page,
      month,
      monthlyLeavesCount: leavesThisMonth.length,
      leavesThisMonth
    });
  } catch (error) {
    console.error('Monthly reports error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly report data' });
  }
});


// Export Individual Employee Excel (with monthly subsheets)
router.get('/export-employee/:id/excel', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get all attendance for this user, ordered oldest to newest
    const records = await Attendance.findAll({
      where: { userId: user.id },
      order: [['date', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tamkeen IT Services HR Portal';
    
    // Group records by Month (YYYY-MM)
    const recordsByMonth = {};
    records.forEach(rec => {
      const month = rec.date.substring(0, 7);
      if (!recordsByMonth[month]) recordsByMonth[month] = [];
      recordsByMonth[month].push(rec);
    });

    // Create a subsheet for each month
    for (const [month, monthRecords] of Object.entries(recordsByMonth)) {
      const sheet = workbook.addWorksheet(`Attendance ${month}`);
      
      // Header Formatting
      sheet.mergeCells('A1:E1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `TAMKEEN IT SERVICES - ${user.name.toUpperCase()} (${month})`;
      titleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 25;

      sheet.addRow([]); // spacer

      // Column definitions
      sheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Check-In', key: 'in', width: 18 },
        { header: 'Check-Out', key: 'out', width: 18 },
        { header: 'Total Hrs', key: 'hrs', width: 15 },
        { header: 'Status', key: 'status', width: 18 }
      ];
      
      const headerRow = sheet.getRow(3);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };

      monthRecords.forEach(rec => {
        sheet.addRow({
          date: rec.date,
          in: rec.check_in_time || '-',
          out: rec.check_out_time || '-',
          hrs: rec.total_hours_formatted || '-',
          status: rec.status
        });
      });
    }

    if (Object.keys(recordsByMonth).length === 0) {
      workbook.addWorksheet('No Data').addRow(['No attendance records found for this employee.']);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${user.name.replace(/\s+/g, '_')}_Attendance_History.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate Excel' });
  }
});

// Export Individual Employee PDF (With Full Branded Layout)
router.get('/export-employee/:id/pdf', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const records = await Attendance.findAll({
      where: { userId: user.id },
      order: [['date', 'DESC']],
      limit: 60 // Limit to last 60 days
    });

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${user.name.replace(/\s+/g, '_')}_Attendance_Report.pdf`);
    doc.pipe(res);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;
    const logoPath = path.join(__dirname, '../../frontend/public/tamkeen-logo.png');

    // ==========================================
    // 1. BRANDED HEADER
    // ==========================================
    doc.fillColor('#1e3a8a').polygon([0, 0], [220, 0], [60, 160], [0, 160]).fill();
    doc.fillColor('#0284c7').polygon([0, 0], [100, 0], [0, 100]).fill();
    doc.fillColor('#38bdf8').polygon([0, 100], [30, 100], [0, 130]).fill();

    doc.fillColor('#1e3a8a').fontSize(26).font('Helvetica-Bold').text('TAMKEEN IT SERVICES', 140, 50);
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Artificial Intelligence | Robotic Process Automation | Cybersecurity', 142, 80);
    doc.moveTo(140, 110).lineTo(400, 110).strokeColor('#1e3a8a').lineWidth(2).stroke();
    doc.circle(400, 110, 4).fill('#1e3a8a');

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 430, 30, { width: 110 });
      doc.save().globalAlpha(0.06).image(logoPath, 147, 300, { width: 300 }).restore(); // Watermark
    }

    // ==========================================
    // 2. EMPLOYEE DETAILS
    // ==========================================
    let currY = 170;
    doc.fillColor('#0284c7').fontSize(16).font('Helvetica-Bold').text(`Official Attendance Report`, margin, currY);
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text('Showing up to the last 60 days of recorded attendance log.', margin, currY + 20);
    currY += 50;

    doc.fillColor('#f8fafc').rect(margin, currY, pageWidth - (margin * 2), 55).fill();
    doc.lineWidth(1).strokeColor('#e2e8f0').rect(margin, currY, pageWidth - (margin * 2), 55).stroke();
    
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('EMPLOYEE DETAILS', margin + 15, currY + 12);
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11).text(user.name, margin + 15, currY + 30);
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('DEPARTMENT', margin + 250, currY + 12);
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11).text(user.department || '-', margin + 250, currY + 30);
    currY += 80;

    // ==========================================
    // 3. DATA TABLE
    // ==========================================
    doc.fillColor('#bae6fd').rect(margin, currY, pageWidth - (margin * 2), 25).fill();
    doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(9);
    doc.text('Date', margin + 10, currY + 8);
    doc.text('Check-In', margin + 100, currY + 8);
    doc.text('Check-Out', margin + 200, currY + 8);
    doc.text('Total Hrs', margin + 300, currY + 8);
    doc.text('Status', margin + 400, currY + 8);
    currY += 25;

    doc.font('Helvetica').fontSize(9);
    records.forEach((rec, idx) => {
      if (currY > pageHeight - 100) {
        doc.addPage({ size: 'A4', margin: 0 });
        if (fs.existsSync(logoPath)) doc.save().globalAlpha(0.06).image(logoPath, 147, 300, { width: 300 }).restore();
        currY = 50;
      }
      
      if (idx % 2 === 0) doc.fillColor('#f8fafc').rect(margin, currY, pageWidth - (margin * 2), 20).fill();
      
      doc.fillColor('#1e293b');
      doc.text(rec.date, margin + 10, currY + 6);
      doc.text(rec.check_in_time || '-', margin + 100, currY + 6);
      doc.text(rec.check_out_time || '-', margin + 200, currY + 6);
      doc.text(rec.total_hours_formatted || '-', margin + 300, currY + 6);
      
      // Color-code status
      if (rec.status === 'Absent') doc.fillColor('#ef4444');
      else if (rec.status === 'Holiday') doc.fillColor('#6366f1');
      else if (rec.status === 'Present') doc.fillColor('#10b981');
      doc.text(rec.status, margin + 400, currY + 6);

      currY += 20;
    });

    // ==========================================
    // 4. FOOTER
    // ==========================================
    const footerY = pageHeight - 50;
    doc.moveTo(0, footerY - 15).lineTo(pageWidth, footerY - 15).strokeColor('#0ea5e9').lineWidth(4).stroke();
    doc.moveTo(150, footerY - 15).lineTo(300, footerY - 15).strokeColor('#1e3a8a').lineWidth(6).stroke();

    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
    doc.text('Lahore, Pakistan', 100, footerY);
    doc.moveTo(230, footerY - 2).lineTo(230, footerY + 10).strokeColor('#cbd5e1').lineWidth(1).stroke();
    doc.text('+92 325 6541677', 260, footerY);
    doc.moveTo(380, footerY - 2).lineTo(380, footerY + 10).strokeColor('#cbd5e1').lineWidth(1).stroke();
    doc.text('samibilal@hotmail.com', 410, footerY);

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});


// Export Attendance & Leave Report as Excel (.xlsx) - DYNAMIC MULTI-SHEET WITH BRANDING (Company Wide)
router.get('/export-excel', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const attendanceRecords = await Attendance.findAll({
      include: [{ model: User, attributes: ['name', 'email', 'department', 'position', 'role'] }],
      order: [['date', 'ASC']]
    });

    const leaveRecords = await Leave.findAll({
      include: [{ model: User, attributes: ['name', 'email', 'department'] }],
      order: [['start_date', 'DESC']]
    });

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({ error: "No attendance data found to export." });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tamkeen IT Services HR Portal';
    workbook.created = new Date();

    const groupedData = {};
    attendanceRecords.forEach(record => {
      const dateObj = new Date(record.date);
      const monthYear = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }); 
      
      if (!groupedData[monthYear]) {
        groupedData[monthYear] = [];
      }
      groupedData[monthYear].push(record);
    });

    // Create Subsheets with Brand Headers for each month
    for (const [monthName, monthRecords] of Object.entries(groupedData)) {
      const sheet = workbook.addWorksheet(`Attendance - ${monthName}`);

      // 1. Branded Title Block
      sheet.mergeCells('A1:H1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'TAMKEEN IT SERVICES - EXECUTIVE HRMS REPORT';
      titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF844FC1' } }; // Tamkeen Purple
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 28;

      sheet.mergeCells('A2:H2');
      const subCell = sheet.getCell('A2');
      subCell.value = `Monthly Attendance & Work Record — ${monthName} (Authorized Corporate Export)`;
      subCell.font = { italic: true, size: 10, color: { argb: 'FF475569' } };
      subCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(2).height = 20;

      sheet.addRow([]); // Spacer row

      // 2. Table Headers (Row 4)
      const headerRow = sheet.addRow(['Date', 'Employee', 'Department', 'Check-In', 'Check-Out', 'Total Hrs', 'Extra Time', 'Status']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo accent
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 24;

      // Set column widths
      sheet.columns = [
        { width: 15 }, { width: 25 }, { width: 22 }, { width: 15 },
        { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
      ];

      // 3. Write targeted row data
      monthRecords.forEach(rec => {
        const row = sheet.addRow([
          rec.date,
          rec.User?.name || 'Unknown',
          rec.User?.department || '-',
          rec.check_in_time || '-',
          rec.check_out_time || '-',
          rec.total_hours_formatted || '-',
          rec.extra_time || '-',
          rec.status
        ]);
        row.alignment = { vertical: 'middle' };
      });
    }

    // Create overarching "All Leaves" Sheet at the end with Branding
    const sheetLeaves = workbook.addWorksheet('All Leaves Log');
    
    sheetLeaves.mergeCells('A1:G1');
    const leaveTitle = sheetLeaves.getCell('A1');
    leaveTitle.value = 'TAMKEEN IT SERVICES - MASTER LEAVE AUDIT LOG';
    leaveTitle.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
    leaveTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald Green
    leaveTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    sheetLeaves.getRow(1).height = 28;

    sheetLeaves.mergeCells('A2:G2');
    sheetLeaves.getCell('A2').value = 'Complete record of employee leave applications and status approvals';
    sheetLeaves.getCell('A2').font = { italic: true, size: 10, color: { argb: 'FF475569' } };
    sheetLeaves.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
    sheetLeaves.getRow(2).height = 20;

    sheetLeaves.addRow([]);

    const leaveHeader = sheetLeaves.addRow(['Employee Name', 'Department', 'Leave Category', 'Start Date', 'End Date', 'Days', 'Status']);
    leaveHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    leaveHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    leaveHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    leaveHeader.height = 24;

    sheetLeaves.columns = [
      { width: 25 }, { width: 20 }, { width: 18 },
      { width: 15 }, { width: 15 }, { width: 10 }, { width: 15 }
    ];

    leaveRecords.forEach(l => {
      sheetLeaves.addRow([
        l.User?.name || 'Unknown',
        l.User?.department || 'General',
        l.leave_type,
        l.start_date,
        l.end_date,
        l.days,
        l.status
      ]);
    });

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`Tamkeen_HR_Report.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel Export error:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Export Attendance Report as PDF (.pdf) (Company Wide)
router.get('/export-pdf', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    const attendanceRecords = await Attendance.findAll({
      where: { date: { [Op.like]: `${month}%` } },
      include: [{ model: User, attributes: ['name', 'email', 'department'] }],
      order: [['date', 'DESC']],
      limit: 100
    });

    const doc = new PDFDocument({ margin: 36, size: 'A4' });

    res.header('Content-Type', 'application/pdf');
    res.attachment(`Tamkeen_Attendance_Report_${month}.pdf`);
    doc.pipe(res);

    // Header Branding
    doc.rect(36, 36, 523, 60).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('Tamkeen IT Services', 50, 48);
    doc.fillColor('#94a3b8').fontSize(11).font('Helvetica').text(`Monthly Attendance & HR Audit Report — ${month}`, 50, 72);

    doc.moveDown(3);
    doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('Official Work Policy & Off-Days:', 36, 115);
    doc.fontSize(10).font('Helvetica').fillColor('#475569').text('• Official Off-Days: Friday and Saturday (automatically excluded from absence count).', 36, 130);
    doc.text(`• Total Attendance Entries Recorded: ${attendanceRecords.length}`, 36, 145);

    // Table Header
    const tableTop = 175;
    doc.rect(36, tableTop, 523, 22).fill('#2563eb');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('Employee', 42, tableTop + 6);
    doc.text('Department', 150, tableTop + 6);
    doc.text('Date', 240, tableTop + 6);
    doc.text('In', 310, tableTop + 6);
    doc.text('Out', 360, tableTop + 6);
    doc.text('Hrs', 420, tableTop + 6);
    doc.text('Overtime', 470, tableTop + 6);

    let currentY = tableTop + 24;
    doc.font('Helvetica').fontSize(8);

    attendanceRecords.forEach((rec, idx) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
      }

      if (idx % 2 === 0) {
        doc.rect(36, currentY, 523, 18).fill('#f8fafc');
      }

      doc.fillColor('#0f172a');
      doc.text(rec.User?.name || 'Unknown', 42, currentY + 4, { width: 100, ellipsis: true });
      doc.text(rec.User?.department || 'Staff', 150, currentY + 4, { width: 80, ellipsis: true });
      doc.text(rec.date, 240, currentY + 4);
      doc.text(rec.check_in_time || '-', 310, currentY + 4);
      doc.text(rec.check_out_time || 'Pending', 360, currentY + 4);
      doc.text(rec.total_hours_formatted || (rec.total_hours ? `${rec.total_hours}h` : '-'), 420, currentY + 4);
      doc.text(rec.extra_time || '-', 470, currentY + 4);

      currentY += 18;
    });

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').text(`Generated on ${new Date().toLocaleString()} | Tamkeen HRMS Portal`, 36, 790, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('PDF Export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

module.exports = router;