---
title: babbled notes: a sound-to-music agent for people who could not make music before
published: true
tags: devchallenge, hermeschallenge, agent
---

> 💎 *You make a sound. Any sound. The agent hears it. Music comes back.*

---

# 𝕓𝕒𝕓𝕓𝕝𝕖𝕕 𝕟𝕠𝕥𝕖𝕤

Hum into a microphone. Tap your desk. Exhale slowly. Click your tongue. Whistle once.

A Gemma 4 agent reads what you made, decides what music lives inside it, and plays it back as piano, cello, marimba, or drums.

You chose nothing. The agent chose everything.

**Built for people who have never been able to make music before** -- people who are non-verbal, people with ALS, cerebral palsy, locked-in syndrome, quadriplegia, Parkinson's. People who have always heard music inside them and had no way to get it out.

🔗 **GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
🎵 **Agent architecture:** [HERMES.md](https://github.com/brookehoward2008-droid/Babbled-notes-v2/blob/main/HERMES.md)

---

## ◈ Why this is an agent, not a tool

A tool does what you tell it. You configure it. You choose the settings. You push the button.

An agent perceives its environment, reasons about what it observes, and takes action on its own judgment.

babbled notes runs a full agent loop on every sound:

| Component | What it does |
|---|---|
| **Perceive** | Web Audio API reads the mic: FFT pitch analysis, RMS amplitude, onset detection. Outputs a structured DspDigest. |
| **Reason** | Gemma 4 (`gemma-4-26b-a4b-it`) receives the raw audio AND the DspDigest. Decides mood, instrument voice, articulation, and note timing. |
| **Act** | Web Audio API synthesizer plays the composition. Real instruments. Real time. |
| **Reflect** | User edits the Lilt score. Agent re-renders without re-recording. |

The user never chooses a key, a tempo, a voice, or a mood. The agent reads the sound and decides all of it.

---

## 💎 The NeuralGem

The agent communicates its state through the NeuralGem -- a canvas visualizer with no text labels:

```
IDLE       ->  breathing silver ring. waiting for input.

RECORDING  ->  crystallizing polygon. sides grow as your audio level rises.
              color shifts purple to cyan as the sound builds.

PROCESSING ->  hexagon forming. the agent is reading your sound.

LOCKED     ->  hexagon. facets lit in the mood color the agent chose.
              the agent has heard you. music is loading.
```

For users who are non-verbal, have cognitive differences, or who cannot read: shape and color carry all the information. No labels to parse. No configuration panel to navigate. Tap once to start. Tap once to stop.

---

## ◈ How the agent reasons

The agent sends two things to Gemma 4 simultaneously:

**1. Raw audio** (base64 WebM)
The actual sound. Gemma 4 can hear the texture -- a tremor in a hum, the scrape of a breath, the sharp crack of a tongue click. These textures do not survive FFT analysis. They live in the audio.

**2. DspDigest** (structured JSON)
What the perception layer already calculated precisely:

```json
{
  "duration": 3.2,
  "averageEnergy": 0.11,
  "peakOnsetCount": 2,
  "events": [
    { "time": 0.0,  "frequency": 220, "pitchName": "A3", "amplitude": 0.11 },
    { "time": 1.6,  "frequency": 261, "pitchName": "C4", "amplitude": 0.13 }
  ]
}
```

Two onsets. A3 moving to C4. 1.6 seconds apart. Average energy 0.11 -- a soft sound.

Gemma 4 reads both and decides: this is a sustained hum that rose in pitch. Mood: pensive. Voice: cinematic cello. Articulation: legato. Two melody notes, one drone pad underneath. Timestamps aligned to the 1.6-second interval in the digest.

The agent's output:

```json
{
  "mood": "pensive",
  "articulation": "legato",
  "voice": "cinematic cello",
  "liltCode": "A3 ! soft @ 0.00s\nC4 ! normal @ 1.60s",
  "notes": [
    { "note": "A3", "duration": 1.4, "velocity": "soft",   "time": 0.0 },
    { "note": "C4", "duration": 1.2, "velocity": "normal", "time": 1.6 },
    { "note": "A2", "duration": 3.5, "velocity": "soft",   "time": 0.0, "voice": "synthesizer ambient" }
  ],
  "explanation": "A rising hum -- two tones, a minor third apart. The cello holds the first note soft, lifts into the second. The drone underneath gives it weight."
}
```

The agent turned a two-second hum into a composition with melody, countermelody, and an ambient drone. The user made one sound. The agent made the music.

---

## ◈ The Lilt Contract

The agent's reasoning follows a set of guidelines built into the system prompt. These are not hardcoded rules -- Gemma 4 interprets them against what it actually heard:

```
Slow, soft, or hummed sounds:
  mood = "gentle" or "pensive"
  voice = "cinematic cello" or "grand piano"
  articulation = "legato"

Sharp, rhythmic, or tapped sounds:
  mood = "energetic" or "tight"
  voice = "marimba" or "drum kit"
  articulation = "staccato"

Always keep pitches harmonious (C major, A minor, or pentatonic).
Timestamps must align with DSP onsets but feel musically polished.
Always include a drone layer using "synthesizer ambient" voice.
```

A tremor-affected tap does not fit cleanly into either category. The agent reads it as closer to a soft sound than a sharp one -- Parkinson's tremor in a hum becomes vibrato in the cello voice. A morse-style rhythm gets staccato articulation but the agent may still choose "grand piano" if the pattern feels musical rather than percussive.

The agent makes judgment calls. That is the point.

---

## ◈ The Lilt format

The agent outputs in Lilt -- a flat timestamp-based musical notation:

```
A3 ! soft   @ 0.00s
C4 ! normal @ 1.60s
E4 ! accent @ 2.80s
A2 ! soft   @ 0.00s   [synthesizer ambient]
```

Each line: pitch, velocity flag, timestamp, optional voice override.

The piano roll renders from this. The code is editable live. Change a velocity, shift a timestamp, swap a pitch, add a note. The synthesizer re-renders immediately. No new recording. No new API call.

This is the feedback loop. The agent interprets. The user adjusts. The agent re-renders.

---

## 💎 Who the agent serves

| Profile | What they give | What the agent produces |
|---|---|---|
| 💜 Non-verbal autism | Sustained hum, single tone | Cello or piano melody in that pitch |
| 💙 Cerebral palsy | Tremor-affected taps | Percussive or piano rhythm |
| 🤍 ALS | Minimal breath control | Ambient drone with gentle melody over it |
| 💛 Locked-in syndrome | Single eye-blink switch click | One-trigger composition, loops |
| 💚 Quadriplegia | Hard puff / soft puff contrast | Two-dynamic melody: accent and soft |
| 🧡 Parkinson's | Tremor vocal hum | Cello composition that treats tremor as vibrato |
| 🩷 Apraxia of speech | Broken phonation bursts | Legato phrase bridging the silence between bursts |
| 💎 AAC / pre-verbal | Rising or falling hum | Interval-based melodic response |
| 🔵 Spinal cord injury C4 | Head tap on mic | Beat-based composition from impact events |
| ⚪ Selective mutism | Barely audible breath | Gentle drone that validates the smallest input |

The agent does not have a "minimum input" requirement. A breath at 0.02 RMS amplitude -- almost nothing -- produces a composition. This was a deliberate design decision. The quietest input a person can give must be enough.

---

## ◈ 32 profiles tested

The agent was validated against 32 real DSP profiles representing the disability communities it was built for.

**Three difficulty levels:**

```
Beginner     -- one event, one sound. proves the agent handles the minimum.
Intermediate -- 2-3 events, some rhythm or pitch shift.
Advanced     -- 4+ events, dynamics, intentional pattern.
```

**Results across all 32 profiles:** 32 passed. 0 failed.

Every result is a live Gemma 4 response -- no simulated data, no hardcoded fallback. The test suite fires real DSP payloads at the running Express server and logs every decision the agent made.

```bash
node test-runner.mjs   # run all 32 profiles yourself
```

Full results in `test-results.json` on GitHub.

---

## ◈ Technical stack

```
Gemma 4 (gemma-4-26b-a4b-it)   reasoning engine
Web Audio API                   perception layer + action layer (synthesis)
React + Vite + TypeScript       frontend / state machine
Express + @google/genai SDK     backend agent server
```

The API key stays server-side. The browser never sees it.

---

## ◈ How to run it

```bash
git clone https://github.com/brookehoward2008-droid/Babbled-notes-v2.git
cd Babbled-notes-v2
npm install
```

Add a free Gemini API key to `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open `http://localhost:3000`. Allow microphone access. Tap the silver ring. Make any sound. Wait 30-60 seconds for Gemma 4 to reason. The music plays.

No API key? The app runs in simulation mode -- the full UI and audio play back immediately.

---

## ◈ Agent architecture (detailed)

Full technical breakdown in [HERMES.md](https://github.com/brookehoward2008-droid/Babbled-notes-v2/blob/main/HERMES.md):

- Perception layer: FFT signal chain, onset detector, DspDigest schema
- Reasoning layer: dual-input Gemma 4 call, Lilt Contract, JSON extraction
- Action layer: per-voice synthesis chains, scheduling via AudioContext
- Feedback loop: live Lilt editor, re-render without re-recording
- State machine: idle / recording / processing / playing

---

> 💎 *The gem crystallizes. The music plays. You made that.*
> *You made that with a breath.*

---

**GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
**Agent docs:** https://github.com/brookehoward2008-droid/Babbled-notes-v2/blob/main/HERMES.md

*by Brooke Chauntel*
