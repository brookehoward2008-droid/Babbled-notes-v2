# babbled notes: Agent Architecture

How babbled notes works as a closed-loop perception-reasoning-action agent.

---

## What makes it an agent

A tool does what you tell it. An agent reads its environment, makes decisions you did not configure, and takes action.

babbled notes is an agent because:

1. **It perceives autonomously.** The DSP layer reads your microphone in real time, identifies pitch, amplitude, and onset events without any user configuration.
2. **It decides without instruction.** You never choose a mood, a voice, or a musical key. Gemma 4 decides all of that from what it heard.
3. **It acts on its own output.** The synthesizer plays a composition. You did not compose it.
4. **It loops.** After the action, the user can correct the agent's interpretation. The agent re-renders. The loop runs again.

---

## State machine

The NeuralGem is the agent's interface. It has four states:

```
IDLE  ----tap---->  RECORDING  ----tap---->  PROCESSING  ----result---->  PLAYING
 ^                                                                            |
 |                                                                            |
 +---------------------------"new seed"--------------------------------------+
```

Each state is visually distinct on the canvas:

| State | Visual | What the agent is doing |
|---|---|---|
| IDLE | Breathing silver ring | Waiting for input |
| RECORDING | Crystallizing polygon, purple to cyan | Running FFT + onset detection in real time |
| PROCESSING | Hexagon forming | Sending audio + DSP digest to Gemma 4 |
| PLAYING | Locked hexagon, mood-colored facets | Rendering Lilt score through synthesizer |

For users who cannot read or who have cognitive differences: the color and shape carry all the information. No text labels required to understand what the agent is doing.

---

## 1. Perception layer

**Goal:** Convert raw mic input into a structured digest Gemma 4 can reason about.

**Implementation:** `src/lib/dspAnalyzer.ts`

### Signal chain

```
Microphone  ->  MediaStreamSource  ->  AnalyserNode (FFT 256)  ->  ScriptProcessor
                                                                          |
                                                                    RMS amplitude
                                                                    FFT peak bin
                                                                    Onset detection
                                                                          |
                                                                     DspEvent[]
```

### Onset detection

An onset is detected when RMS amplitude crosses 0.1 and at least 100ms have passed since the last onset:

```typescript
if (rms > 0.1 && elapsed - lastOnset > 0.1) {
  let peakIdx = 1;
  for (let i = 2; i < freqData.length; i++) {
    if (freqData[i] > freqData[peakIdx]) peakIdx = i;
  }
  const freq = (peakIdx / freqData.length) * nyquist;
  events.push({ time: elapsed, frequency: freq, pitchName: freqToNote(freq), amplitude: rms });
  lastOnset = elapsed;
}
```

This threshold is intentionally low. A breath barely registers above 0.02 RMS in a quiet room. The agent is tuned to hear the quietest inputs -- not the loudest.

### Pitch estimation

```typescript
function freqToNearestNote(freq: number): string {
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const clamped = Math.max(0, Math.min(127, midi));
  return `${names[clamped % 12]}${Math.floor(clamped / 12) - 1}`;
}
```

Converts the FFT peak bin frequency to the nearest MIDI note name (e.g. 220 Hz = A3).

### DspDigest output

```typescript
interface DspDigest {
  duration: number;       // total recording length in seconds
  averageEnergy: number;  // mean RMS across all events
  peakOnsetCount: number; // number of onset events detected
  events: DspEvent[];     // timestamped onset array
}

interface DspEvent {
  time: number;           // seconds from recording start
  frequency: number;      // Hz at onset peak
  pitchName: string;      // nearest note name
  amplitude: number;      // RMS at onset
}
```

The DSP digest is a compressed, structured summary of what the user produced. It reduces the audio to the events that matter for musical interpretation.

---

## 2. Reasoning layer

**Goal:** Read the DSP digest and raw audio, reason about the user's intent, produce a Lilt musical score.

**Implementation:** `server.ts` -- Express POST `/api/interpret`

### Why both audio and DSP digest

The agent sends two inputs to Gemma 4 simultaneously:

- **Raw audio (base64 WebM):** Gemma 4 can hear the actual sound -- the texture, the breath noise, the quality of the tone. A tremor in a hum has a different audio texture than a steady hum, even if the pitch is the same.
- **DspDigest (JSON):** Structured data the model can reason about precisely. Onset count, timing intervals, amplitude envelope. The model doesn't have to estimate these -- they are given.

Neither input alone is complete. The audio captures what structured analysis misses. The digest captures what audio analysis makes vague.

### The Lilt Contract

The system prompt defines a contract the agent must follow:

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

This is not a rigid classifier. Gemma 4 reads these as guidelines, not switch cases. A tremor-affected tap might produce "pensive" + "grand piano" + "legato" -- the agent decides the tremor is closer to a hum than a click.

### Response structure

The model outputs a Lilt score -- a structured JSON object:

