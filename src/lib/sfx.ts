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
// Mission start: an accelerating snare drum roll landing on a low accent hit
// — a countdown-style "here we go!" instead of a plain jingle.
// ---------------------------------------------------------------------------

/** Number of taps in the roll, not counting the final accent hit. */
export const DRUM_ROLL_TAP_COUNT = 14;
const DRUM_ROLL_START_INTERVAL_S = 0.075;
/** Each tap's gap shrinks by this factor — what makes the roll accelerate. */
const DRUM_ROLL_ACCEL = 0.88;
const DRUM_ROLL_TAP_DURATION_S = 0.045;
const DRUM_ROLL_TAP_PEAK_GAIN = 0.2;
/** Gap between the last tap and the accent hit that closes the roll. */
export const DRUM_ROLL_ACCENT_GAP_S = 0.09;
const DRUM_ROLL_ACCENT_DURATION_S = 0.24;
const DRUM_ROLL_ACCENT_PEAK_GAIN = 0.38;
const DRUM_ROLL_ACCENT_SUB_FREQUENCY = 95;
const DRUM_ROLL_ACCENT_SUB_GAIN = 0.35;

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

/** Plays when the player taps Start on a location's mission. */
export async function playMissionStartSfx(): Promise<void> {
  const ctx = await resumeSharedAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const offsets = drumRollTapOffsets();

  offsets.forEach((offset) => {
    playNoiseBurst(ctx, now + offset, DRUM_ROLL_TAP_DURATION_S, {
      peakGain: DRUM_ROLL_TAP_PEAK_GAIN,
      bandpassFrequency: 2400,
      bandpassQ: 0.9,
      highpassFrequency: 700,
    });
  });

  const accentTime = now + offsets[offsets.length - 1] + DRUM_ROLL_ACCENT_GAP_S;
  playNoiseBurst(ctx, accentTime, DRUM_ROLL_ACCENT_DURATION_S, {
    peakGain: DRUM_ROLL_ACCENT_PEAK_GAIN,
    bandpassFrequency: 1800,
    bandpassQ: 0.7,
    highpassFrequency: 400,
  });
  playTone(ctx, DRUM_ROLL_ACCENT_SUB_FREQUENCY, accentTime, DRUM_ROLL_ACCENT_DURATION_S, {
    type: "sine",
    peakGain: DRUM_ROLL_ACCENT_SUB_GAIN,
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
// Reward applause: a crowd of short, randomised "clap" noise grains that
// swell in and settle out — a round of applause for finishing the mission.
// ---------------------------------------------------------------------------

export const APPLAUSE_DURATION_S = 1.4;
export const APPLAUSE_CLAP_COUNT = 45;
const APPLAUSE_MIN_FREQUENCY = 1500;
const APPLAUSE_MAX_FREQUENCY = 4200;
const APPLAUSE_MIN_CLAP_DURATION_S = 0.03;
const APPLAUSE_MAX_CLAP_DURATION_S = 0.07;
const APPLAUSE_PEAK_GAIN = 0.18;

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

/** Plays once when the Rewards screen for a completed mission appears. */
export async function playRewardApplauseSfx(): Promise<void> {
  const ctx = await resumeSharedAudioContext();
  if (!ctx) return;

  // Dozens of overlapping claps can stack louder than any one envelope
  // expects, so route them through a limiter instead of the raw destination.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -20;
  limiter.knee.value = 10;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.15;
  limiter.connect(ctx.destination);

  const now = ctx.currentTime;
  buildApplauseClaps().forEach(({ startOffset, duration, gain, frequency }) => {
    playNoiseBurst(ctx, now + startOffset, duration, {
      peakGain: gain,
      bandpassFrequency: frequency,
      bandpassQ: 1.2,
      destination: limiter,
    });
  });
}
