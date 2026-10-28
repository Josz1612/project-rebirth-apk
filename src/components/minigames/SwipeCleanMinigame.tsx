import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface SwipeCleanMinigameProps {
  onComplete: () => void;
  onMissionNoise?: () => void;
}

const ROWS = 7;
const COLS = 10;
const TOTAL_CELLS = ROWS * COLS;

export const SwipeCleanMinigame: React.FC<SwipeCleanMinigameProps> = ({
  onComplete,
  onMissionNoise,
}) => {
  const [cleaned, setCleaned] = useState<boolean[]>(() => new Array(TOTAL_CELLS).fill(false));
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const isPointerDownRef = useRef<boolean>(false);
  const lastSoundTimeRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);

  const cleanedCount = cleaned.filter(Boolean).length;
  const progress = Math.min(100, Math.round((cleanedCount / TOTAL_CELLS) * 100));

  const cleanCellAtPoint = useCallback((clientX: number, clientY: number, container: HTMLElement) => {
    if (completedRef.current) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

    const col = Math.floor((x / rect.width) * COLS);
    const row = Math.floor((y / rect.height) * ROWS);

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      // Clean target cell and adjacent radius for fluid swipe brush feel
      const cellsToClean: number[] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            cellsToClean.push(r * COLS + c);
          }
        }
      }

      setCleaned((prev) => {
        let changed = false;
        const next = [...prev];
        for (const idx of cellsToClean) {
          if (!next[idx]) {
            next[idx] = true;
            changed = true;
          }
        }

        if (changed) {
          const now = performance.now();
          if (now - lastSoundTimeRef.current > 75) {
            soundManager.playSwipeWhoosh();
            onMissionNoise?.();
            lastSoundTimeRef.current = now;
          }

          const newCleanedCount = next.filter(Boolean).length;
          if (newCleanedCount >= TOTAL_CELLS && !completedRef.current) {
            completedRef.current = true;
            setIsSuccess(true);
            soundManager.playTaskComplete();
            setTimeout(() => {
              onComplete();
            }, 750);
          }
        }
        return changed ? next : prev;
      });
    }
  }, [onComplete, onMissionNoise]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;
    cleanCellAtPoint(e.clientX, e.clientY, e.currentTarget);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    cleanCellAtPoint(e.clientX, e.clientY, e.currentTarget);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    isPointerDownRef.current = false;
  };

  return (
    <div className="space-y-4 my-2 select-none">
      <p className="text-xs text-slate-300 text-center leading-relaxed">
        Desliza el dedo o cursor rápidamente de un lado a otro sobre la mancha para limpiar el sensor al 100%.
      </p>

      {/* Sensor Canvas Area */}
      <div className="relative p-3 bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-inner overflow-hidden">
        {/* Optic sensor reticle background underneath grime */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
          <div className="w-48 h-48 rounded-full border border-cyan-500/40 animate-pulse flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-dashed border-cyan-400/50 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-300 animate-spin" />
              </div>
            </div>
          </div>
        </div>

        {/* Grime Interactive Swiping Grid */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full h-52 grid grid-cols-10 grid-rows-7 gap-0.5 touch-none cursor-crosshair rounded-xl overflow-hidden bg-slate-900/60 border border-slate-800"
          style={{ touchAction: 'none' }}
        >
          {cleaned.map((isCellClean, idx) => (
            <div
              key={idx}
              className={`transition-opacity duration-150 ${
                isCellClean
                  ? 'bg-transparent opacity-0 pointer-events-none'
                  : 'bg-gradient-to-br from-stone-800 via-stone-900 to-amber-950/80 opacity-95 shadow-inner'
              }`}
            />
          ))}

          {/* Clean sparkles on touch guide */}
          {!isSuccess && progress < 100 && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <span className="text-xs font-tech font-bold text-amber-200/50 uppercase tracking-widest animate-pulse">
                ✋ ¡DESLIZA PARA LIMPIAR!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Feedback */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-tech">
          <span className="text-slate-400">ESTADO DEL SENSOR</span>
          <span className={`font-bold ${isSuccess ? 'text-emerald-400' : 'text-cyan-400'}`}>
            {progress}% LIMPIO
          </span>
        </div>

        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isSuccess ? 'bg-emerald-400 shadow-emerald-400/80 shadow-md' : 'bg-cyan-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {isSuccess && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce pt-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ¡SENSOR ÓPTICO 100% LIMPIO!
          </div>
        )}
      </div>
    </div>
  );
};
