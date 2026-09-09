const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// GET /api/payroll/my-payslips (Employee portal)
router.get('/my-payslips', authenticateToken, async (req, res) => {
  try {
    const payslips = await Payroll.findAll({
      where: { userId: req.user.id },
      order: [['month', 'DESC']]
    });
    res.json(payslips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// GET /api/payroll/generate/:month (HR / CEO portal)
router.get('/generate/:month', authenticateToken, requireRole('HR', 'CEO'), async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM
    const users = await User.findAll({ where: { role: 'Employee' } });

    const payrollRecords = [];

    for (const user of users) {
      let payroll = await Payroll.findOne({ where: { userId: user.id, month } });

      if (!payroll) {
        const absentCount = await Attendance.count({
          where: {
            userId: user.id,
            date: { [Op.like]: `${month}-%` },
            status: 'Absent'
          }
        });

        const dailyWage = user.base_salary / 30;
        const deductions = Math.round(absentCount * dailyWage);
        const netPayable = user.base_salary - deductions;

        payroll = await Payroll.create({
          userId: user.id,
          month,
          base_salary: user.base_salary,
          unpaid_leaves: absentCount,
          deductions,
          bonus: 0,
          net_payable: netPayable,
          status: 'Draft'
        });
      }
      
      payroll = await Payroll.findByPk(payroll.id, { include: [User] });
      payrollRecords.push(payroll);
    }

    res.json(payrollRecords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate payroll' });
  }
});

// PUT /api/payroll/update/:id (HR ONLY)
router.put('/update/:id', authenticateToken, requireRole('HR'), async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(req.params.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });

    const { base_salary, unpaid_leaves, deductions, bonus, status } = req.body;

    const net_payable = Number(base_salary || payroll.base_salary) 
                      - Number(deductions !== undefined ? deductions : payroll.deductions) 
                      + Number(bonus !== undefined ? bonus : payroll.bonus);

    await payroll.update({
      base_salary: base_salary || payroll.base_salary,
      unpaid_leaves: unpaid_leaves !== undefined ? unpaid_leaves : payroll.unpaid_leaves,
      deductions: deductions !== undefined ? deductions : payroll.deductions,
      bonus: bonus !== undefined ? bonus : payroll.bonus,
      net_payable,
      status: status || payroll.status
    });

    res.json({ message: 'Payroll updated successfully', payroll });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payroll' });
  }
});

// PUT /api/payroll/approve-all (HR ONLY)
router.put('/approve-all', authenticateToken, requireRole('HR'), async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) return res.status(400).json({ error: 'Month is required' });

    const [updatedCount] = await Payroll.update(
      { status: 'Approved & Paid' },
      { where: { month: month, status: 'Draft' } }
    );

    res.json({ message: `Successfully approved & finalized ${updatedCount} payroll records!` });
  } catch (error) {
    console.error('Approve all error:', error);
    res.status(500).json({ error: 'Failed to approve payrolls' });
  }
});

