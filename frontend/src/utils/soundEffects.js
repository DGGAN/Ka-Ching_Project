/**
 * @file frontend/src/utils/soundEffects.js
 * @layer Utils (Audio Synthesizer)
 * @description Zero-dependency Web Audio API sound generator for UI interactions (pop, tab, bell, kaching, success).
 * @exports playUiSound
 */

// Web Audio API synthesizer for UI sound effects ("kaching", "bell", "tab", "pop", "success")
export const playUiSound = (type = "pop") => {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!window.__kachingAudioCtx) {
      window.__kachingAudioCtx = new AudioCtx();
    }
    const ctx = window.__kachingAudioCtx;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (type === "kaching") {
      const coinNotes = [
        { freq: 1318.5, delay: 0.0, dur: 0.07 },
        { freq: 1760.0, delay: 0.055, dur: 0.07 },
        { freq: 2093.0, delay: 0.11, dur: 0.09 },
        { freq: 2637.0, delay: 0.17, dur: 0.32 },
      ];
      coinNotes.forEach(({ freq, delay, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + delay);
        gain.gain.setValueAtTime(0.11, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + dur);
      });
    } else if (type === "bell") {
      [
        { freq: 587.33, start: 0, dur: 0.14 },
        { freq: 440.0, start: 0.12, dur: 0.24 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.09, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });
    } else if (type === "success") {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);
        gain.gain.setValueAtTime(0.06, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.14);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(type === "tab" ? 340 : 440, now);
      osc.frequency.exponentialRampToValueAtTime(type === "tab" ? 500 : 600, now + 0.045);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  } catch (e) {
    // Ignore audio context restrictions
  }
};
