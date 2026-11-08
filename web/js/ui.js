// Interface: dialogen, joystick, knoppen, minikaart, beloningen, menu's.
import { S } from './state.js';
import { SND, ac } from './audio.js';
import { NPCS, ITEMS } from './story.js';

export const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const fill = s => s.replace(/\{naam\}/g, esc(S.name || 'kanjer'));

const EMOJI = { uil: '🦉', muis: '🐭', draak: '🐲', vos: '🦊', beer: '🐻', beer_full: '🐻' };
export const ITEM_EMOJI = { cape: '🦸', lantaarn: '🏮', megafoon: '📣', ballon: '🎈', laarzen: '🥾', magneet: '🧲', kristal: '💎', bril: '😎', armband: '📿', schild: '🛡️', hoed: '🤠', rugzak: '🎒', sjaal: '🧣', vleugels: '🦋', schelp: '🐚', fluit: '🎶', kroon: '👑' };
const NAME_COL = { uil: '#7c5cff', muis: '#ff7eb6', draak: '#2fbf71', vos: '#ff8a3d', beer: '#a0652f' };

export function portraitImg(who, cls = '') {
  return `<span class="portrait ${cls}" data-e="${EMOJI[who] || '🐻'}"><img src="assets/portraits/${who}.png" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()"></span>`;
}
export function iconImg(item, cls = '') {
  return `<span class="icon ${cls}" data-e="${ITEM_EMOJI[item] || '⭐'}"><img src="assets/icons/${item}.png" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()"></span>`;
}

/* ---------- kleine dingen ---------- */
export function confetti(n = 60) {
  const cols = ['#ff8a3d', '#2fbf71', '#7c5cff', '#ffd23f', '#ff5d8f', '#3ab0ff'];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'confetti';
    d.style.left = Math.random() * 100 + 'vw'; d.style.background = cols[i % cols.length];
    d.style.animationDuration = (2 + Math.random() * 2) + 's'; d.style.animationDelay = (Math.random() * .5) + 's';
    document.body.appendChild(d); setTimeout(() => d.remove(), 5000);
  }
}
export function overlay(html, cls = '') {
  const o = document.createElement('div'); o.className = 'overlay ' + cls; o.innerHTML = `<div class="ov-card">${html}</div>`;
  document.body.appendChild(o); return o;
}
let toastT = null;
export function toast(msg, ms = 2600) {
  const t = $('#toast'); t.innerHTML = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}
export function banner(big, small, emoji = '✨') {
  const b = document.createElement('div'); b.className = 'banner';
  b.innerHTML = `<div class="b-emoji">${emoji}</div><div class="b-big">${big}</div><div class="b-small">${small || ''}</div>`;
  document.body.appendChild(b); setTimeout(() => b.classList.add('out'), 2200); setTimeout(() => b.remove(), 2800);
}

/* ---------- dialogen (typemachine, zoals Animal Crossing) ---------- */
export function say(who, lines, choices) {
  return new Promise(res => {
    const box = $('#dialog'), n = NPCS[who];
    const name = who === 'beer' ? (S.name || 'Jij') : (n ? n.name : who);
    box.innerHTML = `<div class="dlg"><div class="nametag" style="background:${NAME_COL[who] || '#7c5cff'}">${esc(name)}</div>
      ${portraitImg(who, 'dlg-port')}<div class="dlg-text"></div><div class="dlg-choices"></div><div class="dlg-next">▼</div></div>`;
    box.classList.add('on');
    const txt = box.querySelector('.dlg-text'), ch = box.querySelector('.dlg-choices'), nx = box.querySelector('.dlg-next');
    let i = 0, typing = false, full = '', timer = null;
    const pitch = { muis: 1.5, draak: 0.6, vos: 1.15, uil: 0.9, beer: 1.1 }[who] || 1;
    function show() {
      full = fill(lines[i]); txt.innerHTML = ''; typing = true; nx.style.opacity = 0; ch.innerHTML = '';
      let k = 0; const plain = full.replace(/<[^>]+>/g, '');
      clearInterval(timer);
      timer = setInterval(() => {
        k += 1; txt.textContent = plain.slice(0, k);
        if (k % 2 === 0 && plain[k] && plain[k] !== ' ') SND.talk(pitch);
        if (k >= plain.length) finish();
      }, 26);
    }
    function finish() {
      clearInterval(timer); typing = false; txt.innerHTML = full;
      if (i === lines.length - 1 && choices) {
        ch.innerHTML = choices.map((c, j) => `<button class="choice" data-j="${j}">${c}</button>`).join('');
        ch.querySelectorAll('.choice').forEach(b => b.onclick = e => { e.stopPropagation(); SND.tap(); close(+b.dataset.j); });
      } else nx.style.opacity = 1;
    }
    function close(v) { clearInterval(timer); box.classList.remove('on'); box.onclick = null; document.removeEventListener('keydown', key); res(v); }
    function adv() {
      if (typing) return finish();
      if (i === lines.length - 1 && choices) return;
      SND.tap(); i++; if (i < lines.length) show(); else close(0);
    }
    const key = e => { if (['Enter', ' ', 'e', 'E'].includes(e.key)) { e.preventDefault(); adv(); } };
    box.onclick = adv; document.addEventListener('keydown', key);
    show();
  });
}

