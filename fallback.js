const PW = 'C:/Users/SMT-IT-LT-27/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4173/?cb=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Simulate the real "needs activation" response
  await page.route('**/formsubmit.co/**', r => r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: 'false', message: 'This form needs Activation.' })
  }));

  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.fill('input[name="name"]', 'Dharma');
  await page.fill('input[name="email"]', 'dharmarajm471@gmail.com');
  await page.fill('input[name="phone"]', '7200712002');
  await page.fill('textarea[name="message"]', 'Need branding & packaging for a new product.');
  await page.click('#formSubmit');
  await page.waitForTimeout(1200);

  console.log('message shown:', (await page.locator('#formNote').textContent()).trim());
  const href = await page.getAttribute('.form-fallback-link', 'href');
  console.log('\nmailto link generated:');
  console.log(decodeURIComponent(href));
  await browser.close();
})();
