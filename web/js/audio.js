// Geluid en muziek, helemaal met WebAudio gemaakt (geen bestanden nodig).
import { S } from './state.js';
let AC = null, master = null, musicGain = null, musicTimer = null;
export function ac() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
      musicGain = AC.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
  return AC;
}
export function tone(f, d, type, vol, delay, dest) {
  const c = ac(); if (!c) return;
  if (!dest && !S.sound) return;
  try {
    const t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + d + 0.05);
  } catch (e) {}
}
function noise(d, vol, freq) {
  const c = ac(); if (!c || !S.sound) return;
  const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 800;
  const g = c.createGain(); g.gain.value = vol || 0.2;
  s.connect(f); f.connect(g); g.connect(master); s.start();
}
export const SND = {
  good() { tone(660, .15, 'triangle'); tone(990, .25, 'triangle', .15, .1); },
  bad() { tone(220, .25, 'sawtooth', .06); },
  tap() { tone(520, .06, 'sine', .08); },
  pop() { tone(880, .08, 'square', .05); tone(1320, .08, 'square', .04, .05); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .3, 'triangle', .15, i * .11)); },
  tick() { tone(1200, .04, 'sine', .05); },
  star() { [1046, 1318, 1568].forEach((f, i) => tone(f, .18, 'sine', .12, i * .05)); },
  jump() { tone(330, .12, 'sine', .07); tone(500, .1, 'sine', .05, .05); },
  land() { noise(.08, .08, 300); },
  splash() { noise(.5, .25, 900); },
  roar() { noise(.6, .35, 220); tone(110, .6, 'sawtooth', .12); tone(90, .7, 'square', .06, .1); },
  talk(pitch) { tone((pitch || 1) * (380 + Math.random() * 160), .05, 'square', .035); },
  magic() { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, .35, 'sine', .1, i * .07)); },
  flute() { [659, 784, 880, 784, 659, 587, 659].forEach((f, i) => tone(f, .4, 'sine', .1, i * .22)); }
};

// Rustige eilandmuziek: pentatonische melodie met zachte baslijn.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
const BASS = [0, -5, -3, -8];
export function musicOn(on) {
  const c = ac(); if (!c) return;
  musicGain.gain.cancelScheduledValues(c.currentTime);
  musicGain.gain.linearRampToValueAtTime(on ? 0.5 : 0, c.currentTime + 1.2);
  if (on && !musicTimer) {
    let step = 0, next = c.currentTime + 0.2;
    const beat = 0.36, root = 261.6;
    musicTimer = setInterval(() => {
      while (next < c.currentTime + 0.6) {
        const bar = Math.floor(step / 8) % 4;
        if (step % 8 === 0) tone(root / 2 * Math.pow(2, BASS[bar] / 12), beat * 7, 'sine', 0.11, next - c.currentTime, musicGain);
        if (step % 2 === 0 || Math.random() < 0.35) {
          const n = SCALE[(step * 3 + bar * 2 + (Math.random() < .3 ? 1 : 0)) % SCALE.length];
          tone(root * Math.pow(2, (n + BASS[bar] * 0) / 12), beat * 1.8, 'triangle', 0.045, next - c.currentTime, musicGain);
        }
        if (step % 4 === 2) tone(root * 2 * Math.pow(2, SCALE[(step + bar) % 5] / 12), beat * 0.8, 'sine', 0.02, next - c.currentTime, musicGain);
        next += beat; step++;
      }
    }, 120);
  }
}
