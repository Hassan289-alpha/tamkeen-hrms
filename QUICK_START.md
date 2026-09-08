# 🚀 Quick Start Reference - Tamkeen IT Services HR Portal

## ⚡ **EVERYTHING IS NOW RUNNING!**

```
✅ Backend Server:  https://tamkeen-hrms.onrender.com
✅ Frontend App:    http://localhost:3001
✅ Database:        SQLite (database.sqlite)
✅ Default Account: hr@tamkeenits.com / admin123
```

---

## 🎯 **Open Application**

### **Method 1: Direct URL**
Open your browser and go to:
```
http://localhost:3001
```

### **Method 2: From HR Dashboard**
Open your browser and go to:
```
http://localhost:3001/hr
```

---

## 👤 **Default Login Credentials**

| Role | Email | Password |
|------|-------|----------|
| HR Manager | hr@tamkeenits.com | admin123 |

**To create employee account:**
1. Register via login page (or backend API)
2. Set role as "Employee"
3. Employee will get default leave balances:
   - Sick: 10 days
   - Casual: 10 days
   - Annual: 15 days

---

## 📱 **Feature Guide**

### **🔐 Login Page**
```
URL: http://localhost:3001 (or :3000)
- Enter Email
- Enter Password
- Click "Sign In"
- Auto-redirects to HR or Employee dashboard
```

### **👨‍💼 Employee Dashboard Features**

1. **Check-In:**
   - Click "Check In" button
   - Records current time
   - Only works once per day
   - Only on working days (not Fri/Sat)

2. **Check-Out:**
   - Click "Check Out" button
   - Calculates total hours worked
   - Shows message with total hours

3. **Apply Leave:**
   - Select leave type: Sick / Casual / Annual
   - Choose start date
   - Choose end date
   - Enter number of days
   - Click "Apply for Leave"
   - Status: Pending (waiting for HR approval)

### **👔 HR Dashboard Features**

1. **Approve Leave Requests:**
   - See all pending leave applications
   - Shows employee name, email, leave details
   - Click "✓ Approve Leave"
   - Employee gets approval email
   - Leave balance auto-deducted

2. **Download Reports:**
   - Click "Download Attendance Report"
   - CSV file downloads with all attendance data
   - Contains: Names, Emails, Dates, Check-in/out times, Hours

3. **View System Info:**
   - Monthly leave accrual schedule
   - Office working days
   - Weekend policy
   - IP verification status

---

## 📊 **Leave System**

### **Leave Types Available:**
```
🏥 Sick Leave    → Medical absences (10 days/year)
📅 Casual Leave  → General leave (10 days/year)
📊 Annual Leave  → Yearly vacation (15 days/year)
```

### **Leave Accrual (Automatic):**
```
Every 1st of the month at 00:00:
- Casual Leave Balance += 1 day
- Annual Leave Balance += 1.5 days
(For all active employees)
```

### **Leave Workflow:**
```
1. Employee applies for leave
   ↓
2. Request status: "Pending"
   ↓
3. HR reviews and clicks "Approve"
   ↓
4. Employee receives approval email
   ↓
5. Leave balance automatically updated
   ↓
6. Request status: "Approved"
```

---

## 🎯 **Attendance Tracking**

### **Daily Attendance:**
```
Morning: Click "Check In" → Records check-in time
Evening: Click "Check Out" → Calculates hours worked

System calculates: Total Hours = Check-Out Time - Check-In Time
```

### **Office Policy:**
```
Working Days:    Sunday, Monday, Tuesday, Wednesday, Thursday
Weekends Off:    Friday, Saturday (Auto-blocked for check-in)
Check-in Reset:  Daily at midnight
```

### **IP Restriction (Optional):**
```
For Office WiFi verification:
1. Update .env file with OFFICE_IP
2. Uncomment IP check in attendance.js
3. Only office WiFi IP can check-in
(Currently disabled for testing)
```

---

## 📧 **Email Notifications**

### **When Email Sends:**
- HR clicks "✓ Approve Leave"
- Employee receives approval email with:
  - Leave type
  - Start & end dates
  - Total days
  - Approval status
  - Leave balance update info

