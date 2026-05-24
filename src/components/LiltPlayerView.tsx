import React, { useRef, useEffect, useState } from "react";
import { LiltNote, LiltSong } from "../types";
import { LiltAudioEngine } from "../lib/audioEngine";
import { Play, Pause, RefreshCw, Send, Music, Edit2, Terminal, AlertCircle, FileAudio, CheckCircle } from "lucide-react";

interface MatchNote {
  note: string;
  duration: number;
  velocity: "soft" | "normal" | "accent";
  time: number;
}

interface LiltPlayerViewProps {
  song: LiltSong;
  audioEngine: LiltAudioEngine;
  onSongChange: (updatedSong: LiltSong & { songDuration?: number }) => void;
}

export default function LiltPlayerView({ song, audioEngine, onSongChange }: LiltPlayerViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liltText, setLiltText] = useState(song.liltCode);
  const [parseError, setParseError] = useState<string | null>(null);
  const [editedNotes, setEditedNotes] = useState<LiltNote[]>(song.notes);
  const [selectedVoice, setSelectedVoice] = useState(song.voice);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);
  
  // Track visual particles
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; alpha: number; size: number }[]>([]);

  // Update editor text when code changes from props
  useEffect(() => {
    setLiltText(song.liltCode);
    setEditedNotes(song.notes);
    setSelectedVoice(song.voice);
    setParseError(null);
  }, [song]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      audioEngine.stopPlaying();
      setIsPlaying(false);
      setActiveNoteIndex(null);
    } else {
      const duration = calculateSongDuration(editedNotes);
      audioEngine.startSchedulingPlay(editedNotes, selectedVoice, duration, (noteIdx) => {
        setActiveNoteIndex(noteIdx);
        triggerImpactParticles(noteIdx);
      });
      setIsPlaying(true);
    }
  };

  // Safe release on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopPlaying();
    };
  }, []);

  const calculateSongDuration = (notes: LiltNote[]): number => {
    if (notes.length === 0) return 4.0;
    const maxTime = Math.max(...notes.map(n => n.time + n.duration));
    return Math.max(4.0, maxTime + 0.5); // Pad slightly
  };

  // Compile manual Lilt Code entry
  const compileLiltCode = () => {
    try {
      setParseError(null);
      const lines = liltText.split("\n");
      const parsedNotes: LiltNote[] = [];
      
      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//")) return; // ignore comments or blanks
        
        // Match C4 ! soft @ 0.50
        // Match G#3 ! accent @ 2.45
        // Match BD ! normal @ 1.2
        const regex = /^([A-G]#?\d+|D[b-b]?\d+|E[b-b]?\d+|G[b-b]?\d+|A[b-b]?\d+|B[b-b]?\d+|BD|SD|HH|CY)\s*!\s*(soft|normal|accent)\s*@\s*([\d\.]+)/i;
        const matches = trimmed.match(regex);
        
        if (matches) {
          const noteStr = matches[1].toUpperCase();
          const velocityStr = matches[2].toLowerCase() as "soft" | "normal" | "accent";
          const timestamp = parseFloat(matches[3]);
          
          parsedNotes.push({
            note: noteStr,
            duration: noteStr === "BD" || noteStr === "SD" || noteStr === "HH" ? 0.25 : 0.8,
            velocity: velocityStr,
            time: timestamp
          });
        } else {
          throw new Error(`Parse error on line ${idx + 1}: "${trimmed}". Must follow syntax "Note ! velocity @ time" (e.g. "C4 ! normal @ 0.5")`);
        }
      });

      if (parsedNotes.length === 0) {
        throw new Error("No musical instructions found. Add at least one trigger command.");
      }

      const songDuration = calculateSongDuration(parsedNotes);
      const updatedSong = {
        ...song,
        notes: parsedNotes,
        liltCode: liltText,
        voice: selectedVoice,
        songDuration
      };

      onSongChange(updatedSong);
      setEditedNotes(parsedNotes);
      
      // If playing actively, hot refresh the schedule
      if (isPlaying) {
        audioEngine.startSchedulingPlay(parsedNotes, selectedVoice, songDuration, (noteIdx) => {
          setActiveNoteIndex(noteIdx);
          triggerImpactParticles(noteIdx);
        });
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to compile .lilt syntax.");
    }
  };

  // Dynamic voice override trigger
  const handleVoiceOverride = (newVoice: string) => {
    setSelectedVoice(newVoice);
    const songDuration = calculateSongDuration(editedNotes);
    
    const updated = {
      ...song,
      voice: newVoice,
      notes: editedNotes
    };
    onSongChange(updated);

    if (isPlaying) {
      audioEngine.startSchedulingPlay(editedNotes, newVoice, songDuration, (noteIdx) => {
        setActiveNoteIndex(noteIdx);
        triggerImpactParticles(noteIdx);
      });
    }
  };

  // Visual particles splash generator
  const triggerImpactParticles = (noteIdx: number) => {
    const note = editedNotes[noteIdx];
    if (!note || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const duration = calculateSongDuration(editedNotes);
    const pct = note.time / duration;
    
    // Get note vertical offset matching canvas drawing height
    const uniqueNotesSorted = Array.from(new Set(editedNotes.map(n => n.note)))
      .sort((a,b) => audioEngine.noteToFreq(a) - audioEngine.noteToFreq(b));
    let noteYProgress = 0.5;
    if (uniqueNotesSorted.length > 0) {
      const nIdx = uniqueNotesSorted.indexOf(note.note);
      noteYProgress = 1.0 - ((nIdx + 1.2) / (uniqueNotesSorted.length + 1.5));
    }
    
    const xPos = pct * (canvas.width - 120) + 60;
    const yPos = noteYProgress * (canvas.height - 60) + 30;
    
    // Create random colorful particles bursting outward
    const color = note.velocity === "accent" ? "#22d3ee" : note.velocity === "normal" ? "#c084fc" : "#f472b6";
    const particleCount = note.velocity === "accent" ? 22 : 12;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      particlesRef.current.push({
        x: xPos,
        y: yPos,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: Math.random() * 5 + 2
      });
    }
  };

  // Complete HTML Canvas loop driving visual music roll
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI retina canvas scaling
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container && canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = container.clientWidth * dpr;
        canvas.height = Math.max(220, container.clientHeight) * dpr;
        canvas.style.width = `${container.clientWidth}px`;
        canvas.style.height = `${Math.max(220, container.clientHeight)}px`;
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      
      // Clear with very deep cosmic fade background
      ctx.fillStyle = "#0c111d";
      ctx.fillRect(0, 0, w, h);
      
      // Draw grid lines
      ctx.strokeStyle = "rgba(42, 55, 74, 0.45)";
      ctx.lineWidth = 1;
      const gridVerticalDivisions = 6;
      for (let i = 0; i <= gridVerticalDivisions; i++) {
        const y = (i / gridVerticalDivisions) * (h - 60) + 30;
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(w - 60, y);
        ctx.stroke();
      }

      // Draw horizontal dividing time lines
      const totalSec = calculateSongDuration(editedNotes);
      const gridTimeSteps = Math.ceil(totalSec);
      ctx.strokeStyle = "rgba(26, 35, 51, 0.9)";
      ctx.fillStyle = "rgba(112, 128, 144, 0.8)";
      ctx.font = "10px 'JetBrains Mono'";
      
      for (let i = 0; i <= gridTimeSteps; i++) {
        const tPct = i / totalSec;
        const x = tPct * (w - 120) + 60;
        
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, h - 25);
        ctx.stroke();
        
        // Draw time stamps
        ctx.fillText(`${i.toFixed(1)}s`, x - 12, h - 8);
      }

      // Map distinct notes to coordinates
      const uniqueNotes = Array.from(new Set(editedNotes.map(n => n.note)))
        .sort((a,b) => audioEngine.noteToFreq(a) - audioEngine.noteToFreq(b));

      // Draw note elements
      editedNotes.forEach((note, index) => {
        const noteIdx = uniqueNotes.indexOf(note.note);
        let noteYProgress = 0.5;
        if (uniqueNotes.length > 0) {
          noteYProgress = 1.0 - ((noteIdx + 1.2) / (uniqueNotes.length + 1.5));
        }

        const xStart = (note.time / totalSec) * (w - 120) + 60;
        const width = (note.duration / totalSec) * (w - 120);
        const yCenter = noteYProgress * (h - 60) + 30;
        const height = 18;

        const isActive = activeNoteIndex === index && isPlaying;

        // Choose color palette based on velocity or accentuation
        let colorTheme = { border: "#f472b6", fill: "rgba(244, 114, 182, 0.15)", glow: "rgba(244, 114, 182, 0.25)" };
        if (note.velocity === "accent") {
          colorTheme = { border: "#22d3ee", fill: "rgba(34, 211, 238, 0.2)", glow: "rgba(34, 211, 238, 0.4)" };
        } else if (note.velocity === "normal") {
          colorTheme = { border: "#c084fc", fill: "rgba(192, 132, 252, 0.2)", glow: "rgba(192, 132, 252, 0.45)" };
        }

        if (isActive) {
          colorTheme.fill = colorTheme.border;
          colorTheme.glow = "rgba(255, 255, 255, 0.65)";
        }

        // Draw glowing background under active note
        ctx.shadowBlur = isActive ? 15 : 4;
        ctx.shadowColor = colorTheme.border;
        ctx.strokeStyle = colorTheme.border;
        ctx.fillStyle = colorTheme.fill;
        ctx.lineWidth = isActive ? 2.5 : 1.5;

        // Draw note capsule rounded rectangle
        ctx.beginPath();
        ctx.roundRect(xStart, yCenter - height / 2, Math.max(16, width), height, 6);
        ctx.fill();
        ctx.stroke();
        
        // Reset shadows to keep performance optimal
        ctx.shadowBlur = 0;

        // Pitch label overlay inside capsules
        ctx.fillStyle = isActive ? "#0a0e17" : "#e2e8f0";
        ctx.font = "9px 'JetBrains Mono'";
        ctx.fillText(note.note, xStart + 5, yCenter + 3);
      });

      // Update and draw live sparkling particles
      particlesRef.current.forEach((p, pIdx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // subtle downward gravity
        p.alpha -= 0.035; // fade out
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Filter out dead particles
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);

      // Draw running playhead cursor
      if (isPlaying) {
        const normTime = audioEngine.getPlayheadNormalized();
        const cursorX = normTime * (w - 120) + 60;

        // Glow stream line
        ctx.strokeStyle = "#22d3ee";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#22d3ee";
        ctx.lineWidth = 2.5;
        
        ctx.beginPath();
        ctx.moveTo(cursorX, 15);
        ctx.lineTo(cursorX, h - 20);
        ctx.stroke();
        
        ctx.shadowBlur = 0;

        // Draw tracker tooltip icon
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath();
        ctx.arc(cursorX, 15, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [editedNotes, isPlaying, activeNoteIndex, audioEngine]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-slate-700">
      
      {/* Top Header Panel */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap justify-between items-center gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-neon-purple/25 text-neon-purple/90 border border-neon-purple/40">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg text-slate-100 font-medium">Gemma 4 Synthesis Canvas</h3>
            <p className="text-xs text-slate-400 max-w-md font-sans">
              Active voice: <span className="font-semibold text-neon-cyan">{song.voice}</span> • Mood signature: <span className="italic text-slate-300">{song.mood}</span>
            </p>
          </div>
        </div>

        {/* Playback & Controls Header block */}
        <div className="flex items-center gap-3">
          
          {/* Custom voice switcher override */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono pl-1">Voice:</span>
            <select 
              value={selectedVoice} 
              onChange={(e) => handleVoiceOverride(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none focus:ring-0 text-xs px-1 select-none font-mono cursor-pointer hover:text-white"
            >
              <option value="grand piano">Grand Piano</option>
              <option value="cinematic cello">Cinematic Cello</option>
              <option value="marimba">Marimba</option>
              <option value="synthesizer ambient">Space Pad Synth</option>
              <option value="drum kit">Drum Kit</option>
            </select>
          </div>

          <button
            onClick={togglePlay}
            className={`cursor-pointer px-4 py-2 rounded-lg font-mono text-xs flex items-center gap-2 transition-all font-semibold ${
              isPlaying 
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                : "bg-neon-cyan hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.35)]"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Stop Live Track
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Play Lilt Sequence
              </>
            )}
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* Interactive Interactive Visual Rolling Board (Left side) */}
        <div className="lg:col-span-8 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/40">
          
          <div className="mb-4">
            <span className="text-[10px] font-mono uppercase bg-slate-800/80 text-teal-400 px-2.5 py-1.5 rounded border border-slate-700/80 inline-block mb-3 leading-none">
              Gemma 4 Poetic Translation
            </span>
            <p className="text-slate-300 text-sm leading-relaxed italic border-l-2 border-neon-cyan/80 pl-4 py-1 font-sans">
              "{song.explanation}"
            </p>
          </div>

          <div ref={containerRef} className="w-full relative min-h-[220px] bg-slate-950 rounded-xl border border-slate-800/70 py-1 shadow-inner overflow-hidden">
            <canvas ref={canvasRef} className="block w-full h-[220px]" />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-[11px] font-mono text-slate-400/90 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-neon-cyan inline-block shadow-sm"></span>
              <span>Accent Node</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-neon-purple inline-block shadow-sm"></span>
              <span>Normal Dynamic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-neon-pink inline-block shadow-sm"></span>
              <span>Soft Transition</span>
            </div>
            <div className="ml-auto text-slate-500">
              Total Duration: {calculateSongDuration(editedNotes).toFixed(1)}s • Loop Mode active
            </div>
          </div>

        </div>

        {/* Lilt Script Text compiler (Right side) */}
        <div className="lg:col-span-4 p-6 bg-slate-900/60 flex flex-col justify-between min-h-[360px]">
          
          <div className="flex-1 flex flex-col justify-start">
            
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-slate-200">
                <Terminal className="w-4 h-4 text-neon-purple" />
                <span className="text-xs font-mono font-bold tracking-tight">Active .lilt Script Editor</span>
              </div>
              
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-pulse"></span>
                <span>Synthesizer Ready</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400/90 leading-normal font-sans mb-3">
              Gemma 4 compiles code following a strict musical timeline structure. Customize strings below then re-trigger the synthesizer.
            </p>

            <div className="relative flex-1 min-h-[190px] flex flex-col">
              <textarea
                value={liltText}
                onChange={(e) => setLiltText(e.target.value)}
                spellCheck="false"
                className="w-full h-full min-h-[190px] flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 outline-none focus:border-neon-purple transition-all leading-relaxed resize-none shadow-md"
              />
              
              {parseError && (
                <div className="absolute left-1.5 right-1.5 bottom-1.5 p-2 bg-rose-500/10 border border-rose-500/20 rounded-md text-[10.5px] text-rose-300 font-mono leading-relaxed flex items-start gap-1.5 shadow-md">
                  <AlertCircle className="w-3.5 h-3.5 flex-none mt-0.5 text-rose-400" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>

          </div>

          <div className="pt-4 mt-auto">
            <button
              onClick={compileLiltCode}
              className="cursor-pointer w-full bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-mono text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition hover:text-white"
            >
              <RefreshCw className="w-4 h-4 text-neon-cyan" /> 
              Sync & Compile Lilt Code
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
