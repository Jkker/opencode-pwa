import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

let hasError = false;

// Listen for console messages including warnings and errors
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'warning' || type === 'error') {
    console.log(`\n[Browser ${type}] ${text}`);
    if (text.includes('unrecognized') || text.includes('ref')) {
      hasError = true;
    }
  }
});

// Listen for page errors
page.on('pageerror', error => {
  console.error(`\n[Page Error] ${error.message}`);
  console.error(error.stack);
  hasError = true;
});

try {
  console.log('Navigating to session...');
  await page.goto('http://localhost:5173/project/%2Fhome%2Frunner%2Fwork%2Fopencode-pwa%2Fopencode-pwa/ses_47f912d17ffedDrP6TBApSlc39', { 
    waitUntil: 'domcontentloaded', 
    timeout: 30000 
  });
  await page.waitForTimeout(5000);
  
  console.log('\nChecking page content...');
  const title = await page.title();
  console.log('Page title:', title);
  
  console.log('\nTaking screenshot...');
  await page.screenshot({ path: '/tmp/screenshot-check.png', fullPage: true });
  console.log('Screenshot saved');
  
  console.log('\nErrors detected:', hasError);
  
} catch (error) {
  console.error('\n[Test Error]', error.message);
}

await browser.close();
