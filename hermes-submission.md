---
title: "Building an Accessibility Agent with Hermes Agent: Sound to Music for People Who Couldn't Before"
published: true
tags: hermesagentchallenge, devchallenge, agents
---

> 💎 *One sound. Any sound. The agent hears it. Music appears.*

---

# 𝕓𝕒𝕓𝕓𝕝𝕖𝕕 𝕟𝕠𝕥𝕖𝕤
## ✦ An Accessibility Agent Built on Hermes Agent Principles ✦

This post explores how **Hermes Agent** -- Nous Research's open-source autonomous agent platform -- maps perfectly to a real-world accessibility problem: giving people who cannot use traditional music tools a way to make music with any sound their body can produce.

The result is **babbled notes v2**: a Gemma 4-powered agent that turns a hum, a breath, a tap, or a tongue click into a real musical composition.

🔗 **GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
📐 **Agent docs:** https://github.com/brookehoward2008-droid/Babbled-notes-v2/blob/main/HERMES.md

---

## ◈ What Is Hermes Agent

Hermes Agent is an autonomous system by Nous Research -- not a coding copilot tethered to an IDE, not a chatbot wrapper around a single API. It is a server-side agent with:

```
✦  Multi-platform reach    Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI
✦  Persistent memory       Learns from past work, reapplies solutions automatically
✦  Scheduled automations   Natural language cron: "send me a briefing every morning"
✦  Subagent delegation     Parallel agents with isolated contexts, no context bleed
✦  Five sandbox backends   Local, Docker, SSH, Singularity, Modal
✦  Web capabilities        Search, browser automation, vision, image gen, TTS
```

Install in one command:

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
hermes setup
```

What makes Hermes Agent different from a chatbot: it operates independently on your server, can schedule work, delegate subtasks to subagents, and persist knowledge across sessions. That is a real agent architecture -- not a prompt-response loop.

---

## 💎 Why Hermes Agent and Accessibility Belong Together

Most music tools require two hands, ten fingers, perfect pitch, or years of training.

That shuts out a huge part of the world. People who are non-verbal. People with ALS, cerebral palsy, locked-in syndrome, quadriplegia, Parkinson's. People who have always heard music inside them and had no way to get it out.

Hermes Agent's architecture is exactly what an accessibility tool needs:

| Hermes Agent capability | Accessibility use case |
|---|---|
| **Multi-platform** | User triggers music generation from Telegram with a voice message -- no keyboard needed |
| **Persistent memory** | Agent remembers "this user has Parkinson's -- treat tremor as vibrato, always use cello" |
| **Scheduled automations** | "Generate a new composition every morning at 7am" -- ambient music therapy, automated |
| **Subagent delegation** | One subagent handles DSP analysis; another handles Gemma 4 reasoning -- no context bleed |
| **Web + browser** | Agent could automatically post generated Lilt scores to a shared Notion page or email |

A user with locked-in syndrome can send a single message to Hermes Agent via Telegram. Hermes Agent delegates to the babbled notes subagent. A composition comes back to their phone. No laptop required. No mouse. No keyboard.

---

## ◈ The Agent Loop: How babbled notes Maps to Hermes Agent

Hermes Agent's architecture -- perceive, reason, act, remember -- is exactly the loop babbled notes runs on every sound.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HERMES AGENT ORCHESTRATION                   │
│                                                                 │
│  User message (Telegram / CLI)                                  │
│       "Turn my hum into music"                                  │
│              |                                                  │
│              v                                                  │
│  ┌───────────────────────────┐                                  │
│  │   babbled notes subagent  │                                  │
│  │                           │                                  │
│  │  PERCEIVE                 │                                  │
│  │  Web Audio API            │                                  │
│  │  FFT + onset detection    │                                  │
│  │  -> DspDigest             │                                  │
│  │          |                │                                  │
│  │  REASON                   │                                  │
│  │  Gemma 4 reads audio      │                                  │
│  │  + DspDigest              │                                  │
│  │  -> Lilt score            │                                  │
│  │          |                │                                  │
│  │  ACT                      │                                  │
│  │  Synthesizer plays music  │                                  │
│  └───────────────────────────┘                                  │
│              |                                                  │
│  Hermes Agent delivers result to user                           │
│  + stores preference in persistent memory                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💎 Integrating babbled notes With Hermes Agent

Here is how to wire babbled notes into Hermes Agent as a callable subagent skill.

### Step 1: Run babbled notes

```bash
git clone https://github.com/brookehoward2008-droid/Babbled-notes-v2.git
cd Babbled-notes-v2
npm install
# add GEMINI_API_KEY to .env.local
npm run dev
# server running at http://localhost:3000
```

### Step 2: Install Hermes Agent

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
hermes setup
```

