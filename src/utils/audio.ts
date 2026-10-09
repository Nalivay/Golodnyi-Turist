// Web Audio API Sound System for ArmMinsk
// Synthesizes instant, zero-latency, offline-capable sound effects:
// - playTap(): Subtle acoustic click for buttons
// - playSendOrder(): Signature "фиу (улетело) + короткие позитивные фанфары"
// - playSuccess(): Uplifting bell chime
// - playToggle(): Crisp tactile checkmark pop
// - playError(): Gentle low thud for invalid input

const SOUND_STORAGE_KEY = 'armminsk_sound_enabled';

class SoundController {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      this.isEnabled = saved !== null ? saved === 'true' : true;
    } catch {
      this.isEnabled = true;
    }

    // Pre-unlock on first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.getAudioContext();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    } catch {}
  }

  public toggleSound(): boolean {
    const next = !this.isEnabled;
    this.setSoundEnabled(next);
    if (next) {
      this.playTap();
    }
    return next;
  }

  /**
   * Crisp, soft tactile button tap sound
   */
  public playTap(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /**
   * Signature "Фиу (улетело) + позитивные фанфары" for order submission
   */
  public playSendOrder(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. "ФИУ" (Rocket / Whoosh swoop upwards)
      const whooshOsc = ctx.createOscillator();
      const whooshGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.28);
      filter.Q.setValueAtTime(3.0, now);

      whooshOsc.type = 'sawtooth';
      whooshOsc.frequency.setValueAtTime(220, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);

      whooshGain.gain.setValueAtTime(0.001, now);
      whooshGain.gain.linearRampToValueAtTime(0.15, now + 0.12);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

      whooshOsc.connect(filter);
      filter.connect(whooshGain);
      whooshGain.connect(ctx.destination);

      whooshOsc.start(now);
      whooshOsc.stop(now + 0.32);

      // 2. "ПОЗИТИВНЫЕ ФАНФАРЫ" (Joyful triumphant major chord arpeggio)
      // Notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046.5Hz)
      const fanfareNotes = [
        { freq: 523.25, time: 0.18, dur: 0.22, vol: 0.22 }, // До
        { freq: 659.25, time: 0.30, dur: 0.24, vol: 0.25 }, // Ми
        { freq: 783.99, time: 0.44, dur: 0.30, vol: 0.28 }, // Соль
        { freq: 1046.50, time: 0.60, dur: 0.65, vol: 0.35 }, // До (финал)
        { freq: 1318.51, time: 0.62, dur: 0.60, vol: 0.20 }, // Ми (колокольный обертон)
      ];

      fanfareNotes.forEach(({ freq, time, dur, vol }) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, now + time);

        noteGain.gain.setValueAtTime(0.001, now + time);
        noteGain.gain.linearRampToValueAtTime(vol, now + time + 0.025);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);

        noteOsc.start(now + time);
        noteOsc.stop(now + time + dur + 0.05);
      });
    } catch {}
  }

  /**
   * Pleasant double chime for success actions (e.g. recipe saved, login successful)
   */
  public playSuccess(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 659.25, time: 0.0, dur: 0.25, vol: 0.2 },
        { freq: 880.00, time: 0.12, dur: 0.45, vol: 0.25 },
      ];

      notes.forEach(({ freq, time, dur, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.linearRampToValueAtTime(vol, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch {}
  }

  /**
   * Crisp toggle sound for checking off items in procurement/fulfillment
   */
  public playToggle(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  /**
   * Gentle low double bump for errors (wrong password, validation error)
   */
  public playError(): void {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const bumpNotes = [
        { freq: 220, time: 0.0 },
        { freq: 174.61, time: 0.09 },
      ];

      bumpNotes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + time + 0.08);

        gain.gain.setValueAtTime(0.2, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + 0.09);
      });
    } catch {}
  }
}

export const soundManager = new SoundController();

// Convenience exports
export const playTapSound = () => soundManager.playTap();
export const playSendOrderSound = () => soundManager.playSendOrder();
export const playSuccessSound = () => soundManager.playSuccess();
export const playToggleSound = () => soundManager.playToggle();
export const playErrorSound = () => soundManager.playError();
export const getSoundEnabled = () => soundManager.getSoundEnabled();
export const setSoundEnabled = (v: boolean) => soundManager.setSoundEnabled(v);
export const toggleSound = () => soundManager.toggleSound();