/* ---------- besturing ---------- */
export function setupControls(input, actions) {
  const joy = $('#joy'), knob = $('#knob'), zone = $('#joyzone');
  let id = null, ox = 0, oy = 0; const R = 56;
  const setKnob = (dx, dy) => { knob.style.transform = `translate(${dx}px,${dy}px)`; };
  zone.addEventListener('pointerdown', e => {
    ac(); if (id !== null) return; id = e.pointerId; ox = e.clientX; oy = e.clientY;
    joy.style.left = (ox - 70) + 'px'; joy.style.top = (oy - 70) + 'px'; joy.classList.add('on');
    zone.setPointerCapture(id);
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - ox, dy = e.clientY - oy; const l = Math.hypot(dx, dy);
    if (l > R) { dx = dx / l * R; dy = dy / l * R; }
    setKnob(dx, dy); input.x = dx / R; input.z = dy / R;
  });
  const end = e => { if (e.pointerId !== id) return; id = null; input.x = 0; input.z = 0; setKnob(0, 0); joy.classList.remove('on'); };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);

  const jb = $('#jump');
  jb.addEventListener('pointerdown', e => { e.preventDefault(); ac(); input.jump = true; input.jumpPressed = true; });
  const jup = () => { input.jump = false; };
  jb.addEventListener('pointerup', jup); jb.addEventListener('pointercancel', jup); jb.addEventListener('pointerleave', jup);
  $('#act').addEventListener('click', () => { ac(); actions.act(); });
  $('#pw-brul').addEventListener('click', () => actions.brul());
  $('#pw-fluit').addEventListener('click', () => actions.fluit());
  $('#pw-schelp').addEventListener('click', () => actions.schelp());
  $('#menuBtn').addEventListener('click', () => actions.menu());

  const keys = {};
  addEventListener('keydown', e => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    keys[e.key.toLowerCase()] = true; ac();
    if (e.key === ' ' && !$('#dialog').classList.contains('on') && !document.querySelector('.panel.on')) { if (!input.jump) input.jumpPressed = true; input.jump = true; e.preventDefault(); }
    if ((e.key === 'e' || e.key === 'Enter') && !$('#dialog').classList.contains('on') && !document.querySelector('.panel.on')) actions.act();
    if (e.key === 'q') actions.brul();
    if (e.key === 'Escape') actions.menu();
    kb();
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; if (e.key === ' ') input.jump = false; kb(); });
  function kb() {
    if (id !== null) return;
    const x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    const z = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    const l = Math.hypot(x, z) || 1; input.x = x / l; input.z = z / l;
  }
  // knijpen of scrollen om in/uit te zoomen
  addEventListener('wheel', e => actions.zoom(e.deltaY > 0 ? 1.06 : 0.94), { passive: true });
}

/* ---------- minikaart ---------- */
let mapImg = null;
export function buildMinimap(height, isWater) {
  const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d');
  const img = g.createImageData(160, 160);
  for (let j = 0; j < 160; j++) for (let i = 0; i < 160; i++) {
    const x = (i / 159 - 0.5) * 120, z = (j / 159 - 0.5) * 120, h = height(x, z), k = (j * 160 + i) * 4;
    let col = h < -0.18 ? [110, 210, 240] : h < 0.45 ? [245, 226, 170] : h > 4.5 ? [150, 210, 130] : h > 2 ? [120, 190, 110] : [140, 214, 120];
    img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0); mapImg = c;
}
export function drawMinimap(d) {
  const cv = $('#mini'), g = cv.getContext('2d'), W = cv.width;
  const sc = W / 120, cx = W / 2, cz = W / 2;
  g.clearRect(0, 0, W, W);
  g.save(); g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 3, 0, 7); g.clip();
  if (mapImg) g.drawImage(mapImg, 0, 0, W, W);
  if (S.items.includes('hoed')) { g.fillStyle = '#ffd23f'; d.stars.forEach(s => { g.beginPath(); g.arc(cx + s.x * sc, cz + s.z * sc, 2.4, 0, 7); g.fill(); }); }
  const t = performance.now() / 300;
  d.npcs.forEach(n => {
    const x = cx + n.x * sc, y = cz + n.z * sc;
    if (n.quest) { g.fillStyle = 'rgba(255,210,63,0.45)'; g.beginPath(); g.arc(x, y, 7 + Math.sin(t) * 2, 0, 7); g.fill(); }
    g.font = '12px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(EMOJI[n.id], x, y);
  });
  const px = cx + d.p.x * sc, pz = cz + d.p.z * sc;
  g.translate(px, pz); g.rotate(-d.rot + Math.PI);
  g.fillStyle = '#fff'; g.strokeStyle = '#2d2346'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2.5); g.lineTo(-5, 5); g.closePath(); g.fill(); g.stroke();
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 4; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 3, 0, 7); g.stroke();
}

/* ---------- beloning kiezen ---------- */
export function pickReward(options) {
  return new Promise(res => {
    const o = overlay(`<div class="rw-title">Kies je cadeau!</div><div class="rw-sub">Elk cadeau geeft je een nieuwe superkracht</div>
      <div class="rw-cards">${options.map((id, i) => `<button class="rw-card" data-id="${id}" style="animation-delay:${i * 0.12}s">
        <div class="rw-glow"></div>${iconImg(id, 'rw-icon')}<div class="rw-name">${ITEMS[id].name}</div>
        <div class="rw-power">⚡ ${ITEMS[id].power}</div><div class="rw-desc">${ITEMS[id].desc}</div></button>`).join('')}</div>`, 'reward');
    SND.magic();
    o.querySelectorAll('.rw-card').forEach(b => b.onclick = () => {
      SND.win(); o.querySelectorAll('.rw-card').forEach(x => x.classList.add(x === b ? 'chosen' : 'gone'));
      setTimeout(() => { o.remove(); res(b.dataset.id); }, 900);
    });
  });
}
