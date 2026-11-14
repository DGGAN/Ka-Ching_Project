/**
 * @file frontend/src/utils/soundEffects.js
 * @layer Utility (9 Sound Profiles for Web, Expo Go & Native APK/IPA)
 * @description Plays the 9 sound profiles ("income"/"kaching", "expense", "tab", "pop", "bell", "profile"/"theme", "edit", "delete", "error") using statically bundled WAV files on Android/iOS and Web Audio API on Web.
 * @exports playUiSound
 */

import { Platform, Vibration } from "react-native";

// Statically require the 9 bundled WAV files so Metro Bundler & APK/IPA builds package them natively
const SOUND_ASSETS = {
  income: require("../../assets/sounds/income.wav"),
  kaching: require("../../assets/sounds/income.wav"),
  expense: require("../../assets/sounds/expense.wav"),
  tab: require("../../assets/sounds/tab.wav"),
  pop: require("../../assets/sounds/pop.wav"),
  bell: require("../../assets/sounds/bell.wav"),
  profile: require("../../assets/sounds/profile.wav"),
  theme: require("../../assets/sounds/profile.wav"),
  edit: require("../../assets/sounds/edit.wav"),
  delete: require("../../assets/sounds/delete.wav"),
  error: require("../../assets/sounds/error.wav"),
};

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
  kaching: {
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
  theme: {
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

let webAudioCtx = null;
let audioModeReady = false;
const activePlayers = {};

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

// Play bundled static WAV asset on Android & iOS (Expo Go + Standalone APK/IPA)
const playBundledNativeAsset = async (profileKey) => {
  try {
    const ExpoAudio = require("expo-audio");
    if (!ExpoAudio || typeof ExpoAudio.createAudioPlayer !== "function") return;

    if (!audioModeReady && typeof ExpoAudio.setAudioModeAsync === "function") {
      audioModeReady = true;
      await ExpoAudio.setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionModeAndroid: "duckOthers",
        interruptionMode: "mixWithOthers",
      }).catch(() => {});
    }

    const assetModule = SOUND_ASSETS[profileKey] || SOUND_ASSETS.pop;

    let player = activePlayers[profileKey];
    if (!player) {
      player = ExpoAudio.createAudioPlayer(assetModule);
      player.volume = 1.0;
      activePlayers[profileKey] = player;
    } else {
      try {
        await player.seekTo(0);
      } catch (seekErr) {
        try {
          if (typeof player.remove === "function") player.remove();
        } catch (e) {}
        player = ExpoAudio.createAudioPlayer(assetModule);
        player.volume = 1.0;
        activePlayers[profileKey] = player;
      }
    }

    player.play();
  } catch (err) {
    console.log("[SoundEffects] Native audio notice:", err.message);
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

    // 2. Android & iOS (Expo Go + Standalone APK/IPA): Haptic Vibration + Bundled Static .WAV Asset
    if (profileKey === "income" || profileKey === "kaching") {
      Vibration.vibrate([0, 18, 30, 30]);
    } else if (profileKey === "error") {
      Vibration.vibrate([0, 35, 35, 35]);
    } else if (profileKey === "expense" || profileKey === "delete") {
      Vibration.vibrate([0, 22, 25, 18]);
    } else if (profileKey === "profile" || profileKey === "theme" || profileKey === "edit" || profileKey === "bell") {
      Vibration.vibrate(14);
    } else {
      Vibration.vibrate(8);
    }

    playBundledNativeAsset(profileKey);
  } catch (e) {
    // Non-blocking fallback
  }
};
