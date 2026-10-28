import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface DodgeNanobotsMinigameProps {
  onComplete: () => void;
  onMissionNoise?: () => void;
}

interface Nanobot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const BOX_WIDTH = 320;
const BOX_HEIGHT = 220;
const CORE_RADIUS = 15;
const BOT_RADIUS = 9;

export const DodgeNanobotsMinigame: React.FC<DodgeNanobotsMinigameProps> = ({
  onComplete,
  onMissionNoise,
}) => {
  const [corePos, setCorePos] = useState<{ x: number; y: number }>({ x: 160, y: 110 });
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(5.0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [shake, setShake] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isHoldingRef = useRef<boolean>(false);
  const corePosRef = useRef<{ x: number; y: number }>({ x: 160, y: 110 });
  const completedRef = useRef<boolean>(false);
  const lastSecondTickRef = useRef<number>(5);

  const nanobotsRef = useRef<Nanobot[]>([
    { x: 40, y: 40, vx: 120, vy: 140, radius: BOT_RADIUS },
    { x: 280, y: 40, vx: -130, vy: 110, radius: BOT_RADIUS },
    { x: 40, y: 180, vx: 140, vy: -120, radius: BOT_RADIUS },
    { x: 280, y: 180, vx: -110, vy: -135, radius: BOT_RADIUS },
  ]);

  const resetNanobotsAway = () => {
    nanobotsRef.current = [
      { x: 35, y: 35, vx: 120, vy: 140, radius: BOT_RADIUS },
      { x: 285, y: 35, vx: -130, vy: 110, radius: BOT_RADIUS },
      { x: 35, y: 185, vx: 140, vy: -120, radius: BOT_RADIUS },
      { x: 285, y: 185, vx: -110, vy: -135, radius: BOT_RADIUS },
    ];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (completedRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * BOX_WIDTH;
    const py = ((e.clientY - rect.top) / rect.height) * BOX_HEIGHT;

    // Must click/touch within 35px of blue core
    const dist = Math.hypot(px - corePosRef.current.x, py - corePosRef.current.y);
    if (dist < 38) {
      el.setPointerCapture(e.pointerId);
      isHoldingRef.current = true;
      setIsHolding(true);
      setFeedbackMsg('');
      onMissionNoise?.();
      soundManager.playMissionButtonClick(0);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHoldingRef.current || completedRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = Math.max(CORE_RADIUS, Math.min(BOX_WIDTH - CORE_RADIUS, ((e.clientX - rect.left) / rect.width) * BOX_WIDTH));
    const py = Math.max(CORE_RADIUS, Math.min(BOX_HEIGHT - CORE_RADIUS, ((e.clientY - rect.top) / rect.height) * BOX_HEIGHT));

    corePosRef.current = { x: px, y: py };
    setCorePos({ x: px, y: py });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
    if (isHoldingRef.current && !completedRef.current) {
      isHoldingRef.current = false;
      setIsHolding(false);
      setTimeLeft(5.0);
      lastSecondTickRef.current = 5;
      soundManager.playMissionSoftError();
      setFeedbackMsg('¡Contacto perdido! Mantén pulsado el punto azul sin soltar.');
    }
  };

  // Game physics and collision animation loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (!completedRef.current) {
        // 1. Move bouncing nanobots
        for (const bot of nanobotsRef.current) {
          bot.x += bot.vx * dt;
          bot.y += bot.vy * dt;

          // Left / Right wall bounce
          if (bot.x - bot.radius <= 0) {
            bot.x = bot.radius;
            bot.vx = Math.abs(bot.vx);
          } else if (bot.x + bot.radius >= BOX_WIDTH) {
            bot.x = BOX_WIDTH - bot.radius;
            bot.vx = -Math.abs(bot.vx);
          }

          // Top / Bottom wall bounce
          if (bot.y - bot.radius <= 0) {
            bot.y = bot.radius;
            bot.vy = Math.abs(bot.vy);
          } else if (bot.y + bot.radius >= BOX_HEIGHT) {
            bot.y = BOX_HEIGHT - bot.radius;
            bot.vy = -Math.abs(bot.vy);
          }

          // 2. Collision check with Blue Player Core
          if (isHoldingRef.current) {
            const dist = Math.hypot(bot.x - corePosRef.current.x, bot.y - corePosRef.current.y);
            if (dist < CORE_RADIUS + BOT_RADIUS) {
              // Collision hit!
              soundManager.playMissionSoftError();
              setShake(true);
              setFeedbackMsg('¡Impacto de nanobot! Esquiva por 5 segundos continuos.');
              setTimeLeft(5.0);
              lastSecondTickRef.current = 5;
              resetNanobotsAway();
              setTimeout(() => setShake(false), 500);
              break;
            }
          }
        }

        // 3. Countdown timer while holding safely
        if (isHoldingRef.current) {
          setTimeLeft((prev) => {
            const next = Math.max(0, prev - dt);

            // Tick sound each second
            const currentFloor = Math.ceil(next);
            if (currentFloor < lastSecondTickRef.current) {
              soundManager.playTaskTick();
              lastSecondTickRef.current = currentFloor;
            }

            if (next <= 0 && !completedRef.current) {
              completedRef.current = true;
              setIsSuccess(true);
              soundManager.playTaskComplete();
              setTimeout(() => {
                onComplete();
              }, 800);
            }
            return next;
          });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [onComplete]);

  const progress = Math.min(100, Math.round(((5.0 - timeLeft) / 5.0) * 100));

  return (
    <div className="space-y-4 my-2 select-none">
      <p className="text-xs text-slate-300 text-center leading-relaxed">
        Mantén presionado el punto azul y muévelo para esquivar los nanobots rojos durante 5 segundos continuos sin soltar.
      </p>

      {/* Containment Chamber Box */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full h-56 bg-slate-950 rounded-2xl border-2 transition-all touch-none cursor-crosshair overflow-hidden shadow-inner ${
          shake
            ? 'border-red-500 bg-red-950/20 animate-shake'
            : isSuccess
            ? 'border-emerald-500 shadow-emerald-500/30 shadow-lg'
            : 'border-slate-700'
        }`}
        style={{ touchAction: 'none' }}
      >
        {/* SVG Visualization for crisp scaling */}
        <svg viewBox={`0 0 ${BOX_WIDTH} ${BOX_HEIGHT}`} className="w-full h-full pointer-events-none">
          {/* Subtle grid lines in containment field */}
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={BOX_WIDTH} height={BOX_HEIGHT} fill="url(#grid)" />

          {/* 4 Bouncing Red Nanobots */}
          {nanobotsRef.current.map((bot, idx) => (
            <g key={idx} transform={`translate(${bot.x}, ${bot.y})`}>
              {/* Outer pulsing glow */}
              <circle r={BOT_RADIUS + 4} fill="rgba(239, 68, 68, 0.25)" />
              {/* Red Nanobot Core */}
              <circle
                r={BOT_RADIUS}
                fill={isSuccess ? '#475569' : '#ef4444'}
                stroke="#fca5a5"
                strokeWidth="1.5"
                filter="drop-shadow(0px 0px 6px rgba(239, 68, 68, 0.8))"
              />
            </g>
          ))}

          {/* Blue Player Core */}
          <g transform={`translate(${corePos.x}, ${corePos.y})`}>
            {/* Pulsing Magnetic Aura */}
            <circle
              r={CORE_RADIUS + 6}
              fill={isSuccess ? 'rgba(52, 211, 153, 0.3)' : 'rgba(56, 189, 248, 0.3)'}
              className={isHolding ? 'animate-ping' : ''}
            />
            {/* Core Shield */}
            <circle
              r={CORE_RADIUS}
              fill={isSuccess ? '#10b981' : '#0284c7'}
              stroke="#ffffff"
              strokeWidth="2.5"
              filter="drop-shadow(0px 0px 8px rgba(56, 189, 248, 0.9))"
            />
            {/* Mini core icon */}
            <Shield x="-6" y="-6" width="12" height="12" className="text-white" />
          </g>
        </svg>

        {/* Start Helper Indicator */}
        {!isHolding && !isSuccess && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-tech font-bold text-cyan-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-cyan-500/50 animate-bounce">
              🔵 TOCA Y MANTÉN PULSADO AQUÍ
            </span>
          </div>
        )}
      </div>

      {/* Timer & Survival Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-tech">
          <span className="text-slate-400">TIEMPO DE CONTENCIÓN</span>
          <span className={`font-bold ${isSuccess ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {timeLeft.toFixed(1)}s / 5.0s
          </span>
        </div>

        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              isSuccess ? 'bg-emerald-400 shadow-emerald-400/80 shadow-md' : 'bg-cyan-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {feedbackMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-tech font-bold text-red-400 bg-red-950/60 p-2 rounded-xl border border-red-500/50 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            {feedbackMsg}
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce pt-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ¡NANOBOTS AISLADOS Y EN STASIS (5.0s)!
          </div>
        )}
      </div>
    </div>
  );
};