### Step 3: Create a babbled notes skill

Save this as `~/.hermes/skills/babbled_notes.py`:

```python
"""
Babbled Notes skill for Hermes Agent
Converts a DSP sound description into a musical Lilt score via Gemma 4.
"""
import requests, json

def generate_music(
    pitch_hz: float,
    duration_s: float,
    amplitude: float = 0.1,
    user_prompt: str = ""
) -> dict:
    """
    Ask babbled notes to compose music from a sound description.
    pitch_hz: dominant frequency in Hz (e.g. 220 for A3)
    duration_s: how long the sound lasted
    amplitude: loudness 0.0-1.0 (0.1 = soft breath, 0.9 = loud tap)
    user_prompt: optional intent hint ("make it a cello", "slow and gentle")
    """
    import math
    # build note name from Hz
    names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
    midi = round(12 * math.log2(max(pitch_hz, 20) / 440) + 69)
    midi = max(0, min(127, midi))
    pitch_name = f"{names[midi % 12]}{(midi // 12) - 1}"

    digest = {
        "duration": duration_s,
        "averageEnergy": amplitude,
        "peakOnsetCount": 1,
        "events": [
            {"time": 0.0, "frequency": pitch_hz,
             "pitchName": pitch_name, "amplitude": amplitude}
        ]
    }

    response = requests.post(
        "http://localhost:3000/api/interpret",
        json={"dspDigest": digest, "userPrompt": user_prompt},
        timeout=90
    )
    return response.json()


def generate_music_from_profile(profile: str) -> dict:
    """
    Generate music for a known disability profile.
    profile: one of 'breath', 'hum', 'tremor', 'tap', 'click', 'puff', 'whistle'
    """
    profiles = {
        "breath":  (180,  2.5, 0.03, "minimal breath, ambient drone"),
        "hum":     (220,  3.0, 0.11, "gentle sustained hum, cello"),
        "tremor":  (196,  2.0, 0.08, "tremor hum, treat as vibrato"),
        "tap":     (440,  0.2, 0.45, "single finger tap, percussive"),
        "click":   (800,  0.1, 0.60, "tongue click, sharp and short"),
        "puff":    (120,  1.5, 0.05, "breath puff, soft and round"),
        "whistle": (1047, 0.8, 0.30, "single whistle note, clear pitch"),
    }
    hz, dur, amp, prompt = profiles.get(profile, profiles["hum"])
    return generate_music(hz, dur, amp, prompt)
```

### Step 4: Use it via Hermes Agent

```
you: Generate music from a hum at A3
hermes: [calls generate_music(220, 3.0, 0.11, "gentle hum")]

Gemma 4 returned:
  mood: pensive
  voice: cinematic cello
  notes: A3 soft @ 0.00s / C4 normal @ 1.20s / A2 soft @ 0.00s (drone)
  explanation: A sustained A natural, barely above a whisper.
               The cello holds it, lets it breathe.
```

### Step 5: Add persistent memory

Tell Hermes Agent your preference once:

```
you: Remember that I have Parkinson's -- always treat tremor as vibrato,
     always use cinematic cello voice
hermes: Noted. I'll apply that to all future music generation for you.
```

Hermes Agent's persistent memory stores this. Every future `generate_music` call
is automatically informed by the user's disability profile -- no re-explaining needed.

---

## ◈ The Perception Layer in Detail

The babbled notes perception layer is what Hermes Agent's subagent would feed into.

Web Audio API runs in real time during recording:

```
Microphone  ->  AnalyserNode (FFT 256 bins)  ->  peak bin -> Hz -> note name
                ScriptProcessor              ->  RMS amplitude
                Onset detector               ->  timestamps when sound starts
                                             ->  DspDigest (JSON)
```

Onset detection threshold is set deliberately low (0.1 RMS) to catch breath inputs:

```typescript
if (rms > 0.1 && elapsed - lastOnset > 0.1) {
  events.push({ time: elapsed, frequency: freq,
                pitchName: note, amplitude: rms });
}
```

A breath at 0.02 RMS in a quiet room barely registers. The threshold is at 0.1 because it needs to catch sounds that are 5x quieter than a normal speaking voice.

