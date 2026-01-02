import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Listen for console messages
page.on('console', msg => {
  console.log(`[Browser ${msg.type()}]`, msg.text());
});

// Listen for page errors
page.on('pageerror', error => {
  console.error(`[Page Error]`, error.message);
  console.error(error.stack);
});

try {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait a bit for React to render
  await page.waitForTimeout(3000);
  
  console.log('Page loaded successfully');
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
  console.log('Screenshot saved to /tmp/screenshot.png');
  
} catch (error) {
  console.error('Error:', error);
}

await browser.close();
