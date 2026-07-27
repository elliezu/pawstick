const { contextBridge, ipcRenderer } = require('electron');

// 카드 창은 실행 인수로 자기 id를 받는다
const idArg = process.argv.find(a => a.startsWith('--memo-id='));
const MEMO_ID = idArg ? idArg.split('=')[1] : null;

contextBridge.exposeInMainWorld('api', {
  memoId: MEMO_ID,

  // UI 문구 (시스템 언어에 따라 결정됨)
  i18n:    ()           => ipcRenderer.invoke('i18n:all'),

  list:    ()           => ipcRenderer.invoke('memo:list'),
  get:     (id)         => ipcRenderer.invoke('memo:get', id),
  create:  ()           => ipcRenderer.invoke('memo:new'),
  open:    (id)         => ipcRenderer.invoke('memo:open', id),
  update:  (id, patch)  => ipcRenderer.invoke('memo:update', id, patch),
  pin:     (id, on)     => ipcRenderer.invoke('memo:pin', id, on),
  hide:    (id)         => ipcRenderer.invoke('memo:hide', id),
  remove:  (id)         => ipcRenderer.invoke('memo:delete', id),
  manager: ()           => ipcRenderer.invoke('app:manager'),

  onListChanged: (fn) => ipcRenderer.on('list:changed', fn)
});
