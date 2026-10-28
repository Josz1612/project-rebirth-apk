import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Sparkles,
  Rocket,
  Lightbulb,
  Palette,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Radar,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface VictoryModalProps {
  onRestart: () => void;
  onReturnToMenu?: () => void;
  tasksCompleted?: number;
  playerSuitColor?: string;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  onRestart,
  onReturnToMenu,
  tasksCompleted = 4,
  playerSuitColor = '#06b6d4',
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/92 backdrop-blur-xl z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-b from-slate-900/98 via-slate-950 to-slate-950 border-2 border-emerald-400/50 rounded-3xl max-w-md w-full p-6 sm:p-7 text-center shadow-2xl shadow-emerald-950/80 text-white overflow-hidden">
        {/* Ambient Top Glow Laser Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Celebratory Astronaut & Rocket Badge */}
        <div className="relative w-20 h-20 mx-auto mb-3 flex items-center justify-center">
          <div
            className="w-18 h-18 rounded-3xl border-2 shadow-xl flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundColor: `${playerSuitColor}20`,
              borderColor: playerSuitColor,
              boxShadow: `0 0 25px ${playerSuitColor}50`,
            }}
          >
            <Rocket className="w-9 h-9 text-emerald-300 animate-bounce" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-md">
            ✓
          </div>
        </div>

        {/* Friendly Kicker */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold tracking-widest text-emerald-300 uppercase mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" /> ¡MISIÓN CUMPLIDA! · NASA ENDEAVOUR
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-tech text-white tracking-tight mb-2">
          ¡EVACUACIÓN EXITOSA!
        </h2>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed max-w-sm mx-auto">
          Has completado todas las reparaciones de la nave y abordado el transbordador a tiempo.
          Los motores cohete rugen en ignición dejando atrás la amenaza biológica.
        </p>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-xs">
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mb-0.5">
              OBJETIVOS RESUELTOS
            </span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-base">
              <CheckCircle2 className="w-4 h-4" />
              <span>{tasksCompleted} / 4 TAREAS</span>
            </div>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mb-0.5">
              ESTADO DEL ASTRONAUTA
            </span>
            <span className="text-cyan-300 font-mono font-bold text-xs mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> A SALVO EN ÓRBITA
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onReturnToMenu && (
            <button
              type="button"
              onClick={onReturnToMenu}
              className="sm:w-1/3 py-3.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 transition-all font-mono text-xs flex items-center justify-center cursor-pointer"
            >
              MENÚ
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-950/70 transition-all font-mono text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4 text-slate-950" /> JUGAR OTRA PARTIDA
          </button>
        </div>
      </div>
    </div>
  );
};

interface CaughtModalProps {
  onFullRestart: () => void;
  onReturnToMenu?: () => void;
  missionsCompleted: number;
  totalMissions?: number;
  playerSuitColor?: string;
  lastRoomName?: string;
  onChangeColor?: (color: string) => void;
}

const SUIT_COLORS = [
  { name: 'Cian Neón', color: '#06b6d4' },
  { name: 'Rojo Carmesí', color: '#ef4444' },
  { name: 'Lima Alien', color: '#84cc16' },
  { name: 'Púrpura Nebula', color: '#a855f7' },
  { name: 'Naranja Fuego', color: '#f97316' },
  { name: 'Rosa Galáctico', color: '#ec4899' },
  { name: 'Oro Solar', color: '#eab308' },
  { name: 'Azul Cobalto', color: '#2563eb' },
  { name: 'Verde Esmeralda', color: '#10b981' },
  { name: 'Blanco Estelar', color: '#e2e8f0' },
  { name: 'Obsidiana', color: '#475569' },
  { name: 'Turquesa', color: '#14b8a6' },
];

const SURVIVAL_TIPS = [
  'Apagar la linterna con la tecla [F] reduce al 50% la distancia a la que te ven los aliens.',
  'Realizar tareas emite un pulso sonoro que atrae al alien más cercano. ¡Termina y huye!',
  'Esconderte en conductos o taquillas rompe la persecución inmediatamente si no te ven entrar.',
  'El radar superior muestra las trayectorias de patrulla en tiempo real de los 8 aliens.',
  'Correr agota tu estamina y hace ruido detectable en las habitaciones adyacentes.',
  'El campo de fuerza del Centro de Control te protege hasta que sales por primera vez.',
];

