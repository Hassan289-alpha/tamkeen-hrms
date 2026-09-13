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

// Seed Initial Data (Clean Production Version)
const seedInitialData = async () => {
  // Only ensure the master HR account exists
  const hrEmail = "hr@tamkeenits.com";
  const exists = await User.findOne({ where: { email: hrEmail } });
  
  if (!exists) {
    await User.create({
      name: "HR Manager", 
      email: hrEmail, 
      password: "admin123", 
      role: "HR",
      department: "Management", 
      position: "HR Admin", 
      base_salary: 120000,
      date_of_birth: "1990-01-01"
    });
    console.log("✓ Master HR account verified.");
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