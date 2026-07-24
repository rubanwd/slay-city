/**
 * Mission-flow sound effects, synthesised at play time with the Web Audio
 * API — same approach as the snake hiss (./hiss.ts): no audio asset to ship
 * or fetch, so a tap never waits on a slow Storage response the first time
 * it's heard.
 */

import { fillWithNoise } from "./hiss";

type AudioContextConstructor = new () => AudioContext;

/** One shared context for the whole session — see hiss.ts for why. */
let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!Ctor) return null;

  sharedContext ??= new Ctor();
  return sharedContext;
}

/** A context created before the first gesture starts suspended. */
async function resumeIfSuspended(ctx: AudioContext): Promise<boolean> {
  if (ctx.state !== "suspended") return true;
  try {
    await ctx.resume();
    return true;
  } catch {
    return false;
  }
}

interface ToneOptions {
  type?: OscillatorType;
  peakGain?: number;
  /** Optional pitch glide target — the oscillator slides from `frequency` to this. */
  glideTo?: number;
  /** Where the tone's gain node connects to. Defaults to the context's speakers. */
  destination?: AudioNode;
}

/** Plays a single tone with a quick-attack, exponential-decay envelope. */
function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  { type = "sine", peakGain = 0.25, glideTo, destination }: ToneOptions = {}
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, startTime + duration);
  }

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.02, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain).connect(destination ?? ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}

// ---------------------------------------------------------------------------
// Mission start: a rising two-note "let's go" blip.
// ---------------------------------------------------------------------------

/** Notes of the mission-start blip, low to high (C5 → G5). */
export const MISSION_START_NOTES = [523.25, 783.99];
export const MISSION_START_NOTE_DURATION_S = 0.16;
/** Notes overlap slightly rather than queuing end-to-end, so the blip feels snappy. */
export const MISSION_START_NOTE_STAGGER_S = MISSION_START_NOTE_DURATION_S * 0.8;

/** Plays when the player taps Start on a location's mission. */
export async function playMissionStartSfx(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!(await resumeIfSuspended(ctx))) return;

  const now = ctx.currentTime;
  MISSION_START_NOTES.forEach((freq, i) => {
    playTone(ctx, freq, now + i * MISSION_START_NOTE_STAGGER_S, MISSION_START_NOTE_DURATION_S, {
      type: "triangle",
      peakGain: 0.3,
    });
  });
}

// ---------------------------------------------------------------------------
// Map travel: a soft pitch-down "whoosh" as the mascot glides to a new stop.
// ---------------------------------------------------------------------------

export const MAP_TRAVEL_DURATION_S = 0.32;
const MAP_TRAVEL_START_FREQUENCY = 2200;
const MAP_TRAVEL_END_FREQUENCY = 500;
const MAP_TRAVEL_PEAK_GAIN = 0.22;

