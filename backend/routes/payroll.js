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
    res.setHeader('Content-Disposition', `attachment; filename=Payslip_${payroll.month}_${payroll.User.name}.pdf`);
    doc.pipe(res);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 50;

    const logoPath = path.join(__dirname, '../../frontend/public/tamkeen-logo.png');

    // ==========================================
    // 1. HEADER (Geometric Graphics & Text)
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
    }

    // ==========================================
    // 2. CENTER WATERMARK (FIXED OPACITY METHOD)
    // ==========================================
    if (fs.existsSync(logoPath)) {
      doc.save()
         .opacity(0.06) // This was the bug! PDFkit uses .opacity(), not .globalAlpha()
         .image(logoPath, 147, 300, { width: 300 })
         .restore();
    }

    // ==========================================
    // 3. PAYSLIP CONTENT
    // ==========================================
    let currY = 170;
    
    doc.fillColor('#0284c7').fontSize(16).font('Helvetica-Bold').text(`Official Salary Statement — ${payroll.month}`, margin, currY);
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text('Generated by Tamkeen IT Services HRMS in compliance with Pakistani labor standards.', margin, currY + 20);
    currY += 60;

    // Employee Details Box
    doc.fillColor('#f8fafc').rect(margin, currY, pageWidth - (margin * 2), 70).fill();
    doc.lineWidth(1).strokeColor('#e2e8f0').rect(margin, currY, pageWidth - (margin * 2), 70).stroke();
    
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('EMPLOYEE DETAILS', margin + 15, currY + 15);
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(11).text(payroll.User.name, margin + 15, currY + 35);
    doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(`Department: ${payroll.User.department}`, margin + 15, currY + 50);

    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('PAYROLL STATUS', margin + 250, currY + 15);
    doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(11).text(payroll.status, margin + 250, currY + 35);
    doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(`Pay Period: ${payroll.month}`, margin + 250, currY + 50);
    currY += 100;

    // Table Header
    doc.fillColor('#bae6fd').rect(margin, currY, pageWidth - (margin * 2), 30).fill();
    doc.fillColor('#0369a1').font('Helvetica-Bold').fontSize(10);
    doc.text('DESCRIPTION / BREAKDOWN', margin + 15, currY + 10);
    doc.text('AMOUNT (PKR)', pageWidth - margin - 100, currY + 10, { width: 85, align: 'right' });
    currY += 30;

    // Table Rows Function
    const drawRow = (label, amount, color, isBold) => {
      doc.fillColor('#f8fafc').rect(margin, currY, pageWidth - (margin * 2), 30).fill();
      doc.moveTo(margin, currY).lineTo(pageWidth - margin, currY).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.fillColor('#1e293b').font('Helvetica').fontSize(10).text(label, margin + 15, currY + 10);
      doc.fillColor(color).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).text(amount, pageWidth - margin - 100, currY + 10, { width: 85, align: 'right' });
      currY += 30;
    };

    drawRow('Base Monthly Salary', `Rs. ${payroll.base_salary.toLocaleString()}`, '#1e293b', false);
    drawRow(`Unpaid Leave Deductions (${payroll.unpaid_leaves} Days)`, `-Rs. ${payroll.deductions.toLocaleString()}`, '#ef4444', true);
    drawRow('Performance Bonus / Allowance', `+Rs. ${payroll.bonus.toLocaleString()}`, '#10b981', false);
    
    currY += 10;

    // Final Net Payable Highlight Box
    doc.fillColor('#1e3a8a').rect(margin, currY, pageWidth - (margin * 2), 40).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(12).text('NET PAYABLE PAYOUT:', margin + 15, currY + 14);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(14).text(`Rs. ${payroll.net_payable.toLocaleString()}`, pageWidth - margin - 150, currY + 13, { width: 135, align: 'right' });

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
    console.error(err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;