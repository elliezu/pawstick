const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, dialog } = require('electron');
const path = require('path');

// ── store/backup 을 require 하기 전에 반드시 실행해야 함 ──
// store.js 가 모듈 로드 시점에 app.getPath('userData')로 경로를 확정하기 때문.
app.setPath('userData', path.join(app.getPath('appData'), 'pawstick'));

const store = require('./store');
const settings = require('./settings');
const backup = require('./backup');
const i18n = require('./i18n');

// 시스템 언어에 따라 UI 언어 자동 선택 (한국어면 ko, 그 외는 en)
let L = i18n.make('en');
const t = (k, v) => L.t(k, v);

app.setAppUserModelId('kr.studiocats.pawstick');

const TRAY_ICON = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD1ElEQVR4nOWXvW8cZRDGfzPv7u2dE/v8EdkFEEfGWIrMh8BKXCEFUSAKREBKhxQJuaBPAQWSZYk/gIIeKRKNKShSpTNVAMkKuIEChQQhIUUyjj9v93b3HYo92+fznb2+RDQ83d2unnmeeeednYH/O6TzDzMr/ltZcVy7lgPvAF8Am4CW5PVAHfgcuNvGhYhY+4vBkeCLiyoivvUzawk6D7wCrAOupIAcGAPOtwJm7QbbRRwRIEtL3u5/N4wLhYp3NLdzmo0BKrUdYO+MAiKajQFb+2aEymDBVa8jIhtHYu47Z3ZWmOYratENGjGYKpbC2FTKpfm44Dx2Yj1ghdaHP1ZZfxAiIYj3VCpKM13BVz9i7r0GCIHZoooseVtdniaqfEKWgwtABLwHpAHsgCt7/vvwIIMEroY6QCHLYWToAza2rojI92bL7vAIQg2Imx5MEDEMwTwk28I/j4bwWVn7BTQwkm0h84ZkrayIJ26C5QdxDwWYNwQ9SLMgiIO99SoPH1fP6L7F4SjcF4QYAqaY616EPVhAwr7iF65PRgkB5Yj6xYkCvJk/6flZoV1uUW8BIuhAVREBe8oM7HPsxseIegrIzfza6q/31rd2t0KnDutThYikuc/HhgaGXrs8Na8dMbsLUJU8zZrLd+/98Pujv5/UqpUg71OAE5FG3MymJyeGX56ZfENVg+ywM/cQkHurhC76dOH6zSRJ90REpc9zMETMzEdRMBAGQUTuCdrCdhcgQO4ZHh+9QBDw9LdAIMtgJ/adddhdgAHOEW9s76ZZGiOiYtJfBsQEMx8GYbUaVQY6vfSoAZFmmja/vH3n6wd/PX5SrUZB7vP+akCdxHGSTT0/Pnzr4/cXQo2qp9eAYarOzb868+KlFyY2oyBwvs8iVBFJsiyfGKnXVdVhlKgBjEDFvfXm6+/irdxX2Cje024fTQNRaCTWWU+9G5FZQVZ2BEHAPL6RdM+UgRaT0BE7vRsR+LX7v5VrRCKSpGn23PjoxOzM5BxZbogczZsAdvw6PZNGFIjo+m4jefvq5YuzL12cM+mM3hsnNqLPFq7fTNJsTxHtIr4dYmb5uVo0WBxFybrpKUAAb9RH6xdwWq4PCcXIlWaUtt9FgKdt9vdx0xDstGHQW2uMA9HTs+9x2mUiEhUqTkmavsi4iZa0oodzvnUrtAOYecIgYCdpnwmXzMyE1Tt/IvFPDA9dJU5AzzaDngozqITK9t4fRNFaawPzxV7Q2lbs59vniEauECdC7p+tAueNWk3YzH+R+Q/XOzek/xQH+ycdl6V48O1ZF5Az4oZvd/4veo6u8g2yfKwAAAAASUVORK5CYII=';

const cards = new Map();   // id -> BrowserWindow
let manager = null;
let tray = null;

/* ── 목록 창 ────────────────────── */
function openManager() {
  if (manager && !manager.isDestroyed()) { manager.show(); manager.focus(); return; }
  manager = new BrowserWindow({
    width: 340, height: 520,
    minWidth: 280, minHeight: 320,
    title: t('appName'),
    icon: nativeImage.createFromDataURL('data:image/png;base64,' + TRAY_ICON),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false
    }
  });
  manager.loadFile(path.join(__dirname, 'manager.html'));
  manager.on('closed', () => { manager = null; });
}

function pushList() {
  if (manager && !manager.isDestroyed()) manager.webContents.send('list:changed');
}

