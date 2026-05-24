<div align="center">
<img width="1200" height="475" alt="babbled notes" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# babbled notes v2

> Submitted to the [Google Gemma Challenge](https://dev.to/challenges/google-gemma-2026-05-06) and [Hermes Agent Challenge](https://dev.to/challenges/hermes-agent-2026-05-15) on DEV.to.

**GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2

---

## What it does

Make any sound into your microphone. Hum. Tap the desk. Breathe. Whistle. Click your tongue.

Gemma 4 (`gemma-4-26b-a4b-it`) finds the music inside it and plays it back as piano, cello, marimba, or drums.

No keyboard. No music theory. No pitch-perfect voice.

**Built for anyone who has ever felt shut out of making music** -- people who are non-verbal, people with ALS, cerebral palsy, locked-in syndrome, quadriplegia, Parkinson's.

---

## How to run it

**Prerequisites:** Node.js 18+, a free Gemini API key from [Google AI Studio](https://aistudio.google.com)

```bash
git clone https://github.com/brookehoward2008-droid/Babbled-notes-v2.git
cd Babbled-notes-v2
npm install
```

Add your API key to `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open `http://localhost:3000` in Chrome or Firefox.

**No API key?** The app runs in simulation mode -- the full UI works and audio plays back immediately so you can see the flow.

---

## Using the app

1. **Tap the orb** -- your microphone opens
2. **Make any sound** -- hum, tap, breathe, whistle. The NeuralGem crystallizes as it listens.
3. **Tap again to stop** -- the gem locks
4. **Wait 30-60 seconds** -- Gemma 4 is reading your sound and composing a response. This is a thinking model; the wait is real.
5. **Music plays** -- the synthesizer renders your composition
6. **Edit anytime** -- change voices, notes, or timestamps in the Lilt code editor and re-render without re-recording

---

## Who it serves

| Profile | Input | Output |
|---|---|---|
| Non-verbal autism | Sustained hum | Cello or piano melody |
| Cerebral palsy | Tremor taps | Percussive rhythm |
| ALS | Minimal breath | Ambient drone + melody |
| Locked-in syndrome | Single switch click | One-trigger composition |
| Quadriplegia | Hard/soft breath puff | Two-dynamic melody |
| Parkinson's | Tremor vocal hum | Tremor treated as vibrato |
| Apraxia of speech | Broken phonation | Legato bridging phrase |
| AAC / pre-verbal | Rising or falling hum | Interval-based melody |

---

## The NeuralGem

The canvas visualizer has three states that tell you what the agent is doing without words:

```
IDLE       ->  breathing silver ring. waiting.
RECORDING  ->  crystallizing polygon. sides grow with your audio level.
              color shifts purple to cyan as the sound builds.
LOCKED     ->  hexagon. facets lit in the mood color Gemma chose.
              the agent has heard you.
```

---

## Test coverage

32 real DSP profiles across 7 disability categories and 3 difficulty levels.

Run the full test suite yourself:

```bash
node test-runner.mjs
```

Results written to `test-results.json`. Every entry is a live Gemma 4 response -- no fabricated data. Each test represents a real human sound profile (breath, tremor tap, tongue click, whistle, hum shift).

---

## Agent architecture

See [HERMES.md](./HERMES.md) for a full breakdown of the perception-reasoning-action loop.

---

## Stack

| Layer | Technology |
|---|---|
| Reasoning engine | Gemma 4 (`gemma-4-26b-a4b-it`) via `@google/genai` SDK |
| Perception + playback | Web Audio API (FFT, RMS, onset detection, synthesis) |
| Frontend | React + Vite + TypeScript |
| Backend | Express (keeps API key server-side) |

---

## Contest submissions

| Challenge | Tags | Deadline |
|---|---|---|
| [Google Gemma Challenge](https://dev.to/challenges/google-gemma-2026-05-06) | `devchallenge` `gemmachallenge` `gemma` | May 24, 2026 |
| [Hermes Agent Challenge](https://dev.to/challenges/hermes-agent-2026-05-15) | `hermeschallenge` `devchallenge` `agent` | May 31, 2026 |

---

*by Brooke Chauntel*
