export default async function run(page, ui) {
  // 1. Employee Login & Leave Modal
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'ahmed@tamkeenits.com');
  await page.fill('input[type="password"]', 'employee123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Open Leave Modal
  await page.click('button:has-text("Apply Leave")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'leave_modal.png' });

  // 2. HR Login & Reports Tab
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'hr@tamkeenits.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Click Reports tab
  await page.click('button:has-text("Monthly Reports & Audit")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'hr_reports_tab.png' });

  return { success: true };
}
