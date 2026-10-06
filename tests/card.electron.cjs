// Run with: node_modules/.bin/electron tests/card.electron.cjs
// Real Chromium editing/selection with isolated fake IPC; never loads user notes.
const { app, BrowserWindow, ipcMain } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pawstick-card-test-'));
app.setPath('userData', profile);
let note = { id: 'test', title: '', body: '', color: 0 };
ipcMain.handle('i18n:all', () => ({ code: 'ko', strings: require('../i18n').STRINGS.ko }));
ipcMain.handle('memo:get', () => note);
ipcMain.handle('memo:update', (_, id, patch) => Object.assign(note, patch));
ipcMain.handle('memo:pin', () => {});
ipcMain.handle('memo:hide', () => {});
let win;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const js = code => win.webContents.executeJavaScript(code, true);
async function click(selector, dx, dy) {
  const point = await js(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + ${dx ?? 'r.width / 2'}, y: r.y + ${dy ?? 'r.height / 2'} }; })()`);
  const p = { x: Math.round(point.x), y: Math.round(point.y), button: 'left', clickCount: 1 };
  win.webContents.sendInputEvent({ type: 'mouseMove', ...p });
  win.webContents.sendInputEvent({ type: 'mouseDown', ...p });
  win.webContents.sendInputEvent({ type: 'mouseUp', ...p });
  await delay(80);
}
async function key(keyCode) {
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode });
  if(keyCode === 'Enter') win.webContents.sendInputEvent({ type: 'char', keyCode: '\r' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode });
  await delay(40);
}
async function fixture(html, selection) {
  await js(`(() => { body.innerHTML = ${JSON.stringify(html)}; body.focus(); ${selection || 'const r = document.createRange(); r.selectNodeContents(body); r.collapse(false); window.getSelection().removeAllRanges(); window.getSelection().addRange(r);'} })()`);
}
async function run() {
  win = new BrowserWindow({ show: false, width: 420, height: 500, webPreferences: {
    preload: path.join(root, 'preload.js'), contextIsolation: true, nodeIntegration: false,
    additionalArguments: ['--memo-id=test']
  }});
  const errors = [];
  win.webContents.on('console-message', details => {
    if (details.level === 'error' && !details.message.includes('ERR_')) errors.push(details.message);
  });
  await win.loadFile(path.join(root, 'index.html'));
  await delay(150);
  await fixture('');
  await win.webContents.insertText('ㅎ');
  assert.equal(await js('body.firstChild.nodeType'), 3, 'ordinary text must remain untouched by auto-format');
  await js(`(() => {
    const node = body.firstChild;
    body.dispatchEvent(new CompositionEvent('compositionstart', { data: 'ㅎ' }));
    node.textContent = '한'; caretToEnd(body);
    body.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, inputType: 'insertCompositionText', data: '한' }));
    if(body.firstChild !== node) throw new Error('IME text node was replaced');
    body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }));
    body.dispatchEvent(new CompositionEvent('compositionend', { data: '한' }));
    if(body.firstChild !== node) throw new Error('plain Korean text was wrapped after composition');
  })()`);
  await win.webContents.insertText('글 본문');
  assert.equal(await js('body.textContent'), '한글 본문');
  await delay(450);
  assert.equal(note.body, '한글 본문');
  console.log('PASS plain Korean text, IME composition node preservation and save');
  await fixture('');
  await js('title.focus();');
  // Fresh note starts with title focus and no body child nodes.
  await click('#btnTodo');
  assert.equal(await js('body.querySelectorAll(".todo").length'), 1, 'toolbar must create a checklist in a blank note');
  assert.equal(await js('document.activeElement === body'), true);
  console.log('PASS blank note toolbar');
  await fixture('<div>first</div><div>second</div>', 'caretToEnd(body.firstElementChild);');
  await click('#btnTodo');
  assert.equal(await js('body.firstElementChild.classList.contains("todo")'), true, 'toolbar must use the selected line, not the last line');
  assert.equal(await js('body.lastElementChild.classList.contains("todo")'), false);
  await click('#btnTodo');
  assert.equal(await js('body.querySelectorAll(".todo").length'), 0, 'second click removes checklist formatting');
  console.log('PASS existing line and toggle off');
  await fixture('plain text');
  await click('#btnTodo');
  assert.equal(await js('body.querySelector(".todo").textContent'), 'plain text');
  console.log('PASS root text');
  await fixture('<blockquote><div>nested</div></blockquote>', 'caretToEnd(body.querySelector("blockquote div"));');
  await click('#btnTodo');
  assert.equal(await js('body.querySelector("blockquote div").classList.contains("todo")'), true);
  assert.equal(await js('body.querySelector("blockquote").classList.contains("todo")'), false);
  console.log('PASS indented line');
  await fixture('<div class="bullet">bullet</div>');
  await click('#btnTodo');
  assert.equal(await js('body.firstElementChild.className'), 'todo', 'a checkbox must replace the bullet marker');
  console.log('PASS bullet conversion');
  await fixture('<div class="todo" data-done="0">first</div>', 'caretToEnd(body.firstElementChild);');
  await key('End');
  await key('Enter');
  assert.equal(await js('body.querySelectorAll(".todo").length'), 2);
  await win.webContents.insertText('second');
  await click('.todo', 8, 10);
  assert.equal(await js('body.firstElementChild.dataset.done'), '1');
  await delay(450);
  assert.match(note.body, /data-done="1"/);
  await win.reload();
  await delay(200);
  assert.equal(await js('body.firstElementChild.dataset.done'), '1', 'checked state survives reopening');
  assert.equal(await js('body.querySelectorAll(".todo").length'), 2);
  console.log('PASS Enter, completion, save and reload');
  await fixture('[] ');
  await js('body.dispatchEvent(new InputEvent("input", { bubbles: true }));');
  assert.equal(await js('body.querySelectorAll(".todo").length'), 1);
  await key('Backspace');
  assert.equal(await js('body.querySelectorAll(".todo").length'), 0);
  console.log('PASS markdown and empty-line Backspace');
  assert.deepEqual(errors, [], 'no renderer errors');
}
app.whenReady().then(run).then(() => app.exit(0)).catch(error => {
  console.error(error);
  app.exit(1);
});
// Chromium may still hold profile files during quit on Windows. Leave this
// isolated temporary profile for OS cleanup instead of throwing on shutdown.
setTimeout(() => { console.error('Test timed out'); app.exit(1); }, 20000).unref();
