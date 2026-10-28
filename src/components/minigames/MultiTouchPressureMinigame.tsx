import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, Gauge, AlertCircle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface MultiTouchPressureMinigameProps {
  onComplete: () => void;
  onMissionNoise?: () => void;
}

export const MultiTouchPressureMinigame: React.FC<MultiTouchPressureMinigameProps> = ({
  onComplete,
  onMissionNoise,
}) => {
  // Slider values from 0 (bottom) to 100 (top)
  const [sliderA, setSliderA] = useState<number>(20);
  const [sliderB, setSliderB] = useState<number>(20);
  const [stabilizedTime, setStabilizedTime] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const pointerTrackA = useRef<number | null>(null);
  const pointerTrackB = useRef<number | null>(null);
  const trackRefA = useRef<HTMLDivElement>(null);
  const trackRefB = useRef<HTMLDivElement>(null);
  const completedRef = useRef<boolean>(false);
  const lastTickTimeRef = useRef<number>(0);

  // Safe optimal pressure zone: 38% to 62%
  const isAInZone = sliderA >= 38 && sliderA <= 62;
  const isBInZone = sliderB >= 38 && sliderB <= 62;
  const isBothInZone = isAInZone && isBInZone;

  // Pointer drag handler for Column A
  const handlePointerDownA = (e: React.PointerEvent<HTMLDivElement>) => {
    if (completedRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerTrackA.current = e.pointerId;
    updateSliderAFromY(e.clientY);
    onMissionNoise?.();
    soundManager.playMissionButtonClick(0);
  };

  const handlePointerMoveA = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerTrackA.current !== e.pointerId || completedRef.current) return;
    updateSliderAFromY(e.clientY);
  };

  const handlePointerUpA = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    pointerTrackA.current = null;
  };

  const updateSliderAFromY = (clientY: number) => {
    const track = trackRefA.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, 100 - (relativeY / rect.height) * 100));
    setSliderA(percentage);
  };

  // Pointer drag handler for Column B
  const handlePointerDownB = (e: React.PointerEvent<HTMLDivElement>) => {
    if (completedRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerTrackB.current = e.pointerId;
    updateSliderBFromY(e.clientY);
    onMissionNoise?.();
    soundManager.playMissionButtonClick(2);
  };

  const handlePointerMoveB = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerTrackB.current !== e.pointerId || completedRef.current) return;
    updateSliderBFromY(e.clientY);
  };

  const handlePointerUpB = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    pointerTrackB.current = null;
  };

  const updateSliderBFromY = (clientY: number) => {
    const track = trackRefB.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const relativeY = clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, 100 - (relativeY / rect.height) * 100));
    setSliderB(percentage);
  };

  // Physics animation loop: Gravity drops bars down unless held; timer tracks 3 continuous seconds
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!completedRef.current) {
        // Gravity pulls sliders downward unless held
        setSliderA((prev) => {
          if (pointerTrackA.current !== null) return prev;
          return Math.max(0, prev - dt * 14);
        });

        setSliderB((prev) => {
          if (pointerTrackB.current !== null) return prev;
          return Math.max(0, prev - dt * 14);
        });

        // Stabilizer timer logic
        setStabilizedTime((prevTime) => {
          if (isBothInZone) {
            const nextTime = Math.min(3.0, prevTime + dt);

            if (currentTime - lastTickTimeRef.current > 480) {
              soundManager.playTaskTick();
              lastTickTimeRef.current = currentTime;
            }

            if (nextTime >= 3.0 && !completedRef.current) {
              completedRef.current = true;
              setIsSuccess(true);
              soundManager.playTaskComplete();
              setTimeout(() => {
                onComplete();
              }, 750);
            }
            return nextTime;
          } else {
            // Decay progress when out of zone
            return Math.max(0, prevTime - dt * 1.8);
          }
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isBothInZone, onComplete]);

  return (
    <div className="space-y-4 my-2 select-none">
      <p className="text-xs text-slate-300 text-center leading-relaxed">
        Usa dos dedos (uno en cada barra) para mantener ambos indicadores en la zona verde central durante 3 segundos seguidos.
      </p>

      {/* 2-Column Hydraulic Pressure Tracks */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-inner">
        {/* Track A */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-[11px] font-tech font-bold text-cyan-400 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" /> CANAL ALFA
          </div>

          <div
            ref={trackRefA}
            onPointerDown={handlePointerDownA}
            onPointerMove={handlePointerMoveA}
            onPointerUp={handlePointerUpA}
            onPointerCancel={handlePointerUpA}
            className="relative w-16 h-48 bg-slate-900 rounded-2xl border-2 border-slate-700 flex items-center justify-center touch-none cursor-pointer overflow-hidden shadow-inner"
            style={{ touchAction: 'none' }}
          >
            {/* Target Green Zone: 38% to 62% */}
            <div className="absolute inset-x-0 bottom-[38%] h-[24%] bg-emerald-500/30 border-y-2 border-emerald-400 flex items-center justify-center">
              <span className="text-[9px] font-tech font-bold text-emerald-300 uppercase tracking-widest rotate-90">
                ÓPTIMO
              </span>
            </div>

            {/* Draggable Hydraulic Knob Handle */}
            <div
              className={`absolute inset-x-1.5 h-10 rounded-xl border-2 flex items-center justify-center shadow-lg transition-transform ${
                isAInZone
                  ? 'bg-emerald-500 border-white text-slate-950 shadow-emerald-400/80 scale-105'
                  : 'bg-cyan-600 border-cyan-300 text-white shadow-cyan-500/50'
              }`}
              style={{
                bottom: `calc(${sliderA}% - 20px)`,
              }}
            >
              <div className="w-6 h-1 bg-white/70 rounded-full" />
            </div>
          </div>

          <span className={`text-[10px] font-tech font-bold ${isAInZone ? 'text-emerald-400' : 'text-slate-400'}`}>
            {Math.round(sliderA)}% PSI
          </span>
        </div>

        {/* Track B */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-[11px] font-tech font-bold text-purple-400 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" /> CANAL BETA
          </div>

          <div
            ref={trackRefB}
            onPointerDown={handlePointerDownB}
            onPointerMove={handlePointerMoveB}
            onPointerUp={handlePointerUpB}
            onPointerCancel={handlePointerUpB}
            className="relative w-16 h-48 bg-slate-900 rounded-2xl border-2 border-slate-700 flex items-center justify-center touch-none cursor-pointer overflow-hidden shadow-inner"
            style={{ touchAction: 'none' }}
          >
            {/* Target Green Zone: 38% to 62% */}
            <div className="absolute inset-x-0 bottom-[38%] h-[24%] bg-emerald-500/30 border-y-2 border-emerald-400 flex items-center justify-center">
              <span className="text-[9px] font-tech font-bold text-emerald-300 uppercase tracking-widest rotate-90">
                ÓPTIMO
              </span>
            </div>

            {/* Draggable Hydraulic Knob Handle */}
            <div
              className={`absolute inset-x-1.5 h-10 rounded-xl border-2 flex items-center justify-center shadow-lg transition-transform ${
                isBInZone
                  ? 'bg-emerald-500 border-white text-slate-950 shadow-emerald-400/80 scale-105'
                  : 'bg-purple-600 border-purple-300 text-white shadow-purple-500/50'
              }`}
              style={{
                bottom: `calc(${sliderB}% - 20px)`,
              }}
            >
              <div className="w-6 h-1 bg-white/70 rounded-full" />
            </div>
          </div>

          <span className={`text-[10px] font-tech font-bold ${isBInZone ? 'text-emerald-400' : 'text-slate-400'}`}>
            {Math.round(sliderB)}% PSI
          </span>
        </div>
      </div>

      {/* 3-Second Countdown Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-tech">
          <span className="text-slate-400">SINCRONIZACIÓN SIMULTÁNEA</span>
          <span className={`font-bold ${isBothInZone ? 'text-emerald-400' : 'text-amber-400'}`}>
            {stabilizedTime.toFixed(1)}s / 3.0s
          </span>
        </div>

        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              isSuccess
                ? 'bg-emerald-400 shadow-emerald-400/80 shadow-md'
                : isBothInZone
                ? 'bg-emerald-500'
                : 'bg-amber-500'
            }`}
            style={{ width: `${(stabilizedTime / 3.0) * 100}%` }}
          />
        </div>

        {isSuccess ? (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce pt-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ¡PRESIÓN HIDRÁULICA ESTABILIZADA!
          </div>
        ) : (
          <div className="text-center text-[11px] font-tech text-slate-400 pt-0.5">
            {isBothInZone ? '⚡ ¡MANTÉN AMBOS FIRMES!' : '⚠ Ambas barras deben estar dentro de la franja verde'}
          </div>
        )}
      </div>
    </div>
  );
};
