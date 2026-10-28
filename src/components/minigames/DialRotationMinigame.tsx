import React, { useState, useRef, useCallback } from 'react';
import { CheckCircle2, RotateCw, Radio, Sparkles } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface DialRotationMinigameProps {
  onComplete: () => void;
  onMissionNoise?: () => void;
}

const RINGS_DEF = [
  { id: 0, name: 'Exterior', radius: 98, color: '#06b6d4' },
  { id: 1, name: 'Medio', radius: 72, color: '#3b82f6' },
  { id: 2, name: 'Interior', radius: 46, color: '#8b5cf6' },
];

export const DialRotationMinigame: React.FC<DialRotationMinigameProps> = ({
  onComplete,
  onMissionNoise,
}) => {
  // Initial scrambled angles (in degrees, target is 0° at 12 o'clock)
  const [angles, setAngles] = useState<number[]>([115, 235, 310]);
  const [activeRing, setActiveRing] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const completedRef = useRef<boolean>(false);

  // Checks if an angle is aligned with the top notch (0° or 360°) within tolerance
  const isRingAligned = useCallback((angle: number) => {
    const normalized = ((angle % 360) + 360) % 360;
    return normalized <= 10 || normalized >= 350;
  }, []);

  const alignedCount = angles.filter(isRingAligned).length;

  const updateAngle = useCallback((ringIdx: number, newAngle: number) => {
    if (completedRef.current) return;
    let normalized = ((newAngle % 360) + 360) % 360;

    // Magnetic snap within 10 degrees of 0°
    if (normalized <= 10 || normalized >= 350) {
      normalized = 0;
    }

    setAngles((prev) => {
      const next = [...prev];
      const wasAligned = isRingAligned(prev[ringIdx]);
      next[ringIdx] = normalized;

      const isNowAligned = isRingAligned(normalized);
      if (!wasAligned && isNowAligned) {
        soundManager.playMissionButtonClick(ringIdx);
        onMissionNoise?.();
      }

      // Check if all 3 are aligned!
      if (next.every(isRingAligned) && !completedRef.current) {
        completedRef.current = true;
        setIsSuccess(true);
        soundManager.playTaskComplete();
        setTimeout(() => {
          onComplete();
        }, 800);
      }

      return next;
    });
  }, [isRingAligned, onComplete, onMissionNoise]);

  const rotateActiveRingBy = (delta: number) => {
    updateAngle(activeRing, angles[activeRing] + delta);
    soundManager.playTaskTick();
  };

  // Direct touch/drag rotation on the dial
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (completedRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    calculateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || completedRef.current) return;
    calculateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isDraggingRef.current = false;
  };

  const calculateAngleFromPointer = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    // Determine angle where top (0, -1) is 0 degrees
    let rad = Math.atan2(dx, -dy);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    // Detect which ring was clicked based on distance from center
    const dist = Math.hypot(dx, dy);
    let targetIdx = activeRing;
    if (dist > 85) targetIdx = 0;
    else if (dist > 58) targetIdx = 1;
    else if (dist > 25) targetIdx = 2;

    setActiveRing(targetIdx);
    updateAngle(targetIdx, deg);
  };

  return (
    <div className="space-y-4 my-2 select-none">
      <p className="text-xs text-slate-300 text-center leading-relaxed">
        Gira los 3 anillos concéntricos con el dedo o los controles hasta alinear las 3 muescas con el láser superior.
      </p>

      {/* Dial Visual Area */}
      <div className="flex flex-col items-center justify-center p-3 bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-inner">
        {/* Top Target Alignment Laser */}
        <div className="flex flex-col items-center mb-1">
          <div className="flex items-center gap-1 text-[10px] font-tech font-bold text-emerald-400 uppercase tracking-wider">
            ▼ MUESCA DE ENLACE SATELITAL
          </div>
          <div className="w-1.5 h-3 bg-emerald-400 rounded-full animate-pulse shadow-emerald-400 shadow-sm" />
        </div>

        {/* Concentric Rotating Rings Container */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-56 h-56 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          {/* Laser beam line when aligned */}
          {alignedCount === 3 && (
            <div className="absolute top-0 bottom-1/2 w-1 bg-emerald-400 shadow-lg shadow-emerald-400 z-20 animate-pulse pointer-events-none" />
          )}

          {/* Center core receiver */}
          <div className="absolute w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center z-10 shadow-md">
            <Radio className={`w-5 h-5 ${isSuccess ? 'text-emerald-400 animate-spin' : 'text-cyan-400'}`} />
          </div>

          {/* Render 3 Concentric Rings */}
          {RINGS_DEF.map((ringDef) => {
            const angle = angles[ringDef.id];
            const aligned = isRingAligned(angle);
            const isSelected = activeRing === ringDef.id;

            return (
              <div
                key={ringDef.id}
                className="absolute rounded-full pointer-events-none transition-transform duration-75"
                style={{
                  width: `${ringDef.radius * 2}px`,
                  height: `${ringDef.radius * 2}px`,
                  transform: `rotate(${angle}deg)`,
                }}
              >
                {/* Ring Border Track */}
                <div
                  className={`w-full h-full rounded-full border-2 border-dashed ${
                    aligned
                      ? 'border-emerald-400/80 shadow-emerald-400/30 shadow-md'
                      : isSelected
                      ? 'border-cyan-400'
                      : 'border-slate-700'
                  }`}
                />

                {/* Ring Alignment Notch Indicator (At 12 o'clock of this ring) */}
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center ${
                    aligned
                      ? 'w-5 h-5 bg-emerald-400 border-white shadow-emerald-400 shadow-md scale-110'
                      : isSelected
                      ? 'w-4 h-4 bg-cyan-400 border-white shadow-cyan-400 shadow-sm'
                      : 'w-3.5 h-3.5 bg-slate-800 border-slate-500'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Ring Selector Tabs & Step Rotators */}
        <div className="w-full mt-3 space-y-2">
          {/* Ring Selector Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {RINGS_DEF.map((r) => {
              const aligned = isRingAligned(angles[r.id]);
              const isSelected = activeRing === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setActiveRing(r.id);
                    soundManager.playMissionButtonClick(r.id);
                  }}
                  className={`py-1.5 px-2 rounded-xl border text-[11px] font-tech font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {aligned && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Step Buttons for precision turning */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => rotateActiveRingBy(-30)}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-tech font-bold active:scale-95 transition-all cursor-pointer"
            >
              ⟲ -30°
            </button>
            <button
              type="button"
              onClick={() => rotateActiveRingBy(30)}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-tech font-bold active:scale-95 transition-all cursor-pointer"
            >
              ⟳ +30°
            </button>
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      <div className="text-center">
        {isSuccess ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ¡ANTENA SUBESPACIAL SINCRONIZADA AL 100%!
          </div>
        ) : (
          <div className="text-xs font-tech text-slate-400">
            ANILLOS ALINEADOS: <span className="font-bold text-cyan-400">{alignedCount} / 3</span>
          </div>
        )}
      </div>
    </div>
  );
};
