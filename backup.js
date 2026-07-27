// memos.json 을 설정된 폴더로 자동 백업.
// - 앱 시작 시 1회 / 6시간마다 / 종료 직전
// - 직전 백업과 내용이 같으면 건너뜀
// - 최근 N개만 보관
//
// 반환값의 skipped 는 i18n 키다. 문구는 main.js 에서 번역한다.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const settings = require('./settings');

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

function runBackup(srcFile, force) {
  try {
    if (!settings.get('backupEnabled') && !force) return { skipped: 'backupOff' };
    if (!fs.existsSync(srcFile)) return { skipped: 'backupNoFile' };

    const raw = fs.readFileSync(srcFile, 'utf8');

    // 빈 내용이나 깨진 JSON은 백업하지 않는다 (사고 방지)
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return { skipped: 'backupUnreadable' }; }
    if (!Array.isArray(parsed) || parsed.length === 0) return { skipped: 'backupEmpty' };

    const dir = settings.get('backupDir');
    fs.mkdirSync(dir, { recursive: true });

    const listOf = () => fs.readdirSync(dir)
      .filter(f => f.startsWith('memos_') && f.endsWith('.json'))
      .sort();

    // 직전 백업과 동일하면 건너뜀
    const list = listOf();
    if (list.length) {
      try {
        if (fs.readFileSync(path.join(dir, list[list.length - 1]), 'utf8') === raw) {
          return { skipped: 'backupNoChange' };
        }
      } catch {}
    }

    const out = path.join(dir, `memos_${stamp()}.json`);
    fs.writeFileSync(out, raw, 'utf8');

    // 오래된 백업 정리
    const keep = Number(settings.get('backupKeep')) || 20;
    const after = listOf();
    while (after.length > keep) {
      try { fs.unlinkSync(path.join(dir, after.shift())); } catch { break; }
    }

    return { saved: out };
  } catch (e) {
    console.error('Backup failed:', e);
    return { error: e.message };
  }
}

module.exports = {
  now: (srcFile) => runBackup(srcFile, true),
  start(srcFile) {
    runBackup(srcFile);
    setInterval(() => runBackup(srcFile), 6 * 60 * 60 * 1000);
    app.on('before-quit', () => runBackup(srcFile));
  }
};