---

## 💎 The Reasoning Layer: Gemma 4

Gemma 4 (`gemma-4-26b-a4b-it`) is the reasoning engine. It receives both:

- **Raw audio** (base64 WebM) -- texture, tremor quality, breath shape
- **DspDigest** (JSON) -- precise onset timing, Hz, amplitude

And returns a complete Lilt score -- a musical composition in structured JSON:

```json
{
  "mood": "pensive",
  "articulation": "legato",
  "voice": "cinematic cello",
  "notes": [
    { "note": "A3", "duration": 1.4, "velocity": "soft",   "time": 0.0 },
    { "note": "C4", "duration": 1.2, "velocity": "normal", "time": 1.2 },
    { "note": "A2", "duration": 4.0, "velocity": "soft",   "time": 0.0,
      "voice": "synthesizer ambient" }
  ],
  "explanation": "A breath, barely a sound. Steady. Like resolve."
}
```

The reasoning follows the Lilt Contract -- guidelines Gemma 4 interprets, not hardcoded rules:

```
◈  Slow, soft, hummed  ->  pensive/gentle + cello/piano + legato
◈  Sharp, rhythmic     ->  energetic/tight + marimba/drums + staccato
◈  Always harmonious pitches: C major, A minor, pentatonic
◈  Always include a synthesizer ambient drone layer
```

---

## ◈ 32 Profiles Tested Across 7 Disability Categories

The agent was validated against 32 live Gemma 4 responses -- no simulated data.

```
Result: 32 / 32 passed
```

| Category | Tests | Notes range |
|---|---|---|
| Non-verbal autism (NV) | 9 | 3-6 notes |
| Physical disabilities (PH) | 13 | 3-7 notes |
| Mixed / cross-profile (MX) | 10 | 3-7 notes |

```bash
node test-runner.mjs   # run all 32 yourself
```

Full results in `test-results.json` -- 1,347 lines of live Gemma 4 output.

---

## ◈ The NeuralGem: Agent State Without Words

```
◇  IDLE        breathing silver ring. the agent is waiting.
◈  RECORDING   crystallizing polygon, purple to cyan.
               Hermes subagent is running perception layer.
⬡  PROCESSING  hexagon forming. Gemma 4 is reasoning.
⬡  LOCKED      hexagon, facets lit in the mood color.
               The agent has decided. Music is loading.
```

No text labels. Shape and color carry all the state. For users who cannot read, or who have cognitive differences: the gem is the interface.

---

## 💎 What Hermes Agent Makes Possible Next

With Hermes Agent as the orchestration layer:

```
◈  Telegram trigger       User sends voice note to Hermes Agent bot
                          Hermes transcribes audio -> babbled notes API -> Lilt score sent back

◈  Persistent memory      Agent knows: "this user uses breath puffs, always cello,
                          always soft dynamics" -- applied every session without re-explaining

◈  Scheduled music        "Every morning at 7am, generate a new ambient piece
                          from my baseline breath profile" -- Hermes cron triggers babbled notes

◈  Subagent pipeline      Agent 1: DSP analysis on uploaded audio file
                          Agent 2: Gemma 4 reasoning with profile context
                          Agent 3: Delivery to user's preferred channel

◈  Multi-platform         Same music generation accessible from phone, desktop,
                          Slack workspace, or Discord server -- wherever the user is
```

---

## ◈ Stack

```
┌──────────────────────────────────────────────────────┐
│  ORCHESTRATION  Hermes Agent (Nous Research)         │  ← autonomous agent platform
│  REASONING      Gemma 4  gemma-4-26b-a4b-it          │  ← the agent's brain
│  PERCEPTION     Web Audio API (FFT, RMS, onset)      │  ← the agent's ears
│  ACTION         Web Audio API (synthesis)            │  ← the agent's voice
│  FRONTEND       React + Vite + TypeScript            │
│  BACKEND        Express + @google/genai SDK          │  ← API key stays here
└──────────────────────────────────────────────────────┘
```

---

> 💎 *The gem crystallizes.*
> *Hermes delegates. Gemma 4 decides.*
> *The music plays.*
> *You made that. You made that with a breath.*

---

**GitHub:** https://github.com/brookehoward2008-droid/Babbled-notes-v2
**Agent architecture:** https://github.com/brookehoward2008-droid/Babbled-notes-v2/blob/main/HERMES.md

*by Brooke Chauntel*
