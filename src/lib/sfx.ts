/**
 * Mission-flow sound effects, synthesised at play time with the Web Audio
 * API — same approach as the snake hiss (./hiss.ts): no audio asset to ship
 * or fetch, so a tap never waits on a slow Storage response the first time
 * it's heard.
 */

import { resumeSharedAudioContext } from "./audioContext";
import { fillWithNoise } from "./hiss";

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

interface NoiseBurstOptions {
  peakGain: number;
  bandpassFrequency: number;
  bandpassQ?: number;
  /** Optional highpass ahead of the bandpass, to strip low rumble from the hit. */
  highpassFrequency?: number;
  destination?: AudioNode;
}

/** Plays one short, filtered burst of noise — the building block for percussive hits. */
function playNoiseBurst(
  ctx: AudioContext,
  startTime: number,
  duration: number,
  { peakGain, bandpassFrequency, bandpassQ = 1, highpassFrequency, destination }: NoiseBurstOptions
): void {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  fillWithNoise(buffer.getChannelData(0));

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = bandpassFrequency;
  bandpass.Q.value = bandpassQ;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peakGain, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  const nodes: AudioNode[] = [source, bandpass, gain];
  let chain: AudioNode = source;
  if (highpassFrequency) {
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = highpassFrequency;
    chain.connect(highpass);
    chain = highpass;
    nodes.push(highpass);
  }
  chain.connect(bandpass).connect(gain).connect(destination ?? ctx.destination);

  source.start(startTime);
  source.stop(startTime + duration + 0.01);
  source.onended = () => {
    nodes.forEach((node) => node.disconnect());
  };
}

// ---------------------------------------------------------------------------
// Mission start: a crisp, accelerating drum roll landing on a resonant gong
// "BONG" — a countdown-style "here we go!" instead of a plain jingle.
// ---------------------------------------------------------------------------

/** Number of taps in the roll, not counting the final gong hit. */
export const DRUM_ROLL_TAP_COUNT = 16;
const DRUM_ROLL_START_INTERVAL_S = 0.07;
/** Each tap's gap shrinks by this factor — what makes the roll accelerate. */
const DRUM_ROLL_ACCEL = 0.9;
/**
 * Short and narrowly filtered so each tap reads as a distinct "crack"
 * instead of smearing into a continuous whoosh once the gaps get tight.
 */
const DRUM_ROLL_TAP_DURATION_S = 0.02;
const DRUM_ROLL_TAP_PEAK_GAIN = 0.24;
const DRUM_ROLL_TAP_BANDPASS_FREQUENCY = 3400;
const DRUM_ROLL_TAP_BANDPASS_Q = 2.2;
const DRUM_ROLL_TAP_HIGHPASS_FREQUENCY = 1200;
/** Gap between the last tap and the gong hit that closes the roll. */
export const DRUM_ROLL_ACCENT_GAP_S = 0.1;

/** Gong hit: a handful of inharmonic partials over a long decay, like a real bell/gong. */
export const GONG_FUNDAMENTAL_FREQUENCY = 165;
export const GONG_PARTIAL_RATIOS = [1, 1.79, 2.45, 3.76, 4.07, 5.43];
const GONG_PARTIAL_GAINS = [1, 0.55, 0.35, 0.22, 0.16, 0.1];
export const GONG_DURATION_S = 1.8;
const GONG_PEAK_GAIN = 0.5;

/** Start offset (seconds, from roll start) of each tap — accelerating gaps. */
export function drumRollTapOffsets(
  count = DRUM_ROLL_TAP_COUNT,
  startInterval = DRUM_ROLL_START_INTERVAL_S,
  accel = DRUM_ROLL_ACCEL
): number[] {
  const offsets: number[] = [];
  let t = 0;
  let interval = startInterval;
  for (let i = 0; i < count; i += 1) {
    offsets.push(t);
    t += interval;
    interval *= accel;
  }
  return offsets;
}

/** Plays the closing gong hit — a mallet-strike transient plus a ringing decay. */
function playGongHit(ctx: AudioContext, startTime: number, destination: AudioNode): void {
  GONG_PARTIAL_RATIOS.forEach((ratio, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = GONG_FUNDAMENTAL_FREQUENCY * ratio;

    // Higher partials die out faster than the fundamental, like a real
    // gong's bright shimmer fading before its low ring settles.
    const decay = GONG_DURATION_S / (1 + i * 0.35);
    const peak = GONG_PEAK_GAIN * GONG_PARTIAL_GAINS[i];

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

    osc.connect(gain).connect(destination);
    osc.start(startTime);
    osc.stop(startTime + decay + 0.05);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  });

  // A quick noise transient at the front sells the mallet strike itself.
  playNoiseBurst(ctx, startTime, 0.05, {
    peakGain: 0.3,
    bandpassFrequency: 900,
    bandpassQ: 0.6,
    destination,
  });
}

