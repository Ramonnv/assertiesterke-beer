// Sterke Beer: Moedeiland – de regie van het spel.
import { LEVELS, FL, RANKS } from './content.js';
import { S, save, touchDay, today, totalStars, doneCount, rankOf, nextRank, isUnlocked, nextQuest, waitingForTomorrow, has, backupCode, restoreCode, fresh, replaceState } from './state.js';
import { SND, ac, musicOn } from './audio.js';
import { NPCS, QUESTS, ITEMS, ITEM_ORDER, SHOP } from './story.js';
import * as W from './world.js';
import * as M from './models.js';
import { runActs, clearTimers } from './activities.js';
import { $, say, toast, banner, overlay, confetti, setupControls, buildMinimap, drawMinimap, pickReward, portraitImg, iconImg, ITEM_EMOJI, fill } from './ui.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let mode = 'loading', busy = false;
const panel = $('#panel');

/* ================= laden ================= */
async function boot() {
  touchDay();
  const bar = $('#loadbar');
  try {
    await M.loadRecipes();
    const fromBlender = await W.init($('#c'), {
      toast, star: onStar, bubble: onBubble, foxEncounter: onFox, blocked: onBlocked, gateOpened: () => { banner('Het Mistpad is open!', 'Er glinsteren daar moedsterren…', '💨'); }
    }, p => bar.style.width = Math.round(p * 100) + '%');
    console.log('Blender-modellen geladen:', fromBlender);
  } catch (e) {
    console.error(e); $('#loadmsg').textContent = 'Oeps, er ging iets mis bij het laden. Probeer de app opnieuw te openen.'; return;
  }
  buildMinimap(W.height, W.isWater);
  setupControls(W.input, { act, brul, fluit, schelp, menu: openMenu, zoom: f => W.setZoom(W.getZoom() * f) });
  $('#loading').classList.add('gone');
  showTitle();
  requestAnimationFrame(loop);
}

