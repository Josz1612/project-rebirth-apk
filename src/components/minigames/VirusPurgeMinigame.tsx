import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bug, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface VirusPurgeMinigameProps {
  onComplete: () => void;
  onMissionNoise?: () => void;
}

type CellType = 'empty' | 'red_virus' | 'green_safe';

export const VirusPurgeMinigame: React.FC<VirusPurgeMinigameProps> = ({
  onComplete,
  onMissionNoise,
}) => {
  const [purgedCount, setPurgedCount] = useState<number>(0);
  const [grid, setGrid] = useState<CellType[]>(() => new Array(9).fill('empty'));
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [penaltyMsg, setPenaltyMsg] = useState<string>('');
  const completedRef = useRef<boolean>(false);

  // Spawns red viruses and green firewall nodes periodically
  useEffect(() => {
    if (completedRef.current) return;

    const spawnInterval = setInterval(() => {
      if (completedRef.current) return;

      setGrid(() => {
        const next: CellType[] = new Array(9).fill('empty');
        // Randomly pick 1 to 2 cells for red viruses
        const availableIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
        const redIndex = availableIndices[0];
        next[redIndex] = 'red_virus';

        // 50% chance of a second red virus
        if (Math.random() > 0.5) {
          next[availableIndices[1]] = 'red_virus';
        }

        // 60% chance of spawning a green safe node in a different cell
        if (Math.random() > 0.4) {
          next[availableIndices[2]] = 'green_safe';
        }

        return next;
      });
    }, 1100);

    return () => clearInterval(spawnInterval);
  }, []);

  const handleCellClick = (index: number) => {
    if (completedRef.current) return;
    const type = grid[index];

    if (type === 'red_virus') {
      onMissionNoise?.();
      soundManager.playMissionButtonClick(purgedCount);

      // Clear this cell
      setGrid((prev) => {
        const next = [...prev];
        next[index] = 'empty';
        return next;
      });

      setPurgedCount((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= 5 && !completedRef.current) {
          completedRef.current = true;
          setIsSuccess(true);
          soundManager.playTaskComplete();
          setTimeout(() => {
            onComplete();
          }, 800);
        }
        return nextCount;
      });
    } else if (type === 'green_safe') {
      soundManager.playMissionSoftError();
      setPenaltyMsg('¡ADVERTENCIA! Tocaste un nodo verde seguro.');
      setTimeout(() => setPenaltyMsg(''), 1000);
    }
  };

  return (
    <div className="space-y-4 my-2 select-none">
      <p className="text-xs text-slate-300 text-center leading-relaxed">
        Toca 5 virus rojos antes de que desaparezcan. ¡Evita tocar los cortafuegos verdes seguros!
      </p>

      {/* 3x3 Firewall Matrix Grid */}
      <div className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-700 shadow-inner">
        <div className="grid grid-cols-3 gap-3">
          {grid.map((cellType, idx) => {
            return (
              <button
                key={idx}
                type="button"
                disabled={isSuccess || cellType === 'empty'}
                onClick={() => handleCellClick(idx)}
                className={`h-20 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer active:scale-90 touch-manipulation ${
                  cellType === 'red_virus'
                    ? 'bg-red-600/90 border-red-300 text-white shadow-red-500/80 shadow-lg scale-95 animate-pulse'
                    : cellType === 'green_safe'
                    ? 'bg-emerald-600/80 border-emerald-300 text-white shadow-emerald-500/50 shadow-md scale-95'
                    : 'bg-slate-900 border-slate-800 text-slate-600 opacity-60 cursor-default'
                }`}
              >
                {cellType === 'red_virus' && (
                  <div className="flex flex-col items-center gap-1 pointer-events-none">
                    <Bug className="w-7 h-7 text-white animate-bounce" />
                    <span className="text-[9px] font-tech font-bold uppercase tracking-wider text-red-200">
                      VIRUS
                    </span>
                  </div>
                )}

                {cellType === 'green_safe' && (
                  <div className="flex flex-col items-center gap-1 pointer-events-none">
                    <ShieldCheck className="w-7 h-7 text-emerald-200" />
                    <span className="text-[9px] font-tech font-bold uppercase tracking-wider text-emerald-100">
                      SEGURO
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Counter & Warning messages */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-tech">
          <span className="text-slate-400">NODOS PURGADOS</span>
          <span className={`font-bold ${isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>
            {purgedCount} / 5
          </span>
        </div>

        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isSuccess ? 'bg-emerald-400 shadow-emerald-400/80 shadow-md' : 'bg-red-500'
            }`}
            style={{ width: `${(purgedCount / 5) * 100}%` }}
          />
        </div>

        {penaltyMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-tech font-bold text-amber-300 bg-amber-950/60 p-2 rounded-xl border border-amber-500/50 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {penaltyMsg}
          </div>
        )}

        {isSuccess && (
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce pt-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            ¡TODOS LOS VIRUS DEL SISTEMA PURGADOS (5/5)!
          </div>
        )}
      </div>
    </div>
  );
};
