const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

test('compact input submits once, expands, minimizes and retains conversation', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<main><h1>WKND</h1></main>');
    await page.addStyleTag({
      path: path.join(__dirname, '..', 'styles', 'brand-concierge.css'),
    });
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'scripts', 'concierge-shell.js'), 'utf8',
    ).replace('export default function', 'function');
    await page.addScriptTag({ content: source });
    await page.evaluate(() => {
      window.submissions = 0;
      window.shell = createConciergeShell();
      window.shell.mount.innerHTML = `<div class="brand-concierge-flex-wrapper">
        <div class="brand-concierge-container"><div class="chat-interface">
        <div class="header-section">Welcome</div>
        <div class="conversation">Previous answer</div>
        <div class="input-section"><input class="chat-input" aria-label="Question">
        <button id="send">Send</button></div></div></div></div>`;
      document.querySelector('#send').addEventListener('click', () => {
        window.submissions += 1;
        window.shell.onEvent({ eventType: 'query:submitted' });
      });
      window.shell.onEvent({ eventType: 'webclient:initialized' });
    });
    assert.equal(await page.locator('.conversation').isVisible(), false);
    assert.equal(await page.locator('.chat-input').isVisible(), true);
    await page.locator('.chat-input').fill('What is WKND?');
    await page.locator('#send').click();
    assert.equal(await page.locator('dialog').evaluate((el) => el.matches(':modal')), true);
    assert.equal(await page.locator('.conversation').isVisible(), true);
    assert.equal(await page.evaluate(() => window.submissions), 1);
    await page.getByRole('button', { name: 'Minimize', exact: true }).click();
    assert.equal(await page.locator('dialog').evaluate((el) => el.matches(':modal')), false);
    assert.equal(await page.locator('.chat-input').inputValue(), 'What is WKND?');
    await page.getByRole('button', { name: 'Open chat', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').evaluate((el) => el.matches(':modal')), false);
    assert.equal(await page.locator('.chat-input').evaluate((el) => el === document.activeElement), true);
    await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
    assert.equal(await page.locator('dialog').isVisible(), false);
    await page.getByRole('button', { name: 'Ask WKND', exact: true }).click();
    assert.equal(await page.locator('.chat-input').isVisible(), true);
    assert.equal(await page.locator('.conversation').textContent(), 'Previous answer');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open chat', exact: true }).click();
    const bounds = await page.locator('dialog').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 844);
    await page.keyboard.press('Escape');
    await page.evaluate(() => window.shell.fail());
    assert.equal(await page.getByRole('status').textContent(),
      'Chat could not load. Please reload the page to try again.');
  } finally {
    await browser.close();
  }
});
