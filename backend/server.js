require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { Op } = require("sequelize");
const sequelize = require("./models/db");
const User = require("./models/User");
const Attendance = require("./models/Attendance");
const Leave = require("./models/Leave");
const Payroll = require("./models/Payroll");
const Holiday = require("./models/Holiday");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded documents statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/leaves", require("./routes/leaves"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/holidays", require("./routes/holidays"));

// Automated Leave Accrual Cron Job
const runMonthlyLeaveAccrual = async () => {
  console.log("🔄 [CRON JOB] Running automated monthly leave accrual...");
  try {
    const [updatedCount] = await User.update(
      {
        casual_leave_balance: sequelize.literal("casual_leave_balance + 1"),
        annual_leave_balance: sequelize.literal("annual_leave_balance + 1.5"),
      },
      { where: { role: "Employee", isActive: true } }
    );
    console.log(`✓ [CRON JOB] Accrued leaves for ${updatedCount} employees.`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error("❌ [CRON JOB] Error:", error);
    return { success: false, error: error.message };
  }
};

cron.schedule("0 0 1 * *", () => runMonthlyLeaveAccrual());

app.post("/api/cron/trigger-accrual", async (req, res) => {
  const result = await runMonthlyLeaveAccrual();
  res.json({ message: "Monthly leave accrual executed", result });
});

// ==========================================
// AUTOMATED BIRTHDAY NOTIFICATION CRON JOB
// ==========================================
cron.schedule("0 8 * * *", async () => {
  console.log("🎂 [CRON JOB] Checking for employee birthdays...");
  try {
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentDay = String(today.getDate()).padStart(2, '0');
    const monthDayString = `${currentMonth}-${currentDay}`;

    // Find all users whose date_of_birth matches today's month and day
    const birthdayEmployees = await User.findAll({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn("to_char", sequelize.col("date_of_birth"), "MM-DD"),
            monthDayString
          )
        ]
      }
    });

    for (const emp of birthdayEmployees) {
      const announcementTitle = "Birthday Reminder 🎂";
      
      // Check if a birthday announcement already exists for today to avoid duplicates
      const existingAnnouncement = await Holiday.findOne({
        where: {
          title: announcementTitle,
          start_date: today.toISOString().slice(0, 10),
          description: { [Op.like]: `%${emp.name}%` }
        }
      });

      if (!existingAnnouncement) {
        await Holiday.create({
          title: announcementTitle,
          start_date: today.toISOString().slice(0, 10),
          end_date: today.toISOString().slice(0, 10),
          description: `Today is ${emp.name}'s birthday 🎉\nA friendly reminder of an important date for our team.\nEveryone, let's congratulate ${emp.name} on their birthday.\n\nSent via Tamkeen IT Services HRMS`
        });
        console.log(`✓ [CRON JOB] Created birthday reminder for ${emp.name}`);
      }
    }
  } catch (error) {
    console.error("❌ [CRON JOB] Birthday cron error:", error);
  }
});

// ==========================================
// DEPLOYMENT CONFIGURATION (Serve React)
// ==========================================
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
// ==========================================

const PORT = process.env.PORT || 5000;

