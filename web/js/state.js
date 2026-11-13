// Voortgang: wordt op het apparaat bewaard (zelfde sleutel als versie 1, dus oude voortgang blijft!).
import { KEY, LEVELS, RANKS } from './content.js';

export function fresh() {
  return {
    name: '', done: {}, maxCombo: 0, bestThoughts: 0, breaths: 0, practice: 0, missions: {},
    streak: 0, bestStreak: 0, lastDay: '', parent: false,
    // nieuw in de 3D-versie
    v: 2, items: [], rewards: {}, stars: [], moed: 0, fur: 'bruin', furs: ['bruin'],
    side: { day: '', foxes: 0, bubbles: [], rust: false, claimed: [] },
    mistGone: false, chestOpen: false, music: true, sound: true, seenIntro: false, pos: null, tips: {},
    // awards (3D-print) en ouderrapport
    awards: {}, awardsShown: [], log: [], parentEmail: '', mailUrl: '', reportEvery: 3, reportAward: true,
    lastReport: { done: 0, t: 0, log: 0 }, mailQueue: [], awardIntro: false
  };
}

export let S = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = Object.assign(fresh(), raw ? JSON.parse(raw) : {});
    s.side = Object.assign(fresh().side, s.side || {});
    if (!Array.isArray(s.items)) s.items = [];
    for (const k of ['awards', 'lastReport']) if (!s[k] || typeof s[k] !== 'object') s[k] = fresh()[k];
    for (const k of ['awardsShown', 'log', 'mailQueue']) if (!Array.isArray(s[k])) s[k] = [];
    return s;
  } catch (e) { return fresh(); }
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function replaceState(n) { S = Object.assign(fresh(), n); S.side = Object.assign(fresh().side, n.side || {}); save(); }
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

export function dayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
export const today = () => dayStr();
export function touchDay() {
  const t = today();
  if (S.side.day !== t) S.side = { day: t, foxes: 0, bubbles: [], rust: false, claimed: [] };
  if (S.lastDay === t) { save(); return; }
  const y = new Date(); y.setDate(y.getDate() - 1);
  S.streak = (S.lastDay === dayStr(y)) ? S.streak + 1 : 1;
  S.bestStreak = Math.max(S.bestStreak || 0, S.streak);
  S.lastDay = t; save();
}
export const totalStars = () => Object.values(S.done).reduce((a, d) => a + (d.stars || 0), 0);
export const doneCount = () => Object.keys(S.done).length;
export function rankOf(st) { let r = RANKS[0]; for (const x of RANKS) if (st >= x[0]) r = x; return r; }
export const nextRank = st => RANKS.find(x => x[0] > st);
export function isUnlocked(i) {
  if (i === 0 || S.done[i] || S.parent) return true;
  const p = S.done[i - 1]; return !!(p && p.date < today());
}
export const nextQuest = () => LEVELS.findIndex((_, i) => !S.done[i]);
export const waitingForTomorrow = i => i > 0 && !S.parent && S.done[i - 1] && S.done[i - 1].date === today() && !S.done[i];
export const has = item => S.items.includes(item);

// Elk antwoord bewaren (voor het ouderrapport). Houdt de laatste 600 bij.
export function logAnswer(e) {
  try {
    e.t = Date.now();
    S.log.push(e);
    if (S.log.length > 600) { const cut = S.log.length - 600; S.log.splice(0, cut); S.lastReport.log = Math.max(0, (S.lastReport.log || 0) - cut); }
    save();
  } catch (x) {}
}
export const legend = () => S.items.includes('kroon');

// Back-upcode: hele voortgang als tekst om over te zetten naar een ander apparaat
export function backupCode() {
  const json = JSON.stringify(S);
  return 'SB2-' + btoa(unescape(encodeURIComponent(json)));
}
export function restoreCode(code) {
  const c = code.trim().replace(/^SB2-/, '').replace(/\s+/g, '');
  const obj = JSON.parse(decodeURIComponent(escape(atob(c))));
  if (!obj || typeof obj !== 'object' || !('done' in obj)) throw new Error('ongeldig');
  replaceState(obj);
}
