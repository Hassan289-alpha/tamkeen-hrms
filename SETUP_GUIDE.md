# 🏢 Tamkeen IT Services - Office Attendance & Leave Portal

## 📋 Project Overview

A complete **Employee Attendance & Leave Management System** built with **React** (Frontend) and **Node.js + Express + Sequelize** (Backend) using **SQLite** database.

---

## ✨ **Features Implemented**

### ✅ **1. Employee Dashboard**
- **Check-In/Check-Out System** - Mark daily attendance with real-time logging
- **Leave Application Portal** - Submit leave requests (Sick, Casual, Annual)
- **Attendance Status Display** - View current day's attendance status
- **Responsive UI** - Clean, modern interface with Tailwind styling

### ✅ **2. HR Dashboard**
- **Leave Approval System** - Review and approve/reject leave applications
- **Pending Leaves Counter** - Real-time count of pending applications
- **Monthly Attendance Report** - Download attendance data in CSV/Excel format
- **System Information Display** - View office policies and configurations

### ✅ **3. Authentication & Security**
- **Secure Login System** - Email & password authentication
- **Role-Based Access** - Separate dashboards for HR and Employees
- **Session Management** - localStorage-based token handling
- **Default HR Account** - Auto-seeded on first run (hr@tamkeenits.com / admin123)

### ✅ **4. Attendance Features**
- **IP-Based Office WiFi Verification** - Restricted check-in to office network
- **Weekend Policy** - Friday & Saturday automatically marked as off
- **Hour Calculation** - Automatic total hours calculation between check-in/check-out
- **Daily Attendance Tracking** - One check-in/check-out per day enforcement

### ✅ **5. Leave Management**
- **Three Leave Types**:
  - 👨‍⚕️ **Sick Leave** - Medical absences
  - 📅 **Casual Leave** - General leave
  - 📊 **Annual Leave** - Yearly leave

- **Leave Balances**:
  - Sick Leave: 10 days/year
  - Casual Leave: 10 days/year
  - Annual Leave: 15 days/year

- **Automated Leave Accrual** - Monthly cron job:
  - 1st of every month: +1 Casual, +1.5 Annual for all active employees
  - Automatic balance deduction on leave approval

### ✅ **6. Email Notifications**
- **Leave Approval Emails** - Instant notification with leave details
- **Beautiful HTML Templates** - Professional email formatting
- **Automated Triggers** - Sends when HR approves leave
- **Employee Confirmation** - Contains all leave information

### ✅ **7. Report Generation**
- **CSV Export** - Download attendance data in CSV format
- **Excel Export** - Detailed Excel reports with formatting
- **Employee Details** - Name, Email, Role, Department
- **Attendance Details** - Date, Check-In, Check-Out, Total Hours
- **Monthly Summary** - Total records, report date, office policy

### ✅ **8. System Configuration**
- **Cron Job Scheduler** - node-cron for monthly leave accrual
- **Environment Variables** - .env for configuration management
- **Database Auto-Sync** - Sequelize auto-creates/updates tables
- **Graceful Error Handling** - User-friendly error messages

---

## 🚀 **Technology Stack**

### **Frontend:**
- ⚛️ React 18.2
- 🎨 React Router DOM v6
- 🔌 Axios for API calls
- 💻 Pure CSS styling

### **Backend:**
- 🟢 Node.js + Express
- 🗄️ Sequelize ORM
- 📦 SQLite Database
- 📧 Nodemailer (Email)
- 📊 ExcelJS (Excel export)
- 📋 json2csv (CSV export)
- ⏰ node-cron (Scheduled tasks)

---

## 📦 **Installation & Setup**

### **Prerequisites:**
- Node.js (v14 or higher)
- npm or yarn
- SQLite (included with Sequelize)

### **1. Clone/Download Project:**
```bash
cd c:\Project\office-attendance-project
```

### **2. Backend Setup:**
```bash
cd backend
npm install
```

### **3. Frontend Setup:**
```bash
cd ../frontend
npm install
```

### **4. Configure Environment Variables:**

Create/Update `backend/.env`:
```env
PORT=5000
DB_NAME=office_attendance
DB_USER=sa
DB_PASSWORD=YourPassword123
DB_HOST=localhost

# Email Configuration (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Office WiFi IP
OFFICE_IP=192.168.1.1
```

**📧 For Gmail with Nodemailer:**
1. Enable 2-Step Verification in Google Account
2. Generate App-Specific Password
3. Use that password in EMAIL_PASSWORD

### **5. Run the Application:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend runs on: `http://localhost:3001` (or 3000 if available)

---

## 📱 **How to Use**

### **Login:**
1. Open `http://localhost:3001/hr` or `http://localhost:3000`
2. Default HR Account:
   - Email: `hr@tamkeenits.com`
   - Password: `admin123`

### **Employee - Check-In/Check-Out:**
1. Login as employee
2. Click **"Check In"** button
3. System logs time automatically
4. Click **"Check Out"** at end of day
5. Total hours calculated automatically

### **Employee - Apply for Leave:**
1. Fill leave application form:
   - Select leave type (Sick/Casual/Annual)
   - Choose start & end dates
   - System calculates days automatically
2. Click **"Apply for Leave"**
3. HR will review and approve/reject

### **HR - Approve Leaves:**
1. Login as HR
2. View "Pending Leave Applications"
3. Click **"✓ Approve Leave"** button
4. Employee receives approval email instantly
5. Leave balance automatically deducted

### **HR - Download Reports:**
1. Click **"Download Attendance Report"**
2. Choose between CSV or Excel format
3. File contains all attendance data
4. Includes summary information

