# babbled notes: Agent Architecture

How babbled notes works as a perception-reasoning-action agent.

---

## The loop

```
PERCEIVE  →  REASON  →  ACT  →  REFLECT  →  (repeat)
```

Every time a user makes a sound, the agent runs this full loop. One sound in. One composition out.

---

## 1. Perception layer

**What it does:** Captures raw mic input and converts it into a structured digest the reasoning engine can read.

**Implementation:** Web Audio API

```
AnalyserNode (FFT)         pitch detection via frequency bin peak
ScriptProcessorNode (RMS)  amplitude envelope over time
Onset detector             detects new note events by amplitude jump threshold
```

**Output:** `DspDigest` -- a JSON object:

```typescript
interface DspDigest {
  duration: number;           // total recording length in seconds
  dominantFreq: number;       // Hz of strongest frequency bin
  dominantPitch: string;      // e.g. "A3", "C4"
  avgAmplitude: number;       // 0.0 to 1.0 RMS average
  tempoEstimate: number;      // BPM estimate from onset intervals
  events: DspEvent[];         // timestamped onset array
}

interface DspEvent {
  time: number;               // seconds from recording start
  frequency: number;          // Hz at onset
  pitchName: string;          // note name
  amplitude: number;          // 0.0 to 1.0 at onset
}
```

The perception layer runs in real time during recording. When the user taps to stop, the digest is complete.

---

## 2. Reasoning engine

**What it does:** Reads the DspDigest and raw audio, reasons about the user's intent, outputs a Lilt musical score.

**Implementation:** Gemma 4 (`gemma-4-26b-a4b-it`) via `@google/genai` SDK

**Inputs sent to the model simultaneously:**
- `audioBase64`: the raw WebM audio, base64-encoded
- `dspDigest`: the structured analysis from the perception layer
- `userPrompt`: optional intent hint from the user ("make it a cello", "slow and gentle")

**System prompt contract (The Lilt Contract):**

```
If the sound is slow, soft, or hummed:
  mood = "gentle" or "pensive"
  voice = "cinematic cello" or "grand piano"
  articulation = "legato"

If the sound is sharp, rhythmic, or tapped:
  mood = "energetic" or "tight"
  voice = "marimba" or "drum kit"
  articulation = "staccato"

Keep pitches harmonious (C major, A minor, or pentatonic).
Align timestamps to DSP onsets but make them musically polished.
Always include a drone note layer with voice "synthesizer ambient".
```

**Output:** JSON Lilt score

```json
{
  "mood": "pensive",
  "articulation": "legato",
  "voice": "cinematic cello",
  "liltCode": "A3 ! soft @ 0.00s\nC4 ! normal @ 1.20s",
  "notes": [
    { "note": "A3", "duration": 1.2, "velocity": "soft", "time": 0.0 },
    { "note": "C4", "duration": 0.8, "velocity": "normal", "time": 1.2, "voice": "synthesizer ambient" }
  ],
  "explanation": "A slow exhale, barely a sound. But steady. Like resolve."
}
```

The model runs server-side. The API key never reaches the browser.

---

## 3. Action layer

**What it does:** Renders the Lilt score as synthesized audio in real time.

**Implementation:** Web Audio API (no external audio library)

Each note in the Lilt score maps to a synthesized voice:

| Voice | Synthesis method |
|---|---|
| `grand piano` | OscillatorNode (triangle) + envelope |
| `cinematic cello` | OscillatorNode (sawtooth) + low-pass filter |
| `marimba` | OscillatorNode (sine) + fast decay envelope |
| `drum kit` | White noise burst + band-pass filter |
| `synthesizer ambient` | OscillatorNode (sine) + long release, low gain |

Each note is scheduled via `AudioContext.currentTime` using the `time` field from the Lilt score. Notes play at the exact offset the agent specified.

---

## 4. Reflect / feedback loop

**What it does:** Gives the user a channel to correct the agent's interpretation.

**Implementation:** Piano roll + Lilt code editor (React)

The piano roll renders the note grid from the Lilt score. The code editor shows the raw Lilt text. Both are live-editable:

```
User edits Lilt code  →  parser re-validates  →  synthesizer re-renders
```

No new recording needed. The user can change a velocity (`soft` to `accent`), shift a timestamp, swap a pitch, or add a drone note. The agent re-renders immediately.

This closes the loop: the agent acts, the user reflects, the agent adapts.

---

## Why the agent framing matters

Traditional music apps put the interface between the user and the music. The user must understand keys, chords, beats, notation.

babbled notes removes the interface. The agent reads whatever the user can give (a breath, a tap, a hum with a tremor in it) and builds the musical structure for them.

The loop runs in one direction: sound goes in, music comes out. The user never has to know what a C major chord is.

---

## Test suite

32 DSP profiles across 7 disability categories and 3 difficulty levels.

```
node test-runner.mjs
```

Results saved to `test-results.json`. Each entry is a live Gemma 4 response -- no fabricated data.

---

## Files

```
server.ts          agent backend: Express + Gemma 4 API call
src/               React frontend: NeuralGem, piano roll, Lilt editor, synthesizer
test-runner.mjs    32-profile DSP test suite
test-results.json  live Gemma 4 responses for all 32 profiles
HERMES.md          this file
```
