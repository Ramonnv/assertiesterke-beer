// Ouderrapport: wat ging goed, waar kan ze nog op oefenen, en welke awards zijn vrijgespeeld.
// Wordt gemaild via de eigen mail-koppeling van de ouder (Google Apps Script), of via de mail-app.
import { S, save, today, totalStars, doneCount, rankOf } from './state.js';
import { LEVELS, SC } from './content.js';
import { ITEMS, QUESTS, NPCS } from './story.js';
import { SITE, PRINT_ZIP, earnedAwards, awardName, awardFile, syncAwards } from './awards.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plain = s => String(s).replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const nlDate = d => { try { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }); } catch (e) { return d; } };
const imgFor = id => SITE + (id === 'poppetje' ? 'assets/portraits/beer_full.png' : 'assets/icons/' + id + '.png');

// Thema's van de situaties, zodat het rapport kan zeggen wáár het lastig is
const THEMA = {
  'Grenzen aangeven': ['gum', 'duwen', 'porren', 'glijbaan', 'plek', 'tas'],
  'Reageren op plagen': ['tekening', 'kleren', 'dom', 'kanniks', 'vallen', 'nadoen', 'naroepen'],
  'Hulp halen': ['bal', 'geheim', 'online', 'app'],
  'Opkomen voor een ander': ['ander', 'meedoen', 'snoep'],
  'Geven en nemen': ['spel', 'tv', 'schommel', 'groepje', 'verliezen', 'verdrietig'],
  'Samen spelen en vrienden maken': ['meedoenGroep', 'nieuweRegels', 'compliment', 'luisteren', 'nietNu', 'alleenKind', 'leiding', 'winnen', 'sorry', 'delen', 'nieuwMeisje', 'beurt']
};
const themaVan = id => Object.keys(THEMA).find(t => THEMA[t].includes(id)) || 'Overig';

export function analyse(log) {
  const r = { n: 0, beer: 0, muis: 0, draak: 0, tijd: 0, fout: 0, vos: { n: 0, won: 0 }, themas: {}, mis: [], sort: { hulpGemist: 0, zelfGemist: 0, vastGemist: 0, meeGemist: 0 }, gedachten: [] };
  for (const e of log) {
    if (e.type === 'gedachten') { r.gedachten.push(e); continue; }
    r.n++;
    const k = e.k;
    if (k === 'beer') r.beer++; else if (k === 'muis') r.muis++; else if (k === 'draak') r.draak++; else if (k === 'tijd') r.tijd++; else r.fout++;
    if (e.type === 'vos') { r.vos.n++; if (k === 'beer') r.vos.won++; }
    if (e.type === 'kies' && e.id) {
      const t = themaVan(e.id); r.themas[t] = r.themas[t] || { n: 0, ok: 0 };
      r.themas[t].n++; if (k === 'beer') r.themas[t].ok++;
    }
    if (k !== 'beer' && (e.type === 'kies' || e.type === 'vos' || e.type === 'flits') && r.mis.length < 8)
      r.mis.push({ q: e.q, k, beer: e.id && SC[e.id] ? SC[e.id].beer : null });
    if (e.type === 'sorteer' && k !== 'beer') {
      if (e.want === 'hulp') r.sort.hulpGemist++; if (e.want === 'zelf') r.sort.zelfGemist++;
      if (e.want === 'vast') r.sort.vastGemist++; if (e.want === 'mee') r.sort.meeGemist++;
    }
  }
  r.pct = r.n ? Math.round(r.beer / r.n * 100) : 0;
  return r;
}

function inzichten(a, naam) {
  const goed = [], oefen = [];
  if (a.n >= 4 && a.pct >= 85) goed.push(`${naam} koos in ${a.pct}% van de situaties de stevige, rustige Beer-reactie. Super!`);
  else if (a.n >= 4 && a.pct >= 65) goed.push(`${naam} koos in ${a.pct}% van de situaties de Beer-reactie. Dat gaat de goede kant op.`);
  if (a.vos.n) goed.push(`Plaagvos-duels: ${a.vos.won} van de ${a.vos.n} gewonnen met een korte, rustige reactie.`);
  for (const [t, v] of Object.entries(a.themas)) {
    if (v.n >= 2 && v.ok / v.n >= 0.85) goed.push(`Sterk in "${t}" (${v.ok}/${v.n} goed).`);
    if (v.n >= 2 && v.ok / v.n < 0.6) oefen.push(`"${t}" vindt ze nog lastig (${v.ok}/${v.n} goed). Praat er samen eens over aan de hand van een voorbeeld uit haar eigen week.`);
  }
  if (a.muis >= 2 && a.muis > a.draak) oefen.push(`Bij twijfel kiest ze vaker de <b>Muis</b>-reactie (stil blijven, toegeven, niks zeggen). Oefen thuis korte, stevige zinnen hardop: "Stop, ik wil dat niet." of "Mag ik meedoen?"`);
  if (a.draak >= 2 && a.draak >= a.muis) oefen.push(`Soms kiest ze de <b>Draak</b>-reactie (terugschelden, de baas spelen, eigen zin doordrijven). Bespreek samen dat rustig blijven en om de beurt gaan vaak meer oplevert.`);
  if (a.tijd >= 2) oefen.push(`Bij de snelle rondes was ze ${a.tijd} keer te laat. Een paar vaste korte zinnen ("Kan zijn.", "Boeiend.", "Stop.") helpen om snel te reageren.`);
  if (a.sort.hulpGemist) oefen.push(`Ze dacht ${a.sort.hulpGemist} keer dat ze iets zelf moest oplossen terwijl een grote mens erbij hoort (bijv. bij dreigen of als het blijft doorgaan). Benadruk: hulp vragen is geen klikken.`);
  if (a.sort.vastGemist) oefen.push(`Bij belangrijke dingen (lijf, veiligheid, meedoen met pesten) koos ze ${a.sort.vastGemist} keer voor meegeven. Herhaal samen: "Nee is nee."`);
  if (a.sort.meeGemist) oefen.push(`Bij kleine dingen (wie mag kiezen, welk spel) wilde ze ${a.sort.meeGemist} keer toch vasthouden. Oefen samen het om-de-beurt kiezen.`);
  const g = a.gedachten.slice(-1)[0];
  if (g) (g.score >= g.target ? goed : oefen).push(`Gedachten omdraaien: ${g.score} punten (doel ${g.target}).`);
  return { goed, oefen };
}