### **To Configure Email:**
1. Open `backend/.env`
2. Set EMAIL_USER = your Gmail
3. Generate app password from Google Account settings
4. Set EMAIL_PASSWORD = app password
5. Restart backend

---

## 📥 **Report Download**

### **CSV Export:**
- Click "Download Attendance Report" on HR Dashboard
- Contains all attendance records in CSV format
- Open with Excel or any spreadsheet app
- Includes employee info and hours worked

### **Excel Export:**
- Use `/api/reports/export-excel` endpoint
- Professional formatted Excel file
- Color-coded rows
- Includes summary section

---

## 🔧 **Troubleshooting**

### **"Already checked in today"**
→ You can only check-in once per day. Check-out to complete the day.

### **Cannot check-in on Friday/Saturday**
→ Intentional! Weekends are off. Only check-in Mon-Thu, Sun.

### **Email not sending**
→ Check `.env` for EMAIL_USER and EMAIL_PASSWORD. Use Gmail app password (not regular password).

### **"Server error" messages**
→ Check backend console for error details. Verify database is running.

### **Port already in use**
→ Kill existing process: `taskkill /PID <PID> /F`

### **Database not updating**
→ Delete `database.sqlite` and restart backend. It will auto-create.

---

## 🔄 **Restart Applications**

### **Restart Backend:**
```bash
# In backend terminal, press Ctrl+C
# Then run:
npm run dev

# Or send 'rs' command if using nodemon
rs
```

### **Restart Frontend:**
```bash
# In frontend terminal, press Ctrl+C
# Then run:
npm start
```

---

## 📋 **API Endpoints**

### **User Management:**
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user

### **Attendance:**
- `POST /api/attendance/check-in` - Record check-in
- `POST /api/attendance/check-out` - Record check-out

### **Leave Management:**
- `POST /api/leaves/apply` - Submit leave application
- `GET /api/leaves/pending` - Get pending leaves (HR only)
- `POST /api/leaves/approve` - Approve leave

### **Reports:**
- `GET /api/reports/export-attendance` - Download CSV
- `GET /api/reports/export-excel` - Download Excel

---

## 💡 **Tips & Best Practices**

1. **HR Account Security:**
   - Change default password after first login
   - Use strong password with special characters
   - Don't share credentials

2. **Leave Planning:**
   - Apply for leave in advance
   - Check leave balance before applying
   - Plan weekends accordingly

3. **Attendance Accuracy:**
   - Check-in within office hours
   - Don't forget to check-out
   - Report discrepancies to HR

4. **Report Generation:**
   - Generate reports at month-end
   - Keep backup of important reports
   - Share with accounting/payroll

5. **System Maintenance:**
   - Keep database backups
   - Monitor server logs
   - Update configurations as needed

---

## 🆘 **Contact Support**

For issues:
1. Check the Troubleshooting section above
2. Review backend console logs
3. Check browser console (F12)
4. Verify `.env` configuration
5. Restart application

---

## 📱 **Mobile Access**

Access from any device on same network:
```
http://192.168.18.23:3001
```
(Replace IP with your actual machine IP)

---

## ✅ **Checklist Before Using**

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3001
- [ ] Database file exists (database.sqlite)
- [ ] Can login with hr@tamkeenits.com
- [ ] Can navigate to /employee dashboard
- [ ] Can navigate to /hr dashboard
- [ ] Check-in/out buttons work
- [ ] Leave form works
- [ ] Leave approval works
- [ ] Reports download works

---

## 🎊 **You're All Set!**

Your Tamkeen IT Services HR Portal is ready to use. 

**Start by:**
1. Opening http://localhost:3001
2. Logging in with hr@tamkeenits.com / admin123
3. Exploring the HR Dashboard
4. Creating test employee accounts
5. Testing check-in/check-out
6. Approving leaves
7. Downloading reports

**Happy managing! 🎉**

---

**Last Updated: September 1, 2026**
**Status: ✅ Fully Operational**
