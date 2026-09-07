export default async function run(page, ui) {
  const log = {
    errors: [],
    steps: [],
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      log.errors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    log.errors.push(err.message);
  });

  // Step 1: Login as Employee
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', "ahmed@tamkeenits.com");
  await page.fill('input[type="password"]', "employee123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  log.steps.push({ step: "Login", currentUrl: page.url() });

  // Step 2: Test Employee Dashboard Overview
  const title = await page.textContent("h1");
  log.steps.push({ step: "Dashboard Header", title });

  // Step 3: Test Check-In (or Check-Out if already checked in)
  const buttons = await page.$$eval("button", (btns) =>
    btns.map((b) => b.innerText.trim()),
  );
  log.steps.push({ step: "Available Buttons on Page", buttons });

  // Step 4: Open Leave Modal
  await page.click('button:has-text("Apply Leave")');
  await page.waitForTimeout(1000);

  // Fill Leave Modal
  await page.click('button:has-text("Casual")');
  await page.fill('input[type="date"]', "2026-09-15");

  const dateInputs = await page.$$('input[type="date"]');
  if (dateInputs.length > 1) {
    await dateInputs[1].fill("2026-09-16");
  }

  await page.fill("textarea", "Personal errands and family trip");
  await page.waitForTimeout(500);

  // Submit Leave Form
  await page.click('button:has-text("Submit to HR")');
  await page.waitForTimeout(2000);

  log.steps.push({ step: "Leave Submission", completed: true });

  // Step 5: Switch to Leave Center Tab
  await page.click('button:has-text("Leave Center")');
  await page.waitForTimeout(1500);

  // Screenshot Leave Center
  await page.screenshot({ path: "employee_leave_center.png", fullPage: true });
  log.steps.push({ step: "Leave Center View", captured: true });

  // Step 6: Switch to Attendance History Tab
  await page.click('button:has-text("Attendance History")');
  await page.waitForTimeout(1500);

  // Screenshot Attendance History
  await page.screenshot({
    path: "employee_attendance_history.png",
    fullPage: true,
  });
  log.steps.push({ step: "Attendance History View", captured: true });

  return log;
}