/* ================= titelscherm ================= */
function showTitle() {
  mode = 'title';
  const t = $('#title'); t.classList.add('on');
  const newPlayer = !S.name;
  t.innerHTML = `<div class="t-inner">
      <div class="t-logo"><span class="t-small">Sterke Beer</span><span class="t-big">MOEDEILAND</span></div>
      <div class="t-hero">${portraitImg('beer_full', 'hero')}</div>
      ${newPlayer ? `<div class="t-name"><label>Hoe heet jij?</label><input id="nm" maxlength="16" placeholder="Jouw naam" autocomplete="off"></div>` :
        `<div class="t-welcome">Welkom terug, <b>${esc(S.name)}</b>! ${statusLine()}</div>`}
      <button class="btn big green t-play" id="play">${newPlayer ? 'Start het avontuur' : 'Verder spelen'} ▶</button>
      <div class="t-hint">Tip: zet je tablet liggend voor het mooiste beeld</div>
    </div>`;
  $('#play').onclick = () => {
    ac();
    if (newPlayer) {
      const v = $('#nm').value.trim();
      if (!v) { $('#nm').classList.add('shake'); setTimeout(() => $('#nm') && $('#nm').classList.remove('shake'), 500); return; }
      S.name = v; save();
    }
    try { document.documentElement.requestFullscreen && !window.SB_APP && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
    startGame();
  };
  const nm = $('#nm'); if (nm) nm.addEventListener('keydown', e => { if (e.key === 'Enter') $('#play').click(); });
}
function statusLine() {
  const q = nextQuest();
  if (q < 0) return 'Je bent een Beer-Legende! 👑';
  return `Missie ${q + 1} van ${LEVELS.length} · ⭐ ${S.moed} moedsterren`;
}

async function startGame() {
  $('#title').classList.remove('on');
  $('#hud').classList.add('on');
  mode = 'play'; SND.win(); musicOn(S.music);
  refreshQuest();
  if (!S.seenIntro) {
    W.introSweep();
    busy = true; W.input.frozen = true;
    await wait(4200);
    banner('Welkom op Moedeiland!', 'Volg de gele pijl naar Juf Uil', '🏝️');
    await wait(2400);
    S.seenIntro = true; save(); busy = false; W.input.frozen = false;
    tip('move', isTouch() ? '👆 Sleep met je duim links op het scherm om te lopen.' : '⌨️ Lopen met WASD of de pijltjes, springen met spatie, praten met E.');
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const isTouch = () => matchMedia('(pointer: coarse)').matches;
function tip(id, msg) { if (S.tips[id]) return; S.tips[id] = 1; save(); setTimeout(() => toast(msg, 4500), 300); }

/* ================= de lus ================= */
let last = performance.now(), titleT = 0, hudT = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'title' || mode === 'loading') { titleT += dt; W.titleCamera(titleT); W.renderOnly(dt); }
  else { W.update(dt); hudT += dt; if (hudT > 0.1) { hudT = 0; updateHUD(); } positionSpeech(); }
  requestAnimationFrame(loop);
}

/* ================= HUD ================= */
function updateHUD() {
  const st = W.getState();
  const it = (busy || W.input.frozen) ? null : st.interact;
  const btn = $('#act');
  if (it) { btn.classList.add('on'); btn.querySelector('span').textContent = it.label; }
  else btn.classList.remove('on');
  $('#moedN').textContent = S.moed;
  const r = rankOf(totalStars()); $('#rankN').textContent = r[2] + ' ' + r[1];
  $('#pw-brul').classList.toggle('on', has('megafoon'));
  $('#pw-fluit').classList.toggle('on', has('fluit'));
  $('#pw-schelp').classList.toggle('on', has('schelp'));
  drawMinimap(W.minimapData());
}
function refreshQuest() {
  const q = nextQuest(), card = $('#quest');
  let main;
  if (q < 0) { main = `<div class="q-main">👑 Alle missies gehaald!</div><div class="q-sub">Speel missies opnieuw via het menu ☰</div>`; W.setQuestTarget(null); }
  else if (!isUnlocked(q)) { main = `<div class="q-main">🌙 Morgen: ${LEVELS[q].t}</div><div class="q-sub">Doe vandaag de klusjes hieronder!</div>`; W.setQuestTarget(null); }
  else {
    const Q = QUESTS[q], n = NPCS[Q.npc];
    main = `<div class="q-main">⭐ Missie ${q + 1}: ${LEVELS[q].t}</div><div class="q-sub">Praat met <b>${n.name}</b> bij ${n.place}</div>`;
    W.setQuestTarget(Q.npc, true);
  }
  const sideItem = (done, txt, prog) => `<div class="q-side ${done ? 'done' : ''}"><span>${done ? '✅' : '▫️'}</span>${txt}<b>${prog}</b></div>`;
  const sd = S.side;
  card.innerHTML = main + `<div class="q-sep">Klusjes van vandaag</div>` +
    sideItem(sd.foxes >= 3, '🦊 Maak 3 plaagvossen saai', `${Math.min(3, sd.foxes)}/3`) +
    sideItem(sd.bubbles.length >= 8, '💭 Vang gedachten-bubbels', `${sd.bubbles.length}/8`) +
    sideItem(sd.rust, '🎈 Rust bij de vijver', sd.rust ? '1/1' : '0/1') +
    sideItem(S.stars.length >= W.STAR_SPOTS.length, '⭐ Moedsterren gevonden', `${S.stars.length}/${W.STAR_SPOTS.length}`);
}
function claimSide(id, amount, label) {
  if (S.side.claimed.includes(id)) return;
  S.side.claimed.push(id); S.moed += amount; save();
  banner('Klusje klaar!', `${label} · +${amount} moedsterren`, '✅'); SND.win(); confetti(40);
}

/* ================= interactie ================= */
async function act() {
  if (busy || mode !== 'play') return;
  const it = W.getState().interact; if (!it) return;
  if (it.kind === 'npc') return talkTo(it.ref);
  if (it.kind === 'board') return openMenu('missies');
  if (it.kind === 'home') return wardrobe();
  if (it.kind === 'chest') {
    if (S.chestOpen) return toast('De schatkist is leeg. Jij hebt hem al gevonden! 🏴‍☠️');
    W.openChest(); const g = has('rugzak') ? 20 : 10; S.moed += g; save();
    banner('Schat gevonden!', `+${g} moedsterren`, '🏴‍☠️'); confetti(80); return;
  }
  if (it.kind === 'rust') {
    if (S.side.rust) return toast('Je hebt vandaag al gerust bij de vijver. Mooi zo! 😌');
    busy = true; W.input.frozen = true;
    await say('beer', ['Wat is het hier rustig… Laten we samen ballon-ademen. 🎈']);
    openPanel();
    runActs([{ type: 'adem', rounds: 3 }], {
      el: panel, npc: 'beer',
      onEnd: () => { closePanel(); S.side.rust = true; save(); refreshQuest(); claimSide('rust', 3, 'Rust bij de vijver'); },
      onQuit: closePanel
    });
  }
}

async function talkTo(id) {
  busy = true; W.input.frozen = true; W.facePlayer(id);
  const n = NPCS[id], q = nextQuest();
  try {
    if (q >= 0 && QUESTS[q].npc === id && isUnlocked(q)) {
      const c = await say(id, QUESTS[q].intro, ['Ja, ik doe mee! 💪', 'Straks']);
      if (c === 0) return runQuest(q, false);
    } else if (q >= 0 && QUESTS[q].npc === id && !isUnlocked(q)) {
      await say(id, [n.idle[Math.floor(Math.random() * n.idle.length)], 'Morgen heb ik een nieuwe missie voor je! Kom je terug? 🌙']);
    } else {
      const lines = [n.idle[Math.floor(Math.random() * n.idle.length)]];
      if (q >= 0 && isUnlocked(q)) { const other = NPCS[QUESTS[q].npc]; lines.push(`Weet je dat ${other.name} je zoekt? Bij ${other.place}!`); }
      if (id === 'vos' && S.side.foxes < 3) lines.push('Mijn vossenvrienden lopen hier ergens rond. Durf jij ze te ontmoeten? Hihi.');
      await say(id, lines);
    }
  } finally {
    if (!panel.classList.contains('on')) { busy = false; W.input.frozen = false; }
  }
}

function openPanel() { panel.classList.add('on'); $('#hud').classList.add('dim'); W.input.frozen = true; busy = true; }
function closePanel() { clearTimers(); panel.classList.remove('on'); panel.innerHTML = ''; $('#hud').classList.remove('dim'); W.input.frozen = false; busy = false; refreshQuest(); }

function runQuest(i, replay) {
  openPanel();
  const npc = QUESTS[i].npc;
  runActs(LEVELS[i].acts, {
    el: panel, npc,
    onEnd: ctx => finishQuest(i, ctx, replay),
    onQuit: closePanel
  });
}

async function finishQuest(i, ctx, replay) {
  panel.classList.remove('on'); panel.innerHTML = '';
  const frac = ctx.total ? ctx.ok / ctx.total : 1;
  const stars = frac >= .85 ? 3 : frac >= .55 ? 2 : 1;
  const before = totalStars(), rankBefore = rankOf(before)[1];
  const first = !S.done[i];
  if (first) S.done[i] = { stars, date: today() };
  else if (stars > S.done[i].stars) S.done[i].stars = stars;
  S.maxCombo = Math.max(S.maxCombo || 0, ctx.best || 0);
  save();
  const npc = QUESTS[i].npc;
  W.facePlayer(npc);
  await say(npc, QUESTS[i].outro);
  // sterren-scherm
  await resultScreen(i, stars, totalStars() - before, rankBefore, first);
  if (first && !S.rewards[i]) {
    let options;
    if (i === LEVELS.length - 1) {
      if (!S.items.includes('kroon')) { S.items.push('kroon'); save(); W.applyLook(); banner('De Gouden Kroon!', ITEMS.kroon.desc, '👑'); confetti(120); await wait(2600); }
    }
    options = ITEM_ORDER.filter(x => !S.items.includes(x)).slice(0, 3);
    if (options.length) {
      const item = await pickReward(options);
      S.items.push(item); S.rewards[i] = item; save();
      W.applyLook(); W.burst(W.playerPos().clone().setY(W.playerPos().y + 1), '#ffd23f', 80, 4, 3);
      banner('Nieuwe superkracht!', `${ITEMS[item].name}: ${ITEMS[item].power}`, ITEM_EMOJI[item]);
      confetti(70);
      await wait(2600);
      const hints = { cape: 'Probeer de Hoge Klif in het oosten eens. Spring maar!', lantaarn: 'Het Schaduwbos in het zuidwesten is nu niet meer eng.', megafoon: 'Druk op 📣 bij het Mistpad in het noordwesten!', ballon: 'Spring van de Hoge Klif en houd springen ingedrukt… zie je dat eilandje?', schelp: 'Tik op 🐚 om te reizen.', fluit: 'Tik op 🎶 bij de vossen.' };
      if (hints[item]) toast('💡 ' + hints[item], 5000);
      else toast(`🖨️ Je ${ITEMS[item].name} bestaat ook echt! Vraag papa of mama om hem te 3D-printen voor je Beer-poppetje.`, 5000);
    }
    await missionCard(i);
  }
  closePanel();
}

function resultScreen(i, stars, gained, rankBefore, first) {
  return new Promise(res => {
    const r = rankOf(totalStars());
    SND.win(); confetti(stars * 30);
    const o = overlay(`<div class="res-title">Missie ${i + 1} gehaald!</div>
      <div class="bigstars">${[0, 1, 2].map(k => `<span style="animation-delay:${k * .25}s;${k < stars ? '' : 'filter:grayscale(1);opacity:.25'}">⭐</span>`).join('')}</div>
      <p>${stars === 3 ? 'Perfect! Jij bent echt een beer! 🐻' : stars === 2 ? 'Heel goed gedaan! 💪' : 'Goed geoefend! Speel hem later nog eens voor meer sterren.'}</p>
      ${gained > 0 ? `<p class="gain">+${gained} ⭐</p>` : ''}
      ${r[1] !== rankBefore ? `<div class="rankup">Nieuwe rang: ${r[2]} <b>${r[1]}</b>!</div>` : ''}
      <button class="btn big green mt" id="ok">${first ? 'Naar je cadeau 🎁' : 'Verder'}</button>`, 'result');
    o.querySelector('#ok').onclick = () => { SND.tap(); o.remove(); res(); };
  });
}
function missionCard(i) {
  return new Promise(res => {
    const o = overlay(`<div class="mission"><div class="m-emoji">🎯</div><div class="m-title">Jouw missie in het echt</div>
      <p>${LEVELS[i].m}</p><div class="m-note">Gedaan? Vink hem aan in het menu ☰ → Echte missies</div></div>
      ${i < LEVELS.length - 1 ? `<div class="moon mt">🌙 Morgen wacht er een nieuwe missie op je!</div>` : `<button class="btn purple mt" id="cert">📜 Bekijk je oorkonde</button>`}
      <button class="btn big green mt" id="ok">Terug naar het eiland 🏝️</button>`, 'result');
    o.querySelector('#ok').onclick = () => { SND.tap(); o.remove(); res(); };
    const c = o.querySelector('#cert'); if (c) c.onclick = () => { o.remove(); showCert().then(res); };
  });
}
function showCert() {
  return new Promise(res => {
    confetti(100); SND.win();
    const o = overlay(`<div class="cert">${portraitImg('beer_full', 'cert-img')}<h1>Oorkonde</h1><p>Hierbij verklaren wij dat</p>
      <div class="cert-name">${esc(S.name)}</div><p>een echte <b>Beer-Legende</b> is van Moedeiland!</p>
      <p>Ze staat stevig, praat met een beer-stem, draait gemene gedachten om, reageert snel op plaaggeesten, kan geven en nemen, en weet wanneer ze hulp haalt.</p>
      <p class="cert-date">${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      <button class="btn big green mt" id="ok">Super! 🎉</button>`, 'result');
    o.querySelector('#ok').onclick = () => { o.remove(); res(); };
  });
}

/* ================= zijmissies ================= */
function onStar(gain) {
  $('#moedN').textContent = S.moed;
  $('#moed').classList.remove('bump'); void $('#moed').offsetWidth; $('#moed').classList.add('bump');
  refreshQuest();
  if (S.stars.length === W.STAR_SPOTS.length) { banner('Alle moedsterren gevonden!', 'Jij kent elk hoekje van Moedeiland', '🌟'); confetti(120); S.moed += 20; save(); }
  else tip('star', '⭐ Moedster! Met moedsterren koop je nieuwe vachtkleuren in je huis.');
}
function onBubble(b) {
  const pts = b.good ? 1 : (has('schild') ? 4 : 2);
  S.moed += 0; S.bestThoughts = Math.max(S.bestThoughts || 0, S.side.bubbles.length * 2); save();
  if (b.good) toast(`💚 Kracht-gedachte: <b>${b.text}</b>`);
  else toast(`🔄 Omgedraaid! <s>${b.text}</s> → <b>${b.flip}</b>`, 3800);
  refreshQuest();
  if (S.side.bubbles.length >= 8) claimSide('bubbles', has('schild') ? 8 : 5, 'Gedachten-bubbels gevangen');
}
let blockT = 0;
function onBlocked(zone) {
  const now = performance.now(); if (now - blockT < 3500) return; blockT = now;
  if (zone === 'schaduw') toast('🌑 Brr… het Schaduwbos is veel te donker. Met een lampje durf je vast wel!', 3500);
  if (zone === 'mist') toast(has('megafoon') ? '🌫️ Dikke mist! Tik op 📣 voor een stevige Beer-brul.' : '🌫️ Dikke mist… Misschien krijg je hem weg met een hele harde BRUL?', 3500);
}

/* --- Plaagvos-duel --- */
let duel = null;
function onFox(f) {
  busy = true; W.input.frozen = true;
  const line = FL[Math.floor(Math.random() * FL.length)];
  const opts = shuffle([{ t: line.g[Math.floor(Math.random() * line.g.length)], k: 'beer' }, { t: line.m, k: 'muis' }, { t: line.d, k: 'draak' }]);
  const time = 8 + (has('kristal') ? 3 : 0);
  duel = { f, line };
  const sp = $('#speech'); sp.innerHTML = `“${line.z}”`; sp.classList.add('on');
  const d = $('#duel');
  d.innerHTML = `<div class="duel-title">🦊 Plaagvos plaagt je! Wat zeg jij?</div><div class="timer"><i id="dtm"></i></div>
    <div class="duel-opts">${opts.map(o => `<button class="opt" data-k="${o.k}">${o.t}</button>`).join('')}</div><div id="dfb"></div>`;
  d.classList.add('on');
  const tm = d.querySelector('#dtm'); tm.style.transition = `width ${time}s linear`;
  requestAnimationFrame(() => requestAnimationFrame(() => tm.style.width = '0%'));
  let done = false;
  const to = setTimeout(() => answer('tijd'), time * 1000);
  function answer(k) {
    if (done) return; done = true; clearTimeout(to);
    d.querySelectorAll('.opt').forEach(b => { b.disabled = true; b.classList.add(b.dataset.k === 'beer' ? 'right' : b.dataset.k === k ? 'wrong' : 'dim'); });
    const won = k === 'beer';
    if (won) {
      SND.good(); const g = (has('bril') ? 2 : 1) * 2; S.moed += g; save();
      sp.innerHTML = '“Pfff… saai. Ik ga wel.”';
      d.querySelector('#dfb').innerHTML = `<div class="fb good"><b>${['Bam! 💥', 'Beer-power! 🐻', 'Zo! 😎', 'Sterk! 💪'][Math.floor(Math.random() * 4)]}</b> +${g} ⭐ Plaagvos vindt er niks meer aan.</div>`;
    } else {
      SND.bad();
      sp.innerHTML = '“Hihihi!”';
      d.querySelector('#dfb').innerHTML = `<div class="fb bad"><b>${k === 'muis' ? '🐭 Muis-reactie: zo laat je Plaagvos winnen.' : k === 'draak' ? '🐲 Draak-reactie: zo wordt het ruzie.' : '⏰ Te laat! Een korte zin is genoeg.'}</b> Het groene antwoord is Beer. Probeer het straks nog eens!</div>`;
    }
    setTimeout(() => {
      d.classList.remove('on'); sp.classList.remove('on'); duel = null;
      W.foxDone(f, won); busy = false; W.input.frozen = false; refreshQuest();
      if (won && S.side.foxes >= 3) claimSide('foxes', 5, 'Drie plaagvossen saai gemaakt');
    }, won ? 1800 : 3200);
  }
  d.querySelectorAll('.opt').forEach(b => b.onclick = () => answer(b.dataset.k));
}
function positionSpeech() {
  if (!duel) return;
  const p = duel.f.obj.position.clone(); p.y += 2.1;
  const s = W.toScreen(p), el = $('#speech');
  el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
}

/* ================= superkrachten ================= */
function brul() { if (!has('megafoon') || busy) return; W.roar(); }
function fluit() { if (!has('fluit') || busy) return; W.flute(); }
function schelp() {
  if (!has('schelp') || busy) return;
  const spots = [['huis', '🏠 Thuis'], ['uil', '🦉 Juf Uil'], ['muis', '🐭 Muis'], ['draak', '🐲 Draak'], ['vos', '🦊 Vossenbos'], ['vijver', '🎈 Vijver']];
  const o = overlay(`<div class="res-title">🐚 Waar wil je heen?</div><div class="travel">${spots.map(([k, l]) => `<button class="btn white" data-k="${k}">${l}</button>`).join('')}</div>
    <button class="btn mt" id="x">Toch niet</button>`, 'result');
  o.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { o.remove(); W.teleport(b.dataset.k); });
  o.querySelector('#x').onclick = () => o.remove();
}

