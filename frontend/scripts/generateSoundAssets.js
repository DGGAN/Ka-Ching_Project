/**
 * @file frontend/scripts/generateSoundAssets.js
 * @description Synthesizes the 9 SOUND_PROFILES into standard 44.1kHz 16-bit Stereo PCM .wav files inside frontend/assets/sounds/.
 *
 * Usage (run from frontend directory):
 *   node scripts/generateSoundAssets.js
 */

const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "assets", "sounds");

// 9 Sound Profiles
const SOUND_PROFILES = {
  income: {
    durationMs: 300,
    notes: [
      { fStart: 440, fEnd: 220, start: 0, dur: 0.018, wave: "triangle", vol: 0.15 },
      { fStart: 739.99, fEnd: 739.99, start: 0.02, dur: 0.07, wave: "sine", vol: 0.2, harmonic: 2 },
      { fStart: 1108.73, fEnd: 1108.73, start: 0.08, dur: 0.21, wave: "sine", vol: 0.23, harmonic: 1.5 },
    ],
  },
  expense: {
    durationMs: 185,
    notes: [
      { fStart: 680, fEnd: 340, start: 0, dur: 0.045, wave: "triangle", vol: 0.18 },
      { fStart: 440, fEnd: 220, start: 0.05, dur: 0.13, wave: "sine", vol: 0.23, harmonic: 1.5 },
    ],
  },
  tab: {
    durationMs: 26,
    notes: [{ fStart: 480, fEnd: 210, start: 0, dur: 0.022, wave: "triangle", vol: 0.17 }],
  },
  pop: {
    durationMs: 26,
    notes: [{ fStart: 520, fEnd: 740, start: 0, dur: 0.022, wave: "sine", vol: 0.15 }],
  },
  bell: {
    durationMs: 215,
    notes: [
      { fStart: 587.33, fEnd: 587.33, start: 0, dur: 0.04, wave: "sine", vol: 0.15 },
      { fStart: 880, fEnd: 880, start: 0.042, dur: 0.04, wave: "sine", vol: 0.17 },
      { fStart: 1174.66, fEnd: 1174.66, start: 0.085, dur: 0.12, wave: "sine", vol: 0.19, harmonic: 1.5 },
    ],
  },
  profile: {
    durationMs: 160,
    notes: [
      { fStart: 220, fEnd: 440, start: 0, dur: 0.065, wave: "triangle", vol: 0.16 },
      { fStart: 659.25, fEnd: 659.25, start: 0.06, dur: 0.09, wave: "sine", vol: 0.18 },
    ],
  },
  edit: {
    durationMs: 85,
    notes: [
      { fStart: 420, fEnd: 580, start: 0, dur: 0.026, wave: "triangle", vol: 0.18 },
      { fStart: 739.99, fEnd: 739.99, start: 0.035, dur: 0.045, wave: "sine", vol: 0.2 },
    ],
  },
  delete: {
    durationMs: 105,
    notes: [{ fStart: 460, fEnd: 110, start: 0, dur: 0.095, wave: "sine", vol: 0.21 }],
  },
  error: {
    durationMs: 175,
    notes: [
      { fStart: 311.13, fEnd: 311.13, start: 0, dur: 0.055, wave: "triangle", vol: 0.21 },
      { fStart: 233.08, fEnd: 220, start: 0.07, dur: 0.095, wave: "triangle", vol: 0.24 },
    ],
  },
};

const sampleWaveform = (waveType, phase) => {
  const p = phase - Math.floor(phase);
  if (waveType === "square") return p < 0.5 ? 1.0 : -1.0;
  if (waveType === "sawtooth") return 2.0 * p - 1.0;
  if (waveType === "triangle") {
    return 1.0 - 4.0 * Math.abs(Math.round(p - 0.25) - (p - 0.25));
  }
  return Math.sin(2.0 * Math.PI * p);
};

// Build standard 44.1kHz 16-bit Stereo PCM WAV buffer
function buildStereoWavBuffer(profile) {
  const sampleRate = 44100;
  const numChannels = 2;
  const bytesPerSample = 2;
  const totalDurationSec = Math.max(profile.durationMs / 1000 + 0.05, 0.24);
  const totalFrames = Math.floor(sampleRate * totalDurationSec);
  const floatSamples = new Float32Array(totalFrames);

  profile.notes.forEach((n) => {
    const startSample = Math.floor(n.start * sampleRate);
    const durSamples = Math.max(1, Math.floor(n.dur * sampleRate));
    let phase = 0;
    let harmPhase = 0;

    for (let i = 0; i < durSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalFrames) break;

      const progress = i / durSamples;
      const freq = n.fStart + (n.fEnd - n.fStart) * progress;
      phase += freq / sampleRate;

      const attack = Math.min(1.0, i / Math.max(1, sampleRate * 0.002));
      const release = Math.pow(1.0 - progress, 1.15);
      const env = attack * release * Math.min(0.9, (n.vol || 0.2) * 2.4);

      let val = sampleWaveform(n.wave || "sine", phase) * env;

      if (n.harmonic) {
        harmPhase += (freq * n.harmonic) / sampleRate;
        val += Math.sin(2.0 * Math.PI * harmPhase) * env * 0.35;
      }

      floatSamples[idx] += val;
    }
  });

  const dataByteLength = totalFrames * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataByteLength);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(dataByteLength, 40);

  for (let i = 0; i < totalFrames; i++) {
    const clamped = Math.max(-1.0, Math.min(1.0, floatSamples[i]));
    const pcm16 = Math.round(clamped * 32767);
    const offset = 44 + i * 4;
    buffer.writeInt16LE(pcm16, offset);
    buffer.writeInt16LE(pcm16, offset + 2);
  }

  return buffer;
}

function generateAllSounds() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("[INFO] Generating 9 finalized WAV files into frontend/assets/sounds/ ...");

  Object.entries(SOUND_PROFILES).forEach(([name, profile]) => {
    const wavBuffer = buildStereoWavBuffer(profile);
    const filePath = path.join(OUTPUT_DIR, `${name}.wav`);
    fs.writeFileSync(filePath, wavBuffer);
    console.log(`  [OK] Created assets/sounds/${name}.wav (${(wavBuffer.length / 1024).toFixed(1)} KB)`);
  });

  console.log("\n[OK] All 9 WAV sound assets generated successfully!");
}

generateAllSounds();
