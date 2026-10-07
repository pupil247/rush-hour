// Web Audio cues (no asset files). Started only after the first user gesture.
const MUTE_KEY = 'rushHour.muted';

let context = null;
let unlocked = false;

export function isMuted() {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(value) {
  try {
    globalThis.localStorage?.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // ignore
  }
}

export function toggleMuted() {
  const next = !isMuted();
  setMuted(next);
  return next;
}

function ensureContext() {
  if (isMuted()) return null;
  const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
}

export function unlockAudio() {
  unlocked = true;
  ensureContext();
}

function tone(frequency, duration, type = 'sine', gain = 0.05, offset = 0) {
  if (!unlocked) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + offset;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playMove() {
  tone(330, 0.08, 'triangle', 0.05);
}

export function playBlocked() {
  tone(140, 0.12, 'sawtooth', 0.04);
}

export function playVictory() {
  tone(523.25, 0.14, 'sine', 0.06, 0);
  tone(659.25, 0.14, 'sine', 0.06, 0.12);
  tone(783.99, 0.22, 'sine', 0.06, 0.24);
}
