<div align="center">
<img width="1200" height="475" alt="babbled notes" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# babbled notes v2

> Submitted to the [Google Gemma Challenge](https://dev.to/challenges/google-gemma-2026-05-06) and [Hermes Agent Challenge](https://dev.to/challenges/hermes-agent-2026-05-15) on DEV.to.

**GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
**Live app (v1):** https://ai.studio/apps/4d235490-15ac-47a5-9599-f82aa85a2b57

---

Make any sound. Hum, tap, whistle, breathe into your mic.

babbled notes listens. It finds the music hiding in that sound, translates it into a Lilt score using Gemini 2.0 Flash, and plays it back as piano, cello, marimba, or drums -- something you actually want to hear.

No music theory required. No keyboard. No pitch-perfect voice. Just a sound.

**Built for anyone who has ever felt shut out of making music.**

---

## The problem it solves

Most music tools require two hands, ten fingers, perfect pitch, or years of training. That shuts out a huge part of the world -- people who are non-verbal, people with motor disabilities, people with ALS, cerebral palsy, locked-in syndrome, quadriplegia, Parkinson's. People who have always heard music inside them but had no way to get it out.

babbled notes gives them a door.

A single breath. A tongue click. A finger tap. A hum with a tremor in it. The app takes whatever you can give and turns it into a real musical composition, rendered in real time by a synthesized instrument of your choice.

---

## Who it is built for

| Profile | What they give the app | What they get back |
|---|---|---|
| Non-verbal autism | Sustained hum, single tone | Cello or piano melody in that pitch |
| Cerebral palsy | Tremor-affected finger taps | Percussive rhythm pattern, drum or marimba |
| ALS / motor neuron disease | Minimal breath, barely audible | Ambient drone pad with gentle melody |
| Locked-in syndrome | Single eye-blink switch click | One-trigger composition, repeating |
| Quadriplegia (breath control) | Hard puff / soft puff contrast | Two-dynamic melody: accent and soft layers |
| Parkinson's disease | Tremor vocal hum | Composition that uses the tremor as vibrato |
| Apraxia of speech | Broken phonation bursts | Legato phrase bridging the gaps |
| AAC / pre-verbal users | Rising or falling hum | Interval-based melodic response |
| Spinal cord injury C4 | Head tap on mic | Beat-based composition from impact events |
| General assistive | Whistle, tongue click, breath | Full melodic or percussive score |

---

## Difficulty levels

The app adapts to input complexity automatically. Gemini reads the DSP digest and scales the output:

**Beginner** -- single event, minimal variation. One sound, one note. The app produces a simple repeating phrase. Designed for first-time users or users with very limited control.

**Intermediate** -- two to three events, some rhythm or pitch shift. The app builds a short melodic phrase with dynamics.

**Advanced** -- four or more events, intentional patterns. The app produces a full multi-voice composition with melody and drone layer.

No setting to switch. The app reads the sound and decides.

---

## What it does

1. **Record** -- tap the orb, make a sound, tap again to stop
2. **Translate** -- Gemini 2.0 Flash reads the DSP analysis, writes a Lilt score
3. **Play** -- the audio engine renders it using synthesized instruments

The Lilt score appears as an editable piano roll. You can change the voice, edit the code directly, and re-render without recording again.

---

## Test coverage

32 real DSP profiles tested across 7 disability categories and 3 difficulty levels:

- Non-verbal autism (4 tests: beginner through advanced)
- Apraxia of speech (3 tests)
- Selective mutism (2 tests)
- Cerebral palsy (3 tests)
- ALS / motor neuron disease (2 tests)
- Locked-in syndrome (3 tests)
- Quadriplegia breath controller (3 tests)
- Parkinson's disease (2 tests)
- Whistle input (3 tests)
- Tongue click / percussion access (3 tests)
- AAC / pre-verbal (2 tests)
- Spinal cord injury C4 (2 tests)

Full results: `test-results.json` -- every Gemini response, every mood, voice, and note count, timestamped.

Test runner: [`test-runner.mjs`](./test-runner.mjs)

---

## How to run

**Prerequisites:** Node.js 18+

```bash
npm install
```

Set your Gemini API key in `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open `http://localhost:3000`

No API key? The app runs in simulation mode -- the full UI works and audio plays back immediately so you can see it working.

---

## Run the test suite

```bash
node test-runner.mjs
```

Fires 32 disability-profile DSP tests at the live server. Saves every Gemini response to `test-results.json`.

---

## Stack

- **Gemini 2.0 Flash** -- multimodal audio interpretation, structured Lilt JSON output
- **Web Audio API** -- mic capture, real-time DSP analysis, synthesized instrument playback
- **React + Vite + TypeScript** -- frontend
- **Express + @google/genai SDK** -- backend, keeps the API key server-side

---

## What changed from v1

- Real microphone recording with live DSP feedback
- NeuralGem visualizer -- ring transforms into a crystallizing gem as you record, locks into a mood-colored hexagon on playback
- Multi-voice output -- melody layer plus a drone pad underneath
- Per-note voice override in the Lilt format
- Model updated to gemini-2.0-flash
- 32-test disability profile suite
- App runs end to end

---

---

## Contest submissions

| Challenge | Track | Tags | Deadline |
|---|---|---|---|
| [Google Gemma Challenge](https://dev.to/challenges/google-gemma-2026-05-06) | Build With Gemma 4 | `devchallenge` `gemmachallenge` `gemma` | May 24, 2026 |
| [Hermes Agent Challenge](https://dev.to/challenges/hermes-agent-2026-05-15) | Build | `hermesagentchallenge` `devchallenge` `agents` | May 31, 2026 |

---

*by Brooke Chauntel*
