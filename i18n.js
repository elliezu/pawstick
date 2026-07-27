// UI 문구. 시스템 언어에 따라 자동 선택된다.
// 새 언어를 추가하려면 아래에 항목을 하나 더 넣으면 된다.

const STRINGS = {
  en: {
    appName: 'PawStick',
    // 매니저 창
    newMemo: '+ New note',
    countSuffix: '',
    emptyTitle: 'No notes yet.',
    emptyHint: 'Use the button above to create one.',
    footerHint: 'Click a note to stick it back on your desktop. Closing this window keeps PawStick in the tray.',
    untitled: 'Untitled',
    openNow: 'Open',
    alarmTag: 'ALARM',
    confirmDelete: 'Delete "{title}"?',
    // 카드
    titlePlaceholder: 'Title',
    bodyPlaceholder: 'Write something',
    todoDefault: 'To do',
    tapeTooltip: 'Drag here to move',
    gripTooltip: 'Drag to resize',
    tipTodo: 'Turn line into a checkbox',
    tipAlarm: 'Alarm',
    tipPinOn: 'Keep on top',
    tipPinOff: 'Stop keeping on top',
    tipClose: 'Close',
    alarmLabel: 'Alarm time',
    alarmSet: 'Set',
    alarmCancel: 'Cancel',
    alarmClear: 'Clear alarm',
    alarmFallback: "It's time",
    notFound: 'Note not found',
    // 트레이
    trayNew: 'New note',
    trayList: 'Open note list',
    trayCloseAll: 'Close all open notes',
    trayAutoStart: 'Start with Windows',
    trayBackup: 'Backup',
    trayBackupOn: 'Automatic backup',
    trayBackupNow: 'Back up now',
    trayBackupOpen: 'Open backup folder',
    trayBackupFolder: 'Folder: {dir}',
    trayBackupChange: 'Change backup folder…',
    trayBackupReset: 'Reset to default folder',
    trayQuit: 'Quit',
    // 백업 대화상자
    backupDoneTitle: 'Backup complete',
    backupDoneMsg: 'Saved.',
    backupSkipTitle: 'Nothing backed up',
    backupOff: 'Automatic backup is turned off.',
    backupNoFile: 'No save file yet.',
    backupUnreadable: "Couldn't read the save file.",
    backupEmpty: 'There are no notes.',
    backupNoChange: 'Nothing has changed since the last backup.',
    backupUnknown: 'Reason unknown.',
    dialogPickFolder: 'Choose a backup folder'
  },

  ko: {
    appName: 'PawStick',
    newMemo: '+ 새 메모',
    countSuffix: '개',
    emptyTitle: '아직 메모가 없어요.',
    emptyHint: '위 버튼으로 하나 만들어 보세요.',
    footerHint: '목록에서 클릭하면 바탕화면에 다시 붙습니다. 창을 닫아도 트레이에 남아 있어요.',
    untitled: '제목 없음',
    openNow: '열려 있음',
    alarmTag: '알람',
    confirmDelete: '"{title}" 메모를 삭제할까요?',
    titlePlaceholder: '제목',
    bodyPlaceholder: '내용을 적어보세요',
    todoDefault: '할 일',
    tapeTooltip: '여기를 끌어서 이동',
    gripTooltip: '끌어서 크기 조절',
    tipTodo: '체크줄로 전환',
    tipAlarm: '알람',
    tipPinOn: '항상 위에 고정',
    tipPinOff: '항상 위 해제',
    tipClose: '닫기',
    alarmLabel: '알람 시각',
    alarmSet: '설정',
    alarmCancel: '취소',
    alarmClear: '알람 끄기',
    alarmFallback: '알람 시각입니다',
    notFound: '메모를 찾을 수 없습니다',
    trayNew: '새 메모',
    trayList: '메모 목록 열기',
    trayCloseAll: '열린 메모 전부 닫기',
    trayAutoStart: '윈도우 시작 시 실행',
    trayBackup: '백업',
    trayBackupOn: '자동 백업 사용',
    trayBackupNow: '지금 백업하기',
    trayBackupOpen: '백업 폴더 열기',
    trayBackupFolder: '폴더: {dir}',
    trayBackupChange: '백업 폴더 바꾸기…',
    trayBackupReset: '기본 폴더로 되돌리기',
    trayQuit: '종료',
    backupDoneTitle: '백업 완료',
    backupDoneMsg: '백업했습니다.',
    backupSkipTitle: '백업하지 않음',
    backupOff: '자동 백업이 꺼져 있습니다.',
    backupNoFile: '저장 파일이 아직 없습니다.',
    backupUnreadable: '저장 파일을 읽을 수 없습니다.',
    backupEmpty: '메모가 없습니다.',
    backupNoChange: '지난 백업 이후 변경된 내용이 없습니다.',
    backupUnknown: '이유를 알 수 없습니다.',
    dialogPickFolder: '백업할 폴더 선택'
  }
};

function pick(locale) {
  const l = String(locale || 'en').toLowerCase();
  if (l.startsWith('ko')) return 'ko';
  return 'en';
}

function make(locale) {
  const code = pick(locale);
  const dict = STRINGS[code];
  return {
    code,
    t(key, vars) {
      let s = dict[key] != null ? dict[key] : key;
      if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
      return s;
    }
  };
}

module.exports = { make, pick, STRINGS };
