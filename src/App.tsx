import { useState, useRef, useCallback } from "react";
import { LiltAudioEngine } from "./lib/audioEngine";
import { DspAnalyzer } from "./lib/dspAnalyzer";
import { generateLocalSong } from "./lib/localInterpreter";
import { LiltSong } from "./types";
import NeuralGem from "./components/NeuralGem";
import RecordButton from "./components/RecordButton";
import LiltPlayerView from "./components/LiltPlayerView";

type AppState = "idle" | "recording" | "processing" | "playing";

const MOOD_COLORS: [string, string][] = [
  ["melancholy", "#E0B0FF"],
  ["pensive",    "#E0B0FF"],
  ["gentle",     "#E0B0FF"],
  ["bright",     "#00FFD1"],
  ["playful",    "#00FFD1"],
  ["energetic",  "#FFD700"],
  ["anthemic",   "#FFD700"],
  ["urgent",     "#FFD700"],
  ["intimate",   "#FF69B4"],
  ["warm",       "#FF69B4"],
];

function moodToColor(mood: string): string {
  const lower = mood.toLowerCase();
  for (const [key, color] of MOOD_COLORS) {
    if (lower.includes(key)) return color;
  }
  return "#c084fc";
}

// module-level singletons — no re-init on re-render
const audioEngine = new LiltAudioEngine();
const dspAnalyzer = new DspAnalyzer();

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [song, setSong] = useState<LiltSong | null>(null);
  const [error, setError] = useState<string | null>(null);
  const levelRef = useRef(0);

  const handleRecord = useCallback(async () => {
    if (appState === "idle") {
      setError(null);
      setAppState("recording");
      try {
        await dspAnalyzer.startRecording((level) => {
          levelRef.current = level;
          setAudioLevel(level);
        });
      } catch {
        setError("Microphone access denied. Allow mic permission and try again.");
        setAppState("idle");
      }
      return;
    }

    if (appState === "recording") {
      setAppState("processing");
      setAudioLevel(0);
      try {
        const { digest, audioBase64 } = await dspAnalyzer.stopRecording();

        let data: LiltSong;
        try {
          const res = await fetch("/api/interpret", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dspDigest: digest, audioBase64, userPrompt: "" }),
          });

          if (!res.ok) throw new Error(`Server error ${res.status}`);
          data = await res.json();
        } catch {
          data = generateLocalSong(digest);
        }

        setSong(data);
        setAppState("playing");
      } catch (e: any) {
        setError(e.message || "Something went wrong. Try again.");
        setAppState("idle");
      }
    }
  }, [appState]);

  const handleSongChange = useCallback((updated: LiltSong) => {
    setSong(updated);
  }, []);

  const handleReset = useCallback(() => {
    audioEngine.stopPlaying();
    setSong(null);
    setAppState("idle");
    setError(null);
    setAudioLevel(0);
  }, []);

  const gemState =
    appState === "recording" ? "recording" : appState === "idle" ? "idle" : "locked";

  const moodColor = song ? moodToColor(song.mood) : undefined;

  const recordBtnState =
    appState === "recording"  ? "recording"  :
    appState === "processing" ? "processing" : "idle";

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-slate-100 flex flex-col select-none">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-900/80">
        <div>
          <h1 className="font-mono font-bold tracking-tight text-slate-200">
            babbled notes
            <span className="ml-2 text-xs text-slate-600 font-normal">v2</span>
          </h1>
        </div>
        {appState === "playing" && (
          <button
            onClick={handleReset}
            className="text-xs font-mono text-slate-500 hover:text-neon-cyan transition-colors"
          >
            new seed
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-10 gap-10">

        {/* Gem + record controls */}
        <div className="flex flex-col items-center gap-8">
          <NeuralGem state={gemState} audioLevel={audioLevel} moodColor={moodColor} />

          {appState !== "playing" && (
            <RecordButton state={recordBtnState} onClick={handleRecord} />
          )}

          {appState === "idle" && !error && (
            <p className="text-xs font-mono text-slate-600 text-center max-w-xs leading-relaxed">
              hum, tap, whistle, breathe — any sound
            </p>
          )}

          {error && (
            <p className="text-xs font-mono text-rose-400 text-center max-w-xs">{error}</p>
          )}

          {appState === "processing" && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-mono text-slate-500 animate-pulse">
                gemma is reading your sound…
              </p>
              <p className="text-xs font-mono text-slate-700">
                (may take 30–60 seconds)
              </p>
            </div>
          )}
        </div>

        {/* Mood label after result */}
        {appState === "playing" && song && (
          <div className="text-center">
            <p className="text-xs font-mono text-slate-600">
              mood detected:{" "}
              <span style={{ color: moodColor }} className="font-semibold">
                {song.mood}
              </span>
            </p>
          </div>
        )}

        {/* Lilt player */}
        {appState === "playing" && song && (
          <div className="w-full max-w-4xl">
            <LiltPlayerView
              song={song}
              audioEngine={audioEngine}
              onSongChange={handleSongChange}
            />
          </div>
        )}

      </main>
    </div>
  );
}