// kind: 'periodiek' | 'award' | 'overzicht'
export function buildReport(kind = 'periodiek', newAwards = []) {
  syncAwards();
  const naam = S.name || 'je kind';
  const lr = S.lastReport || { done: 0, log: 0, t: 0 };
  const log = kind === 'overzicht' ? S.log : S.log.slice(lr.log || 0);
  const a = analyse(log), ins = inzichten(a, esc(naam));
  const dc = doneCount(), st = totalStars(), rank = rankOf(st);
  const nieuweMissies = Object.keys(S.done).map(Number).sort((x, y) => x - y).filter(i => kind === 'overzicht' || i >= (lr.done || 0));
  const earned = earnedAwards();
  const sinds = kind === 'overzicht' ? earned : earned.filter(id => newAwards.includes(id) || (S.awards[id].date >= (lr.date || '0')));
  const ophalen = earned.filter(id => !S.awards[id].got);
  const echteTodo = Object.keys(S.done).filter(i => !S.missions[i]).map(i => LEVELS[i].m).slice(0, 5);

  const subject = kind === 'award'
    ? `🎁 ${naam} heeft een award vrijgespeeld in Sterke Beer!`
    : `🐻 Sterke Beer: zo gaat het met ${naam} (${dc} van ${LEVELS.length} missies)`;

  const card = (title, body, color = '#7c5cff') => `<div style="background:#fff;border-radius:16px;padding:16px 18px;margin:12px 0;border-left:6px solid ${color}">
    <div style="font-weight:800;font-size:17px;margin-bottom:6px;color:#2d2346">${title}</div>${body}</div>`;
  const list = items => items.length ? `<ul style="margin:6px 0 0 18px;padding:0;line-height:1.5">${items.map(x => `<li>${x}</li>`).join('')}</ul>` : '<p style="margin:0;color:#8f87b5">Nog niets om te melden.</p>';
  const awardTile = (id, extra = '') => `<td style="text-align:center;padding:6px;width:120px;vertical-align:top">
      <img src="${imgFor(id)}" width="96" height="96" alt="" style="background:#fff9ec;border-radius:14px"><br>
      <b style="font-size:14px">${esc(awardName(id))}</b><br><span style="font-size:12px;color:#8f87b5">${extra}</span></td>`;
  const tiles = ids => `<table role="presentation" style="border-collapse:collapse"><tr>${ids.map((id, i) => awardTile(id, id === 'poppetje' ? 'het poppetje zelf' : esc(ITEMS[id] ? '⚡ ' + ITEMS[id].power : '')) + ((i + 1) % 4 === 0 ? '</tr><tr>' : '')).join('')}</tr></table>`;

  let html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#f4f1ff;padding:18px;color:#2d2346;max-width:640px">
    <div style="background:linear-gradient(135deg,#7c5cff,#4aa8ff);color:#fff;border-radius:20px;padding:20px 22px">
      <div style="font-size:14px;opacity:.9">Sterke Beer: Moedeiland</div>
      <div style="font-size:24px;font-weight:800;margin-top:4px">${kind === 'award' ? '🎁 Nieuwe award voor ' + esc(naam) + '!' : 'Rapport van ' + esc(naam)}</div>
      <div style="font-size:14px;margin-top:6px">${dc} van de ${LEVELS.length} missies gehaald · ${st} ⭐ · rang: ${rank[1]} · ${S.moed} moedsterren${S.streak > 1 ? ' · 🔥 ' + S.streak + ' dagen op rij' : ''}</div>
    </div>`;

  if (sinds.length) html += card(kind === 'overzicht' ? '🎁 Alle vrijgespeelde awards' : '🎁 Vrijgespeeld!',
    `<p style="margin:0 0 6px">${esc(naam)} heeft ${sinds.length === 1 ? 'deze award' : 'deze awards'} verdiend:</p>${tiles(sinds)}`, '#ffb000');

  if (kind !== 'award') {
    if (nieuweMissies.length) html += card('🗺️ Gespeelde missies', list(nieuweMissies.map(i => `Missie ${i + 1}: <b>${esc(LEVELS[i].t)}</b> ${'⭐'.repeat(S.done[i].stars)} <span style="color:#8f87b5">(${nlDate(S.done[i].date)}, met ${esc(NPCS[QUESTS[i].npc].name)})</span>`)), '#2fbf71');
    html += card('💪 Wat ging goed', list(ins.goed), '#2fbf71');
    html += card('🌱 Hier kan ze nog op oefenen', list(ins.oefen), '#ff8a3d');
    if (a.mis.length) html += card('🔍 Voorbeelden om samen te bespreken', list(a.mis.slice(0, 5).map(m =>
      `${esc(plain(m.q))}<br><span style="color:#8f87b5">Ze koos: ${m.k === 'muis' ? '🐭 Muis-reactie' : m.k === 'draak' ? '🐲 Draak-reactie' : m.k === 'tijd' ? '⏰ te laat' : 'een ander antwoord'}${m.beer ? ' · Beer zou zeggen: ' + esc(plain(m.beer)) : ''}</span>`)), '#7c5cff');
    if (echteTodo.length) html += card('🎯 Missies in het echt om samen te doen', list(echteTodo.map(esc)), '#ff5d8f');
  }

  html += card('🖨️ Awards printen en ophalen', ophalen.length
    ? `<p style="margin:0 0 6px">Nog uit te reiken (${ophalen.length}):</p>${tiles(ophalen)}
       <p style="margin:8px 0 0;font-size:14px">Printbestanden: ${ophalen.map(id => `<code>${awardFile(id)}</code>`).join(', ')}<br>
       Download: <a href="${PRINT_ZIP}">SterkeBeer-3Dprint.zip</a>. Uitgereikt? Vink het aan in de Ouderhoek van het spel.</p>`
    : '<p style="margin:0">Alle verdiende awards zijn uitgereikt. 👍</p>', '#4aa8ff');
  html += `<p style="font-size:12px;color:#8f87b5;margin-top:14px">Dit rapport komt uit de Ouderhoek van Sterke Beer. Je kunt instellen hoe vaak je het krijgt (Menu ☰ → Ouders). Sterke Beer is een speelse aanvulling, geen vervanging van een echte weerbaarheidstraining.</p></div>`;

  const text = [
    subject, '',
    `${dc}/${LEVELS.length} missies · ${st} sterren · ${S.moed} moedsterren`, '',
    sinds.length ? 'VRIJGESPEELD: ' + sinds.map(awardName).join(', ') : '',
    ins.goed.length ? 'WAT GING GOED:\n- ' + ins.goed.map(plain).join('\n- ') : '',
    ins.oefen.length ? 'OM TE OEFENEN:\n- ' + ins.oefen.map(plain).join('\n- ') : '',
    ophalen.length ? 'NOG UIT TE REIKEN: ' + ophalen.map(id => awardName(id) + ' (' + awardFile(id) + ')').join(', ') + '\nPrintbestanden: ' + PRINT_ZIP : ''
  ].filter(Boolean).join('\n\n');
  return { subject, html, text };
}

export function markReported() {
  S.lastReport = { done: doneCount(), log: S.log.length, t: Date.now(), date: today() };
  save();
}

// In de wachtrij zetten en (als er internet is) versturen
export function sendReport(kind, newAwards = []) {
  const r = buildReport(kind, newAwards);
  if (kind !== 'award') markReported();
  if (!S.parentEmail) { S.reportWaiting = true; save(); return 'geen-adres'; }
  if (!S.mailUrl) { S.reportWaiting = true; save(); return 'geen-koppeling'; }
  S.mailQueue.push({ to: S.parentEmail, subject: r.subject, html: r.html, text: r.text, t: Date.now() });
  if (S.mailQueue.length > 10) S.mailQueue.splice(0, S.mailQueue.length - 10);
  save(); flushQueue();
  return 'verstuurd';
}
let flushing = false;
export async function flushQueue() {
  if (flushing || !S.mailUrl || !S.mailQueue.length || (navigator.onLine === false)) return;
  flushing = true;
  try {
    while (S.mailQueue.length) {
      const m = S.mailQueue[0];
      await fetch(S.mailUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(m) });
      S.mailQueue.shift(); save();
    }
  } catch (e) { /* geen internet: later opnieuw */ }
  flushing = false;
}
addEventListener('online', () => flushQueue());

// Reserve zonder koppeling: opent de mail-app met het rapport als tekst
export function mailtoLink(kind = 'periodiek') {
  const r = buildReport(kind);
  return `mailto:${encodeURIComponent(S.parentEmail || '')}?subject=${encodeURIComponent(r.subject)}&body=${encodeURIComponent(r.text.slice(0, 1800))}`;
}
