import { LiltNote } from "../types";

export class LiltAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private scheduleTimer: number | null = null;
  private activeNodes: { osc: AudioNode; gain: GainNode; stopTime: number }[] = [];

  public isPlaying = false;
  private currentNotes: LiltNote[] = [];
  private currentVoice = "grand piano";
  private playbackStartTime = 0;
  private duration = 4.0;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  public getAnalyser(): AnalyserNode | null {
    this.initCtx();
    return this.analyser;
  }

  private getNoiseBuffer(): AudioBuffer {
    if (!this.ctx) this.initCtx();
    const ctx = this.ctx!;
    if (!this.noiseBuffer) {
      const size = ctx.sampleRate * 2;
      this.noiseBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
  }

  public noteToFreq(note: string): number {
    const map: Record<string, number> = {
      C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4,
      F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
    };
    const m = note.match(/^([A-G]#?|[A-G]b?)(-?\d+)$/i);
    if (!m) return 440;
    const step = map[m[1]] ?? 0;
    const octave = parseInt(m[2], 10);
    const midi = step + (octave + 1) * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  public playNote(
    noteName: string,
    duration: number,
    velocity: string,
    voice: string,
    timeOffset = 0
  ) {
    this.initCtx();
    const ctx = this.ctx!;
    const start = ctx.currentTime + timeOffset;

    let vel = 0.4;
    if (velocity === "soft") vel = 0.2;
    if (velocity === "accent") vel = 0.75;

    if (voice === "drum kit") {
      this.playDrum(noteName, duration, vel, start);
      return;
    }

    const freq = this.noteToFreq(noteName);
    switch (voice.toLowerCase()) {
      case "cinematic cello":    this.synthCello(freq, duration, vel, start); break;
      case "grand piano":        this.synthPiano(freq, duration, vel, start); break;
      case "synthesizer ambient":this.synthAmbient(freq, duration, vel, start); break;
      case "marimba":            this.synthMarimba(freq, duration, vel, start); break;
      default:                   this.synthPiano(freq, duration, vel, start);
    }
  }

  // ---- synthesis engines (unchanged from v1) ----

  private synthPiano(freq: number, dur: number, vel: number, start: number) {
    const ctx = this.ctx!;
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(freq, start);
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 2, start);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vel * 0.7, start + 0.005);
    g.gain.exponentialRampToValueAtTime(vel * 0.22, start + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.5);
    const ns = ctx.createBufferSource();
    ns.buffer = this.getNoiseBuffer();
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass";
    nf.frequency.setValueAtTime(1500, start);
    nf.Q.setValueAtTime(4, start);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vel * 0.4, start);
    ng.gain.exponentialRampToValueAtTime(0.0001, start + 0.03);
    osc1.connect(g); osc2.connect(g); g.connect(this.masterGain!);
    ns.connect(nf); nf.connect(ng); ng.connect(this.masterGain!);
    osc1.start(start); osc2.start(start); ns.start(start);
    osc1.stop(start + dur + 0.6); osc2.stop(start + dur + 0.6); ns.stop(start + 0.1);
  }

  private synthCello(freq: number, dur: number, vel: number, start: number) {
    const ctx = this.ctx!;
    const o1 = ctx.createOscillator(); o1.type = "sawtooth"; o1.frequency.setValueAtTime(freq, start);
    const o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.setValueAtTime(freq * 0.995 + 0.3, start);
    const o3 = ctx.createOscillator(); o3.type = "sawtooth"; o3.frequency.setValueAtTime(freq * 1.004 - 0.2, start);
    const lfo = ctx.createOscillator(); lfo.frequency.setValueAtTime(5.2, start);
    const lg = ctx.createGain(); lg.gain.setValueAtTime(freq * 0.008, start);
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); lg.connect(o3.frequency);
    const f = ctx.createBiquadFilter(); f.type = "lowpass";
    f.frequency.setValueAtTime(200, start);
    f.frequency.exponentialRampToValueAtTime(800, start + 0.4);
    f.frequency.exponentialRampToValueAtTime(320, start + dur);
    f.Q.setValueAtTime(2.2, start);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vel * 0.55, start + 0.18);
    g.gain.setValueAtTime(vel * 0.55, start + dur - 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur + 0.4);
    o1.connect(f); o2.connect(f); o3.connect(f); f.connect(g); g.connect(this.masterGain!);
    lfo.start(start); o1.start(start); o2.start(start); o3.start(start);
    const stop = start + dur + 0.5;
    lfo.stop(stop); o1.stop(stop); o2.stop(stop); o3.stop(stop);
  }

  private synthMarimba(freq: number, dur: number, vel: number, start: number) {
    const ctx = this.ctx!;
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.setValueAtTime(freq, start);
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.setValueAtTime(freq * 3.01, start);
    const o3 = ctx.createOscillator(); o3.type = "sine"; o3.frequency.setValueAtTime(freq * 4.0, start);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vel * 0.85, start + 0.001);
    g.gain.exponentialRampToValueAtTime(vel * 0.1, start + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    const og = ctx.createGain();
    og.gain.setValueAtTime(vel * 0.3, start);
    og.gain.exponentialRampToValueAtTime(0.0001, start + 0.04);
    o1.connect(g); o2.connect(og); o3.connect(og);
    g.connect(this.masterGain!); og.connect(this.masterGain!);
    o1.start(start); o2.start(start); o3.start(start);
    o1.stop(start + 0.8); o2.stop(start + 0.5); o3.stop(start + 0.5);
  }

  private synthAmbient(freq: number, dur: number, vel: number, start: number) {
    const ctx = this.ctx!;
    const o1 = ctx.createOscillator(); o1.type = "triangle"; o1.frequency.setValueAtTime(freq, start);
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.setValueAtTime(freq * 1.5, start);
    const f = ctx.createBiquadFilter(); f.type = "lowpass";
    f.frequency.setValueAtTime(80, start);
    f.frequency.exponentialRampToValueAtTime(1400, start + 0.5);
    f.frequency.exponentialRampToValueAtTime(300, start + dur);
    f.Q.setValueAtTime(3.5, start);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vel * 0.65, start + 0.25);
    g.gain.setValueAtTime(vel * 0.65, start + dur - 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur + 1.8);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.masterGain!);
    o1.start(start); o2.start(start);
    const stop = start + dur + 2.4;
    o1.stop(stop); o2.stop(stop);
  }

  private playDrum(name: string, dur: number, vol: number, start: number) {
    const ctx = this.ctx!;
    const label = name.toUpperCase().replace(/\d+$/, "");
    if (label === "BD" || name === "C3") {
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(145, start);
      o.frequency.exponentialRampToValueAtTime(45, start + 0.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(vol * 1.2, start + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      o.connect(g); g.connect(this.masterGain!);
      o.start(start); o.stop(start + 0.4);
    } else if (label === "SD" || name === "E3") {
      const so = ctx.createOscillator(); so.type = "triangle";
      so.frequency.setValueAtTime(180, start); so.frequency.setValueAtTime(100, start + 0.08);
      const ns = ctx.createBufferSource(); ns.buffer = this.getNoiseBuffer();
      const nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.setValueAtTime(1300, start);
      const sg = ctx.createGain(); sg.gain.setValueAtTime(vol * 0.5, start); sg.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      const ng = ctx.createGain(); ng.gain.setValueAtTime(vol * 0.9, start); ng.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      so.connect(sg); sg.connect(this.masterGain!);
      ns.connect(nf); nf.connect(ng); ng.connect(this.masterGain!);
      so.start(start); so.stop(start + 0.25); ns.start(start); ns.stop(start + 0.25);
    } else if (label === "HH" || name === "G3") {
      const ns = ctx.createBufferSource(); ns.buffer = this.getNoiseBuffer();
      const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.setValueAtTime(8000, start);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.5, start); g.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
      ns.connect(f); f.connect(g); g.connect(this.masterGain!);
      ns.start(start); ns.stop(start + 0.08);
    } else {
      const ns = ctx.createBufferSource(); ns.buffer = this.getNoiseBuffer();
      const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.setValueAtTime(5000, start);
      const g = ctx.createGain(); g.gain.setValueAtTime(vol * 0.65, start); g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      ns.connect(f); f.connect(g); g.connect(this.masterGain!);
      ns.start(start); ns.stop(start + dur + 0.1);
    }
  }

  // ---- sequencer ----

  public startSchedulingPlay(
    notes: LiltNote[],
    voice: string,
    totalDuration: number,
    onNoteTriggered: (idx: number) => void
  ) {
    this.stopPlaying();
    this.initCtx();
    this.isPlaying = true;
    this.currentNotes = [...notes].sort((a, b) => a.time - b.time);
    this.currentVoice = voice;
    this.playbackStartTime = this.ctx!.currentTime;
    this.duration = totalDuration || (this.currentNotes.at(-1)?.time ?? 0) + 1.2;

    const loop = () => {
      if (!this.isPlaying) return;
      const elapsed = this.ctx!.currentTime - this.playbackStartTime;
      if (elapsed >= this.duration) this.playbackStartTime = this.ctx!.currentTime;
      this.scheduleWindow(onNoteTriggered);
      this.scheduleTimer = window.setTimeout(loop, 50);
    };
    this.scheduleWindow(onNoteTriggered);
    this.scheduleTimer = window.setTimeout(loop, 50);
  }

  private scheduled = new Map<number, boolean>();

  private scheduleWindow(onNoteTriggered: (idx: number) => void) {
    if (!this.ctx || !this.isPlaying) return;
    const elapsed = this.ctx.currentTime - this.playbackStartTime;
    const ahead = 0.15;

    this.currentNotes.forEach((note, idx) => {
      const t = note.time;
      if (t >= elapsed && t <= elapsed + ahead && !this.scheduled.get(idx)) {
        this.scheduled.set(idx, true);
        const offset = t - elapsed;
        // use per-note voice override if present
        const noteVoice = note.voice || this.currentVoice;
        this.playNote(note.note, note.duration, note.velocity, noteVoice, offset);
        setTimeout(() => { if (this.isPlaying) onNoteTriggered(idx); }, offset * 1000);
      }
      if (elapsed < 0.05 && this.scheduled.get(idx)) this.scheduled.delete(idx);
    });
  }

  public getPlayheadNormalized(): number {
    if (!this.isPlaying || !this.ctx) return 0;
    return Math.min(1, Math.max(0, (this.ctx.currentTime - this.playbackStartTime) / this.duration));
  }

  public getElapsedTime(): number {
    if (!this.isPlaying || !this.ctx) return 0;
    return this.ctx.currentTime - this.playbackStartTime;
  }

  public stopPlaying() {
    this.isPlaying = false;
    this.scheduled.clear();
    if (this.scheduleTimer) { clearTimeout(this.scheduleTimer); this.scheduleTimer = null; }
  }
}
