export interface DspEvent {
  time: number;
  frequency: number;
  pitchName: string;
  amplitude: number;
}

export interface DspDigest {
  duration: number;
  averageEnergy: number;
  peakOnsetCount: number;
  events: DspEvent[];
}

export interface LiltNote {
  note: string;
  duration: number;
  velocity: "soft" | "normal" | "accent";
  time: number;
  voice?: string; // per-note voice override (e.g. drone layer)
}

export interface LiltSong {
  mood: string;
  articulation: "legato" | "staccato" | "tenuto" | string;
  voice: string;
  liltCode: string;
  notes: LiltNote[];
  explanation: string;
}

export interface SeedPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  dspDigest: DspDigest;
  simulatedEnergy: number[];
}
