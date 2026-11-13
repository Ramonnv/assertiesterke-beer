// Awards: echte 3D-geprinte onderdelen voor het Beer-poppetje.
// Het poppetje zelf win je na Missie 1, elk accessoire bij de bijbehorende superkracht.
import { S, save, today } from './state.js';
import { ITEMS, ITEM_ORDER } from './story.js';

export const SITE = 'https://ramonnv.github.io/assertiesterke-beer/';
export const PRINT_ZIP = SITE + 'print/SterkeBeer-3Dprint.zip';

export const POPPETJE = { id: 'poppetje', name: 'Beer-poppetje', when: 'na Missie 1', file: 'beer_poppetje.stl' };

export function awardName(id) { return id === 'poppetje' ? POPPETJE.name : (ITEMS[id] ? ITEMS[id].name : id); }
export function awardFile(id) {
  if (id === 'poppetje') return POPPETJE.file;
  if (id === 'laarzen') return 'laarzen_links.stl + laarzen_rechts.stl';
  return id + '.stl';
}
export function awardImg(id) { return id === 'poppetje' ? 'assets/portraits/beer_full.png' : 'assets/icons/' + id + '.png'; }
export const ALL_AWARDS = ['poppetje', ...ITEM_ORDER, 'kroon'];

// Zorgt dat alle verdiende awards in de lijst staan (ook van vóór deze update). Geeft de nieuwe terug.
export function syncAwards() {
  const newly = [];
  const add = (id, date) => { if (!S.awards[id]) { S.awards[id] = { date: date || today(), got: false }; newly.push(id); } };
  if (S.done[0]) add('poppetje', S.done[0].date);
  for (const id of S.items) {
    const lvl = Object.keys(S.rewards || {}).find(k => S.rewards[k] === id);
    add(id, lvl !== undefined && S.done[lvl] ? S.done[lvl].date : (id === 'kroon' && S.done[16] ? S.done[16].date : today()));
  }
  if (newly.length) save();
  return newly;
}
export const earnedAwards = () => ALL_AWARDS.filter(id => S.awards[id]);
export const pendingAwards = () => earnedAwards().filter(id => !S.awards[id].got);
export function setCollected(id, got) { if (S.awards[id]) { S.awards[id].got = got; save(); } }
