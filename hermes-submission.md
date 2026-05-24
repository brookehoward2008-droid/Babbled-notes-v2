---
title: babbled notes: a Gemma 4 agent that turns any human sound into music
published: true
tags: devchallenge, hermeschallenge, agent
---

> 💎 *One sound. Any sound. The Gemma 4 agent hears it. Music appears.*

---

# 𝕓𝕒𝕓𝕓𝕝𝕖𝕕 𝕟𝕠𝕥𝕖𝕤
## ✦ A Hermes Agent Powered by Gemma 4 ✦

**Hum. Tap. Breathe. Whistle. Click your tongue.**

A Gemma 4 agent reads your sound, decides what music lives inside it, and plays it back as piano, cello, marimba, or drums.

You chose nothing. **The agent chose everything.**

Built for people who have never been able to make music before -- people who are non-verbal, people with ALS, cerebral palsy, locked-in syndrome, quadriplegia, Parkinson's.

> *The quietest breath. The smallest click. The most tremor-filled hum.*
> *All of it becomes music. The agent makes sure of that.*

🔗 **GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
📐 **Agent docs:** [HERMES.md](https://github.com/brookehoward2008-droid/Babbled-notes-v2/blob/main/HERMES.md)

---

## 💎 Gemma 4 + Hermes: How They Work Together

This is not a chatbot sitting inside an agent wrapper. Gemma 4 (`gemma-4-26b-a4b-it`) **is** the agent's reasoning engine -- the only component capable of deciding what a sound means musically.

The Hermes agent provides the body. Gemma 4 provides the mind.

```
┌─────────────────────────────────────────────────────────┐
│                   HERMES AGENT LOOP                     │
│                                                         │
│  PERCEIVE        REASON            ACT                  │
│  ─────────       ──────────────    ──────────           │
│  Web Audio API   ┌──────────────┐  Web Audio API        │
│  FFT + RMS    →  │  GEMMA  4    │→ Synthesizer          │
│  Onset detect    │  gemma-4-    │  Piano, cello,        │
│  DspDigest out   │  26b-a4b-it  │  marimba, drums       │
│                  └──────────────┘                       │
│                         ↕                               │
│  REFLECT: User edits Lilt code → Agent re-renders       │
└─────────────────────────────────────────────────────────┘
```

**What the agent does without Gemma 4:** records audio, measures pitch and amplitude. That's it. A microphone.

**What Gemma 4 makes possible:** the agent reads a breath and decides it's pensive. It maps a tremor-hum to a cello in A minor. It hears a morse-style rhythm and produces a six-note grand piano phrase with a drone underneath. None of that is rules. It is Gemma 4's judgment, called once, producing a complete musical composition.

---

## ◈ Why This Is an Agent

A tool does what you tell it. An agent perceives its environment, reasons about what it observed, and takes action on its own.

| Agent property | babbled notes implementation |
|---|---|
| **Autonomous perception** | Web Audio API reads the mic; FFT, RMS, and onset detection run without any user input |
| **Independent reasoning** | Gemma 4 decides mood, voice, articulation, pitches, and timing -- user sets none of these |
| **Real-world action** | Synthesizer plays a full composition -- the agent produced this, not the user |
| **Feedback loop** | User edits the Lilt score; agent re-renders without re-recording |
| **State awareness** | NeuralGem tracks and displays agent state -- idle, recording, processing, playing |

---

## 💎 The NeuralGem

The agent's face is the **NeuralGem** -- a canvas visualizer that shows state without a single word of text:

```
◇  IDLE        breathing silver ring. the agent is waiting.

◈  RECORDING   crystallizing polygon, purple shifting to cyan.
               sides multiply as your audio level rises.
               the agent is listening and measuring.

⬡  PROCESSING  hexagon forming. the agent is reading your sound.
               Gemma 4 is receiving audio + DSP digest.

⬡  LOCKED      hexagon. facets lit in the mood color Gemma chose.
               the agent has decided. music is loading.
```

For users who are non-verbal, have cognitive differences, or cannot read: **shape and color are the whole interface.** No labels to parse. No configuration screens. Tap once to open the mic. Tap once to close it. The gem tells you everything else.

---

## ◈ How Gemma 4 Reads a Sound

The agent sends **two inputs simultaneously** to Gemma 4:

### Input 1: Raw audio (base64 WebM)

The actual recorded sound. Gemma 4 can hear what FFT analysis cannot measure:
- The texture of a breath
- The tremor frequency inside a hum
- The sharpness or softness of a tap
- The space between broken phonation bursts

### Input 2: DspDigest (structured JSON)

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

Two onsets. A3 moving to C4. 1.6 seconds apart. Energy 0.11 -- a soft, sustained sound.

### What Gemma 4 decides

Gemma 4 reads both and returns a complete **Lilt score** -- the agent's musical output format:

```json
{
  "mood": "pensive",
  "articulation": "legato",
  "voice": "cinematic cello",
  "liltCode": "A3 ! soft @ 0.00s\nC4 ! normal @ 1.60s",
  "notes": [
    { "note": "A3", "duration": 1.4, "velocity": "soft",   "time": 0.0 },
    { "note": "C4", "duration": 1.2, "velocity": "normal", "time": 1.6 },
    { "note": "A2", "duration": 4.0, "velocity": "soft",   "time": 0.0,
      "voice": "synthesizer ambient" }
  ],
  "explanation": "A rising hum, two tones a minor third apart. The cello holds the first note soft, lifts into the second. A low drone gives it weight."
}
```

**Every field is a Gemma 4 decision.** Mood: pensive. Instrument: cello. Key: A minor. Note count: 3. Drone: yes. The user made one two-second hum. Gemma 4 made the music.

---

## 💎 The Lilt Contract

The system prompt Gemma 4 follows defines a musical judgment contract -- not rigid rules, but principles Gemma 4 interprets against what it actually heard:

```
◈  Slow, soft, or hummed input:
   mood   =  "gentle" or "pensive"
   voice  =  "cinematic cello" or "grand piano"
   style  =  legato

◈  Sharp, rhythmic, or tapped input:
   mood   =  "energetic" or "tight"
   voice  =  "marimba" or "drum kit"
   style  =  staccato

◈  Always harmonious pitches: C major, A minor, or pentatonic
◈  Timestamps aligned to DSP onsets, polished to feel musical
◈  Always include a drone layer: "synthesizer ambient" voice
```

A Parkinson's tremor-hum does not fit cleanly into "soft" or "sharp." Gemma 4 reads it as closer to a sustained sound -- the tremor becomes vibrato in the cello voice. A morse-style rhythm gets staccato articulation, but Gemma 4 may still choose grand piano if the pattern has musical phrasing rather than raw percussive impact.

**This is why Gemma 4 is the right model for this agent.** It does not follow rules mechanically. It reads the full context -- audio texture AND structured data -- and makes a judgment.

---

## ◈ The Lilt Format

The agent outputs in Lilt -- a flat, human-readable musical notation:

```
A3 ! soft   @ 0.00s
C4 ! normal @ 1.60s
E4 ! accent @ 2.80s
A2 ! soft   @ 0.00s   [synthesizer ambient]
```

```
pitch  !  velocity  @  timestamp  [voice override]
```

The piano roll renders from this. The code is editable live. Change `soft` to `accent`, shift `1.60s` to `1.20s`, swap `C4` for `E4`, add a note. The synthesizer re-renders immediately. No new recording. No new Gemma 4 call.

**This is the feedback loop.** Gemma 4 interprets. The user steers. The agent re-renders.

---

## ◈ Who the Agent Serves

| Profile | Input | What Gemma 4 produces |
|---|---|---|
| 💜 Non-verbal autism | Sustained hum | Cello or piano melody in that pitch |
| 💙 Cerebral palsy | Tremor-affected taps | Polished percussive phrase |
| 🤍 ALS | Minimal breath | Ambient drone with gentle melody |
| 💛 Locked-in syndrome | Single switch click | One-trigger composition |
| 💚 Quadriplegia | Hard/soft breath puffs | Two-dynamic melody |
| 🧡 Parkinson's | Tremor vocal hum | Cello with tremor as vibrato |
| 🩷 Apraxia | Broken phonation | Legato phrase bridging the gaps |
| 💎 AAC / pre-verbal | Rising or falling hum | Interval-based melody |
| 🔵 SCI C4 | Head tap on mic | Beat composition from impact |
| ⚪ Selective mutism | Barely-audible breath | Drone that validates the smallest input |

> *The agent does not have a minimum input requirement.*
> *A breath at 0.02 RMS -- barely detectable -- still produces a full composition.*
> *Gemma 4 never dismisses a sound as too small to mean something.*

---

## 💎 32 Profiles. 7 Categories. 3 Difficulty Levels.

The agent was tested with 32 real DSP profiles representing the disability communities it was built for. Every test is a live Gemma 4 response -- no simulated data.

```
◈  Beginner     single event, one sound. minimum viable input.
◈  Intermediate 2-3 events, some rhythm or pitch change.
◈  Advanced     4+ events, dynamics, intentional pattern.
```

**Result: 32 / 32 passed.**

```bash
# run the full suite yourself
node test-runner.mjs
```

Full Gemma 4 responses in `test-results.json` on GitHub -- every mood, voice, note count, and explanation the agent produced.

---

## ◈ Stack

```
┌─────────────────────────────────────────────┐
│  REASONING    Gemma 4  gemma-4-26b-a4b-it   │  ← the agent's brain
│  PERCEPTION   Web Audio API (FFT, RMS)      │  ← the agent's ears
│  ACTION       Web Audio API (synthesis)     │  ← the agent's voice
│  FRONTEND     React + Vite + TypeScript     │
│  BACKEND      Express + @google/genai SDK   │  ← API key stays here
└─────────────────────────────────────────────┘
```

---

## ◈ Run It

```bash
git clone https://github.com/brookehoward2008-droid/Babbled-notes-v2.git
cd Babbled-notes-v2
npm install
```

Add a free key from [aistudio.google.com](https://aistudio.google.com) to `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
# open http://localhost:3000
```

Tap the silver ring. Make any sound. Wait 30-60 seconds while Gemma 4 reasons. The music plays.

**No key?** Simulation mode runs the full UI with audio -- you can see the complete agent flow without any quota.

---

## ◈ Agent Architecture

Full technical breakdown in [HERMES.md](https://github.com/brookehoward2008-droid/Babbled-notes-v2/blob/main/HERMES.md):

```
✦  Perception:  FFT signal chain, onset detector, DspDigest schema
✦  Reasoning:   dual-input Gemma 4 call, Lilt Contract, JSON extraction
✦  Action:      5 voice synthesis chains, AudioContext scheduling
✦  Feedback:    live Lilt editor, re-render without re-recording
✦  State:       idle / recording / processing / playing machine
✦  Tests:       32 disability DSP profiles, live Gemma 4 responses
```

---

> 💎 *The gem crystallizes.*
> *Gemma 4 has decided.*
> *The music plays.*
> *You made that.*
> *You made that with a breath.*

---

**GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
**Agent docs:** https://github.com/brookehoward2008-droid/Babbled-notes-v2/blob/main/HERMES.md

*by Brooke Chauntel*
