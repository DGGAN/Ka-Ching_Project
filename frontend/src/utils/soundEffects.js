/**
 * @file frontend/src/utils/soundEffects.js
 * @layer Utility (8 Finalized Retro-Modern Sound Profiles for Web & Android/iOS)
 * @description Synthesizes ONLY the 8 finalized SOUND_PROFILES ("income"/"kaching", "expense", "tab", "pop", "bell", "profile"/"theme", "edit", "delete") using Web Audio API on Web and cached WAV file playback via expo-av + expo-file-system on Android/iOS.
 * @exports playUiSound
 */

import { Platform, Vibration } from "react-native";

let webAudioCtx = null;
const cachedWavUris = {};
const cachedFilePaths = {};

// 8 Finalized Sound Profiles (All legacy sounds removed)
const SOUND_PROFILES = {
  // 1. Income (+Income saved): #1 Gem 1-UP (3-note ascending arpeggio E6 -> G6 -> C7 with 2x harmonic)
  income: {
    durationMs: 360,
    notes: [
      { fStart: 1318.5, fEnd: 1318.5, start: 0.0, dur: 0.055, wave: "square", vol: 0.15 },
      { fStart: 1567.98, fEnd: 1567.98, start: 0.055, dur: 0.055, wave: "square", vol: 0.16 },
      { fStart: 2093.0, fEnd: 2093.0, start: 0.11, dur: 0.25, wave: "sine", vol: 0.34, harmonic: 2.0 },
    ],
  },
  kaching: {
    durationMs: 360,
    notes: [
      { fStart: 1318.5, fEnd: 1318.5, start: 0.0, dur: 0.055, wave: "square", vol: 0.15 },
      { fStart: 1567.98, fEnd: 1567.98, start: 0.055, dur: 0.055, wave: "square", vol: 0.16 },
      { fStart: 2093.0, fEnd: 2093.0, start: 0.11, dur: 0.25, wave: "sine", vol: 0.34, harmonic: 2.0 },
    ],
  },

  // 2. Expense (-Expense saved): #1 Retro Pipe / Coin Drain (3-step descending pitch slide)
  expense: {
    durationMs: 255,
    notes: [
      { fStart: 780.0, fEnd: 480.0, start: 0.0, dur: 0.06, wave: "square", vol: 0.14 },
      { fStart: 520.0, fEnd: 300.0, start: 0.065, dur: 0.06, wave: "square", vol: 0.14 },
      { fStart: 340.0, fEnd: 150.0, start: 0.13, dur: 0.12, wave: "triangle", vol: 0.3 },
    ],
  },

  // 3. BottomNav Tab Switch: #1 RPG Menu Cursor Blip (300Hz -> 620Hz triangle wave)
  tab: {
    durationMs: 50,
    notes: [{ fStart: 300, fEnd: 620, start: 0.0, dur: 0.045, wave: "triangle", vol: 0.25, harmonic: 2.0 }],
  },

  // 4. Normal Button / Modal Action: #3 Bubble Pop (380Hz -> 780Hz sine wave)
  pop: {
    durationMs: 45,
    notes: [{ fStart: 380, fEnd: 780, start: 0.0, dur: 0.04, wave: "sine", vol: 0.26 }],
  },

  // 5. Notification Bell: #3 Japanese Glass Wind Chime (Double chime 1174.66Hz -> 1567.98Hz)
  bell: {
    durationMs: 310,
    notes: [
      { fStart: 1174.66, fEnd: 1174.66, start: 0.0, dur: 0.1, wave: "sine", vol: 0.26, harmonic: 2.0 },
      { fStart: 1567.98, fEnd: 1567.98, start: 0.08, dur: 0.22, wave: "sine", vol: 0.3, harmonic: 2.0 },
    ],
  },

  // 6. Profile / Theme Switch: #5 Cyber Neon Charge (Rising sawtooth + sine harmonic sweep)
  profile: {
    durationMs: 240,
    notes: [
      { fStart: 260, fEnd: 1040, start: 0.0, dur: 0.1, wave: "sawtooth", vol: 0.12 },
      { fStart: 1040, fEnd: 1560, start: 0.09, dur: 0.14, wave: "sine", vol: 0.28, harmonic: 1.5 },
    ],
  },
  theme: {
    durationMs: 240,
    notes: [
      { fStart: 260, fEnd: 1040, start: 0.0, dur: 0.1, wave: "sawtooth", vol: 0.12 },
      { fStart: 1040, fEnd: 1560, start: 0.09, dur: 0.14, wave: "sine", vol: 0.28, harmonic: 1.5 },
    ],
  },

  // 7. Edit Record / Budget Update: #2 Arcade Triple Reload (600Hz -> 900Hz -> 1200Hz)
  edit: {
    durationMs: 125,
    notes: [
      { fStart: 600, fEnd: 600, start: 0.0, dur: 0.03, wave: "square", vol: 0.13 },
      { fStart: 900, fEnd: 900, start: 0.035, dur: 0.03, wave: "square", vol: 0.14 },
      { fStart: 1200, fEnd: 1200, start: 0.07, dur: 0.05, wave: "triangle", vol: 0.25 },
    ],
  },

  // 8. Delete Record: #3 Blackhole Deep Suck (680Hz -> 180Hz & 220Hz -> 45Hz)
  delete: {
    durationMs: 220,
    notes: [
      { fStart: 680, fEnd: 180, start: 0.0, dur: 0.08, wave: "sine", vol: 0.26 },
      { fStart: 220, fEnd: 45, start: 0.07, dur: 0.14, wave: "triangle", vol: 0.34 },
    ],
  },
};

