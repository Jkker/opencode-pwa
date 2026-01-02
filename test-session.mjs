import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Listen for console messages
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  console.log(`[Browser ${type}]`, text);
});

// Listen for page errors
page.on('pageerror', error => {
  console.error(`\n[Page Error] ${error.message}`);
  console.error(error.stack);
});

try {
  console.log('Navigating to home page...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log('\nLooking for project link...');
  const projectLink = await page.locator('text=opencode-pwa').first();
  if (await projectLink.isVisible()) {
    console.log('Found project, clicking...');
    await projectLink.click();
    await page.waitForTimeout(3000);
    
    console.log('\nTaking screenshot after project click...');
    await page.screenshot({ path: '/tmp/screenshot-project.png', fullPage: true });
    console.log('Screenshot saved to /tmp/screenshot-project.png');
    
    // Try to start a new session or find existing one
    console.log('\nLooking for new session or existing sessions...');
    const newSessionBtn = page.locator('button:has-text("New Session"), button:has-text("New Chat")');
    if (await newSessionBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found new session button, clicking...');
      await newSessionBtn.first().click();
      await page.waitForTimeout(3000);
      
      console.log('\nTaking screenshot after new session...');
      await page.screenshot({ path: '/tmp/screenshot-session.png', fullPage: true });
      console.log('Screenshot saved to /tmp/screenshot-session.png');
    } else {
      console.log('No new session button found, checking for existing sessions...');
    }
  }
  
  console.log('\nFinal page state...');
  const url = page.url();
  console.log('Current URL:', url);
  
} catch (error) {
  console.error('\n[Test Error]', error.message);
  console.error(error.stack);
}

await browser.close();