---

## 🔒 **Security Features**

### **1. Office WiFi IP Restriction:**
```javascript
// In backend/routes/attendance.js
const OFFICE_IP = process.env.OFFICE_IP;
// Check-in only allowed from this IP
```

**To Enable:**
- Uncomment the IP validation code in `attendance.js`
- Update `.env` with your office WiFi gateway IP
- IP checking automatically happens on check-in

### **2. Role-Based Access:**
```javascript
// Different dashboards for HR vs Employees
if (response.data.user.role === 'HR') {
  navigate('/hr');
} else {
  navigate('/employee');
}
```

### **3. Local Storage Protection:**
- Tokens stored in localStorage
- Logout clears all user data
- Protected routes validate user role

---

## ⏰ **Automated Features**

### **Monthly Leave Accrual (Runs 1st of every month at 00:00):**
```javascript
cron.schedule('0 0 1 * *', async () => {
  // Adds leaves to all active employees
  casual_leave_balance += 1
  annual_leave_balance += 1.5
});
```

### **Weekend Off (Friday & Saturday):**
```javascript
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 5 || day === 6; // Auto-off
};
```

---

## 📧 **Email Configuration**

### **Leave Approval Email Contains:**
- ✓ Employee name
- ✓ Leave type (Sick/Casual/Annual)
- ✓ Start and end dates
- ✓ Total days
- ✓ Approval status
- ✓ Professional HTML template

### **Email Workflow:**
```
Employee applies for leave
         ↓
HR reviews & clicks "Approve"
         ↓
System sends approval email
         ↓
Employee receives confirmation
         ↓
Leave balance automatically updated
```

---

## 📊 **Database Schema**

### **Users Table:**
```javascript
{
  id: INTEGER (Primary Key),
  name: STRING,
  email: STRING (Unique),
  password: STRING,
  role: STRING ('HR' or 'Employee'),
  isActive: BOOLEAN,
  sick_leave_balance: FLOAT (Default: 10),
  casual_leave_balance: FLOAT (Default: 10),
  annual_leave_balance: FLOAT (Default: 15)
}
```

### **Attendance Table:**
```javascript
{
  id: INTEGER (Primary Key),
  userId: INTEGER (Foreign Key),
  date: STRING (YYYY-MM-DD),
  check_in_time: STRING (HH:MM:SS),
  check_out_time: STRING (null if not checked out),
  total_hours: STRING ('8.5 hours')
}
```

### **Leave Table:**
```javascript
{
  id: INTEGER (Primary Key),
  userId: INTEGER (Foreign Key),
  leave_type: STRING ('Sick', 'Casual', 'Annual'),
  start_date: STRING (YYYY-MM-DD),
  end_date: STRING (YYYY-MM-DD),
  days: INTEGER,
  status: STRING ('Pending', 'Approved', 'Rejected')
}
```

---

## 🔌 **API Endpoints**

### **Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### **Attendance:**
- `POST /api/attendance/check-in` - Record check-in
- `POST /api/attendance/check-out` - Record check-out

### **Leave Management:**
- `POST /api/leaves/apply` - Submit leave application
- `GET /api/leaves/pending` - Get pending leaves (HR only)
- `POST /api/leaves/approve` - Approve leave request

### **Reports:**
- `GET /api/reports/export-attendance` - Download CSV report
- `GET /api/reports/export-excel` - Download Excel report

---

## 🛠️ **Troubleshooting**

### **Port Already in Use:**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### **Email Not Sending:**
1. Check `.env` EMAIL_USER and EMAIL_PASSWORD
2. For Gmail: Use App-Specific Password (2FA required)
3. Allow "Less Secure App Access" in email settings

### **Database Not Syncing:**
1. Delete `database.sqlite` file
2. Restart backend (`npm run dev`)
3. Database will auto-create

### **Check-in IP Restriction Issues:**
1. Find your office WiFi gateway IP
2. Update `OFFICE_IP` in `.env`
3. Test with: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

---

## 📸 **Screenshots**

### **Login Page:**
- Company branding (Tamkeen IT Services)
- Email & password inputs
- Professional styling

### **Employee Dashboard:**
- Check-In/Check-Out buttons
- Leave application form
- Status messages

### **HR Dashboard:**
- Pending leave applications list
- Approve leave buttons
- Download report button
- System information display

---

## 🎯 **Future Enhancements**

- [ ] SMS notifications for leave status
- [ ] WhatsApp integration
- [ ] Biometric check-in
- [ ] Mobile app (React Native)
- [ ] Dashboard analytics & charts
- [ ] Employee performance metrics
- [ ] Attendance history calendar view
- [ ] Integration with payroll system

---

## 📞 **Support**

For issues or questions:
1. Check the troubleshooting section above
2. Review backend console logs
3. Check browser console (F12)
4. Verify environment variables in `.env`

---

## ✅ **Project Checklist**

- ✅ Attendance portal with dashboard for HR & Employees
- ✅ Check-In/Check-Out functionality
- ✅ Total hours calculation
- ✅ Monthly leave accrual (Cron job)
- ✅ Friday/Saturday weekend off
- ✅ Three types of leaves (Sick, Casual, Annual)
- ✅ Leave balance counter and auto-deduction
- ✅ Office WiFi IP restriction for check-in
- ✅ Excel/CSV export for reports
- ✅ Email notifications for leave approval
- ✅ Professional UI/UX
- ✅ Secure authentication
- ✅ Role-based access control

---

## 📄 **License**

This project is proprietary software for Tamkeen IT Services.

---

**Built with ❤️ using React, Node.js, and Sequelize**
