import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === "your_key_here") {
  console.warn(
    "WARNING: GEMINI_API_KEY not set in .env.local — running in local simulation mode."
  );
}

const ai = apiKey && apiKey !== "your_key_here"
  ? new GoogleGenAI({ apiKey })
  : null;

// ---------- helpers ----------

function idxToNote(idx: number, freq: number): string {
  if (freq > 40) {
    const pitches = ["C4", "D4", "E4", "G4", "A4", "C5", "E5"];
    return pitches[Math.floor(freq / 60) % pitches.length];
  }
  return ["C4", "E4", "G4", "C5", "A4", "E4", "D4"][idx % 7];
}

// ---------- /api/interpret ----------

app.post("/api/interpret", async (req, res): Promise<any> => {
  try {
    const { dspDigest, audioBase64, userPrompt } = req.body;

    // --- fallback when no API key ---
    if (!ai) {
      const voice =
        userPrompt?.toLowerCase().includes("cello") ? "cinematic cello" : "grand piano";
      const notes =
        dspDigest?.events?.length > 0
          ? dspDigest.events.map((e: any, i: number) => ({
              note: idxToNote(i, e.frequency),
              duration: 0.8,
              velocity: e.amplitude > 0.15 ? "accent" : "normal",
              time: e.time,
            }))
          : [
              { note: "C4", duration: 0.6, velocity: "normal", time: 0.0 },
              { note: "E4", duration: 0.6, velocity: "soft",   time: 0.5 },
              { note: "G4", duration: 0.6, velocity: "normal", time: 1.0 },
              { note: "C5", duration: 1.2, velocity: "accent", time: 1.5 },
            ];

      const droneNotes = [
        { note: "C3", duration: 3.5, velocity: "soft", time: 0.0, voice: "synthesizer ambient" },
      ];

      return res.json({
        mood: "warm nostalgic (local simulation)",
        articulation: "legato",
        voice,
        liltCode: notes
          .map((n: any) => `${n.note} ! ${n.velocity} @ ${n.time.toFixed(2)}s`)
          .join("\n"),
        notes: [...notes, ...droneNotes],
        explanation:
          "Running in local simulation mode — add your GEMINI_API_KEY to .env.local to enable real AI interpretation.",
      });
    }

    // --- real Gemini call ---
    const dspText = JSON.stringify(dspDigest, null, 2);

    const systemPrompt = `You are Lilt, a professional music producer and composer. Your job is to listen to a user's organic seed sound and translate it into musical instructions (the Lilt format).

You are given:
1. DSP Digest (pitch/onset analysis):
${dspText}

2. User intent: "${userPrompt || "Produce a beautiful, expressive response"}"

THE LILT CONTRACT:
- If the sound is slow, soft, or hummed: mood = "gentle" or "pensive", voice = "cinematic cello" or "grand piano", articulation = "legato"
- If the sound is sharp, rhythmic, or tapped: mood = "energetic" or "tight", voice = "marimba" or "drum kit", articulation = "staccato"
- Keep pitches harmonious (C major, A minor, or pentatonic)
- Timestamps must align with DSP onsets but feel musically polished
- Always include a second gentle drone note layer using "synthesizer ambient" voice

Output ONLY valid JSON matching the schema.`;

    const contents: any[] = [];
    if (audioBase64) {
      contents.push({
        inlineData: { mimeType: "audio/webm", data: audioBase64 },
      });
    }
    contents.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["mood", "articulation", "voice", "liltCode", "notes", "explanation"],
          properties: {
            mood: { type: Type.STRING },
            articulation: { type: Type.STRING },
            voice: { type: Type.STRING },
            liltCode: { type: Type.STRING },
            notes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["note", "duration", "velocity", "time"],
                properties: {
                  note:     { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  velocity: { type: Type.STRING },
                  time:     { type: Type.NUMBER },
                  voice:    { type: Type.STRING },
                },
              },
            },
            droneNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["note", "duration", "velocity", "time"],
                properties: {
                  note:     { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  velocity: { type: Type.STRING },
                  time:     { type: Type.NUMBER },
                },
              },
            },
            explanation: { type: Type.STRING },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");

    // Merge drone notes into main notes array with voice override
    const droneNotes = (parsed.droneNotes || []).map((n: any) => ({
      ...n,
      voice: "synthesizer ambient",
    }));
    parsed.notes = [...(parsed.notes || []), ...droneNotes];
    delete parsed.droneNotes;

    res.json(parsed);
  } catch (err: any) {
    console.error("Interpret error:", err);
    res.status(500).json({ error: "Interpretation failed.", details: err.message });
  }
});

// ---------- Vite dev server middleware ----------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\nbabbled notes v2 running at http://localhost:${PORT}\n`);
  });
}

startServer();
