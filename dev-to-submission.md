---
title: babbled notes: any sound becomes music. built for people who couldn't before.
published: true
tags: devchallenge, gemmachallenge, gemma
---

> 💎 *One sound. Any sound. The gem listens. The music appears.*

---

# 𝕓𝕒𝕓𝕓𝕝𝕖𝕕 𝕟𝕠𝕥𝕖𝕤

**Make any sound. Hum. Tap. Breathe. Whistle.**

Gemma 4 finds the music inside it and plays it back as piano, cello, marimba, or drums.

No keyboard. No music theory. No pitch-perfect voice.

**Built for anyone who has ever felt shut out of making music.**

🔗 **GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
🎵 **Live app:** https://ai.studio/apps/4d235490-15ac-47a5-9599-f82aa85a2b57

---

## ◈ The problem

Most music tools require two hands, ten fingers, perfect pitch, or years of training.

That shuts out a huge part of the world. People who are non-verbal. People with ALS, cerebral palsy, locked-in syndrome, quadriplegia, Parkinson's. People who have always heard music inside them and had no way to get it out.

**babbled notes gives them a door.**

A single breath. A tongue click. A finger tap. A hum with a tremor in it.

The app takes whatever you can give and turns it into a real musical composition, rendered in real time by a synthesized instrument of your choice.

---

## 💎 The NeuralGem

At the center of the app is the **NeuralGem**, a canvas visualizer with three states:

```
IDLE       →  a breathing silver ring. waiting.
RECORDING  →  a crystallizing polygon. sides grow with your audio level.
             color shifts purple → cyan as the sound builds.
LOCKED     →  a hexagon. facets lit in your mood color.
             the gem has heard you.
```

The gem is not decoration. It tells you what the app is doing without words.

---

## ◈ Who it is built for

| Profile | What they give | What they get |
|---|---|---|
| 💜 Non-verbal autism | Sustained hum, single tone | Cello or piano melody |
| 💙 Cerebral palsy | Tremor-affected taps | Percussive rhythm, drum or marimba |
| 🤍 ALS | Minimal breath | Ambient drone pad with gentle melody |
| 💛 Locked-in syndrome | Single eye-blink switch click | One-trigger composition, looping |
| 💚 Quadriplegia | Hard puff / soft puff | Two-dynamic melody: accent and soft |
| 🧡 Parkinson's | Tremor vocal hum | Composition that treats tremor as vibrato |
| 🩷 Apraxia of speech | Broken phonation bursts | Legato phrase bridging the gaps |
| 💎 AAC / pre-verbal | Rising or falling hum | Interval-based melodic response |

---

## ◈ How it works

```
1.  TAP THE ORB      →  microphone opens
2.  MAKE A SOUND     →  Web Audio API captures + analyzes in real time
                        (FFT pitch, RMS amplitude, onset detection)
3.  TAP AGAIN        →  recording stops
4.  GEMMA 4 READS    →  receives audio + DSP digest simultaneously
                        returns: mood, voice, articulation, Lilt score
5.  THE GEM LOCKS    →  mood-colored hexagon appears
6.  MUSIC PLAYS      →  synthesized instrument renders the Lilt score
7.  EDIT ANYTIME     →  piano roll + live Lilt code editor, re-render without re-recording
```

---

## 💎 Why Gemma 4

The app sends two things to the model at once:

- **Raw audio**: the actual recorded sound
- **DSP digest**: structured analysis of onset times, dominant frequency, pitch name, amplitude, tempo estimate

Gemma 4 (`gemma-4-26b-a4b-it`) reads both together and returns fast enough that a user with ALS or limited stamina hears their composition without waiting. That responsiveness matters. A slow model breaks the experience.

The system prompt enforces a strict JSON Lilt score every time. No freeform text. No guessing.

```json
{
  "mood": "gentle",
  "articulation": "legato",
  "voice": "cinematic cello",
  "notes": [
    { "note": "A3", "duration": 1.2, "velocity": "soft", "time": 0.0 },
    { "note": "C4", "duration": 0.8, "velocity": "normal", "time": 1.2 }
  ],
  "explanation": "A slow exhale, barely a sound. But steady. Like resolve."
}
```

---

## ◈ Disability profiles tested

**32 real DSP profiles. 7 disability categories. 3 difficulty levels.**

> Beginner: one event, one sound, one note
> Intermediate: 2-3 events, some rhythm or pitch shift
> Advanced: 4+ events, dynamics, intentional pattern

```
NV-01  Autism — slow exhale breath         (beginner)
NV-02  Autism — single sustained hum       (beginner)
NV-03  Autism — two-tone hum shift         (intermediate)
NV-04  Autism — melodic hum phrase         (advanced)
NV-05  Apraxia — disrupted single vowel    (beginner)
NV-06  Apraxia — broken phonation bursts   (intermediate)
NV-07  Apraxia — vowel glide attempt       (advanced)
NV-08  Selective mutism — barely audible   (beginner)
PH-01  Cerebral palsy — single finger tap  (beginner)
PH-02  Cerebral palsy — tremor cluster     (intermediate)
PH-03  Cerebral palsy — intentional beat   (advanced)
PH-04  ALS — minimal breath control        (beginner)
PH-05  ALS — pulsed breath pattern         (intermediate)
PH-06  Locked-in — single switch click     (beginner)
PH-07  Locked-in — two-click phrase        (intermediate)
PH-08  Locked-in — morse-style rhythm      (advanced)
PH-09  Quadriplegia — single breath puff   (beginner)
PH-10  Quadriplegia — hard/soft contrast   (intermediate)
PH-11  Quadriplegia — rhythmic phrase      (advanced)
PH-12  Parkinson's — tremor hum            (beginner)
PH-13  Parkinson's — vocal tremor melody   (advanced)
MX-01  Whistle — single clear pitch        (beginner)
MX-02  Whistle — two-note call             (intermediate)
MX-03  Whistle — pentatonic phrase         (advanced)
MX-04  Tongue click — single event         (beginner)
MX-05  Tongue click — 4/4 rhythm           (intermediate)
MX-06  Tongue click — syncopated groove    (advanced)
MX-07  AAC — rising hum intention          (intermediate)
MX-08  AAC — call and response             (advanced)
MX-09  SCI C4 — head tap                   (beginner)
MX-10  SCI C4 — two-tap intentional gap    (intermediate)
```

Run them yourself: `node test-runner.mjs`

---

## ◈ Stack

```
Gemma 4 (gemma-4-26b-a4b-it)   multimodal audio + DSP digest to Lilt JSON
Web Audio API                   mic capture, FFT/RMS DSP, synthesized playback
React + Vite + TypeScript       frontend
Express + @google/genai SDK     backend (API key stays server-side)
```

---

## 💎 What the Lilt format looks like

```
A3 ! soft   @ 0.00s
C4 ! normal @ 1.20s
E4 ! accent @ 2.10s
G4 ! soft   @ 3.40s
```

Each line is a note trigger: pitch, velocity, timestamp. The piano roll renders from this. The code is editable live. Change a velocity, move a timestamp, swap a note, hit compile. The music changes without re-recording.

---

> 💎 *The gem crystallizes. The music plays. You made that.*
> *You made that with a breath.*

---

**GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
**Live app:** https://ai.studio/apps/4d235490-15ac-47a5-9599-f82aa85a2b57

*by Brooke Chauntel*
