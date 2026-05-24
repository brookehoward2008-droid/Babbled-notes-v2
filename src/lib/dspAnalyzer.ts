import { DspDigest, DspEvent } from "../types";

export class DspAnalyzer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private events: DspEvent[] = [];
  private recordingStart = 0;
  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;

  async startRecording(onLevelUpdate: (level: number) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const AC = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AC();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;

    const source = this.audioCtx.createMediaStreamSource(this.stream);
    source.connect(this.analyser);

    this.recordedChunks = [];
    this.events = [];
    this.recordingStart = this.audioCtx.currentTime;

    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.start(100);

    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    let lastOnset = -0.5;

    const analyze = () => {
      if (!this.analyser || !this.audioCtx) return;
      this.analyser.getByteFrequencyData(freqData);

      const rms = Math.sqrt(
        freqData.reduce((s, v) => s + v * v, 0) / freqData.length
      ) / 128;

      onLevelUpdate(Math.min(1, rms));

      const elapsed = this.audioCtx.currentTime - this.recordingStart;

      if (rms > 0.1 && elapsed - lastOnset > 0.1) {
        // find FFT peak bin for rough pitch estimate
        let peakIdx = 1;
        for (let i = 2; i < freqData.length; i++) {
          if (freqData[i] > freqData[peakIdx]) peakIdx = i;
        }
        const nyquist = this.audioCtx.sampleRate / 2;
        const freq = (peakIdx / freqData.length) * nyquist;

        this.events.push({
          time: elapsed,
          frequency: freq,
          pitchName: freqToNearestNote(freq),
          amplitude: rms,
        });
        lastOnset = elapsed;
      }

      this.animFrameId = requestAnimationFrame(analyze);
    };

    this.animFrameId = requestAnimationFrame(analyze);
  }

  async stopRecording(): Promise<{ digest: DspDigest; audioBase64: string }> {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const duration = this.audioCtx
      ? this.audioCtx.currentTime - this.recordingStart
      : 0;

    const avgEnergy =
      this.events.length > 0
        ? this.events.reduce((s, e) => s + e.amplitude, 0) / this.events.length
        : 0;

    const digest: DspDigest = {
      duration,
      averageEnergy: avgEnergy,
      peakOnsetCount: this.events.length,
      events: this.events,
    };

    const audioBase64 = await new Promise<string>((resolve) => {
      if (!this.mediaRecorder) { resolve(""); return; }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(",")[1] ?? "";
          resolve(b64);
        };
        reader.readAsDataURL(blob);
      };

      this.mediaRecorder.stop();
    });

    // cleanup
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioCtx?.close().catch(() => {});
    this.audioCtx = null;
    this.analyser = null;
    this.stream = null;

    return { digest, audioBase64 };
  }
}

function freqToNearestNote(freq: number): string {
  if (freq < 20 || !isFinite(freq)) return "C4";
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const clamped = Math.max(0, Math.min(127, midi));
  return `${names[clamped % 12]}${Math.floor(clamped / 12) - 1}`;
}
