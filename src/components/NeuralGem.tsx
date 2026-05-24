import { useRef, useEffect } from "react";

export type GemState = "idle" | "recording" | "locked";

interface NeuralGemProps {
  state: GemState;
  audioLevel: number; // 0–1
  moodColor?: string;
}

const SIZE = 288;

export default function NeuralGem({ state, audioLevel, moodColor }: NeuralGemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);
  const flashRef = useRef(0);
  const prevStateRef = useRef<GemState>("idle");
  const animRef = useRef(0);

  // Trigger flash when state transitions to locked
  useEffect(() => {
    if (state === "locked" && prevStateRef.current !== "locked") {
      flashRef.current = 1.0;
    }
    prevStateRef.current = state;
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const baseR = SIZE * 0.28;

    const draw = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);
      phaseRef.current += 0.012 + audioLevel * 0.03;

      if (state === "idle") {
        // Softly breathing ring
        const pulse = 1 + Math.sin(phaseRef.current * 0.7) * 0.06;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(180, 160, 255, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 14;
        ctx.shadowColor = "rgba(160, 130, 255, 0.4)";
        ctx.stroke();
        ctx.shadowBlur = 0;

        // small center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180, 160, 255, 0.4)";
        ctx.fill();

      } else if (state === "recording") {
        // Crystallizing polygon
        const sides = Math.max(3, Math.min(8, 3 + Math.floor(audioLevel * 6)));
        const variance = audioLevel * 0.22;
        const rot = phaseRef.current * (0.3 + audioLevel * 0.5);
        const hue = 260 + audioLevel * 100; // purple → cyan
        const color = `hsl(${hue}, 85%, 65%)`;

        // Inner radial glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR);
        grad.addColorStop(0, `hsla(${hue}, 85%, 65%, 0.14)`);
        grad.addColorStop(1, "transparent");

        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const angle = (i / sides) * Math.PI * 2 + rot;
          const r = baseR * (1 + Math.sin(phaseRef.current * 2 + i * 1.3) * variance);
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 + audioLevel * 2.5;
        ctx.shadowBlur = 18 + audioLevel * 28;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;

      } else {
        // Locked gem — flash then steady hexagon with facets
        if (flashRef.current > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flashRef.current * 0.55})`;
          ctx.fillRect(0, 0, SIZE, SIZE);
          flashRef.current = Math.max(0, flashRef.current - 0.045);
        }

        const lockedColor = moodColor ?? "#c084fc";
        const subtle = phaseRef.current * 0.15; // very slow subtle rotation

        // Facet lines
        ctx.strokeStyle = `${lockedColor}55`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 6;
        ctx.shadowColor = lockedColor;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 6 + subtle;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * baseR, cy + Math.sin(angle) * baseR);
          ctx.stroke();
        }

        // Outer hexagon
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 6 + subtle;
          const x = cx + Math.cos(angle) * baseR;
          const y = cy + Math.sin(angle) * baseR;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = lockedColor;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 30;
        ctx.shadowColor = lockedColor;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Center gem sparkle
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = lockedColor;
        ctx.shadowBlur = 12;
        ctx.shadowColor = lockedColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, audioLevel, moodColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE }}
      aria-hidden="true"
    />
  );
}