/* ================= kledingkast ================= */
function wardrobe() {
  busy = true; W.input.frozen = true;
  const draw = () => {
    o.querySelector('.shop').innerHTML = SHOP.map(f => {
      const own = S.furs.includes(f.id), on = S.fur === f.id;
      return `<button class="shop-item ${on ? 'on' : ''}" data-id="${f.id}"><span class="swatch" style="background:linear-gradient(135deg,${f.fur} 60%,${f.belly} 60%)"></span>
        <b>${f.name}</b><small>${on ? 'Aan ✔' : own ? 'Aantrekken' : '⭐ ' + f.price}</small></button>`;
    }).join('');
    o.querySelector('.shop-moed').textContent = '⭐ ' + S.moed + ' moedsterren';
    o.querySelectorAll('.shop-item').forEach(b => b.onclick = () => {
      const f = SHOP.find(x => x.id === b.dataset.id);
      if (S.furs.includes(f.id)) { S.fur = f.id; save(); W.applyLook(); SND.pop(); draw(); return; }
      if (S.moed < f.price) { SND.bad(); toast(`Je hebt nog ${f.price - S.moed} moedsterren nodig. Zoek ze op het eiland! ⭐`); return; }
      S.moed -= f.price; S.furs.push(f.id); S.fur = f.id; save(); W.applyLook(); SND.magic(); confetti(40); draw();
    });
  };
  const o = overlay(`<div class="res-title">🧥 Kledingkast</div><div class="shop-moed"></div><div class="shop"></div><button class="btn big green mt" id="x">Klaar</button>`, 'result');
  o.querySelector('#x').onclick = () => { o.remove(); busy = false; W.input.frozen = false; };
  draw();
}

