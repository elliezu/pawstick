// 카드 창 로직. index.html 에서 로드된다.
const COLORS = ['#FFDCC6','#FCEFAF','#C8EEDD','#CDE3FA','#E1D4F4','#FAD3E1'];
const ID    = window.api.memoId;
const card  = document.getElementById('card');
const body  = document.querySelector('.body');
const title = document.querySelector('.title');
const pal   = document.getElementById('pal');

const pop        = document.getElementById('pop');
const alarmBar   = document.getElementById('alarmBar');
const alarmTxt   = document.getElementById('alarmTxt');
const alarmInput = document.getElementById('alarmInput');
const btnPin     = document.getElementById('btnPin');

let memo = null, saveTimer = null;
let alarmAt = null, fired = false, pinned = false;
let S = {}, LOCALE = 'en';
const t = k => (S[k] != null ? S[k] : k);

function save(patch){
  Object.assign(memo, patch);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=> window.api.update(ID, patch), 350);
}

function applyColor(i){
  card.style.background = COLORS[i];
  pal.querySelectorAll('button').forEach((x,j)=> x.setAttribute('aria-pressed', j===i));
}

const pad = n => String(n).padStart(2,'0');
const toLocalValue = d =>
  `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function paintAlarm(){
  if(!alarmAt){ alarmBar.classList.remove('on','due'); return; }
  const d = new Date(alarmAt);
  alarmTxt.textContent = '\u23F0 ' + d.toLocaleString(LOCALE === 'ko' ? 'ko-KR' : 'en-US',
    {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  alarmBar.classList.add('on');
  alarmBar.classList.toggle('due', Date.now() >= alarmAt);
}

/* 현재 커서가 있는 블록 요소를 찾는다.
   contenteditable 첫 줄은 블록 없이 텍스트만 있을 수 있어서 그 경우 div로 감싼다. */
function currentBlock(){
  const sel = window.getSelection();
  if(!sel.rangeCount) return null;
  let n = sel.anchorNode;
  if(!n || !body.contains(n)) return null;

  // body 직속 텍스트 노드면 div로 감싸기
  if(n.nodeType === 3 && n.parentNode === body){
    const d = document.createElement('div');
    body.insertBefore(d, n);
    d.appendChild(n);
    return d;
  }
  while(n && n.parentNode !== body) n = n.parentNode;
  return (n && n.nodeType === 1) ? n : null;
}

/* 보이는 마지막 지점에 커서를 둔다.
   반드시 el 이 반 경우를 처리해야 함 — contenteditable 에서 반 반록은
   <br> 이 없으면 커서가 엉은 자리를 잃어서 ::before 어기로 밀려보인다. */
function caretToEnd(el){
  const sel = window.getSelection();
  const r = document.createRange();

  // 반 반록이면 <br> 을 넣어 커서 자리를 만들어 줍니다
  if(!el.firstChild){
    el.appendChild(document.createElement('br'));
  }

  const last = el.lastChild;
  if(last && last.nodeName === 'BR'){
    r.setStartBefore(last);
  } else if(last && last.nodeType === 3){
    r.setStart(last, last.length);
  } else {
    r.selectNodeContents(el);
    r.collapse(false);
  }
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

/* 마크다운식 자동 서식
   "- "  → 불릿 목록
   "[] " → 체크박스 */
function autoFormat(){
  const el = currentBlock();
  if(!el) return false;

  const txt = el.textContent;
  let cut = 0, kind = null;

  let m = txt.match(/^[-*]\s/);
  if(m){ cut = m[0].length; kind = 'bullet'; }
  if(!kind){
    m = txt.match(/^\[\s?\]\s?/);
    if(m){ cut = m[0].length; kind = 'todo'; }
  }
  if(!kind) return false;

  if(kind === 'bullet' && el.classList.contains('bullet')) return false;
  if(kind === 'todo'   && el.classList.contains('todo'))   return false;

  el.classList.remove('bullet', 'todo');
  delete el.dataset.done;

  el.textContent = txt.slice(cut);
  if(kind === 'bullet'){
    el.classList.add('bullet');
  } else {
    el.classList.add('todo');
    el.dataset.done = '0';
  }
  // 내용이 반 줄이면 <br> 을 넣어야 커서가 제자리에 섬니다
  if(!el.textContent) el.innerHTML = '<br>';
  caretToEnd(el);
  return true;
}

/* 서식 벗어나기 — 내용이 빈 서식 줄에서 백스페이스를 누르면 서식을 푼다.
   노션과 같은 방식. */
function escapeFormat(){
  const el = currentBlock();
  if(!el) return false;
  if(!el.classList.contains('bullet') && !el.classList.contains('todo')) return false;
  if(el.textContent.length > 0) return false;

  el.classList.remove('bullet', 'todo');
  delete el.dataset.done;
  el.innerHTML = '<br>';
  caretToEnd(el);
  return true;
}

function toggleTodo(){
  body.focus();
  const sel = window.getSelection();
  let n = sel.anchorNode;
  if(!n || !body.contains(n)){
    const d = document.createElement('div');
    d.className='todo'; d.dataset.done='0'; d.textContent=t('todoDefault');
    body.appendChild(d); save({body:body.innerHTML}); return;
  }
  while(n && n.parentNode !== body) n = n.parentNode;
  if(!n) return;
  if(n.nodeType === 3){
    const d = document.createElement('div');
    d.className='todo'; d.dataset.done='0';
    n.parentNode.insertBefore(d, n); d.appendChild(n);
  } else if(n.classList.contains('todo')){
    n.classList.remove('todo'); delete n.dataset.done;
  } else {
    n.classList.add('todo'); n.dataset.done='0';
  }
  save({body:body.innerHTML});
}

(async function init(){
  const info = await window.api.i18n();
  S = info.strings; LOCALE = info.code;
  document.documentElement.lang = LOCALE;

  title.dataset.ph = t('titlePlaceholder');
  body.dataset.ph  = t('bodyPlaceholder');
  document.getElementById('tape').title = t('tapeTooltip');
  document.querySelector('.grip').title = t('gripTooltip');
  document.getElementById('btnTodo').title  = t('tipTodo');
  document.getElementById('btnAlarm').title = t('tipAlarm');
  document.getElementById('btnDel').title   = t('tipClose');
  document.getElementById('btnAlarmOff').title = t('alarmClear');
  document.getElementById('popLabel').textContent = t('alarmLabel');
  document.getElementById('popOk').textContent    = t('alarmSet');
  document.getElementById('popNo').textContent    = t('alarmCancel');

  COLORS.forEach((c,i)=>{
    const b = document.createElement('button');
    b.style.background = c;
    b.onclick = ()=>{ applyColor(i); save({color:i}); };
    pal.appendChild(b);
  });

  memo = await window.api.get(ID);
  if(!memo){
    document.body.innerHTML = '<p style="padding:20px">' + t('notFound') + '</p>';
    return;
  }
  title.textContent = memo.title || '';
  body.innerHTML    = memo.body  || '';
  applyColor(memo.color || 0);
  alarmAt = memo.alarm || null;
  fired   = !!memo.fired;
  paintAlarm();
  pinned = !!memo.pinned;
  btnPin.setAttribute('aria-pressed', pinned);
  btnPin.title = pinned ? t('tipPinOff') : t('tipPinOn');
  if(!memo.title && !memo.body) title.focus();
})();

title.addEventListener('input', ()=> save({title:title.textContent}));
title.addEventListener('keydown', e=>{
  if(e.key==='Enter'){ e.preventDefault(); body.focus(); }
});

body.addEventListener('input', ()=>{
  autoFormat();
  save({body:body.innerHTML});
});
body.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='b'){
    e.preventDefault(); document.execCommand('bold'); save({body:body.innerHTML});
  }
  if(e.key==='Tab'){
    e.preventDefault();
    document.execCommand(e.shiftKey ? 'outdent' : 'indent');
    save({body:body.innerHTML});
  }
  if(e.key==='Backspace'){
    if(escapeFormat()){
      e.preventDefault();
      save({body:body.innerHTML});
    }
  }
});
body.addEventListener('click', e=>{
  const line = e.target.closest('.todo');
  if(!line) return;
  if(e.clientX - line.getBoundingClientRect().left > 22) return;
  line.dataset.done = line.dataset.done === '1' ? '0' : '1';
  save({body:body.innerHTML});
});

document.getElementById('btnTodo').onclick = toggleTodo;

document.getElementById('btnAlarm').onclick = ()=>{
  alarmInput.value = toLocalValue(alarmAt ? new Date(alarmAt) : new Date(Date.now()+3600000));
  pop.classList.add('on'); alarmInput.focus();
};
document.getElementById('popNo').onclick = ()=> pop.classList.remove('on');
document.getElementById('popOk').onclick = ()=>{
  if(alarmInput.value){
    alarmAt = new Date(alarmInput.value).getTime();
    fired = false; paintAlarm();
    save({alarm:alarmAt, fired:false});
  }
  pop.classList.remove('on');
};
document.getElementById('btnAlarmOff').onclick = ()=>{
  alarmAt = null; fired = false; paintAlarm();
  save({alarm:null, fired:false});
};

setInterval(()=>{
  if(!alarmAt || fired) return;
  if(Date.now() >= alarmAt){
    fired = true; paintAlarm(); save({fired:true});
    new Notification(title.textContent.trim() || t('appName'), {
      body: body.innerText.trim().slice(0,100) || t('alarmFallback'),
      requireInteraction: true
    });
  }
}, 20000);

btnPin.onclick = async ()=>{
  pinned = !pinned;
  await window.api.pin(ID, pinned);
  memo.pinned = pinned;
  btnPin.setAttribute('aria-pressed', pinned);
  btnPin.title = pinned ? t('tipPinOff') : t('tipPinOn');
};

document.getElementById('btnDel').onclick = ()=> window.api.hide(ID);

document.querySelector('.grip').addEventListener('mousedown', e=>{
  e.preventDefault(); e.stopPropagation();
  const sx = e.screenX, sy = e.screenY;
  const ow = window.outerWidth, oh = window.outerHeight;
  const move = ev=>{
    const w = Math.max(190, ow + ev.screenX - sx);
    const h = Math.max(150, oh + ev.screenY - sy);
    window.resizeTo(w, h);
  };
  const up = ()=>{
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
});
