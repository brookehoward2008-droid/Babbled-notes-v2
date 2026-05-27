import { DspDigest, LiltNote, LiltSong } from "../types";

const PITCHES = ["C4", "D4", "E4", "G4", "A4", "C5", "E5"];

function idxToNote(idx: number, freq: number): string {
  if (freq > 40) {
    return PITCHES[Math.floor(freq / 60) % PITCHES.length];
  }
  return ["C4", "E4", "G4", "C5", "A4", "E4", "D4"][idx % 7];
}

function velocityFromAmplitude(amplitude: number): LiltNote["velocity"] {
  if (amplitude > 0.28) return "accent";
  if (amplitude > 0.14) return "normal";
  return "soft";
}

function moodFromDigest(digest: DspDigest): Pick<LiltSong, "mood" | "voice" | "articulation" | "explanation"> {
  const density = digest.duration > 0 ? digest.peakOnsetCount / digest.duration : 0;

  if (density > 3 || digest.averageEnergy > 0.26) {
    return {
      mood: "bright focused",
      voice: "marimba",
      articulation: "staccato",
      explanation:
        "Your sound had quick, clear pulses, so the browser shaped it into a bright pattern with crisp timing.",
    };
  }

  if (digest.averageEnergy < 0.08) {
    return {
      mood: "gentle calm",
      voice: "grand piano",
      articulation: "legato",
      explanation:
        "Your sound was soft, so the browser made a calm piano sketch with roomy timing and simple notes.",
    };
  }

  return {
    mood: "warm reflective",
    voice: "cinematic cello",
    articulation: "legato",
    explanation:
      "Your sound had a steady shape, so the browser translated it into a warm melodic line with a soft drone.",
  };
}

export function generateLocalSong(digest: DspDigest): LiltSong {
  const seedEvents = digest.events.length > 0
    ? digest.events.slice(0, 16)
    : [
        { time: 0.0, frequency: 130.81, pitchName: "C3", amplitude: 0.12 },
        { time: 0.5, frequency: 164.81, pitchName: "E3", amplitude: 0.16 },
        { time: 1.0, frequency: 196.0, pitchName: "G3", amplitude: 0.14 },
        { time: 1.5, frequency: 261.63, pitchName: "C4", amplitude: 0.2 },
      ];

  const notes: LiltNote[] = seedEvents.map((event, index) => ({
    note: idxToNote(index, event.frequency),
    duration: event.amplitude > 0.22 ? 0.5 : 0.8,
    velocity: velocityFromAmplitude(event.amplitude),
    time: Number(event.time.toFixed(2)),
  }));

  const lastTime = notes.length > 0
    ? Math.max(...notes.map((note) => note.time + note.duration))
    : 3.5;

  notes.push({
    note: "C3",
    duration: Math.max(3.5, lastTime + 0.5),
    velocity: "soft",
    time: 0,
    voice: "synthesizer ambient",
  });

  const songShape = moodFromDigest(digest);
  const liltCode = notes
    .filter((note) => !note.voice)
    .map((note) => `${note.note} ! ${note.velocity} @ ${note.time.toFixed(2)}s`)
    .join("\n");

  return {
    ...songShape,
    liltCode,
    notes,
  };
}
