// ===== Fun sounds via Web Audio API (no assets needed) =====

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  startOffset: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + startOffset;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function playCorrect() {
  // Happy ascending arpeggio: C5 - E5 - G5
  tone(523.25, 0, 0.22, 0.15);
  tone(659.25, 0.1, 0.22, 0.15);
  tone(783.99, 0.2, 0.3, 0.15);
}

export function playWrong() {
  // Gentle descending "try again"
  tone(311.13, 0, 0.2, 0.12, "triangle");
  tone(233.08, 0.15, 0.3, 0.12, "triangle");
}

export function playFinish() {
  // Little fanfare: C5 E5 G5 C6
  tone(523.25, 0, 0.18, 0.15);
  tone(659.25, 0.14, 0.18, 0.15);
  tone(783.99, 0.28, 0.18, 0.15);
  tone(1046.5, 0.42, 0.5, 0.18);
}

export function playClick() {
  tone(880, 0, 0.08, 0.06, "sine");
}
