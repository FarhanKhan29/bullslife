/**
 * Tiny procedural audio (Web Audio API) — no sound files needed.
 * SFX: soft UI blips, chat pops, stamp chimes, celebration fanfare.
 * Music: a slow, cozy chord loop.
 */
import { getSettings, settingsEvents } from './settings';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = getSettings().sfxVolume;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.09;
    musicGain.connect(master);
  } catch {
    ctx = null;
  }
  return ctx;
}

settingsEvents.on('change', (s) => {
  if (master) master.gain.value = s.sfxVolume;
  if (s.music) startMusic();
  else stopMusic();
});

/** Must be called from a user gesture (browsers block autoplay). */
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') void c.resume();
  if (getSettings().music) startMusic();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, dest?: AudioNode) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(dest ?? master!);
  o.start(start);
  o.stop(start + dur + 0.05);
}

export type Sfx = 'click' | 'chat' | 'emote' | 'stamp' | 'success' | 'join' | 'door' | 'error' | 'shutter' | 'plate' | 'piano' | 'drums' | 'swish' | 'miss' | 'kick' | 'quake' | 'eat' | 'sit' | 'ping' | 'honk';

export function play(sfx: Sfx) {
  const c = ensure();
  if (!c || c.state !== 'running' || getSettings().sfxVolume <= 0) return;
  const t = c.currentTime;
  switch (sfx) {
    case 'click':
      tone(660, t, 0.08, 'triangle', 0.15);
      break;
    case 'chat':
      tone(880, t, 0.09, 'sine', 0.18);
      tone(1320, t + 0.06, 0.1, 'sine', 0.12);
      break;
    case 'emote':
      tone(523, t, 0.1, 'triangle', 0.18);
      tone(784, t + 0.08, 0.14, 'triangle', 0.16);
      break;
    case 'join':
      tone(392, t, 0.12, 'sine', 0.14);
      tone(587, t + 0.1, 0.16, 'sine', 0.14);
      break;
    case 'door':
      tone(220, t, 0.18, 'triangle', 0.2);
      tone(330, t + 0.1, 0.2, 'triangle', 0.15);
      break;
    case 'plate':
      tone(300, t, 0.12, 'square', 0.08);
      break;
    case 'error':
      tone(200, t, 0.15, 'sawtooth', 0.08);
      break;
    case 'shutter':
      tone(1800, t, 0.03, 'square', 0.1);
      tone(900, t + 0.05, 0.05, 'square', 0.08);
      break;
    case 'stamp':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.3, 'triangle', 0.18));
      break;
    case 'piano': {
      // a short random pentatonic phrase
      const scale = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
      let i = Math.floor(Math.random() * 4);
      for (let n = 0; n < 5; n++) {
        i = Math.max(0, Math.min(scale.length - 1, i + Math.floor(Math.random() * 5) - 2));
        tone(scale[i], t + n * 0.18, 0.6, 'triangle', 0.2);
        tone(scale[i] * 2, t + n * 0.18, 0.3, 'sine', 0.05);
      }
      break;
    }
    case 'drums':
      [0, 0.15, 0.3, 0.45].forEach((d, i) => tone(i % 2 ? 180 : 70, t + d, 0.12, i % 2 ? 'square' : 'sine', i % 2 ? 0.07 : 0.3));
      break;
    case 'swish':
      tone(900, t, 0.08, 'sine', 0.12);
      [523, 784, 1047].forEach((f, i) => tone(f, t + 0.1 + i * 0.08, 0.25, 'triangle', 0.16));
      break;
    case 'miss':
      tone(330, t, 0.15, 'triangle', 0.15);
      tone(247, t + 0.12, 0.25, 'triangle', 0.15);
      break;
    case 'kick':
      tone(90, t, 0.15, 'sine', 0.35);
      break;
    case 'quake':
      for (let n = 0; n < 8; n++) tone(45 + Math.random() * 20, t + n * 0.12, 0.2, 'sawtooth', 0.12);
      break;
    case 'eat':
      tone(600, t, 0.06, 'square', 0.06);
      tone(800, t + 0.08, 0.06, 'square', 0.06);
      break;
    case 'sit':
      tone(220, t, 0.1, 'sine', 0.12);
      break;
    case 'honk':
      tone(320, t, 0.14, 'sawtooth', 0.09);
      tone(250, t + 0.16, 0.2, 'sawtooth', 0.09);
      break;
    case 'ping':
      tone(1500, t, 0.05, 'sine', 0.12);
      tone(1200, t + 0.25, 0.05, 'sine', 0.12);
      break;
    case 'success':
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.4, 'triangle', 0.18));
      break;
  }
}

// ---- cheerful campus tune: bouncy bass, plucked chords, a sunny melody ----
const BEAT = 0.27; // seconds per eighth note (about 110 BPM)
const CHORDS = [
  [261.63, 329.63, 392.0], // C
  [392.0, 493.88, 587.33], // G
  [440.0, 523.25, 659.25], // Am
  [349.23, 440.0, 523.25], // F
];
const BASS = [130.81, 98.0, 110.0, 87.31];
// melody in eighth notes, four bars at a time; 0 is a rest
const MELODIES = [
  [659.25, 0, 783.99, 659.25, 880.0, 783.99, 659.25, 0],
  [587.33, 0, 783.99, 587.33, 659.25, 783.99, 880.0, 783.99],
  [880.0, 0, 1046.5, 880.0, 783.99, 659.25, 783.99, 0],
  [698.46, 880.0, 1046.5, 880.0, 783.99, 698.46, 587.33, 0],
];

function startMusic() {
  const c = ensure();
  if (!c || musicTimer !== null) return;
  let step = 0;
  const playBar = () => {
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.05;
    const i = step % CHORDS.length;
    for (let n = 0; n < 8; n++) {
      const at = t + n * BEAT;
      // oom-pah: bass on the beat, chord stabs on the off-beats
      if (n % 2 === 0) tone(n % 4 === 0 ? BASS[i] : BASS[i] * 1.5, at, 0.3, 'triangle', 0.5, musicGain!);
      else CHORDS[i].forEach((f) => tone(f, at, 0.2, 'triangle', 0.14, musicGain!));
      const note = MELODIES[i][n];
      if (note && step % 8 >= 2) tone(note, at, 0.32, 'square', 0.1, musicGain!);
      tone(7000, at, 0.03, 'square', 0.012, musicGain!); // light shaker
    }
    step++;
  };
  playBar();
  musicTimer = window.setInterval(playBar, BEAT * 8 * 1000);
}

function stopMusic() {
  if (musicTimer !== null) clearInterval(musicTimer);
  musicTimer = null;
}
