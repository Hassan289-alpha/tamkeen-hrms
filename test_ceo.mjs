export default async function run(page, ui) {
  // Login as CEO
  await page.goto("http://localhost:3000/login");
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', "ceo@tamkeenits.com");
  await page.fill('input[type="password"]', "ceo123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  await page.screenshot({ path: "ceo_dashboard.png", fullPage: true });

  return { currentUrl };
}