/* ================= menu ================= */
function openMenu(tab = 'missies') {
  if (busy && !panel.classList.contains('menu')) return;
  openPanel(); panel.classList.add('menu');
  const tabs = [['missies', '🗺️ Missies'], ['krachten', '⚡ Superkrachten'], ['echt', '🎯 Echte missies'], ['opties', '⚙️ Opties'], ['ouders', '👪 Ouders']];
  const body = () => ({ missies: menuMissies, krachten: menuKrachten, echt: menuEcht, opties: menuOpties, ouders: menuOudersGate })[tab]();
  panel.innerHTML = `<div class="wrap"><div class="topbar"><button class="iconbtn" id="x">✕</button><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${k === tab ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}</div></div><div id="mbody"></div></div>`;
  panel.querySelector('#x').onclick = () => { panel.classList.remove('menu'); closePanel(); };
  panel.querySelectorAll('.tab').forEach(b => b.onclick = () => { SND.tap(); tab = b.dataset.t; panel.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === b)); body(); });
  body();
}
const mbody = () => panel.querySelector('#mbody');
function menuMissies() {
  const st = totalStars(), r = rankOf(st), nx = nextRank(st);
  mbody().innerHTML = `<div class="statusrow"><div class="pill big">${r[2]} ${r[1]}</div><div class="pill big">⭐ ${st} missiesterren</div><div class="pill big">✨ ${S.moed} moedsterren</div>${S.streak > 1 ? `<div class="pill big">🔥 ${S.streak} dagen op rij</div>` : ''}</div>
    ${nx ? `<div class="xpbar"><i style="width:${Math.round((st - r[0]) / (nx[0] - r[0]) * 100)}%"></i></div><div class="xpnote">Nog ${nx[0] - st} ⭐ tot ${nx[1]}</div>` : ''}
    <div class="qlist">${LEVELS.map((L, i) => {
      const d = S.done[i], un = isUnlocked(i), n = NPCS[QUESTS[i].npc];
      const state = d ? `<span class="qs">${'⭐'.repeat(d.stars)}<span style="opacity:.25">${'⭐'.repeat(3 - d.stars)}</span></span><button class="btn small white" data-replay="${i}">Opnieuw ▶</button>`
        : un ? `<span class="qs now">Nu te spelen · ${n.name}</span>` : `<span class="qs">${waitingForTomorrow(i) ? '🌙 morgen' : '🔒'}</span>`;
      return `<div class="qrow ${d ? 'done' : un ? 'now' : 'locked'}"><span class="qn">${i + 1}</span><span class="qe">${L.e}</span><span class="qt">${L.t}${S.rewards[i] ? ` <small>${ITEM_EMOJI[S.rewards[i]]}</small>` : ''}</span>${state}</div>`;
    }).join('')}</div>`;
  mbody().querySelectorAll('[data-replay]').forEach(b => b.onclick = () => { panel.classList.remove('menu'); panel.innerHTML = ''; runQuest(+b.dataset.replay, true); });
}
function menuKrachten() {
  const all = [...ITEM_ORDER, 'kroon'];
  mbody().innerHTML = `<p class="center muted">Elke hoofdmissie mag je een cadeau kiezen. Elk cadeau geeft een superkracht!</p>
    <div class="kgrid">${all.map(id => {
      const own = S.items.includes(id);
      return `<div class="kcard ${own ? 'own' : ''}">${own ? iconImg(id, 'k-icon') : `<span class="icon k-icon noimg locked" data-e="❔"></span>`}
        <b>${own ? ITEMS[id].name : '???'}</b><small>${own ? '⚡ ' + ITEMS[id].power + '<br>' + ITEMS[id].desc : 'Nog niet ontdekt'}</small></div>`;
    }).join('')}</div>`;
}
function menuEcht() {
  const rows = LEVELS.map((L, i) => S.done[i] ? `<label class="mrow"><input type="checkbox" data-i="${i}" ${S.missions[i] ? 'checked' : ''}><span>${L.m}</span></label>` : '').join('');
  mbody().innerHTML = `<p class="center muted">Na elke missie krijg je een opdracht voor in het echt. Doe ze samen met papa of mama!</p><div class="mlist">${rows || '<p class="center">Speel je eerste missie om een echte missie te krijgen!</p>'}</div>`;
  mbody().querySelectorAll('input').forEach(c => c.onchange = () => { S.missions[c.dataset.i] = c.checked; save(); if (c.checked) { SND.good(); confetti(25); } });
}
function menuOpties() {
  mbody().innerHTML = `<div class="opts-list">
    <label class="toggle"><input type="checkbox" id="o-m" ${S.music ? 'checked' : ''}> 🎵 Muziek</label>
    <label class="toggle"><input type="checkbox" id="o-s" ${S.sound ? 'checked' : ''}> 🔊 Geluidjes</label>
    <div class="zoomrow">🔍 Camera <button class="btn small white" id="zin">Dichterbij</button><button class="btn small white" id="zout">Verder weg</button></div>
    <div class="help"><h3>Hoe speel je?</h3>
      <p>👆 <b>Lopen:</b> sleep met je duim op de linkerkant van het scherm (of WASD / pijltjes).</p>
      <p>⤒ <b>Springen:</b> de springknop rechtsonder (of spatie). Houd ingedrukt met de Adem-ballon om te zweven.</p>
      <p>💬 <b>Praten:</b> loop naar iemand toe en tik op de gele knop (of E).</p>
      <p>⭐ <b>Missies:</b> volg de gele pijl. Elke dag gaat er een nieuwe missie open.</p></div></div>`;
  mbody().querySelector('#o-m').onchange = e => { S.music = e.target.checked; save(); musicOn(S.music); };
  mbody().querySelector('#o-s').onchange = e => { S.sound = e.target.checked; save(); };
  mbody().querySelector('#zin').onclick = () => W.setZoom(W.getZoom() * 0.85);
  mbody().querySelector('#zout').onclick = () => W.setZoom(W.getZoom() * 1.15);
}
function menuOudersGate() {
  const a = 3 + Math.floor(Math.random() * 7), b = 6 + Math.floor(Math.random() * 4); let typed = '';
  mbody().innerHTML = `<div class="center"><p>Voor ouders. Hoeveel is <b>${a} × ${b}</b>?</p><div class="bigsay" id="ty">&nbsp;</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, 'OK'].map(k => `<button data-k="${k}">${k}</button>`).join('')}</div></div>`;
  mbody().querySelectorAll('.keypad button').forEach(btn => btn.onclick = () => {
    const k = btn.dataset.k;
    if (k === '⌫') typed = typed.slice(0, -1);
    else if (k === 'OK') { if (+typed === a * b) return menuOuders(); typed = ''; SND.bad(); }
    else if (typed.length < 3) typed += k;
    mbody().querySelector('#ty').innerHTML = typed || '&nbsp;';
  });
}
function menuOuders() {
  mbody().innerHTML = `<div class="parent">
    <div class="card"><h3>Over Sterke Beer</h3>
      <p>Er zijn ${LEVELS.length} hoofdmissies. Elke dag gaat er <b>één nieuwe</b> open (als de vorige gehaald is). Daarnaast zijn er dagelijkse klusjes: plaagvossen “saai maken”, gedachten-bubbels omdraaien en ademen bij de vijver.</p>
      <p>Het spel gebruikt drie figuren: <b>🐭 Muis</b> (te klein), <b>🐲 Draak</b> (te boos) en <b>🐻 Beer</b> (stevig, rustig, duidelijk). Na elke missie volgt een <b>missie in het echt</b>: doe die samen, dat maakt het meeste verschil.</p>
      <p class="muted">Een speelse aanvulling, geen vervanging van een echte weerbaarheidstraining of hulp van school bij pesten.</p></div>
    <div class="card"><h3>Voortgang</h3>
      <p>De voortgang wordt op dit apparaat bewaard. Met een <b>back-upcode</b> zet je hem over naar een ander apparaat of bewaar je hem veilig.</p>
      <textarea id="bk" readonly>${backupCode()}</textarea>
      <div class="row"><button class="btn small white" id="cp">📋 Kopieer code</button></div>
      <p class="mt">Code terugzetten:</p><textarea id="rs" placeholder="Plak hier een back-upcode (SB2-…)"></textarea>
      <div class="row"><button class="btn small purple" id="rsb">♻️ Terugzetten</button></div></div>
    <div class="card"><h3>🖨️ Beer-poppetje printen</h3>
      <p>Alle superkrachten bestaan ook als 3D-print. Print het poppetje één keer, en elke nieuwe superkracht die je kind wint als accessoire dat erop klikt.</p>
      <img src="print/printset.png" alt="" style="width:100%;border-radius:16px;margin:6px 0" onerror="this.remove()">
      <p>Gewonnen tot nu toe: <b>${S.items.length ? S.items.map(i => ITEMS[i].name).join(', ') : 'nog niets'}</b></p>
      <p>Download: <a href="print/SterkeBeer-3Dprint.zip" target="_blank">SterkeBeer-3Dprint.zip</a> (ook te vinden op GitHub onder Releases).</p></div>
    <div class="card"><label class="toggle"><input type="checkbox" id="pm" ${S.parent ? 'checked' : ''}> Alle missies openzetten (niet wachten tot morgen)</label>
      <div class="row mt"><button class="btn small white" id="nm">✏️ Naam wijzigen</button><button class="btn small red" id="reset">🗑️ Opnieuw beginnen</button></div></div></div>`;
  const m = mbody();
  m.querySelector('#cp').onclick = async () => { const t = m.querySelector('#bk'); t.select(); try { await navigator.clipboard.writeText(t.value); toast('📋 Gekopieerd!'); } catch (e) { document.execCommand && document.execCommand('copy'); toast('Selecteer de code en kopieer hem.'); } };
  m.querySelector('#rsb').onclick = () => { try { restoreCode(m.querySelector('#rs').value); toast('✅ Voortgang teruggezet! Het spel herstart.'); setTimeout(() => location.reload(), 1200); } catch (e) { SND.bad(); toast('❌ Deze code klopt niet.'); } };
  m.querySelector('#pm').onchange = e => { S.parent = e.target.checked; save(); refreshQuest(); };
  m.querySelector('#nm').onclick = () => { const o = overlay(`<h3>Nieuwe naam</h3><input class="name" id="nn" maxlength="16" value="${esc(S.name)}"><div class="row center mt"><button class="btn white" id="c">Annuleer</button><button class="btn green" id="s">Opslaan</button></div>`); o.querySelector('#c').onclick = () => o.remove(); o.querySelector('#s').onclick = () => { const v = o.querySelector('#nn').value.trim(); if (v) { S.name = v; save(); } o.remove(); }; };
  m.querySelector('#reset').onclick = () => { const o = overlay(`<div class="ov-emoji">⚠️</div><h3>Alles wissen?</h3><p>Alle sterren, missies en superkrachten gaan weg.</p><div class="row center mt"><button class="btn white" id="c">Nee</button><button class="btn red" id="s">Ja, wissen</button></div>`); o.querySelector('#c').onclick = () => o.remove(); o.querySelector('#s').onclick = () => { replaceState(fresh()); location.reload(); }; };
}

// Android-terugknop
window.onAndroidBack = function () {
  const ov = document.querySelectorAll('.overlay'); if (ov.length) { ov[ov.length - 1].remove(); return true; }
  if (panel.classList.contains('menu')) { panel.classList.remove('menu'); closePanel(); return true; }
  if (mode === 'play' && !busy) { openMenu(); return true; }
  return mode === 'play';
};
document.addEventListener('visibilitychange', () => { if (mode !== 'play') return; if (document.hidden) { S.pos = [W.playerPos().x, W.playerPos().z]; save(); musicOn(false); } else musicOn(S.music); });
window.SB = { S, W, runQuest, openMenu, talkTo }; // handig voor testen
boot();
