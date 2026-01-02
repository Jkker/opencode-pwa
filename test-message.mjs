import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Listen for console messages including warnings and errors
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
  console.log('Navigating to session...');
  await page.goto('http://localhost:5173/project/%2Fhome%2Frunner%2Fwork%2Fopencode-pwa%2Fopencode-pwa/ses_47f912d17ffedDrP6TBApSlc39', { 
    waitUntil: 'networkidle', 
    timeout: 30000 
  });
  await page.waitForTimeout(3000);
  
  console.log('\nLooking for input field...');
  const input = page.locator('textarea, [contenteditable="true"]').first();
  if (await input.isVisible()) {
    console.log('Found input, typing message...');
    await input.click();
    await input.fill('Hello, can you help me?');
    await page.waitForTimeout(1000);
    
    console.log('Looking for send button...');
    const sendBtn = page.locator('button[type="submit"], button:has-text("Send")').first();
    if (await sendBtn.isVisible()) {
      console.log('Clicking send...');
      await sendBtn.click();
      await page.waitForTimeout(5000);
      
      console.log('\nTaking screenshot after sending message...');
      await page.screenshot({ path: '/tmp/screenshot-message.png', fullPage: true });
      console.log('Screenshot saved');
    }
  }
  
} catch (error) {
  console.error('\n[Test Error]', error.message);
  console.error(error.stack);
}

await browser.close();
