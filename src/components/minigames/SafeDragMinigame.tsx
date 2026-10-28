import React, { useState, useRef, useCallback } from 'react';
import { Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface SafeDragMinigameProps {
  onComplete: () => void;
  onMissionNoise?: () => void;
}

interface Point {
  x: number;
  y: number;
}

// 6 Zigzag waypoints defining the safe conduit
const WAYPOINTS: Point[] = [
  { x: 45, y: 35 },   // Start (Top-Left)
  { x: 275, y: 35 },  // Top-Right
  { x: 45, y: 110 },  // Mid-Left
  { x: 275, y: 110 }, // Mid-Right
  { x: 45, y: 185 },  // Low-Left
  { x: 275, y: 185 }, // Goal Terminal (Low-Right)
];

// Helper: distance from point P to line segment AB
function distanceToSegment(p: Point, a: Point, b: Point): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * (b.x - a.x);
  const projY = a.y + t * (b.y - a.y);
  return Math.hypot(p.x - projX, p.y - projY);
}

export const SafeDragMinigame: React.FC<SafeDragMinigameProps> = ({
  onComplete,
  onMissionNoise,
}) => {
  const [orbPos, setOrbPos] = useState<Point>(WAYPOINTS[0]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [reachedIndex, setReachedIndex] = useState<number>(0);
  const [errorShake, setErrorShake] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const completedRef = useRef<boolean>(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const resetToStart = useCallback((msg: string) => {
    soundManager.playMissionSoftError();
    setErrorShake(true);
    setErrorMsg(msg);
    setOrbPos(WAYPOINTS[0]);
    setIsDragging(false);
    setReachedIndex(0);
    setTimeout(() => {
      setErrorShake(false);
    }, 500);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (completedRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 320;
    const py = ((e.clientY - rect.top) / rect.height) * 220;

    // Must tap near current orb to start dragging
    const distToOrb = Math.hypot(px - orbPos.x, py - orbPos.y);
    if (distToOrb < 40) {
      svg.setPointerCapture(e.pointerId);
      setIsDragging(true);
      setErrorMsg('');
      onMissionNoise?.();
      soundManager.playMissionButtonClick(1);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || completedRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 320;
    const py = ((e.clientY - rect.top) / rect.height) * 220;

    // Check distance to ALL segments up to next available segment for generous tolerance
    const currentPoint: Point = { x: px, y: py };
    let minDistance = Infinity;

    // Allow moving along any reached segment or the immediate next segment
    const maxSegment = Math.min(WAYPOINTS.length - 2, reachedIndex);
    for (let i = 0; i <= maxSegment; i++) {
      const d = distanceToSegment(currentPoint, WAYPOINTS[i], WAYPOINTS[i + 1]);
      if (d < minDistance) minDistance = d;
    }

    // Wide, permissive boundary tolerance: 36px half-width (72px full corridor)
    if (minDistance > 36) {
      resetToStart('¡Desconexión! Te saliste del canal seguro. Reintenta el trazo.');
      return;
    }

    setOrbPos(currentPoint);

    // Check if reached next waypoint
    const nextWaypoint = WAYPOINTS[reachedIndex + 1];
    if (nextWaypoint) {
      const distToNext = Math.hypot(px - nextWaypoint.x, py - nextWaypoint.y);
      if (distToNext < 34) {
        const nextIdx = reachedIndex + 1;
        setReachedIndex(nextIdx);
        soundManager.playMissionButtonClick((nextIdx % 4) + 1);

        // Reached destination goal terminal!
        if (nextIdx === WAYPOINTS.length - 1) {
          completedRef.current = true;
          setIsSuccess(true);
          setOrbPos(WAYPOINTS[WAYPOINTS.length - 1]);
          setIsDragging(false);
          soundManager.playTaskComplete();
          setTimeout(() => {
            onComplete();
          }, 800);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (svgRef.current?.hasPointerCapture(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
    if (isDragging && !completedRef.current) {
      setIsDragging(false);
    }
  };

  // Build SVG path string for the zigzag
  const pathD = WAYPOINTS.map((pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');

  return (
    <div className="space-y-4 my-2 select-none">
      <p className="text-xs text-slate-300 text-center leading-relaxed">
        Arrastra el haz de luz por el canal en zigzag hasta el terminal verde. El canal es amplio; ¡no te salgas de la pista!
      </p>

      {/* Interactive Conduit Box */}
      <div
        className={`relative p-2 bg-slate-950 rounded-2xl border-2 transition-all ${
          errorShake
            ? 'border-red-500 bg-red-950/20 animate-shake'
            : isSuccess
            ? 'border-emerald-500 shadow-emerald-500/30 shadow-lg'
            : 'border-slate-700 shadow-inner'
        }`}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 320 220"
          className="w-full h-56 touch-none cursor-grab active:cursor-grabbing rounded-xl bg-slate-900/80"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {/* Broad, Permissive Channel Outer Border (very generous 56px width) */}
          <path
            d={pathD}
            fill="none"
            stroke="#1e293b"
            strokeWidth="56"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Permissive Conduit Inner Channel (48px wide glow track) */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(6, 182, 212, 0.18)"
            strokeWidth="48"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Guideline */}
          <path
            d={pathD}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="4"
            strokeDasharray="6 6"
            strokeOpacity="0.45"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Waypoint Sockets */}
          {WAYPOINTS.map((wp, idx) => {
            const isTerminal = idx === WAYPOINTS.length - 1;
            const isPassed = idx <= reachedIndex;
            return (
              <g key={idx}>
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r={isTerminal ? 22 : 16}
                  fill={isTerminal ? (isSuccess ? '#10b981' : '#059669') : isPassed ? '#0284c7' : '#1e293b'}
                  stroke={isTerminal ? '#6ee7b7' : isPassed ? '#38bdf8' : '#475569'}
                  strokeWidth="2.5"
                  className={isTerminal ? 'animate-pulse' : ''}
                />
                <text
                  x={wp.x}
                  y={wp.y + 4}
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isTerminal ? 'META' : idx === 0 ? 'START' : idx}
                </text>
              </g>
            );
          })}

          {/* Draggable Light Orb with Aura */}
          <g transform={`translate(${orbPos.x}, ${orbPos.y})`}>
            {/* Outer pulsating aura */}
            <circle
              r="24"
              fill={isSuccess ? 'rgba(52, 211, 153, 0.35)' : 'rgba(56, 189, 248, 0.35)'}
              className={isDragging ? 'animate-ping' : ''}
            />
            {/* Inner Core Orb */}
            <circle
              r="15"
              fill={isSuccess ? '#34d399' : '#38bdf8'}
              stroke="#ffffff"
              strokeWidth="2.5"
              filter="drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.9))"
            />
            {/* Icon inside orb */}
            <Zap x="-6" y="-6" width="12" height="12" className="text-slate-950 pointer-events-none" />
          </g>
        </svg>

        {/* Start drag helper tooltip */}
        {!isDragging && !isSuccess && reachedIndex === 0 && (
          <div className="absolute top-16 left-6 pointer-events-none bg-cyan-950/90 text-cyan-200 text-[10px] font-tech px-2.5 py-1 rounded-lg border border-cyan-500/50 animate-bounce">
            Arrastra este punto aquí ➔
          </div>
        )}
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div className="flex items-center justify-center gap-2 text-xs font-tech font-bold text-red-400 bg-red-950/60 p-2 rounded-xl border border-red-500/50 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          {errorMsg}
        </div>
      )}

      {isSuccess && (
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          ¡CANAL DE DATOS ENRUTADO CON ÉXITO!
        </div>
      )}
    </div>
  );
};
