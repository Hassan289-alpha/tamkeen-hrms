export default async function run(page, ui) {
  const results = {};

  // 1. Visit Login
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(2000);

  // Login as HR
  await page.fill('input[type="email"]', "hr@tamkeenits.com");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  results.hrUrl = page.url();
  results.hrTitle = await page.title();

  // Screenshot HR Dashboard
  await page.screenshot({ path: "hr_dashboard.png", fullPage: true });

  // 2. Visit Employee Login
  await page.evaluate(() => localStorage.clear());
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', "ahmed@tamkeenits.com");
  await page.fill('input[type="password"]', "employee123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  results.employeeUrl = page.url();

  // Screenshot Employee Dashboard
  await page.screenshot({ path: "employee_dashboard.png", fullPage: true });

  return results;
}
