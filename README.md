<div align="center">
<img width="1200" height="475" alt="babbled notes" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# babbled notes

Make any sound. Hum, tap, whistle, breathe into your mic.

babbled notes listens. It finds the music hiding in that sound, translates it into a Lilt score using Gemini 2.0 Flash, and plays it back as piano, cello, marimba, or drums -- something you actually want to hear.

No music theory required. No keyboard. No pitch-perfect voice. Just a sound.

Built for anyone who has ever felt shut out of making music.

---

## What it does

1. **Record** -- tap the orb, make a sound, tap again to stop
2. **Translate** -- Gemini 2.0 Flash reads the audio and DSP data, writes a Lilt score
3. **Play** -- the audio engine renders it using synthesized instruments

The Lilt score appears as an editable piano roll. You can change the voice, tweak the code, and re-render without re-recording.

---

## Run locally

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

No API key? It still runs -- falls back to a local simulation so you can see the UI working immediately.

---

## Stack

- **Gemini 2.0 Flash** -- multimodal audio interpretation, structured Lilt JSON output
- **Web Audio API** -- mic capture, real-time DSP analysis, synthesized instrument playback
- **React + Vite + TypeScript** -- frontend
- **Express + @google/genai SDK** -- backend, keeps the API key server-side

---

## What changed from v1

- Real microphone recording with live DSP feedback
- Neural Gem visualizer -- ring transforms into a crystallizing gem as you record
- Multi-voice output -- melody layer plus a drone pad underneath
- Model updated to gemini-2.0-flash
- App actually runs end to end

---

*by Brooke Chauntel*