// Seed Initial Data
const seedInitialData = async () => {
  // 1. Seed CEO, HR & Manager
  const management = [
    { email: "ceo@tamkeenits.com", name: "Eng. Fahad", role: "CEO", pass: "ceo123" },
    { email: "hr@tamkeenits.com", name: "HR Manager", role: "HR", pass: "admin123" },
    { email: "manager@tamkeenits.com", name: "Ops Manager", role: "Manager", pass: "manager123" }
  ];

  for (const m of management) {
    const exists = await User.findOne({ where: { email: m.email } });
    if (!exists) {
      await User.create({
        name: m.name, email: m.email, password: m.pass, role: m.role,
        department: "Management", position: m.role, base_salary: 120000,
        date_of_birth: "1995-01-01"
      });
    }
  }

  // 2. Seed 7 Employees with Sample DOBs
  const employeeData = [
    { name: "Ahmed Raza", email: "ahmed.raza@tamkeenits.com", dept: "RPA", salary: 85000, dob: "2000-05-15" },
    { name: "Usman Bhai", email: "usman.bhai@tamkeenits.com", dept: "Power Apps", salary: 90000, dob: "1998-03-22" },
    { name: "Waqas Bhai", email: "waqas.bhai@tamkeenits.com", dept: "RPA", salary: 90000, dob: "1996-07-10" },
    { name: "Hassan", email: "hassan@tamkeenits.com", dept: "RPA INTERN", salary: 35000, dob: "2002-11-05" },
    { name: "Jazib", email: "jazib@tamkeenits.com", dept: "POWER APPS INTERN", salary: 35000, dob: "2003-02-18" },
    { name: "Muaaz", email: "muaaz@tamkeenits.com", dept: "RPA INTERN", salary: 35000, dob: "2001-09-30" },
    { name: "Ali", email: "ali@tamkeenits.com", dept: "RPA", salary: 80000, dob: "1999-12-12" }
  ];

  const createdEmployees = [];
  for (const emp of employeeData) {
    let user = await User.findOne({ where: { email: emp.email } });
    if (!user) {
      user = await User.create({
        name: emp.name, email: emp.email, password: "employee123",
        role: "Employee", department: emp.dept, position: "Staff",
        casual_leave_balance: 10, sick_leave_balance: 10, annual_leave_balance: 15,
        base_salary: emp.salary,
        date_of_birth: emp.dob
      });
    }
    createdEmployees.push(user);
  }

  // 3. Seed Sample Pending Leaves
  const leavesCount = await Leave.count();
  if (leavesCount === 0) {
    await Leave.create({
      userId: createdEmployees[1].id, leave_type: "Casual", start_date: "2026-09-10",
      end_date: "2026-09-12", days: 3, reason: "Family wedding", status: "Pending"
    });
    await Leave.create({
      userId: createdEmployees[2].id, leave_type: "Sick", start_date: "2026-09-15",
      end_date: "2026-09-16", days: 2, reason: "Dental procedure", status: "Pending"
    });
  }

  // 4. Seed 2 Months of Attendance Data (July & August 2026)
  const attendanceCount = await Attendance.count();
  if (attendanceCount === 0) {
    console.log("⏳ Generating 2 months of attendance data (July - August 2026)...");

    const startDate = new Date('2026-07-01');
    const endDate = new Date();
    const validDates = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 5 && d.getDay() !== 6) {
        validDates.push(d.toISOString().split('T')[0]);
      }
    }

    const recordsToInsert = [];

    for (const date of validDates) {
      for (const emp of createdEmployees) {
        if (Math.random() < 0.05) continue;

        const isLate = Math.random() > 0.85;
        const inMin = isLate ? Math.floor(Math.random() * 30) + 46 : Math.floor(Math.random() * 30) + 15;
        const inHour = isLate && inMin >= 60 ? 11 : 10;
        const adjustedInMin = inMin >= 60 ? inMin - 60 : inMin;

        const inTimeStr = `${inHour}:${adjustedInMin.toString().padStart(2, '0')}:00 AM`;
        const status = (inHour === 11 || adjustedInMin > 45) ? 'Half-Day' : 'Present';

        const outHour = Math.random() < 0.6 ? 7 : 8;
        const outMin = outHour === 7 ? Math.floor(Math.random() * 30) + 30 : Math.floor(Math.random() * 45);
        const outTimeStr = `0${outHour}:${outMin.toString().padStart(2, '0')}:00 PM`;

        const checkInTotalMins = (inHour * 60) + adjustedInMin;
        const checkOutTotalMins = ((outHour + 12) * 60) + outMin;

        const elapsedMinutes = checkOutTotalMins - checkInTotalMins;
        const totalHoursFloat = parseFloat((elapsedMinutes / 60).toFixed(2));
        const formattedHours = `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`;

        const SHIFT_END = 1170;
        let extraTimeStr = "-";
        if (checkOutTotalMins > SHIFT_END) {
          const extraMins = checkOutTotalMins - SHIFT_END;
          const extraH = Math.floor(extraMins / 60);
          const extraM = extraMins % 60;
          extraTimeStr = extraH > 0 ? `${extraH}h ${extraM}m` : `${extraM}m`;
        }

        recordsToInsert.push({
          userId: emp.id,
          date: date,
          check_in_time: inTimeStr,
          check_out_time: outTimeStr,
          total_hours: totalHoursFloat,
          total_hours_formatted: formattedHours,
          extra_time: extraTimeStr,
          client_ip: "192.168.1.100",
          status: status,
        });
      }
    }

    await Attendance.bulkCreate(recordsToInsert);
    console.log(`✓ Successfully seeded ${recordsToInsert.length} attendance records!`);
  }
};

// Sync Database and Start Server (Updated with '0.0.0.0' for Render port detection)
sequelize
  .sync()
  .then(async () => {
    console.log("✓ PostgreSQL Database Connected & Synced Successfully");
    await seedInitialData();
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`🚀 Tamkeen HRMS Backend running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Database Connection Error:", err);
  });