// Initialize or resume browser Web Audio API context
const getWebAudioContext = () => {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!webAudioCtx) {
    webAudioCtx = new AudioCtx();
  }
  if (webAudioCtx.state === "suspended") {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
};

// Evaluate oscillator waveform sample at normalized phase [0, 1)
const sampleWaveform = (waveType, phase) => {
  const p = phase - Math.floor(phase);
  if (waveType === "square") {
    return p < 0.5 ? 1.0 : -1.0;
  }
  if (waveType === "sawtooth") {
    return 2.0 * p - 1.0;
  }
  if (waveType === "triangle") {
    return 1.0 - 4.0 * Math.abs(Math.round(p - 0.25) - (p - 0.25));
  }
  return Math.sin(2.0 * Math.PI * p);
};

// Pure JavaScript Base64 encoder for React Native Hermes engine
const encodeBase64 = (uint8Array) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  const len = uint8Array.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = uint8Array[i];
    const b2 = i + 1 < len ? uint8Array[i + 1] : 0;
    const b3 = i + 2 < len ? uint8Array[i + 2] : 0;
    const triplet = (b1 << 16) | (b2 << 8) | b3;
    output += chars[(triplet >> 18) & 0x3f];
    output += chars[(triplet >> 12) & 0x3f];
    output += i + 1 < len ? chars[(triplet >> 6) & 0x3f] : "=";
    output += i + 2 < len ? chars[triplet & 0x3f] : "=";
  }
  return output;
};

// Generate and cache 16-bit PCM WAV Base64 payload for Android and iOS playback
const getOrCreateWavBase64 = (profileKey) => {
  if (cachedWavUris[profileKey]) return cachedWavUris[profileKey];

  const profile = SOUND_PROFILES[profileKey] || SOUND_PROFILES.pop;
  try {
    const sampleRate = 22050;
    const totalDurationSec = Math.max(profile.durationMs / 1000, 0.06);
    const totalSamples = Math.floor(sampleRate * totalDurationSec);
    const floatSamples = new Float32Array(totalSamples);

    profile.notes.forEach((n) => {
      const startSample = Math.floor(n.start * sampleRate);
      const durSamples = Math.max(1, Math.floor(n.dur * sampleRate));
      let phase = 0;
      let harmPhase = 0;

      for (let i = 0; i < durSamples; i++) {
        const idx = startSample + i;
        if (idx >= totalSamples) break;

        const progress = i / durSamples;
        const freq = n.fStart + (n.fEnd - n.fStart) * progress;
        phase += freq / sampleRate;

        const attack = Math.min(1.0, i / Math.max(1, sampleRate * 0.003));
        const release = Math.pow(1.0 - progress, 1.15);
        const env = attack * release * (n.vol || 0.25);

        let val = sampleWaveform(n.wave || "sine", phase) * env;

        if (n.harmonic) {
          harmPhase += (freq * n.harmonic) / sampleRate;
          val += Math.sin(2.0 * Math.PI * harmPhase) * env * 0.35;
        }

        floatSamples[idx] += val;
      }
    });

    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);
    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, totalSamples * 2, true);

    for (let i = 0; i < totalSamples; i++) {
      const clamped = Math.max(-1.0, Math.min(1.0, floatSamples[i] * 1.75));
      view.setInt16(44 + i * 2, clamped * 32767, true);
    }

    const b64 = encodeBase64(new Uint8Array(buffer));
    cachedWavUris[profileKey] = b64;
    return b64;
  } catch (err) {
    return null;
  }
};

