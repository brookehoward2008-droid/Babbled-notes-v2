---
title: babbled notes: the sound-to-music agent. built for people who couldn't before.
published: true
tags: devchallenge, hermeschallenge, agent
---

> 💎 *You make a sound. The agent hears it. Music comes back.*

---

# 𝕓𝕒𝕓𝕓𝕝𝕖𝕕 𝕟𝕠𝕥𝕖𝕤

**An AI agent that turns any human sound into a real musical composition.**

Hum. Tap. Breathe. Whistle. Click your tongue.

The agent listens, reasons about what it heard, and plays it back as piano, cello, marimba, or drums.

No keyboard. No music theory. No pitch-perfect voice.

**Built for anyone who has ever felt shut out of making music.**

🔗 **GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
🎵 **Live app:** https://ai.studio/apps/4d235490-15ac-47a5-9599-f82aa85a2b57

---

## ◈ The agent loop

This is not a chatbot. It is not a prompt → response tool. It is a closed perception-reasoning-action loop that runs on a single sound.

```
PERCEIVE   →  Web Audio API captures mic input
               FFT pitch analysis, RMS amplitude, onset detection
               Outputs a structured DSP digest

REASON     →  Gemma 4 (gemma-4-26b-a4b-it) receives:
               - the raw audio
               - the DSP digest
               Returns a Lilt musical score (JSON)

ACT        →  Web Audio API synthesizer renders the score
               Piano, cello, marimba, or drum kit
               Timed to the agent's onset map

REFLECT    →  User sees the Lilt code, edits it, re-compiles
               The agent re-renders without a new recording
```

One sound in. One composition out. Every time.

---

## 💎 The NeuralGem

The agent's interface is the **NeuralGem**, a canvas visualizer that shows the agent's state without words:

```
IDLE       →  breathing silver ring. waiting for input.
RECORDING  →  crystallizing polygon. sides grow with audio level.
             color shifts purple to cyan as the sound builds.
LOCKED     →  hexagon. facets lit in the mood color the agent chose.
             the agent has heard you. music is loading.
```

For users who are non-verbal, cognitively different, or have motor impairments: the visual state is the whole interface. No labels to read. No buttons to find. Tap once to start. Tap once to stop.

---

## ◈ Why this is an agent, not a tool

A tool does one thing when you click it.

An agent **perceives its environment, reasons about it, and takes action** -- then waits for new input and repeats.

babbled notes runs a full agent loop on every sound:

| Agent component | Implementation |
|---|---|
| Perception | Web Audio API: FFT, RMS, onset detector, pitch estimator |
| Environment state | DspDigest: timestamped event array with frequency, amplitude, pitch name |
| Reasoning engine | Gemma 4: multimodal, reads audio + structured digest simultaneously |
| Action output | Lilt score: pitch, velocity, timestamp, instrument voice |
| Actuator | Web Audio API synthesizer: renders the score in real time |
| Feedback channel | Piano roll + Lilt code editor: user corrects, agent re-renders |

The agent is not passive. It interprets intent. A tremor in the hum becomes vibrato in the composition. A morse-style rhythm becomes a percussive groove. A barely audible breath becomes a drone pad with a gentle melody over it.

---

## ◈ Who the agent serves

| User profile | What they give | What the agent produces |
|---|---|---|
| 💜 Non-verbal autism | Sustained hum, single tone | Cello or piano melody |
| 💙 Cerebral palsy | Tremor-affected taps | Percussive rhythm, drum or marimba |
| 🤍 ALS | Minimal breath control | Ambient drone with gentle melody |
| 💛 Locked-in syndrome | Single eye-blink switch click | One-trigger composition, looping |
| 💚 Quadriplegia | Hard puff / soft puff | Two-dynamic melody: accent and soft |
| 🧡 Parkinson's | Tremor vocal hum | Composition that treats tremor as vibrato |
| 🩷 Apraxia of speech | Broken phonation bursts | Legato phrase bridging the gaps |
| 💎 AAC / pre-verbal | Rising or falling hum | Interval-based melodic response |

---

## 💎 The agent's language: Lilt

The reasoning engine outputs in Lilt format. Lilt is the agent's internal musical notation: flat, timestamp-based, readable, and editable.

```
A3 ! soft   @ 0.00s
C4 ! normal @ 1.20s
E4 ! accent @ 2.10s
G4 ! soft   @ 3.40s
```

Each line: pitch, velocity flag, timestamp. The piano roll renders from this. The code is editable live. Change a velocity, move a timestamp, swap a note, hit compile. The agent re-renders without a new recording.

This is the feedback loop. The user corrects the agent's interpretation. The agent learns from the correction in real time.

---

## ◈ How the reasoning works

The agent sends two inputs to Gemma 4 simultaneously:

- **Raw audio**: the actual recorded sound as base64 WebM
- **DSP digest**: structured analysis the perception layer already ran

```json
{
  "duration": 3.2,
  "dominantFreq": 220,
  "dominantPitch": "A3",
  "avgAmplitude": 0.11,
  "events": [
    { "time": 0.0, "frequency": 220, "pitchName": "A3", "amplitude": 0.11 },
    { "time": 1.6, "frequency": 261, "pitchName": "C4", "amplitude": 0.13 }
  ]
}
```

Gemma 4 reads both and returns a complete Lilt score with mood, articulation, voice, note timings, and a human-language explanation of what it heard.

The model does not need both every time. If audio is unavailable (switch-access users, low-bandwidth), the DSP digest alone is enough for the agent to reason.

---

## ◈ 32 profiles. 7 categories. 3 difficulty levels.

The agent was tested against 32 real DSP profiles representing disability communities it was designed to serve.

```
Beginner:      one event, one sound -- proves the agent handles minimal input
Intermediate:  2-3 events with rhythm or pitch shift
Advanced:      4+ events with dynamics and intentional pattern
```

Run the test suite yourself:

```
npm install
npm run dev       # start the server
node test-runner.mjs
```

---

## ◈ Stack

```
Gemma 4 (gemma-4-26b-a4b-it)   reasoning engine: audio + DSP to Lilt JSON
Web Audio API                   perception + actuation
React + Vite + TypeScript       frontend
Express + @google/genai SDK     backend agent server
```

---

> 💎 *The gem crystallizes. The music plays. You made that.*
> *You made that with a breath.*

---

**GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
**Live app:** https://ai.studio/apps/4d235490-15ac-47a5-9599-f82aa85a2b57

*by Brooke Chauntel*