/** Plays when the player taps Start on a location's mission. */
export async function playMissionStartSfx(): Promise<void> {
  const ctx = await resumeSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const offsets = drumRollTapOffsets();

  offsets.forEach((offset) => {
    playNoiseBurst(ctx, now + offset, DRUM_ROLL_TAP_DURATION_S, {
      peakGain: DRUM_ROLL_TAP_PEAK_GAIN,
      bandpassFrequency: DRUM_ROLL_TAP_BANDPASS_FREQUENCY,
      bandpassQ: DRUM_ROLL_TAP_BANDPASS_Q,
      highpassFrequency: DRUM_ROLL_TAP_HIGHPASS_FREQUENCY,
    });
  });

  const gongTime = now + offsets[offsets.length - 1] + DRUM_ROLL_ACCENT_GAP_S;
  playGongHit(ctx, gongTime, ctx.destination);
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
  const ctx = await resumeSharedAudioContext();
  if (!ctx) return;

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
// Reward applause: a big-concert moment — a crowd roar under a swell of
// claps, with a few firework pops going off — for finishing the mission.
// ---------------------------------------------------------------------------

export const APPLAUSE_DURATION_S = 1.7;
export const APPLAUSE_CLAP_COUNT = 70;
const APPLAUSE_MIN_FREQUENCY = 1500;
const APPLAUSE_MAX_FREQUENCY = 4200;
const APPLAUSE_MIN_CLAP_DURATION_S = 0.03;
const APPLAUSE_MAX_CLAP_DURATION_S = 0.07;
const APPLAUSE_PEAK_GAIN = 0.32;

export interface ApplauseClap {
  /** Seconds after the applause starts that this clap fires. */
  startOffset: number;
  duration: number;
  gain: number;
  frequency: number;
}

/**
 * Shapes the crowd's overall volume over the applause: a quick swell in, a
 * brief hold at full volume, then a gentle settle — rather than a flat wall
 * of claps starting and stopping abruptly.
 */
export function applauseSwell(fraction: number): number {
  const attackEnd = 0.18;
  const releaseStart = 0.65;
  if (fraction < attackEnd) return fraction / attackEnd;
  if (fraction < releaseStart) return 1;
  return Math.max(0, 1 - (fraction - releaseStart) / (1 - releaseStart));
}

/**
 * Builds the individual clap "grains" that make up the applause: randomised
 * timing, duration and pitch (`random` is injectable so this stays testable),
 * each scaled by `applauseSwell` so the crowd builds and settles naturally.
 */
export function buildApplauseClaps(
  count = APPLAUSE_CLAP_COUNT,
  totalDuration = APPLAUSE_DURATION_S,
  random: () => number = Math.random
): ApplauseClap[] {
  return Array.from({ length: count }, () => {
    const startOffset = random() * totalDuration;
    const swell = applauseSwell(startOffset / totalDuration);
    return {
      startOffset,
      duration:
        APPLAUSE_MIN_CLAP_DURATION_S +
        random() * (APPLAUSE_MAX_CLAP_DURATION_S - APPLAUSE_MIN_CLAP_DURATION_S),
      gain: APPLAUSE_PEAK_GAIN * (0.5 + random() * 0.5) * swell,
      frequency: APPLAUSE_MIN_FREQUENCY + random() * (APPLAUSE_MAX_FREQUENCY - APPLAUSE_MIN_FREQUENCY),
    };
  }).sort((a, b) => a.startOffset - b.startOffset);
}

const CROWD_ROAR_BANDPASS_FREQUENCY = 1100;
const CROWD_ROAR_BANDPASS_Q = 0.5;
const CROWD_ROAR_PEAK_GAIN = 0.3;
const CROWD_ROAR_ENVELOPE_POINTS = 64;

/** A wash of crowd "roar" underneath the claps — reuses the applause swell so it rises and falls with them. */
function playCrowdRoar(
  ctx: AudioContext,
  startTime: number,
  duration: number,
  destination: AudioNode
): void {
  const frames = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  fillWithNoise(buffer.getChannelData(0));

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = CROWD_ROAR_BANDPASS_FREQUENCY;
  bandpass.Q.value = CROWD_ROAR_BANDPASS_Q;

  const gain = ctx.createGain();
  const curve = new Float32Array(CROWD_ROAR_ENVELOPE_POINTS);
  for (let i = 0; i < CROWD_ROAR_ENVELOPE_POINTS; i += 1) {
    curve[i] = CROWD_ROAR_PEAK_GAIN * applauseSwell(i / (CROWD_ROAR_ENVELOPE_POINTS - 1));
  }
  gain.gain.setValueCurveAtTime(curve, startTime, duration);

  source.connect(bandpass).connect(gain).connect(destination);
  source.start(startTime);
  source.stop(startTime + duration);
  source.onended = () => {
    source.disconnect();
    bandpass.disconnect();
    gain.disconnect();
  };
}

// Firework pops: a handful of loud bangs (some with a whistle-up lead-in and
// a crackle tail) scattered through the applause, like fireworks going off.

export const FIREWORK_POP_COUNT = 9;
/** Pops only start once the crowd's already going, not right at the top. */
export const FIREWORK_START_DELAY_S = 0.3;
const FIREWORK_WHISTLE_CHANCE = 0.5;
const FIREWORK_WHISTLE_DURATION_S = 0.22;
const FIREWORK_WHISTLE_START_FREQUENCY = 700;
const FIREWORK_WHISTLE_END_FREQUENCY = 1800;
const FIREWORK_POP_DURATION_S = 0.14;
const FIREWORK_POP_PEAK_GAIN = 0.55;
const FIREWORK_SUB_THUMP_FREQUENCY = 65;
const FIREWORK_CRACKLE_COUNT = 3;
const FIREWORK_CRACKLE_GAP_S = 0.03;

export interface FireworkPop {
  /** Seconds after the applause starts that this pop goes off. */
  startOffset: number;
  /** Whether a rising whistle leads into the pop, like a firework going up first. */
  hasWhistle: boolean;
}

/** Builds the firework pops scattered through the applause (`random` is injectable for tests). */
export function buildFireworkPops(
  count = FIREWORK_POP_COUNT,
  totalDuration = APPLAUSE_DURATION_S,
  random: () => number = Math.random
): FireworkPop[] {
  return Array.from({ length: count }, () => ({
    startOffset: FIREWORK_START_DELAY_S + random() * (totalDuration - FIREWORK_START_DELAY_S),
    hasWhistle: random() < FIREWORK_WHISTLE_CHANCE,
  })).sort((a, b) => a.startOffset - b.startOffset);
}

/** Plays one firework pop: an optional whistle-up, the bang, and a short crackle tail. */
function playFireworkPop(
  ctx: AudioContext,
  popTime: number,
  hasWhistle: boolean,
  destination: AudioNode
): void {
  if (hasWhistle) {
    playTone(ctx, FIREWORK_WHISTLE_START_FREQUENCY, popTime - FIREWORK_WHISTLE_DURATION_S, FIREWORK_WHISTLE_DURATION_S, {
      type: "sine",
      peakGain: 0.09,
      glideTo: FIREWORK_WHISTLE_END_FREQUENCY,
      destination,
    });
  }

  playNoiseBurst(ctx, popTime, FIREWORK_POP_DURATION_S, {
    peakGain: FIREWORK_POP_PEAK_GAIN,
    bandpassFrequency: 1800,
    bandpassQ: 0.4,
    destination,
  });
  playTone(ctx, FIREWORK_SUB_THUMP_FREQUENCY, popTime, FIREWORK_POP_DURATION_S, {
    type: "sine",
    peakGain: 0.45,
    destination,
  });

  for (let i = 1; i <= FIREWORK_CRACKLE_COUNT; i += 1) {
    playNoiseBurst(ctx, popTime + i * FIREWORK_CRACKLE_GAP_S, 0.04, {
      peakGain: FIREWORK_POP_PEAK_GAIN * 0.35,
      bandpassFrequency: 2600,
      bandpassQ: 0.6,
      destination,
    });
  }
}

/** Plays once when the Rewards screen for a completed mission appears. */
export async function playRewardApplauseSfx(): Promise<void> {
  const ctx = await resumeSharedAudioContext();
  if (!ctx) return;

  // This is meant to be loud — a concert crowd, not a polite clap — so the
  // layers below run hot; a hard limiter keeps that from turning into
  // clipping while still squashing everything up toward full volume.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -24;
  limiter.knee.value = 6;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.15;
  limiter.connect(ctx.destination);

  const now = ctx.currentTime;

  playCrowdRoar(ctx, now, APPLAUSE_DURATION_S, limiter);

  buildApplauseClaps().forEach(({ startOffset, duration, gain, frequency }) => {
    playNoiseBurst(ctx, now + startOffset, duration, {
      peakGain: gain,
      bandpassFrequency: frequency,
      bandpassQ: 1.2,
      destination: limiter,
    });
  });

  buildFireworkPops().forEach(({ startOffset, hasWhistle }) => {
    playFireworkPop(ctx, now + startOffset, hasWhistle, limiter);
  });
}
