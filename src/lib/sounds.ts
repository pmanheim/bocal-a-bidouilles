/**
 * Web Audio API sound generation — no audio files needed.
 * All functions check localStorage mute state before playing.
 */

export const MUTE_STORAGE_KEY = "bocal-muted";

let audioCtx: AudioContext | null = null;

// Cached MediaQueryList — avoids recreating on every sound call
let reducedMotionQuery: MediaQueryList | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function isMuted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (!reducedMotionQuery) {
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  }
  return reducedMotionQuery.matches;
}

function playTone(
  frequency: number,
  duration: number,
  delay: number = 0,
  type: OscillatorType = "sine",
  volume: number = 0.15
) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  const startTime = ctx.currentTime + delay;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Short ascending two-tone "ding" for individual check-in (~150ms) */
export function playCheckInSound() {
  if (isMuted() || prefersReducedMotion()) return;
  playTone(523, 0.08, 0, "sine", 0.12); // C5
  playTone(659, 0.12, 0.06, "sine", 0.12); // E5
}

/** Satisfying "clink" for marble dropping into jar (~200ms) */
export function playMarbleDropSound() {
  if (isMuted() || prefersReducedMotion()) return;
  playTone(1200, 0.08, 0, "sine", 0.1);
  playTone(800, 0.15, 0.03, "triangle", 0.08);
}

/** Ascending three-note fanfare for daily success celebration (~500ms) */
export function playCelebrationSound() {
  if (isMuted() || prefersReducedMotion()) return;
  playTone(523, 0.15, 0, "sine", 0.12); // C5
  playTone(659, 0.15, 0.12, "sine", 0.12); // E5
  playTone(784, 0.25, 0.24, "sine", 0.15); // G5
  // Add a shimmer
  playTone(1047, 0.3, 0.36, "sine", 0.06); // C6 soft
}
