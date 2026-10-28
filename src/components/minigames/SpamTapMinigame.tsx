import React, { useState, useEffect, useRef } from 'react';
import { Wind, CheckCircle2, Zap } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface SpamTapMinigameProps {
  onComplete: () => void;
  onMissionNoise?: () => void;
}

export const SpamTapMinigame: React.FC<SpamTapMinigameProps> = ({
  onComplete,
  onMissionNoise,
}) => {
  const [oxygenLevel, setOxygenLevel] = useState<number>(20);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [pistonActive, setPistonActive] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);

  // Constant decay loop: Tank level leaks/empties continuously
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!completedRef.current) {
        setOxygenLevel((prev) => {
          // Drops by 14% per second
          return Math.max(0, prev - dt * 14);
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePumpTap = () => {
    if (completedRef.current) return;

    soundManager.playPumpPulse();
    onMissionNoise?.();
    setPistonActive(true);
    setTimeout(() => setPistonActive(false), 90);

    setOxygenLevel((prev) => {
      const next = Math.min(100, prev + 7.5);
      if (next >= 100 && !completedRef.current) {
        completedRef.current = true;
        setIsSuccess(true);
        soundManager.playTaskComplete();
        setTimeout(() => {
          onComplete();
        }, 800);
      }
      return next;
    });
  };

  const progress = Math.min(100, Math.round(oxygenLevel));

  return (
    <div className="space-y-4 my-2 select-none">
      <p className="text-xs text-slate-300 text-center leading-relaxed">
        El tanque tiene una fuga constante. Presiona el botón a máxima velocidad para bombear oxígeno y alcanzar el 100%.
      </p>

      {/* Oxygen Tank Cylinder & Piston Visualization */}
      <div className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-inner flex flex-col items-center gap-3">
        {/* Tank Valve Header */}
        <div className="flex items-center gap-2 text-xs font-tech font-bold text-emerald-400">
          <Wind className={`w-4 h-4 ${pistonActive ? 'animate-bounce text-cyan-300' : ''}`} />
          <span>VÁLVULA DE PRESIÓN O2 (SOPORTE VITAL)</span>
        </div>

        {/* Vertical Oxygen Reservoir Cylinder */}
        <div className="relative w-full h-28 bg-slate-900 rounded-2xl border-2 border-slate-700 p-2 overflow-hidden flex flex-col justify-end shadow-inner">
          {/* Bubbling liquid effect */}
          <div
            className={`w-full rounded-xl transition-all duration-75 relative overflow-hidden ${
              isSuccess
                ? 'bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-400 shadow-emerald-400 shadow-lg'
                : 'bg-gradient-to-t from-teal-700 via-emerald-600 to-cyan-500'
            }`}
            style={{ height: `${progress}%` }}
          >
            {/* Top surface line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-white/70 shadow-sm" />
          </div>

          {/* Target 100% Goal Marker */}
          <div className="absolute top-2 inset-x-3 flex justify-between items-center text-[10px] font-tech text-emerald-400 font-bold border-b border-dashed border-emerald-500/50 pb-0.5">
            <span>META: 100% LLENO</span>
            <span>CAPACIDAD MÁXIMA</span>
          </div>

          {/* Level readout overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-2xl font-black font-tech text-white drop-shadow-md">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Big Mashing Button */}
      <button
        type="button"
        disabled={isSuccess}
        onClick={handlePumpTap}
        className={`w-full py-5 rounded-2xl font-tech font-black text-lg tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation flex items-center justify-center gap-2 shadow-2xl ${
          isSuccess
            ? 'bg-emerald-600 text-white shadow-emerald-500/50 shadow-lg'
            : pistonActive
            ? 'bg-cyan-500 text-slate-950 scale-95 shadow-cyan-400/80 shadow-lg'
            : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-cyan-500/40 shadow-lg'
        }`}
      >
        <Zap className="w-6 h-6 animate-pulse" />
        {isSuccess ? '¡TANQUE 100% LLENO!' : '⚡ ¡BOMBEAR OXÍGENO! (TOCA RÁPIDO)'}
      </button>

      {/* Feedback banner */}
      {isSuccess && (
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          ¡RESERVA DE OXÍGENO TOTALMENTE RESTAURADA!
        </div>
      )}
    </div>
  );
};
