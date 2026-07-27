// 앱 설정 (백업 폴더 등). userData\settings.json 에 저장.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const FILE = path.join(app.getPath('userData'), 'settings.json');

// 기본 백업 위치: 실행 파일 옆 backup 폴더.
// 설치판은 프로그램 폴더가 쓰기 제한될 수 있어 문서 폴더로 잡는다.
function defaultBackupDir() {
  if (app.isPackaged) {
    return path.join(app.getPath('documents'), 'memo-backup');
  }
  return path.join(__dirname, 'backup');
}

const DEFAULTS = {
  backupDir: defaultBackupDir(),
  backupEnabled: true,
  backupKeep: 20
};

let cache = null;

function read() {
  if (cache) return cache;
  try {
    cache = Object.assign({}, DEFAULTS, JSON.parse(fs.readFileSync(FILE, 'utf8')));
  } catch {
    cache = Object.assign({}, DEFAULTS);
  }
  return cache;
}

function write() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.error('설정 저장 실패:', e);
  }
}

module.exports = {
  FILE,
  DEFAULTS,
  get: (k) => read()[k],
  all: () => read(),
  set(k, v) {
    read()[k] = v;
    write();
    return v;
  },
  resetBackupDir() {
    return this.set('backupDir', defaultBackupDir());
  }
};