export const CaughtModal: React.FC<CaughtModalProps> = ({
  onFullRestart,
  onReturnToMenu,
  missionsCompleted,
  totalMissions = 4,
  playerSuitColor = '#06b6d4',
  lastRoomName = 'Pasillos de la Nave',
  onChangeColor,
}) => {
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  const randomTip = useMemo(() => {
    return SURVIVAL_TIPS[Math.floor(Math.random() * SURVIVAL_TIPS.length)];
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/94 backdrop-blur-xl z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="relative bg-gradient-to-b from-slate-900/98 via-slate-950 to-slate-950 border-2 border-rose-500/50 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl shadow-rose-950/80 text-white overflow-hidden">
        {/* Ambient Top Glow Laser Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* ================= BESPOKE ASTRONAUT HELMET VISOR GRAPHIC (UNIQUE TO PROJECT_REBIRTH) ================= */}
        <div className="relative w-24 h-24 mx-auto mb-2 flex items-center justify-center">
          <svg className="w-24 h-24 drop-shadow-xl" viewBox="0 0 100 100">
            {/* Outer Helmet Shell with player's custom suit color */}
            <circle
              cx="50"
              cy="48"
              r="38"
              fill={playerSuitColor}
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            {/* Helmet Collar / Neck Seal */}
            <rect
              x="30"
              y="78"
              width="40"
              height="10"
              rx="4"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Side Ear Comms Pods */}
            <circle cx="12" cy="48" r="6" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="88" cy="48" r="6" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="12" cy="48" r="2.5" fill="#ef4444" className="animate-ping" />
            <circle cx="88" cy="48" r="2.5" fill="#ef4444" className="animate-pulse" />

            {/* Dark Visor Bubble */}
            <ellipse
              cx="50"
              cy="48"
              rx="26"
              ry="21"
              fill="#090d16"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Visor Glare Reflection */}
            <path
              d="M 32 36 Q 44 31 66 34"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.7"
            />

            {/* Visor Fracture / Crack Line (Drama & Storytelling) */}
            <path
              d="M 50 32 L 46 43 L 55 49 L 48 60 L 53 66"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />

            {/* Glowing Emergency Warning X in Visor */}
            <text
              x="50"
              y="53"
              textAnchor="middle"
              fill="#f43f5e"
              fontSize="12"
              fontFamily="monospace"
              fontWeight="bold"
              opacity="0.9"
            >
              SIGNAL LOST
            </text>
          </svg>

          {/* Alarm Ring Indicator */}
          <div className="absolute inset-0 rounded-full border-2 border-rose-500/40 animate-ping pointer-events-none" />
        </div>

        {/* Clean, Friendly Status Kicker */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-rose-400 uppercase mb-1">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" /> CONTACTO HOSTIL // BITÁCORA DE RESCATE
        </div>

        <h2 className="text-2xl font-extrabold font-tech text-white tracking-wide mb-1">
          ¡EL ALIEN TE HA CAZADO!
        </h2>
        <p className="text-xs text-slate-300 mb-4 max-w-xs mx-auto">
          Casi lo logras... La señal de tu traje se interrumpió, pero puedes reiniciar los sistemas y volver a intentarlo.
        </p>

        {/* Flight Recorder Telemetry Card (Caja Negra) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 mb-4 text-xs">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2 pb-1.5 border-b border-slate-800">
            <span className="flex items-center gap-1 text-cyan-300 font-bold">
              <Radar className="w-3 h-3 text-cyan-400" /> REGISTRO DE VUELO
            </span>
            <span className="text-rose-400 font-bold">TRANSMISIÓN FINAL</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9px] text-slate-500 font-mono block">ÚLTIMO SECTOR</span>
              <span className="text-slate-200 font-bold font-mono text-[11px] truncate block">
                📍 {lastRoomName}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-[9px] text-slate-500 font-mono block">MISIONES LOGRADAS</span>
              <span className="text-amber-300 font-bold font-mono text-[11px] block">
                {missionsCompleted} de {totalMissions} Tareas
              </span>
            </div>
          </div>
        </div>

        {/* Survival Tip Debriefing */}
        <div className="bg-slate-900/70 border border-amber-500/30 rounded-2xl p-3 mb-5 text-left flex items-start gap-2.5">
          <div className="p-1.5 bg-amber-500/15 rounded-xl text-amber-400 shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider mb-0.5">
              Consejo de Supervivencia
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {randomTip}
            </p>
          </div>
        </div>

        {/* Color Customizer Drawer (Optional Friendly Agency) */}
        {showColorPicker && (
          <div className="mb-4 p-3 rounded-2xl bg-slate-900 border border-cyan-500/30 animate-in fade-in duration-150">
            <div className="text-[10px] font-mono text-cyan-300 font-bold mb-2">
              ELIGE COLOR PARA TU PRÓXIMO INTENTO:
            </div>
            <div className="grid grid-cols-6 gap-2">
              {SUIT_COLORS.map((sc, i) => (
                <button
                  type="button"
                  key={sc.color}
                  onClick={() => {
                    onChangeColor?.(sc.color);
                    soundManager.playMissionButtonClick(i % 5);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer mx-auto ${
                    playerSuitColor === sc.color ? 'scale-125 border-white ring-2 ring-cyan-400' : 'border-slate-700 hover:scale-110'
                  }`}
                  style={{ backgroundColor: sc.color }}
                  title={sc.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Friendly Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {onChangeColor && (
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-2xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Cambiar traje"
            >
              <Palette className="w-4 h-4 text-cyan-400" />
              <span>{showColorPicker ? 'CERRAR' : 'TRAJE'}</span>
            </button>
          )}

          {onReturnToMenu && (
            <button
              type="button"
              onClick={onReturnToMenu}
              className="w-full sm:w-auto px-4 py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-2xl border border-slate-700 flex items-center justify-center transition-all cursor-pointer font-bold"
            >
              MENÚ
            </button>
          )}

          <button
            type="button"
            onClick={onFullRestart}
            className="flex-1 w-full py-3.5 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black rounded-2xl shadow-xl shadow-red-950/70 transition-all font-mono text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" /> REINTENTAR <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