/** Plays when the mascot is sent walking to a different map location. */
export async function playMapTravelSfx(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!(await resumeIfSuspended(ctx))) return;

  const now = ctx.currentTime;
  const duration = MAP_TRAVEL_DURATION_S;

  const frames = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  fillWithNoise(buffer.getChannelData(0));

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Sweeping the bandpass down turns flat noise into a "whoosh" with direction.
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.Q.value = 0.9;
  bandpass.frequency.setValueAtTime(MAP_TRAVEL_START_FREQUENCY, now);
  bandpass.frequency.exponentialRampToValueAtTime(MAP_TRAVEL_END_FREQUENCY, now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(MAP_TRAVEL_PEAK_GAIN, now + duration * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(bandpass).connect(gain).connect(ctx.destination);
  source.onended = () => {
    source.disconnect();
    bandpass.disconnect();
    gain.disconnect();
  };

  source.start(now);
  source.stop(now + duration);
}

// ---------------------------------------------------------------------------
// Reward fanfare: a rising "wooaah" swoop that lands on a big chord hit, then
// trails off into a sparkly shimmer — the properly triumphant "WOW!" for the
// one screen in the app that should feel like a payoff.
// ---------------------------------------------------------------------------

/** How long the rising swoop takes to build before it lands on the hit. */
export const REWARD_SWOOP_DURATION_S = 0.38;
const REWARD_SWOOP_START_FREQUENCY = 220;
const REWARD_SWOOP_END_FREQUENCY = 1100;
const REWARD_SWOOP_PEAK_GAIN = 0.3;
/** The hit lands slightly before the swoop finishes climbing, for punch. */
const REWARD_HIT_TIME_FRACTION = 0.85;

/** Notes of the impact chord, low to high (C5 E5 G5 C6). */
export const REWARD_CHORD_NOTES = [523.25, 659.25, 783.99, 1046.5];
export const REWARD_CHORD_DURATION_S = 0.9;
const REWARD_CHORD_PEAK_GAIN = 0.22;
const REWARD_SUB_THUMP_FREQUENCY = 80;
const REWARD_SUB_THUMP_DURATION_S = 0.25;
const REWARD_SUB_THUMP_PEAK_GAIN = 0.5;

/** Sparkle notes that glitter in after the hit, high to higher (G6 B6 E7 G7). */
export const REWARD_SPARKLE_NOTES = [1568.0, 1975.5, 2637.0, 3136.0];
export const REWARD_SPARKLE_NOTE_GAP_S = 0.09;
const REWARD_SPARKLE_NOTE_DURATION_S = 0.3;
const REWARD_SPARKLE_PEAK_GAIN = 0.09;

/** Plays once when the Rewards screen for a completed mission appears. */
export async function playRewardFanfareSfx(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!(await resumeIfSuspended(ctx))) return;

  // Several layers stack right at the hit, so route everything through a
  // limiter instead of the raw destination to keep that moment from clipping.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -16;
  limiter.knee.value = 12;
  limiter.ratio.value = 10;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  limiter.connect(ctx.destination);

  const now = ctx.currentTime;

  // Phase 1 — the "wooaah": a rising sawtooth swoop, brightening as it climbs.
  const swoop = ctx.createOscillator();
  swoop.type = "sawtooth";
  swoop.frequency.setValueAtTime(REWARD_SWOOP_START_FREQUENCY, now);
  swoop.frequency.exponentialRampToValueAtTime(REWARD_SWOOP_END_FREQUENCY, now + REWARD_SWOOP_DURATION_S);

  const swoopFilter = ctx.createBiquadFilter();
  swoopFilter.type = "lowpass";
  swoopFilter.frequency.setValueAtTime(500, now);
  swoopFilter.frequency.exponentialRampToValueAtTime(4500, now + REWARD_SWOOP_DURATION_S);

  const swoopGain = ctx.createGain();
  swoopGain.gain.setValueAtTime(0.0001, now);
  swoopGain.gain.exponentialRampToValueAtTime(REWARD_SWOOP_PEAK_GAIN, now + REWARD_SWOOP_DURATION_S * 0.9);
  swoopGain.gain.exponentialRampToValueAtTime(0.0001, now + REWARD_SWOOP_DURATION_S);

  swoop.connect(swoopFilter).connect(swoopGain).connect(limiter);
  swoop.start(now);
  swoop.stop(now + REWARD_SWOOP_DURATION_S + 0.02);
  swoop.onended = () => {
    swoop.disconnect();
    swoopFilter.disconnect();
    swoopGain.disconnect();
  };

  // Phase 2 — the hit: a bright chord plus a sub thump for weight, landing
  // right as the swoop peaks.
  const hitTime = now + REWARD_SWOOP_DURATION_S * REWARD_HIT_TIME_FRACTION;
  REWARD_CHORD_NOTES.forEach((freq) => {
    playTone(ctx, freq, hitTime, REWARD_CHORD_DURATION_S, {
      type: "sawtooth",
      peakGain: REWARD_CHORD_PEAK_GAIN,
      destination: limiter,
    });
  });
  playTone(ctx, REWARD_SUB_THUMP_FREQUENCY, hitTime, REWARD_SUB_THUMP_DURATION_S, {
    type: "sine",
    peakGain: REWARD_SUB_THUMP_PEAK_GAIN,
    destination: limiter,
  });

  // Phase 3 — sparkle: a quick high glitter trailing off after the hit.
  REWARD_SPARKLE_NOTES.forEach((freq, i) => {
    playTone(
      ctx,
      freq,
      hitTime + i * REWARD_SPARKLE_NOTE_GAP_S,
      REWARD_SPARKLE_NOTE_DURATION_S,
      { type: "sine", peakGain: REWARD_SPARKLE_PEAK_GAIN, destination: limiter }
    );
  });
}