// GET /payslip/:id/pdf - Generate Highly Styled Branded PDF
router.get('/payslip/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const payroll = await Payroll.findByPk(req.params.id, { include: [User] });
    if (!payroll) return res.status(404).json({ error: 'Payslip not found' });

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payslip_${payroll.month}_${payroll.User.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;

    const logoPath = path.join(__dirname, '../../frontend/public/tamkeen-logo.png');

    // ==========================================
    // 1. EXACT LETTERHEAD HEADER GEOMETRY
    // ==========================================
    
    // Top Left Overlapping Geometric Shapes
    // Main Dark Blue Wedge
    doc.fillColor('#102b4e').moveTo(0, 0).lineTo(160, 0).lineTo(40, 190).lineTo(0, 190).fill();
    // Cyan/Teal Stripe
    doc.fillColor('#2a8296').moveTo(160, 0).lineTo(180, 0).lineTo(60, 190).lineTo(40, 190).fill();
    // Thin Dark Blue Stripe
    doc.fillColor('#102b4e').moveTo(180, 0).lineTo(190, 0).lineTo(70, 190).lineTo(60, 190).fill();

    // Company Name & Subtitle
    doc.fillColor('#102b4e').fontSize(22).font('Helvetica-Bold').text('TAMKEEN IT SERVICES', 130, 45);
    doc.fillColor('#52525b').fontSize(8).font('Helvetica').text('Artificial Intelligence | Robotic Process Automation | Cybersecurity', 132, 72);
    
    // Underline with Circle Dot
    doc.moveTo(130, 90).lineTo(380, 90).strokeColor('#102b4e').lineWidth(1.5).stroke();
    doc.circle(380, 90, 3).fill('#102b4e');

    // Right Aligned Large Logo
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 420, 20, { width: 140 }); 
    }

    // ==========================================
    // 2. CENTER WATERMARK
    // ==========================================
    if (fs.existsSync(logoPath)) {
      doc.save()
         .opacity(0.08)
         .image(logoPath, 147, 280, { width: 300 })
         .restore();
    }

    // ==========================================
    // 3. PAYSLIP CONTENT
    // ==========================================
    let currY = 140;
    
    // Title
    doc.fillColor('#1e293b').fontSize(16).font('Helvetica-Bold').text('Official Payslip Statement', 0, currY, { align: 'center' });
    currY += 40;

    // Employee Box Content
    doc.fillColor('#f8fafc').rect(margin, currY, pageWidth - (margin * 2), 70).fill();
    doc.lineWidth(1).strokeColor('#e2e8f0').rect(margin, currY, pageWidth - (margin * 2), 70).stroke();
    
    doc.fillColor('#102b4e').font('Helvetica-Bold').fontSize(11).text('Employee Name:', margin + 15, currY + 15);
    doc.fillColor('#475569').font('Helvetica').fontSize(11).text(payroll.User.name, margin + 110, currY + 15);

    doc.fillColor('#102b4e').font('Helvetica-Bold').fontSize(11).text('Email Address:', margin + 15, currY + 35);
    doc.fillColor('#475569').font('Helvetica').fontSize(11).text(payroll.User.email, margin + 110, currY + 35);

    doc.fillColor('#102b4e').font('Helvetica-Bold').fontSize(11).text('Department:', pageWidth / 2, currY + 15);
    doc.fillColor('#475569').font('Helvetica').fontSize(11).text(payroll.User.department, (pageWidth / 2) + 75, currY + 15);

    doc.fillColor('#102b4e').font('Helvetica-Bold').fontSize(11).text('Pay Period:', pageWidth / 2, currY + 35);
    doc.fillColor('#475569').font('Helvetica').fontSize(11).text(payroll.month, (pageWidth / 2) + 75, currY + 35);

    currY += 100;

    // ==========================================
    // 4. PAYROLL BREAKDOWN TABLE
    // ==========================================
    doc.fillColor('#2a8296').fontSize(11).font('Helvetica-Bold').text('EARNINGS & DEDUCTIONS', margin, currY);
    currY += 15;

    // Table Header
    doc.fillColor('#f1f5f9').rect(margin, currY, pageWidth - (margin * 2), 30).fill();
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10);
    doc.text('DESCRIPTION', margin + 15, currY + 10);
    doc.text('AMOUNT (PKR)', pageWidth - margin - 110, currY + 10, { width: 95, align: 'right' });
    currY += 30;

    // Table Rows Function
    const drawRow = (label, amount, color, isBold) => {
      doc.moveTo(margin, currY).lineTo(pageWidth - margin, currY).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fillColor('#1e293b').font('Helvetica').fontSize(10).text(label, margin + 15, currY + 10);
      doc.fillColor(color).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).text(amount, pageWidth - margin - 110, currY + 10, { width: 95, align: 'right' });
      currY += 30;
    };

    drawRow('Base Monthly Salary', `Rs. ${payroll.base_salary.toLocaleString()}`, '#1e293b', false);
    drawRow(`Unpaid Leave Deductions (${payroll.unpaid_leaves} Days)`, `-Rs. ${payroll.deductions.toLocaleString()}`, '#ef4444', false);
    drawRow('Performance Bonus / Allowances', `+Rs. ${payroll.bonus.toLocaleString()}`, '#10b981', false);
    
    // Bottom Border of table
    doc.moveTo(margin, currY).lineTo(pageWidth - margin, currY).strokeColor('#e2e8f0').lineWidth(1).stroke();
    currY += 20;

    // ==========================================
    // 5. FINAL NET PAYABLE
    // ==========================================
    doc.fillColor('#102b4e').rect(margin, currY, pageWidth - (margin * 2), 40).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text('NET PAYABLE AMOUNT:', margin + 15, currY + 14);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text(`Rs. ${payroll.net_payable.toLocaleString()}`, pageWidth - margin - 160, currY + 13, { width: 145, align: 'right' });

    currY += 70;

    // Status Indicator
    const statusColor = payroll.status.includes('Paid') ? '#10b981' : '#f59e0b';
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10).text('Transfer Status:', margin, currY);
    doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(10).text(payroll.status.toUpperCase(), margin + 90, currY);

    // ==========================================
    // 6. EXACT FOOTER MATCH
    // ==========================================
    const footerY = pageHeight - 60;

    // Top cyan line
    doc.moveTo(0, footerY).lineTo(pageWidth, footerY).strokeColor('#2a8296').lineWidth(2).stroke();
    
    // Center dark blue trapezoid
    doc.fillColor('#102b4e').polygon([270, footerY], [325, footerY], [320, footerY + 8], [275, footerY + 8]).fill();

    // Footer Text & Dividers
    doc.fillColor('#102b4e').fontSize(9).font('Helvetica-Bold');
    
    doc.text('Lahore, Pakistan', 105, footerY + 20);
    
    doc.moveTo(225, footerY + 18).lineTo(225, footerY + 30).strokeColor('#cbd5e1').lineWidth(1.5).stroke();
    
    doc.text('+92 325 6541677', 260, footerY + 20);
    
    doc.moveTo(375, footerY + 18).lineTo(375, footerY + 30).strokeColor('#cbd5e1').lineWidth(1.5).stroke();
    
    doc.text('samibilal@hotmail.com', 410, footerY + 20);

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;