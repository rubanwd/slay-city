/**
 * Snake-hiss sound effect, synthesised at play time with the Web Audio API.
 *
 * Deliberately not an audio file: the hiss is band-passed white noise, which
 * costs nothing to ship (no asset, no network fetch on tap) and can never be
 * blocked by a slow Storage response the first time a child taps Slay.
 */

import { resumeSharedAudioContext } from "./audioContext";

/** Length of one hiss, in seconds. */
export const HISS_DURATION_S = 0.85;

/** Peak gain of the hiss — loud enough to be playful, quiet enough for a phone. */
export const HISS_PEAK_GAIN = 0.32;

/** Number of points in the amplitude envelope handed to the gain node. */
const ENVELOPE_POINTS = 128;

/** Fraction of the hiss spent ramping up, and the point the tail starts. */
const ATTACK_FRACTION = 0.08;
const RELEASE_START = 0.55;

/** Breath waver: how many times the hiss pulses, and how deep each dip goes. */
const FLUTTER_CYCLES = 7;
const FLUTTER_DEPTH = 0.15;

/**
 * Fills `data` with white noise in [-1, 1). `random` is injectable so the shape
 * of the buffer can be asserted in tests.
 */
export function fillWithNoise(data: Float32Array, random: () => number = Math.random): void {
  for (let i = 0; i < data.length; i += 1) {
    data[i] = random() * 2 - 1;
  }
}

/**
 * Amplitude envelope for the hiss: a fast attack, a fluttering body (so it
 * breathes like a real snake instead of sounding like radio static) and a long
 * fade to silence. Returned as a value curve normalised over the full duration.
 */
export function hissEnvelope(points = ENVELOPE_POINTS, peak = HISS_PEAK_GAIN): Float32Array {
  const curve = new Float32Array(points);

  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1);
    const attack = Math.min(t / ATTACK_FRACTION, 1);
    const release = t < RELEASE_START ? 1 : Math.max(0, 1 - (t - RELEASE_START) / (1 - RELEASE_START));
    const flutter = 1 - FLUTTER_DEPTH + FLUTTER_DEPTH * Math.sin(t * Math.PI * 2 * FLUTTER_CYCLES);
    curve[i] = peak * attack * release * flutter;
  }

  // Guarantee true silence at both ends so the tap never clicks.
  curve[0] = 0;
  curve[points - 1] = 0;
  return curve;
}

let activeSource: AudioBufferSourceNode | null = null;

/**
 * Plays the hiss. Safe to call on every tap: a hiss already in flight is cut
 * off rather than layered, so spamming the mascot stays a hiss and not a roar.
 * Resolves silently (and does nothing) where Web Audio is unavailable.
 */
export async function playSnakeHiss(): Promise<void> {
  const ctx = await resumeSharedAudioContext();
  if (!ctx) return;

  activeSource?.stop();

  const frames = Math.floor(ctx.sampleRate * HISS_DURATION_S);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  fillWithNoise(buffer.getChannelData(0));

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Highpass strips the rumble, bandpass parks the energy in the "sss" region.
  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 1800;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 5200;
  bandpass.Q.value = 0.7;

  const gain = ctx.createGain();
  gain.gain.setValueCurveAtTime(hissEnvelope(), ctx.currentTime, HISS_DURATION_S);

  source.connect(highpass).connect(bandpass).connect(gain).connect(ctx.destination);

  source.onended = () => {
    source.disconnect();
    highpass.disconnect();
    bandpass.disconnect();
    gain.disconnect();
    if (activeSource === source) activeSource = null;
  };

  activeSource = source;
  source.start();
  source.stop(ctx.currentTime + HISS_DURATION_S);
}