/* ── 카드 창 ────────────────────── */
function openCard(id) {
  const m = store.get(id);
  if (!m) return;
  const exist = cards.get(id);
  if (exist && !exist.isDestroyed()) { exist.show(); exist.focus(); return; }

  const win = new BrowserWindow({
    width: m.w || 252, height: m.h || 200,
    x: Number.isInteger(m.x) ? m.x : undefined,
    y: Number.isInteger(m.y) ? m.y : undefined,
    minWidth: 190, minHeight: 150,
    frame: false, transparent: true, hasShadow: false,
    alwaysOnTop: !!m.pinned,
    skipTaskbar: true, resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
      additionalArguments: ['--memo-id=' + id]
    }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  cards.set(id, win);
  store.update(id, { open: true });

  const saveBounds = () => {
    if (win.isDestroyed()) return;
    const b = win.getBounds();
    store.update(id, { x: b.x, y: b.y, w: b.width, h: b.height });
  };
  win.on('moved', saveBounds);
  win.on('resized', saveBounds);
  win.on('closed', () => {
    cards.delete(id);
    if (store.get(id)) store.update(id, { open: false });
    pushList();
  });
}

function newMemo() {
  const now = Date.now();
  const m = {
    id: 'm' + now + Math.random().toString(36).slice(2, 6),
    title: '', body: '', color: 0,
    x: null, y: null, w: 252, h: 200,
    alarm: null, fired: false, pinned: false,
    createdAt: now, updatedAt: now
  };
  store.add(m);
  openCard(m.id);
  pushList();
  return m.id;
}

/* ── IPC ────────────────────────── */
ipcMain.handle('memo:list',   () => store.all());
ipcMain.handle('memo:get',    (e, id) => store.get(id));
ipcMain.handle('memo:new',    () => newMemo());
ipcMain.handle('memo:open',   (e, id) => openCard(id));
ipcMain.handle('app:manager', () => openManager());

// 렌더러에 UI 문구 전달
ipcMain.handle('i18n:all', () => ({ code: L.code, strings: i18n.STRINGS[L.code] }));

ipcMain.handle('memo:update', (e, id, patch) => {
  store.update(id, patch);
  pushList();
});

ipcMain.handle('memo:pin', (e, id, on) => {
  const w = cards.get(id);
  if (w && !w.isDestroyed()) w.setAlwaysOnTop(!!on);
  store.update(id, { pinned: !!on });
});

// 카드 창만 닫기 (내용은 남음)
ipcMain.handle('memo:hide', (e, id) => {
  const w = cards.get(id);
  if (w && !w.isDestroyed()) w.close();
});

// 완전 삭제
ipcMain.handle('memo:delete', (e, id) => {
  const w = cards.get(id);
  if (w && !w.isDestroyed()) w.close();
  store.remove(id);
  pushList();
});

/* ── 시작 시 자동 실행 ──────────── */
// 개발 모드(electron.exe로 직접 실행)에서는 프로젝트 경로를 인수로 넘겨야 한다.
const isDev = !!process.defaultApp;

function autoLaunchOpts() {
  return isDev ? { path: process.execPath, args: [path.resolve(__dirname)] } : {};
}
function getAutoLaunch() {
  return app.getLoginItemSettings(autoLaunchOpts()).openAtLogin;
}
function setAutoLaunch(on) {
  app.setLoginItemSettings(Object.assign({ openAtLogin: !!on }, autoLaunchOpts()));
}

/* ── 트레이 ─────────────────────── */
function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: t('trayNew'),  click: () => newMemo() },
    { label: t('trayList'), click: () => openManager() },
    { type: 'separator' },
    { label: t('trayCloseAll'), click: () => {
        cards.forEach(w => { if (!w.isDestroyed()) w.close(); });
      } },
    { type: 'separator' },
    { label: t('trayAutoStart'),
      type: 'checkbox',
      checked: getAutoLaunch(),
      click: (item) => {
        setAutoLaunch(item.checked);
        tray.setContextMenu(buildTrayMenu());
      } },
    { type: 'separator' },
    { label: t('trayBackup'),
      submenu: [
        { label: t('trayBackupOn'),
          type: 'checkbox',
          checked: !!settings.get('backupEnabled'),
          click: (item) => {
            settings.set('backupEnabled', item.checked);
            tray.setContextMenu(buildTrayMenu());
          } },
        { type: 'separator' },
        { label: t('trayBackupNow'), click: () => {
            const r = backup.now(store.FILE);
            if (r.saved) {
              dialog.showMessageBox({ type: 'info',
                title: t('backupDoneTitle'),
                message: t('backupDoneMsg'),
                detail: r.saved });
            } else {
              dialog.showMessageBox({ type: 'warning',
                title: t('backupSkipTitle'),
                message: r.skipped ? t(r.skipped) : (r.error || t('backupUnknown')) });
            }
          } },
        { label: t('trayBackupOpen'), click: () => {
            const dir = settings.get('backupDir');
            require('fs').mkdirSync(dir, { recursive: true });
            shell.openPath(dir);
          } },
        { type: 'separator' },
        { label: t('trayBackupFolder', { dir: settings.get('backupDir') }), enabled: false },
        { label: t('trayBackupChange'), click: async () => {
            const r = await dialog.showOpenDialog({
              title: t('dialogPickFolder'),
              defaultPath: settings.get('backupDir'),
              properties: ['openDirectory', 'createDirectory']
            });
            if (!r.canceled && r.filePaths[0]) {
              settings.set('backupDir', r.filePaths[0]);
              tray.setContextMenu(buildTrayMenu());
            }
          } },
        { label: t('trayBackupReset'), click: () => {
            settings.resetBackupDir();
            tray.setContextMenu(buildTrayMenu());
          } }
      ] },
    { type: 'separator' },
    { label: t('trayQuit'), click: () => { app.isQuitting = true; app.quit(); } }
  ]);
}

function makeTray() {
  const img = nativeImage.createFromDataURL('data:image/png;base64,' + TRAY_ICON);
  tray = new Tray(img);
  tray.setToolTip(t('appName'));
  tray.setContextMenu(buildTrayMenu());
  tray.on('double-click', () => openManager());
}

/* ── 시작 ───────────────────────── */
app.whenReady().then(() => {
  const sys = (typeof app.getSystemLocale === 'function') ? app.getSystemLocale() : app.getLocale();
  L = i18n.make(sys || app.getLocale());
  Menu.setApplicationMenu(null);
  makeTray();
  backup.start(store.FILE);
  const opened = store.all().filter(m => m.open);
  opened.forEach(m => openCard(m.id));
  if (!opened.length) openManager();
});

// 창을 다 닫아도 트레이에 남아있게 (종료는 트레이 메뉴로)
app.on('window-all-closed', () => {});