// Write synthesized WAV to local cache and play via expo-av on Android and iOS
const playNativeWavSound = async (profileKey) => {
  try {
    const { Audio } = require("expo-av");
    if (!Audio?.Sound) return;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {});

    const b64 = getOrCreateWavBase64(profileKey);
    if (!b64) return;

    let playableUri = `data:audio/wav;base64,${b64}`;

    // Write WAV file to device cache directory so Android MediaPlayer plays it reliably
    try {
      let FileSystem;
      try {
        FileSystem = require("expo-file-system/legacy");
      } catch (legacyErr) {
        FileSystem = require("expo-file-system");
      }

      const cacheDir = FileSystem?.cacheDirectory || FileSystem?.documentDirectory;
      if (cacheDir && typeof FileSystem.writeAsStringAsync === "function") {
        if (!cachedFilePaths[profileKey]) {
          const fileUri = `${cacheDir}kaching_sfx_${profileKey}_v3.wav`;
          await FileSystem.writeAsStringAsync(fileUri, b64, {
            encoding: FileSystem.EncodingType?.Base64 || "base64",
          });
          cachedFilePaths[profileKey] = fileUri;
        }
        playableUri = cachedFilePaths[profileKey];
      }
    } catch (fsErr) {
      // Fallback to data URI if file system write is unavailable
    }

    const profile = SOUND_PROFILES[profileKey] || SOUND_PROFILES.pop;
    const { sound } = await Audio.Sound.createAsync({ uri: playableUri }, { shouldPlay: true, volume: 1.0 });

    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, profile.durationMs + 350);
  } catch (err) {
    // Non-blocking fallback
  }
};

export const playUiSound = (type = "pop") => {
  try {
    const profileKey = SOUND_PROFILES[type] ? type : "pop";
    const profile = SOUND_PROFILES[profileKey];

    // 1. Web Browser: Synthesize exact notes, frequency slides, and harmonics via Web Audio API
    if (Platform.OS === "web") {
      const ctx = getWebAudioContext();
      if (!ctx) return;
      const baseTime = ctx.currentTime;

      profile.notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = n.wave || "sine";
        osc.frequency.setValueAtTime(n.fStart, baseTime + n.start);
        if (n.fEnd !== n.fStart) {
          osc.frequency.linearRampToValueAtTime(Math.max(20, n.fEnd), baseTime + n.start + n.dur);
        }

        gain.gain.setValueAtTime(n.vol || 0.2, baseTime + n.start);
        gain.gain.exponentialRampToValueAtTime(0.001, baseTime + n.start + n.dur + 0.015);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(baseTime + n.start);
        osc.stop(baseTime + n.start + n.dur + 0.02);

        if (n.harmonic) {
          const hOsc = ctx.createOscillator();
          const hGain = ctx.createGain();
          hOsc.type = "sine";
          hOsc.frequency.setValueAtTime(n.fStart * n.harmonic, baseTime + n.start);
          if (n.fEnd !== n.fStart) {
            hOsc.frequency.linearRampToValueAtTime(Math.max(20, n.fEnd * n.harmonic), baseTime + n.start + n.dur);
          }
          hGain.gain.setValueAtTime((n.vol || 0.2) * 0.35, baseTime + n.start);
          hGain.gain.exponentialRampToValueAtTime(0.001, baseTime + n.start + n.dur + 0.015);
          hOsc.connect(hGain);
          hGain.connect(ctx.destination);
          hOsc.start(baseTime + n.start);
          hOsc.stop(baseTime + n.start + n.dur + 0.02);
        }
      });
      return;
    }

    // 2. Android / iOS Native: Haptic Vibration + Synthesized WAV File Playback
    if (profileKey === "income" || profileKey === "kaching") {
      Vibration.vibrate([0, 25, 40, 45]);
    } else if (profileKey === "expense" || profileKey === "delete") {
      Vibration.vibrate([0, 30, 30, 25]);
    } else if (profileKey === "profile" || profileKey === "theme" || profileKey === "edit" || profileKey === "bell") {
      Vibration.vibrate(20);
    } else {
      Vibration.vibrate(10);
    }

    playNativeWavSound(profileKey);
  } catch (e) {
    // Non-blocking fallback
  }
};
