import { Mic, MicOff, Loader2 } from "lucide-react";

export type RecordState = "idle" | "recording" | "processing";

interface RecordButtonProps {
  state: RecordState;
  onClick: () => void;
}

export default function RecordButton({ state, onClick }: RecordButtonProps) {
  const isDisabled = state === "processing";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        disabled={isDisabled}
        aria-label={
          state === "recording"
            ? "Stop recording"
            : state === "processing"
            ? "Processing…"
            : "Start recording — make any sound"
        }
        className={[
          "relative w-24 h-24 rounded-full border-2 transition-all duration-300",
          "focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-[#0C0C0C]",
          "flex items-center justify-center",
          state === "idle"
            ? "border-slate-600 bg-slate-900 hover:border-neon-purple hover:bg-neon-purple/10 focus:ring-neon-purple cursor-pointer"
            : state === "recording"
            ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_40px_rgba(34,211,238,0.35)] cursor-pointer focus:ring-neon-cyan"
            : "border-slate-700 bg-slate-900 cursor-not-allowed opacity-60",
        ].join(" ")}
      >
        {state === "idle"      && <Mic      className="w-8 h-8 text-slate-400" />}
        {state === "recording" && <MicOff   className="w-8 h-8 text-neon-cyan" />}
        {state === "processing"&& <Loader2  className="w-8 h-8 text-slate-500 animate-spin" />}

        {state === "recording" && (
          <span className="absolute inset-0 rounded-full border-2 border-neon-cyan animate-ping opacity-30" />
        )}
      </button>

      <p className="text-xs font-mono text-center h-4">
        {state === "idle"       && <span className="text-slate-600">tap to record</span>}
        {state === "recording"  && <span className="text-neon-cyan">listening — tap to stop</span>}
        {state === "processing" && <span className="text-slate-500">translating…</span>}
      </p>
    </div>
  );
}
