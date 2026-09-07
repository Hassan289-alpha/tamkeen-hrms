const nodemailer = require('nodemailer');

// Configure SMTP Transporter
const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_PASSWORD !== 'your-app-specific-password') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Fallback / Development transporter (logs email output cleanly without failing)
  return {
    sendMail: async (options) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 [SMTP Email Notification Simulated]');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return { messageId: 'simulated-mail-' + Date.now() };
    }
  };
};

const transporter = createTransporter();

/**
 * Send professionally formatted HTML Leave Approval Email
 */
const sendLeaveApprovalEmail = async (employeeEmail, employeeName, leaveData) => {
  try {
    const leaveColor = leaveData.leave_type === 'Sick' ? '#ef4444' : leaveData.leave_type === 'Casual' ? '#f59e0b' : '#3b82f6';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
          .badge { display: inline-block; background: #10b981; color: white; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid ${leaveColor}; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 500; }
          .value { color: #0f172a; font-weight: 600; text-align: right; }
          .info-banner { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 14px 18px; border-radius: 10px; font-size: 13px; line-height: 1.5; margin: 24px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">🏢 Tamkeen IT Services</h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 14px;">Human Resources Management Portal</p>
            <div class="badge">✓ Leave Approved</div>
          </div>

          <div class="content">
            <p class="greeting">Hello, ${employeeName} 👋</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
              Great news! Your request for <strong>${leaveData.leave_type} Leave</strong> has been reviewed and officially approved by HR management.
            </p>

            <div class="card">
              <div class="row">
                <span class="label">Leave Category</span>
                <span class="value" style="color: ${leaveColor};">${leaveData.leave_type} Leave</span>
              </div>
              <div class="row">
                <span class="label">Start Date</span>
                <span class="value">${leaveData.start_date}</span>
              </div>
              <div class="row">
                <span class="label">End Date</span>
                <span class="value">${leaveData.end_date}</span>
              </div>
              <div class="row">
                <span class="label">Total Approved Duration</span>
                <span class="value">${leaveData.days} Day(s)</span>
              </div>
              <div class="row">
                <span class="label">Status</span>
                <span class="value" style="color: #059669;">● Approved & Synchronized</span>
              </div>
            </div>

            <div class="info-banner">
              <strong>✨ Automatic Leave Counter Synchronized:</strong><br/>
              Your remaining leave balance in the Tamkeen HR Portal has been automatically updated to reflect these <strong>${leaveData.days}</strong> approved day(s).
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
              Please make sure all ongoing handovers and team notifications are completed before your scheduled leave begins. Have a restful time!
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">Automated notification from Tamkeen IT Services HR Portal.</p>
            <p style="margin: 4px 0 0 0;">Please do not reply directly to this automated address.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Tamkeen HR Portal" <${process.env.EMAIL_USER || 'hr@tamkeenits.com'}>`,
      to: employeeEmail,
      subject: `✓ Leave Approved: ${leaveData.leave_type} Leave (${leaveData.start_date} to ${leaveData.end_date})`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Leave approval email sent to ${employeeEmail} (ID: ${info?.messageId || 'N/A'})`);
    return true;
  } catch (error) {
    console.error('Failed to send leave approval email:', error);
    return false;
  }
};

/**
 * Send Leave Rejection Email
 */
const sendLeaveRejectionEmail = async (employeeEmail, employeeName, leaveData) => {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 20px;">
        <div style="max-width: 580px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #ef4444; margin-top: 0;">Leave Application Notice</h2>
          <p>Dear ${employeeName},</p>
          <p>Your application for <strong>${leaveData.leave_type} Leave</strong> (${leaveData.start_date} to ${leaveData.end_date}) could not be approved at this time.</p>
          ${leaveData.reason ? `<p><strong>Reason:</strong> ${leaveData.reason}</p>` : ''}
          <p>Please contact HR department for further details.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Tamkeen HR Portal" <${process.env.EMAIL_USER || 'hr@tamkeenits.com'}>`,
      to: employeeEmail,
      subject: `✗ Leave Request Update: ${leaveData.leave_type} Leave`,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    return false;
  }
};

module.exports = {
  sendLeaveApprovalEmail,
  sendLeaveRejectionEmail
};

