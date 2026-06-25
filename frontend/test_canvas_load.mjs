import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await page.goto('http://localhost:3000/editor', { waitUntil: 'networkidle0' }).catch(e => console.log('GOTO ERROR:', e.message));
  await browser.close();
})();
