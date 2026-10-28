import React, { useState } from 'react';
import {
  ListChecks,
  Radio,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  Palette,
  Compass,
  MapPin,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  X,
  ChevronDown,
  ChevronUp,
  Home,
} from 'lucide-react';
import {
  PlayerState,
  AlienEntity,
  Room,
  Mission,
} from '../types/game';
import { ROOMS, CORRIDORS, MAP_WIDTH, MAP_HEIGHT } from '../game/mapData';
import { soundManager } from '../audio/soundManager';

interface GameHUDProps {
  player: PlayerState;
  aliens: AlienEntity[];
  missions: Mission[];
  currentRoom: Room | null;
  escapePodUnlocked: boolean;
  canLaunchEscapePod: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRestart: () => void;
  onReturnToMenu?: () => void;
  onChangeColor: (color: string) => void;
  controlCenterShieldActive?: boolean;
  isPowerRestored?: boolean;
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

// Room abbreviations for high-legibility tactical minimap
const ROOM_SHORT_CODES: Record<string, string> = {
  hydroponics: 'HID',
  lifesupport: 'O2',
  medbay: 'MED',
  escape_pod: 'NASA',
  engines: 'MOT',
  control_center: 'CTRL',
  cafeteria: 'CAF',
  navigation: 'NAV',
  storage: 'ALM',
  armory: 'ARM',
  shields: 'ESC',
  communications: 'COM',
};

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  aliens,
  missions,
  currentRoom,
  canLaunchEscapePod,
  soundEnabled,
  onToggleSound,
  onRestart,
  onReturnToMenu,
  onChangeColor,
  controlCenterShieldActive = true,
  isPowerRestored = false,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);

  const completedCount = missions.filter((m) => m.completed).length;
  const totalTasks = missions.length; // 4 tasks
  const allTasksDone = completedCount === totalTasks;

  const isControlCenter = currentRoom?.id === 'control_center';
  const isInSafeRoom = isControlCenter && controlCenterShieldActive;

  // Highest alert among the 8 aliens
  const isAnyChasing = aliens.some((a) => a.state === 'chase');
  const isAnySuspicious = aliens.some((a) => a.state === 'suspicious' || a.state === 'search');

  let threatText = 'DESPEJADO';
  let threatDotClass = 'bg-emerald-400 shadow-emerald-400';
  let threatBadgeClass = 'text-emerald-300 border-emerald-500/30 bg-emerald-950/40';

  if (isInSafeRoom) {
    threatText = 'ESCUDO ACTIVO';
    threatDotClass = 'bg-cyan-400 shadow-cyan-400 animate-pulse';
    threatBadgeClass = 'text-cyan-300 border-cyan-500/40 bg-cyan-950/50';
  } else if (isAnyChasing) {
    threatText = '¡PERSECUCIÓN!';
    threatDotClass = 'bg-red-500 shadow-red-500 animate-ping';
    threatBadgeClass = 'text-red-300 border-red-500/60 bg-red-950/60 animate-pulse';
  } else if (isAnySuspicious) {
    threatText = 'ALERTA';
    threatDotClass = 'bg-amber-400 shadow-amber-400 animate-pulse';
    threatBadgeClass = 'text-amber-300 border-amber-500/40 bg-amber-950/50';
  }

  // Minimap scaling dimensions (Map: 3800x2800 -> Minimap screen: 240x176)
  const mapCanvasWidth = 240;
  const mapCanvasHeight = 176;
  const scaleX = mapCanvasWidth / MAP_WIDTH;
  const scaleY = mapCanvasHeight / MAP_HEIGHT;

  return (
    <>
      {/* ================= TOP SCI-FI FRIENDLY TELEMETRY HEADER ================= */}
      <header className="absolute inset-x-0 top-0 p-2 sm:p-3 flex items-center justify-between gap-1.5 sm:gap-2 z-20 pointer-events-none select-none">
        {/* Left: Ship Brand & Current Sector with Suit Icon */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-950/90 backdrop-blur-xl px-2.5 sm:px-3 py-1.5 rounded-2xl border border-cyan-500/30 shadow-xl shadow-cyan-950/40">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center shadow-inner relative transition-colors"
            style={{
              backgroundColor: `${player.suitColor}25`,
              borderColor: player.suitColor,
            }}
          >
            {/* Friendly Astronaut Icon */}
            <span className="text-sm select-none" role="img" aria-label="astronaut">
              👨‍🚀
            </span>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950"
              style={{ backgroundColor: player.suitColor }}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-cyan-300">
                PROJECT_REBIRTH
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono tracking-widest hidden md:inline">
                DECK 01
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium mt-0.5">
              {isInSafeRoom ? (
                <ShieldCheck className="w-3 h-3 text-cyan-400 animate-pulse shrink-0" />
              ) : (
                <MapPin className="w-3 h-3 text-cyan-400/80 shrink-0" />
              )}
              <span
                className={`truncate max-w-[100px] sm:max-w-[140px] ${
                  isInSafeRoom ? 'text-cyan-300 font-semibold' : 'text-slate-200'
                }`}
              >
                {currentRoom ? currentRoom.name : 'Pasillo Conector'}
              </span>
            </div>
            {/* Top HUD Quick Stamina Bar */}
            <div className="flex items-center gap-1 mt-1">
              <div className="w-14 sm:w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    player.stamina > 25 ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100))}%` }}
                />
              </div>
              <span className="text-[7px] sm:text-[8px] font-mono font-bold text-slate-400 leading-none">
                {Math.round((player.stamina / player.maxStamina) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {isPowerRestored && (
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/40 pointer-events-auto shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LUZ 100%
          </div>
        )}

        {/* Right: Stealth Threat Sensor + Unified Action Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Stealth Threat Gauge */}
          <div
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-2xl border backdrop-blur-xl text-xs font-mono transition-all duration-300 ${threatBadgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full shadow-sm ${threatDotClass}`} />
            <span className="font-semibold tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap">
              {threatText}
            </span>
          </div>

          {/* Quick HUD Toolbar */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950/90 backdrop-blur-xl p-1 rounded-2xl border border-cyan-500/30 shadow-xl shadow-cyan-950/40">
            <button
              type="button"
              onClick={() => setShowChecklist(!showChecklist)}
              title={showChecklist ? 'Ocultar Misiones' : 'Ver Misiones'}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                showChecklist
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Personalizar Traje"
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                showColorPicker
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? 'Silenciar Audio' : 'Activar Audio'}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowMinimap(!showMinimap)}
              title={showMinimap ? 'Ocultar Minimapa' : 'Ver Minimapa'}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                showMinimap
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowHelp(true)}
              title="Guía de Navegación"
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={onRestart}
              title="Reiniciar Misión"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {onReturnToMenu && (
              <button
                type="button"
                onClick={onReturnToMenu}
                title="Volver al Menú Principal"
                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= 3. CLEAN & MINIMALIST MISSIONS PANEL (Rule 3) ================= */}
      {showChecklist && (
        <div className="pointer-events-auto absolute top-14 left-2.5 sm:left-3 w-68 bg-slate-950/92 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-2.5 shadow-2xl z-20 select-none text-slate-200 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Minimalist Direct Header */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-300 uppercase">
                OBJETIVOS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-400">
                {completedCount}/{totalTasks}
              </span>
              <button
                type="button"
                onClick={() => setShowChecklist(false)}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer transition-colors"
                title="Ocultar panel"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Clean 4 Missions List (Direct & Minimalist - Zero Redundancy) */}
          <div className="space-y-1">
            {missions.map((m) => {
              const isDone = m.completed;
              const hasStarted = !isDone && m.progress > 0;

              return (
                <div
                  key={m.id}
                  className={`px-2 py-1.5 rounded-xl transition-all duration-200 border relative overflow-hidden ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-200/80'
                      : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700/90 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    {/* Left: Icon & Direct Title + Room */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs shrink-0 select-none">{m.icon}</span>
                      <div className="min-w-0 leading-tight">
                        <div
                          className={`text-[11px] font-semibold truncate ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {m.title}
                        </div>
                        <div className="text-[9px] text-cyan-400/80 font-mono truncate">
                          {m.roomName}
                        </div>
                      </div>
                    </div>

                    {/* Right: Direct Status */}
                    <div className="shrink-0 flex items-center">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-500/30">
                          {m.mechanicType === 'anomalies'
                            ? `${m.collectedAnomalies || 0}/5`
                            : `${Math.floor(m.progress)}%`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Micro Progress Line (Only when in active progress) */}
                  {hasStarted && (
                    <div className="absolute bottom-0 inset-x-0 h-[2px] bg-slate-800">
                      <div
                        className="bg-cyan-400 h-full transition-all duration-150"
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Minimalist Evacuation Status */}
          <div
            className={`mt-1.5 px-2 py-1 rounded-xl text-[10px] font-mono border flex items-center gap-1.5 transition-all ${
              allTasksDone
                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 font-bold animate-pulse'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <Rocket
              className={`w-3 h-3 shrink-0 ${
                allTasksDone ? 'text-emerald-400 animate-bounce' : 'text-slate-500'
              }`}
            />
            <span className="truncate">
              {allTasksDone
                ? '¡Endeavour listo en Navegación!'
                : `Evacuación: Faltan ${totalTasks - completedCount}`}
            </span>
          </div>
        </div>
      )}

      {/* ================= 2. CONNECTED SHIP MINIMAP (RADAR DE LA NAVE) (Rule 2) ================= */}
      {showMinimap && (
        <div className="pointer-events-auto absolute top-14 right-2.5 sm:right-3 w-[266px] bg-slate-950/92 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-2 shadow-2xl z-20 select-none animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Radar Header with Tactical Telemetry */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5 pb-1 border-b border-slate-800/80 px-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Radio className="w-3 h-3 animate-pulse" /> RADAR NAVE
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 font-mono">RED CONECTADA</span>
              <button
                type="button"
                onClick={() => setShowMinimap(false)}
                className="text-slate-500 hover:text-slate-300 p-0.5 rounded cursor-pointer transition-colors"
                title="Ocultar radar"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Tactical Connected Radar Display with Connected Rooms & Corridors */}
          <div
            className="relative bg-slate-950 rounded-xl overflow-hidden border border-cyan-900/50"
            style={{ width: `${mapCanvasWidth}px`, height: `${mapCanvasHeight}px` }}
          >
            {/* Tactical Grid Background */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Sweep radar ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-40 h-40 rounded-full border border-cyan-400/30" />
              <div className="absolute w-24 h-24 rounded-full border border-cyan-400/20" />
            </div>

            {/* ================= SVG LAYER: CONNECTED SHIP CORRIDORS & ARTERIES ================= */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              viewBox={`0 0 ${mapCanvasWidth} ${mapCanvasHeight}`}
            >
              {/* Connected Hallway Arteries: Continuous illuminated conduit network linking rooms */}
              {/* Horizontal Trunk 1: Hidroponía -> Soporte Vital -> Medbay */}
              <line
                x1={Math.round(425 * scaleX)}
                y1={Math.round(450 * scaleY)}
                x2={Math.round(2225 * scaleX)}
                y2={Math.round(450 * scaleY)}
                stroke="#0284c7"
                strokeWidth="4"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <line
                x1={Math.round(425 * scaleX)}
                y1={Math.round(450 * scaleY)}
                x2={Math.round(2225 * scaleX)}
                y2={Math.round(450 * scaleY)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />

              {/* Horizontal Trunk 2: Motores -> Centro de Control -> Cafetería -> Navegación */}
              <line
                x1={Math.round(475 * scaleX)}
                y1={Math.round(1425 * scaleY)}
                x2={Math.round(3300 * scaleX)}
                y2={Math.round(1425 * scaleY)}
                stroke="#0284c7"
                strokeWidth="4"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <line
                x1={Math.round(475 * scaleX)}
                y1={Math.round(1425 * scaleY)}
                x2={Math.round(3300 * scaleX)}
                y2={Math.round(1425 * scaleY)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />

              {/* Horizontal Trunk 3: Carga -> Armería -> Escudos -> Comunicaciones */}
              <line
                x1={Math.round(475 * scaleX)}
                y1={Math.round(2400 * scaleY)}
                x2={Math.round(3300 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#0284c7"
                strokeWidth="4"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <line
                x1={Math.round(475 * scaleX)}
                y1={Math.round(2400 * scaleY)}
                x2={Math.round(3300 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />

              {/* Vertical Trunk 1: Hidroponía -> Motores -> Carga */}
              <line
                x1={Math.round(450 * scaleX)}
                y1={Math.round(450 * scaleY)}
                x2={Math.round(450 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#0284c7"
                strokeWidth="4"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <line
                x1={Math.round(450 * scaleX)}
                y1={Math.round(450 * scaleY)}
                x2={Math.round(450 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />

              {/* Vertical Trunk 2: Soporte Vital -> Centro de Control -> Armería */}
              <line
                x1={Math.round(1400 * scaleX)}
                y1={Math.round(450 * scaleY)}
                x2={Math.round(1400 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#0284c7"
                strokeWidth="4"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <line
                x1={Math.round(1400 * scaleX)}
                y1={Math.round(450 * scaleY)}
                x2={Math.round(1400 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />

              {/* Vertical Trunk 3: Medbay -> Cafetería -> Escudos */}
              <line
                x1={Math.round(2325 * scaleX)}
                y1={Math.round(450 * scaleY)}
                x2={Math.round(2325 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#0284c7"
                strokeWidth="4"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <line
                x1={Math.round(2325 * scaleX)}
                y1={Math.round(450 * scaleY)}
                x2={Math.round(2325 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />

              {/* Vertical Trunk 4: Navegación -> Comunicaciones */}
              <line
                x1={Math.round(3300 * scaleX)}
                y1={Math.round(1425 * scaleY)}
                x2={Math.round(3300 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#0284c7"
                strokeWidth="4"
                strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <line
                x1={Math.round(3300 * scaleX)}
                y1={Math.round(1425 * scaleY)}
                x2={Math.round(3300 * scaleX)}
                y2={Math.round(2400 * scaleY)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.9"
                strokeLinecap="round"
              />

              {/* Vertical Trunk 5 (Bridge): Navegación -> NASA Endeavour Escape Pod */}
              <line
                x1={Math.round(3300 * scaleX)}
                y1={Math.round(1425 * scaleY)}
                x2={Math.round(3300 * scaleX)}
                y2={Math.round(450 * scaleY)}
                stroke={allTasksDone ? '#10b981' : '#ef4444'}
                strokeWidth="4"
                strokeOpacity="0.6"
                strokeLinecap="round"
              />
              <line
                x1={Math.round(3300 * scaleX)}
                y1={Math.round(1425 * scaleY)}
                x2={Math.round(3300 * scaleX)}
                y2={Math.round(450 * scaleY)}
                stroke={allTasksDone ? '#34d399' : '#f87171'}
                strokeWidth="1.8"
                strokeDasharray={allTasksDone ? undefined : '3,3'}
                strokeOpacity="0.9"
                strokeLinecap="round"
              />

              {/* Doorway connection junction nodes */}
              {[
                { x: 450, y: 450 },
                { x: 1400, y: 450 },
                { x: 2325, y: 450 },
                { x: 450, y: 1425 },
                { x: 1400, y: 1425 },
                { x: 2325, y: 1425 },
                { x: 3300, y: 1425 },
                { x: 450, y: 2400 },
                { x: 1400, y: 2400 },
                { x: 2325, y: 2400 },
                { x: 3300, y: 2400 },
                { x: 3300, y: 450 },
              ].map((pt, i) => (
                <circle
                  key={`node_${i}`}
                  cx={Math.round(pt.x * scaleX)}
                  cy={Math.round(pt.y * scaleY)}
                  r="2.5"
                  fill="#38bdf8"
                  opacity="0.8"
                />
              ))}
            </svg>

            {/* ================= CONNECTED CORRIDORS (Physical Passages) ================= */}
            {CORRIDORS.map((c) => {
              const isPodBridge = c.id === 'corr_escape_bridge';
              const isControlTunnel = c.id.includes('control');
              const isShieldBlocked = isControlTunnel && controlCenterShieldActive;

              return (
                <div
                  key={c.id}
                  className={`absolute transition-all duration-200 z-1 ${
                    isPodBridge
                      ? allTasksDone
                        ? 'bg-emerald-950/70 border border-emerald-400 shadow-xs shadow-emerald-400/40'
                        : 'bg-red-950/60 border border-red-500/60'
                      : isShieldBlocked
                      ? 'bg-cyan-950/80 border border-cyan-400/50 shadow-xs shadow-cyan-400/30'
                      : 'bg-slate-900/90 border border-cyan-500/40 shadow-xs shadow-cyan-950/40'
                  }`}
                  style={{
                    left: `${Math.round(c.x * scaleX)}px`,
                    top: `${Math.round(c.y * scaleY)}px`,
                    width: `${Math.max(4, Math.round(c.width * scaleX))}px`,
                    height: `${Math.max(4, Math.round(c.height * scaleY))}px`,
                  }}
                  title={c.name}
                >
                  {/* Centerline illuminated conduit stripe */}
                  <div
                    className={`w-full h-full ${
                      c.width > c.height
                        ? 'border-t border-cyan-400/80 my-auto'
                        : 'border-l border-cyan-400/80 mx-auto'
                    }`}
                  />
                </div>
              );
            })}

            {/* ================= 12 SHIP ROOMS (Distinct, Connected Chambers) ================= */}
            {ROOMS.map((r) => {
              const isSafe = r.id === 'control_center';
              const isPod = r.id === 'escape_pod';
              const isCurrent = currentRoom?.id === r.id;
              const code = ROOM_SHORT_CODES[r.id] || r.id.substring(0, 3).toUpperCase();

              return (
                <div
                  key={r.id}
                  className={`absolute rounded-xs flex items-center justify-center overflow-hidden border z-2 transition-all duration-150 ${
                    isCurrent
                      ? 'border-cyan-300 ring-1.5 ring-cyan-400/80 shadow-md shadow-cyan-400/30'
                      : isSafe
                      ? 'border-cyan-400/90 shadow-xs shadow-cyan-400/30'
                      : isPod
                      ? allTasksDone
                        ? 'border-emerald-400/90 shadow-xs shadow-emerald-400/40 animate-pulse'
                        : 'border-red-500/70'
                      : 'border-cyan-500/30 hover:border-cyan-400/60'
                  }`}
                  style={{
                    left: `${Math.round(r.x * scaleX)}px`,
                    top: `${Math.round(r.y * scaleY)}px`,
                    width: `${Math.round(r.width * scaleX)}px`,
                    height: `${Math.round(r.height * scaleY)}px`,
                    backgroundColor: isCurrent ? '#0c2438' : r.floorColor,
                    opacity: 0.92,
                  }}
                  title={r.name}
                >
                  {/* High-Tech Tactical Room Code Label */}
                  <span
                    className={`text-[7px] font-mono font-bold tracking-tighter select-none pointer-events-none ${
                      isCurrent
                        ? 'text-cyan-200 font-extrabold'
                        : isSafe
                        ? 'text-cyan-300'
                        : isPod
                        ? allTasksDone
                          ? 'text-emerald-300 font-black'
                          : 'text-red-300'
                        : 'text-slate-300/80'
                    }`}
                  >
                    {code}
                  </span>
                </div>
              );
            })}

            {/* Active Mission Target Pulsing Indicators */}
            {missions.map((m) => {
              if (m.completed) return null;
              const targetRoom = ROOMS.find((r) => r.id === m.roomId);
              if (!targetRoom) return null;

              return (
                <div
                  key={`ping_${m.id}`}
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${Math.round((targetRoom.x + targetRoom.width / 2) * scaleX) - 3}px`,
                    top: `${Math.round((targetRoom.y + targetRoom.height / 2) * scaleY) - 3}px`,
                  }}
                  title={`Objetivo: ${m.title}`}
                >
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-sm shadow-amber-300 animate-ping absolute inset-0" />
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-xs shadow-amber-300" />
                </div>
              );
            })}

            {/* Escape Pod NASA Beacon */}
            <div
              className={`absolute w-2 h-2 rounded-full border pointer-events-none z-10 ${
                allTasksDone
                  ? 'bg-emerald-400 border-white shadow-md shadow-emerald-400 animate-bounce'
                  : 'bg-red-500 border-red-300'
              }`}
              style={{
                left: `${Math.round(3300 * scaleX) - 2}px`,
                top: `${Math.round(450 * scaleY) - 2}px`,
              }}
              title="Cápsula NASA Endeavour"
            />

            {/* 8 Aliens Radar Blips */}
            {aliens.map((alien) => {
              const isChasing = alien.state === 'chase';

              return (
                <div
                  key={alien.id}
                  className="absolute transition-all duration-300 pointer-events-none z-10"
                  style={{
                    left: `${Math.round(alien.x * scaleX) - 2.5}px`,
                    top: `${Math.round(alien.y * scaleY) - 2.5}px`,
                  }}
                  title={alien.name}
                >
                  {isChasing && (
                    <div className="absolute -inset-1 rounded-full border border-red-500 animate-ping" />
                  )}
                  <div
                    className="w-1.5 h-1.5 rounded-full border border-white/80 shadow-xs"
                    style={{ backgroundColor: alien.color }}
                  />
                </div>
              );
            })}

            {/* Player Astronaut Blip with Radar Pulse */}
            <div
              className="absolute transition-all duration-75 pointer-events-none z-20"
              style={{
                left: `${Math.round(player.x * scaleX) - 3}px`,
                top: `${Math.round(player.y * scaleY) - 3}px`,
              }}
              title="Tu Posición"
            >
              <div className="absolute -inset-1.5 rounded-full border border-cyan-400/80 animate-ping" />
              <div className="w-2 h-2 bg-cyan-400 rounded-full border border-white shadow-md shadow-cyan-400" />
            </div>
          </div>
        </div>
      )}

      {/* ================= SUIT COLOR PALETTE PICKER MODAL (ARMORY CONSOLE) ================= */}
      {showColorPicker && (
        <div className="pointer-events-auto absolute top-14 right-16 sm:right-24 bg-slate-950/95 backdrop-blur-xl p-3.5 rounded-2xl border border-cyan-500/35 shadow-2xl z-30 w-72 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" /> PERSONALIZAR TRAJE
            </span>
            <button
              type="button"
              title="Cerrar selector de color"
              aria-label="Cerrar selector de color"
              onClick={() => setShowColorPicker(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[10px] text-slate-400 mb-2 leading-tight font-mono">
            Selecciona el blindaje EVA para tu astronauta:
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SUIT_COLORS.map((sc, scIdx) => {
              const isSelected = player.suitColor.toLowerCase() === sc.color.toLowerCase();
              return (
                <button
                  type="button"
                  key={sc.color}
                  onClick={() => {
                    onChangeColor(sc.color);
                    soundManager.playMissionButtonClick(scIdx % 5);
                    setShowColorPicker(false);
                  }}
                  className={`flex flex-col items-center p-1.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/70 ring-1.5 ring-cyan-400 shadow-md shadow-cyan-950 scale-105'
                      : 'hover:bg-slate-900 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white/80 shadow-sm mb-1 relative flex items-center justify-center"
                    style={{ backgroundColor: sc.color }}
                  >
                    {isSelected && (
                      <span className="text-white text-[10px] drop-shadow font-bold">✓</span>
                    )}
                  </div>
                  <span className="text-[8.5px] text-slate-300 text-center leading-tight truncate w-full font-mono">
                    {sc.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TACTICAL BRIEFING & HELP MODAL ================= */}
      {showHelp && (
        <div className="pointer-events-auto fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="bg-slate-900/95 border border-cyan-500/35 rounded-3xl max-w-md w-full p-6 text-slate-200 shadow-2xl shadow-cyan-950/60">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-bold font-mono text-cyan-400 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" /> MANUAL DE NAVEGACIÓN // PROJECT_REBIRTH
              </h3>
              <button
                type="button"
                title="Cerrar manual"
                aria-label="Cerrar manual"
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs leading-relaxed text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-cyan-500/25">
                <strong className="text-cyan-300 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Centro de Control (Safe Room):
                </strong>
                <p className="mt-0.5 text-slate-400">
                  Aparición segura protegida por campo de fuerza hermético. Se desactiva al cruzar la puerta exterior por primera vez.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-amber-500/25">
                <strong className="text-amber-300 font-mono">Linterna y Modo Sigilo (Tecla F):</strong>
                <p className="mt-0.5 text-slate-400">
                  Enciéndela para ver pasillos oscuros. Apágala para camuflarte en sombras y reducir al 50% el rango de detección alien.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-yellow-500/25">
                <strong className="text-yellow-300 font-mono">4 Objetivos por Partida:</strong>
                <p className="mt-0.5 text-slate-400">
                  Completa las 4 misiones asignadas en los terminales interactivos de cada sala para alimentar el Transbordador.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-red-500/25">
                <strong className="text-rose-300 font-mono">8 Aliens con Patrulla Global:</strong>
                <p className="mt-0.5 text-slate-400">
                  Patrullan todos los pasillos y salas. El radar conectado muestra sus trayectorias. Usa taquillas y conductos para ocultarte.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/25">
                <strong className="text-emerald-300 font-mono flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" /> Evacuación NASA Endeavour:
                </strong>
                <p className="mt-0.5 text-slate-400">
                  Con las 4 misiones completadas, cruza el puente de evacuación en Navegación y activa el despegue orbital.
                </p>
              </div>

              {/* Quick Controls Reference */}
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                <div className="font-bold text-slate-200 mb-1">CONTROLES RÁPIDOS:</div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div>WASD / Joystick: Moverse</div>
                  <div>Shift / Botón: Correr</div>
                  <div>F / Linterna: Luz / Sigilo</div>
                  <div>Espacio / E: Interactuar</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-xl font-mono text-xs cursor-pointer shadow-lg shadow-cyan-950 transition-all active:scale-98"
            >
              ENTENDIDO
            </button>
          </div>
        </div>
      )}
    </>
  );
};