```json
{
  "mood": "pensive",
  "articulation": "legato",
  "voice": "cinematic cello",
  "liltCode": "A3 ! soft @ 0.00s\nC4 ! normal @ 1.20s",
  "notes": [
    { "note": "A3", "duration": 1.2, "velocity": "soft", "time": 0.0 },
    { "note": "C4", "duration": 0.8, "velocity": "normal", "time": 1.2 },
    { "note": "A2", "duration": 3.5, "velocity": "soft", "time": 0.0, "voice": "synthesizer ambient" }
  ],
  "explanation": "A slow exhale, barely a sound. But steady. Like resolve."
}
```

Every field is a decision the agent made. The user did not choose "A3" or "legato" or "cinematic cello". The agent chose them.

### JSON extraction

Gemma 4 is a thinking model. It generates chain-of-thought reasoning before the output. The server extracts only the JSON object:

```typescript
const jsonMatch = rawText.match(/\{[\s\S]*\}/);
if (jsonMatch) rawText = jsonMatch[0];
const parsed = JSON.parse(rawText);
```

---

## 3. Action layer

**Goal:** Render the Lilt score as synthesized audio in real time.

**Implementation:** `src/lib/audioEngine.ts`

### Voice synthesis

Each Lilt voice maps to a Web Audio API synthesis chain:

| Voice | Oscillator | Filter | Envelope |
|---|---|---|---|
| `grand piano` | Triangle | None | Fast attack, medium decay |
| `cinematic cello` | Sawtooth | Low-pass 800Hz | Slow attack, long release |
| `marimba` | Sine | None | Very fast decay (0.3s) |
| `drum kit` | White noise | Band-pass 200Hz | Instant attack, very fast decay |
| `synthesizer ambient` | Sine | None | Long attack, very long release, low gain |

### Scheduling

Notes are scheduled using `AudioContext.currentTime`:

```typescript
const startAt = this.audioCtx.currentTime + note.time;
oscillator.start(startAt);
oscillator.stop(startAt + note.duration + release);
```

The `time` field from the Lilt score maps directly to the audio timeline. The agent's timestamp decisions become the actual playback timing.

### Velocity mapping

```typescript
const gain = velocity === "accent" ? 0.9
           : velocity === "normal" ? 0.6
           : velocity === "soft"   ? 0.35
           : 0.5;
```

Three velocity levels. "Accent" flags map to the highest gain. "Soft" maps to 35% gain -- barely audible, which is correct for drone layers and breath-based inputs.

---

## 4. Feedback loop

**Goal:** Let the user correct the agent's interpretation without re-recording.

**Implementation:** `src/components/LiltPlayerView.tsx`

The Lilt code editor is live. When the user changes any field:

```
Edit "soft" to "accent"  ->  re-parse Lilt tokens  ->  re-schedule audio  ->  music updates
Move timestamp 1.20s to 0.80s  ->  re-parse  ->  note plays earlier
Swap "C4" to "E4"  ->  re-parse  ->  pitch changes
```

This is the feedback loop. The agent makes a first-pass interpretation. The user steers it. The agent re-renders without asking Gemma 4 again -- the reasoning has already happened. Only the output needs to change.

---

## 5. Autonomy in practice

The agent's decisions across 32 disability profiles:

```
NV-01  Autism — breath (beginner)    ->  pensive, cinematic cello, legato, 4 notes
PH-02  CP — tremor taps (interm.)    ->  pensive, grand piano, legato, 5 notes
PH-08  Locked-in — morse (advanced)  ->  pensive, grand piano, legato, 6 notes
MX-04  Tongue click — single         ->  energetic, marimba, staccato, 3 notes
MX-06  Tongue click — syncopated     ->  energetic, drum kit, staccato, 5 notes
```

The agent correctly identifies:
- Soft inputs (breath, hum, tremor) as "pensive/gentle" with legato voices
- Sharp inputs (clicks, taps, whistles) as "energetic" with staccato voices
- Minimal inputs (1 event) as short phrases (3-4 notes)
- Complex inputs (4+ events) as longer compositions (6-8 notes)

No rules are hardcoded for these distinctions. Gemma 4 reads the DSP digest and decides.

---

## 6. Server architecture

```
Client (React)
    |
    | POST /api/interpret
    | { dspDigest, audioBase64, userPrompt }
    |
Express (server.ts)
    |
    | GoogleGenAI.models.generateContent()
    | model: "gemma-4-26b-a4b-it"
    | contents: [{ inlineData: audio }, { text: systemPrompt }]
    |
Gemma 4 API
    |
    | { mood, articulation, voice, liltCode, notes, explanation }
    |
Express (parses JSON, merges drone notes)
    |
Client (renders NeuralGem locked state, starts synthesizer)
```

The API key never touches the browser. The Express server is the only process that calls the Gemma API.

---

## Files

```
server.ts                    agent backend: Express + Gemma 4 reasoning call
src/lib/dspAnalyzer.ts       perception layer: FFT, RMS, onset detection
src/lib/audioEngine.ts       action layer: Web Audio API synthesis
src/components/NeuralGem.tsx agent state visualizer: idle/recording/locked
src/components/LiltPlayerView.tsx  feedback loop: piano roll + Lilt editor
src/App.tsx                  state machine: idle/recording/processing/playing
test-runner.mjs              32-profile autonomous decision test suite
test-results.json            live Gemma 4 responses for all 32 profiles
HERMES.md                    this file
```
