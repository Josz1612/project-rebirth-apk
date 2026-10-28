/**
 * PROJECT_REBIRTH - Pristine Web Audio API Sound Engine
 * - Zero white noise / Zero static / Zero audio pops
 * - Evolving celestial ambient space music (harmonic pads, warm sub-bass, stardust chimes)
 * - Intense pursuit soundtrack (140 BPM driving 16th-note bass, heartbeat kick, tension alarms)
 * - High-definition sci-fi sound effects
 * - Mission sounds attract the nearest alien
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private isBgmPlaying: boolean = false;
  private isChaseMode: boolean = false;
  private bgmTimer: number | null = null;
  private chordTimer: number | null = null;
  private bgmStep: number = 0;
  private currentChordIndex: number = 0;

  // Master buses & filters
  private masterFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private chaseGain: GainNode | null = null;

  // Active pad oscillators & gains for ambient chords
  private activePadOscs: OscillatorNode[] = [];
  private activePadGains: GainNode[] = [];

  // Chord progression: Dm9 -> Bbmaj7 -> Fsus2 -> Asus4 (Cinematic deep space harmonies)
  private readonly chordProgression = [
    [146.83, 220.0, 261.63, 329.63], // Dm9 (D3, A3, C4, E4)
    [116.54, 174.61, 220.0, 293.66], // Bbmaj7 (Bb2, F3, A3, D4)
    [174.61, 261.63, 349.23, 392.0], // Fsus2 (F3, C4, F4, G4)
    [110.0, 164.81, 220.0, 293.66],  // Asus4 (A2, E3, A3, D4)
  ];

  constructor() {
    // Lazy initialisation on first user touch/click
  }

  public initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master Lowpass Filter at 2600Hz to eliminate digital harshness and static
        this.masterFilter = this.ctx.createBiquadFilter();
        this.masterFilter.type = 'lowpass';
        this.masterFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);
        this.masterFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        this.masterFilter.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  // ================= REACTIVE AMBIENT & CHASE MUSIC ENGINE =================
  public startBGM() {
    if (!this.enabled || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      this.isBgmPlaying = true;
      const now = this.ctx.currentTime;

      // Master Ambient Bus
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.12, now);
      this.ambientGain.connect(this.masterFilter);

      // Master Chase Bus (initially silent)
      this.chaseGain = this.ctx.createGain();
      this.chaseGain.gain.setValueAtTime(0.0001, now);
      this.chaseGain.connect(this.masterFilter);

      // Trigger initial ambient chord
      this.currentChordIndex = 0;
      this.playEvolvingPadChord();

      // Cycle ambient chord every 8 seconds with smooth cross-dissolve
      this.chordTimer = window.setInterval(() => {
        if (!this.isChaseMode && this.isBgmPlaying) {
          this.currentChordIndex = (this.currentChordIndex + 1) % this.chordProgression.length;
          this.playEvolvingPadChord();
        }
      }, 8000);

      // Sequencer clock: 120ms ticks (16th-note sub-division at 125-140 BPM)
      this.bgmStep = 0;
      this.bgmTimer = window.setInterval(() => {
        this.tickBgmPattern();
      }, 125);
    } catch {
      // Browser autoplay restriction handling
    }
  }

  /**
   * Plays a lush, evolving ambient chord pad with gentle attack/release and zero static
   */
  private playEvolvingPadChord() {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const notes = this.chordProgression[this.currentChordIndex];

    // Gently fade out old pad oscillators over 2.5s
    const oldOscs = [...this.activePadOscs];
    const oldGains = [...this.activePadGains];
    this.activePadOscs = [];
    this.activePadGains = [];

    oldGains.forEach((g) => {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      } catch {}
    });

    setTimeout(() => {
      oldOscs.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
    }, 2600);

    // Warm Lowpass Filter for the pad to ensure velvety smoothness
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(650, now);
    padFilter.Q.setValueAtTime(1.0, now);
    padFilter.connect(this.ambientGain);

    // Spawn new chord oscillators
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Slight detune for analog spatial depth
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx % 2 === 0 ? 3 : -3), now);

      const targetVol = idx === 0 ? 0.045 : 0.028;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(targetVol, now + 2.0);

      osc.connect(gain);
      gain.connect(padFilter);

      osc.start(now);
      this.activePadOscs.push(osc);
      this.activePadGains.push(gain);
    });
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.chordTimer !== null) {
      clearInterval(this.chordTimer);
      this.chordTimer = null;
    }
    this.activePadOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activePadOscs = [];
    this.activePadGains = [];
  }

  /**
   * Smoothly crossfades between peaceful ambient space music and intense pursuit music
   */
  public updateMusicState(isChased: boolean) {
    if (!this.enabled) return;
    if (!this.isBgmPlaying) {
      this.startBGM();
    }
    if (!this.ctx || !this.ambientGain || !this.chaseGain) return;

    if (this.isChaseMode !== isChased) {
      this.isChaseMode = isChased;
      const now = this.ctx.currentTime;
      if (isChased) {
        // Pursuit Crossfade: Ambient drops down, intense chase soundtrack surges
        this.ambientGain.gain.cancelScheduledValues(now);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.setTargetAtTime(0.02, now, 0.2);

        this.chaseGain.gain.cancelScheduledValues(now);
        this.chaseGain.gain.setValueAtTime(this.chaseGain.gain.value, now);
        this.chaseGain.gain.setTargetAtTime(0.22, now, 0.12);
      } else {
        // Calm Crossfade: Return to beautiful celestial ambience
        this.ambientGain.gain.cancelScheduledValues(now);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.setTargetAtTime(0.12, now, 0.4);

        this.chaseGain.gain.cancelScheduledValues(now);
        this.chaseGain.gain.setValueAtTime(this.chaseGain.gain.value, now);
        this.chaseGain.gain.setTargetAtTime(0.0001, now, 0.4);
      }
    }
  }

  private tickBgmPattern() {
    if (!this.ctx || !this.enabled || !this.isBgmPlaying) return;
    this.bgmStep = (this.bgmStep + 1) % 32;
    const now = this.ctx.currentTime;

    if (!this.isChaseMode) {
      // CALM SPACE AMBIENT: Crystalline stardust chimes (gentle, random pentatonic notes)
      if (this.bgmStep % 8 === 0 || (this.bgmStep % 8 === 4 && Math.random() > 0.4)) {
        // Pentatonic celestial scale: D5, F5, G5, A5, C6, D6
        const celestialScale = [587.33, 698.46, 783.99, 880.0, 1046.5, 1174.66];
        const freq = celestialScale[Math.floor(Math.random() * celestialScale.length)];

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Gentle crystalline envelope: 25ms attack, 1.2s shimmer decay
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.03, now + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

        osc.connect(g);
        if (this.ambientGain) g.connect(this.ambientGain);

        osc.start(now);
        osc.stop(now + 1.15);
      }
    } else {
      // ================= INTENSE CHASE SOUNDTRACK =================
      // 1. Driving Rhythmic 16th-Note Bassline (140 BPM urgency)
      if (this.bgmStep % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        const bassFilter = this.ctx.createBiquadFilter();

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(480, now);
        bassFilter.Q.setValueAtTime(3.0, now);

        bassOsc.type = 'sawtooth';
        // Urgent minor bass riff: D2 (73.4) -> F2 (87.3) -> G2 (98.0) -> D2
        const bassPattern = [73.42, 73.42, 87.31, 73.42, 98.0, 73.42, 87.31, 110.0];
        const bassFreq = bassPattern[(this.bgmStep / 2) % bassPattern.length];
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        if (this.chaseGain) bassGain.connect(this.chaseGain);

        bassOsc.start(now);
        bassOsc.stop(now + 0.15);
      }

      // 2. High-tension heartbeat sub-thump on beats 0, 8, 16, 24
      if (this.bgmStep % 8 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();

        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(120, now);
        kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

        kickGain.gain.setValueAtTime(0.0001, now);
        kickGain.gain.exponentialRampToValueAtTime(0.24, now + 0.01);
        kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        kickOsc.connect(kickGain);
        if (this.chaseGain) kickGain.connect(this.chaseGain);

        kickOsc.start(now);
        kickOsc.stop(now + 0.2);
      }

      // 3. Piercing Tension Alarm Stab on bar accents (every 16 steps)
      if (this.bgmStep % 16 === 0) {
        const alarmOsc = this.ctx.createOscillator();
        const alarmGain = this.ctx.createGain();

        alarmOsc.type = 'triangle';
        alarmOsc.frequency.setValueAtTime(880, now); // A5 alarm
        alarmOsc.frequency.exponentialRampToValueAtTime(587.33, now + 0.22); // D5 drop

        alarmGain.gain.setValueAtTime(0.0001, now);
        alarmGain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
        alarmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        alarmOsc.connect(alarmGain);
        if (this.chaseGain) alarmGain.connect(this.chaseGain);

        alarmOsc.start(now);
        alarmOsc.stop(now + 0.38);
      }
    }
  }

  // ================= SOUND EFFECTS (PRISTINE SYNTHESIS) =================

  // Soft EVA pressurized footstep (zero clicks)
  public playStep() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + Math.random() * 15, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.05);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.masterFilter);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  // Friendly, melodious mission button click (soft celesta/marimba sci-fi chime)
  public playMissionButtonClick(noteIndex: number = 0) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      // Friendly C Major / Pentatonic scale notes
      const notes = [523.25, 659.25, 783.99, 880.0, 1046.5]; // C5, E5, G5, A5, C6
      const freq = notes[noteIndex % notes.length];

      // Primary warm sine body
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterFilter);
      osc.start(now);
      osc.stop(now + 0.18);

      // Subtle harmonic overtone (gives a soft bell/chime quality)
      const oscHarmonic = this.ctx.createOscillator();
      const gainHarmonic = this.ctx.createGain();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 2, now);

      gainHarmonic.gain.setValueAtTime(0.0001, now);
      gainHarmonic.gain.linearRampToValueAtTime(0.04, now + 0.006);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(this.masterFilter);
      oscHarmonic.start(now);
      oscHarmonic.stop(now + 0.12);
    } catch {}
  }

  // Friendly soft error / try-again cue (gentle bloop, zero harsh buzzing)
  public playMissionSoftError() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.12); // C4

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterFilter);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  // Mission interaction sound: Friendly ascending dual-bell chime
  public playMissionInteract() {
    this.playMissionToolPing();
  }

  public playMissionToolPing() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;

      // Positive ascending chime (G5 to C6)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now); // G5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // C6

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.008);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc1.connect(gain1);
      gain1.connect(this.masterFilter);
      osc1.start(now);
      osc1.stop(now + 0.24);

      // Sweet sparkle harmonic
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.05); // E6

      gain2.gain.setValueAtTime(0.0001, now + 0.05);
      gain2.gain.linearRampToValueAtTime(0.08, now + 0.058);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc2.connect(gain2);
      gain2.connect(this.masterFilter);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.26);
    } catch {}
  }

  // Battery / anomaly collected chime
  public playBattery() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D maj triad ascent

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.045 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.19);

        osc.connect(gain);
        gain.connect(this.masterFilter!);

        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.21);
      });
    } catch {}
  }

  // Gentle tactile bubble tick
  public playTaskTick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // Warm D5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.035); // E5

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterFilter);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch {}
  }

  // Pneumatic piston / oxygen pump stroke sound
  public playPumpPulse() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterFilter);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  // Soft optical sensor swipe / glass cleaning whoosh
  public playSwipeWhoosh() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(720, now + 0.04);
      osc.frequency.linearRampToValueAtTime(540, now + 0.08);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.masterFilter);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  // Task complete celebratory chord
  public playTaskComplete() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major 9th triumph

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.05 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.45);

        osc.connect(gain);
        gain.connect(this.masterFilter!);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.48);
      });
    } catch {}
  }

  // Tactical Flashlight switch
  public playFlashlightToggle(isOn: boolean) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isOn ? 1400 : 700, now);
      osc.frequency.exponentialRampToValueAtTime(isOn ? 1900 : 350, now + 0.04);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.masterFilter);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // Escape pod door unlocked (hydraulic authorization chime)
  public playDoorUnlock() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;

      // Rising harmonic
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.25);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterFilter);
      osc.start(now);
      osc.stop(now + 0.38);

      // High authorization tone
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.28);

      gain2.gain.setValueAtTime(0.0001, now + 0.28);
      gain2.gain.exponentialRampToValueAtTime(0.16, now + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc2.connect(gain2);
      gain2.connect(this.masterFilter);
      osc2.start(now + 0.28);
      osc2.stop(now + 0.7);
    } catch {}
  }

  // Rocket launch roar for Endeavour Shuttle
  public playRocketLaunch() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 2.5);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      osc.connect(gain);
      gain.connect(this.masterFilter);
      osc.start(now);
      osc.stop(now + 3.3);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now + 0.8);
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 2.8);

      gain2.gain.setValueAtTime(0.0001, now + 0.8);
      gain2.gain.exponentialRampToValueAtTime(0.15, now + 1.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      osc2.connect(gain2);
      gain2.connect(this.masterFilter);
      osc2.start(now + 0.8);
      osc2.stop(now + 3.1);
    } catch {}
  }

  // Victory fanfare
  public playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];

      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.7);

        osc.connect(gain);
        gain.connect(this.masterFilter!);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.75);
      });
    } catch {}
  }

  // Caught by Alien (Biometric Flatline Tone)
  public playCaught() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(440, now + 0.6);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.masterFilter);

      osc.start(now);
      osc.stop(now + 1.25);
    } catch {}
  }

  // Hide in locker/vent
  public playHide(isHidden: boolean) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHidden ? 350 : 220, now);
      osc.frequency.exponentialRampToValueAtTime(isHidden ? 180 : 420, now + 0.1);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.masterFilter);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // Proximity Alert
  public playAlert(isWarning: boolean) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isWarning ? 330 : 550, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(isWarning ? 0.09 : 0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterFilter);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  // Power grid restored sound
  public playPowerRestore() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx || !this.masterFilter) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(146.83, now);
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.6);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.masterFilter);
      osc.start(now);
      osc.stop(now + 0.95);

      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const cOsc = this.ctx!.createOscillator();
        const cGain = this.ctx!.createGain();
        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(freq, now + 0.4 + idx * 0.08);

        cGain.gain.setValueAtTime(0.0001, now + 0.4 + idx * 0.08);
        cGain.gain.exponentialRampToValueAtTime(0.14, now + 0.4 + idx * 0.08 + 0.02);
        cGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

        cOsc.connect(cGain);
        cGain.connect(this.masterFilter!);
        cOsc.start(now + 0.4 + idx * 0.08);
        cOsc.stop(now + 1.35);
      });
    } catch {}
  }
}

export const soundManager = new SoundManager();
