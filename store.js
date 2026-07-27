// 메모 데이터를 JSON 파일 하나로 읽고 쓴다.
// 저장 위치: %APPDATA%\memo\memos.json
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const FILE = path.join(app.getPath('userData'), 'memos.json');

let cache = null;
let timer = null;

function readAll() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (!Array.isArray(cache)) cache = [];
  } catch {
    cache = [];
  }
  return cache;
}

// 잦은 호출을 묶어서 저장 (400ms)
function flush() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, JSON.stringify(cache, null, 2), 'utf8');
    } catch (e) {
      console.error('저장 실패:', e);
    }
  }, 400);
}

module.exports = {
  FILE,
  all: () => readAll(),
  get: (id) => readAll().find(m => m.id === id),
  add(memo) {
    readAll().push(memo);
    flush();
    return memo;
  },
  update(id, patch) {
    const m = readAll().find(x => x.id === id);
    if (!m) return null;
    Object.assign(m, patch, { updatedAt: Date.now() });
    flush();
    return m;
  },
  remove(id) {
    cache = readAll().filter(m => m.id !== id);
    flush();
  }
};
