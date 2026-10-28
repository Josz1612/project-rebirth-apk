import React, { useRef, useState, useCallback } from 'react';
import {
  Shield,
  Zap,
  LogOut,
  Wrench,
  Rocket,
  Sparkles,
  Flashlight,
  Power,
} from 'lucide-react';
import { GameProp, Mission } from '../types/game';

interface VirtualControlsProps {
  onDirectionChange: (dir: { x: number; y: number }) => void;
  onSprintToggle: (active: boolean) => void;
  onActionTrigger: () => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  isPlayerHidden: boolean;
  nearbyHidingProp: GameProp | null;
  nearbyTaskProp: GameProp | null;
  activeMission: Mission | null;
  canLaunchEscapePod: boolean;
  stamina: number;
  maxStamina: number;
  isSprinting: boolean;
  flashlightOn: boolean;
  onFlashlightToggle: () => void;
  isPowerRestored?: boolean;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  onDirectionChange,
  onSprintToggle,
  onActionTrigger,
  onHoldStart,
  onHoldEnd,
  isPlayerHidden,
  nearbyHidingProp,
  nearbyTaskProp,
  activeMission,
  canLaunchEscapePod,
  stamina,
  maxStamina,
  isSprinting,
  flashlightOn,
  onFlashlightToggle,
  isPowerRestored = false,
}) => {
  const [joystickThumb, setJoystickThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState<boolean>(false);

  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickPointerIdRef = useRef<number | null>(null);
  const lastActionTapRef = useRef<number>(0);

  // ---------------- 360-DEGREE ANALOG JOYSTICK LOGIC ----------------
  const handleJoystickPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      joystickPointerIdRef.current = e.pointerId;
      setIsJoystickActive(true);

      const base = joystickBaseRef.current;
      if (!base) return;

      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const maxRadius = 48;

      if (dist < 4) {
        setJoystickThumb({ x: 0, y: 0 });
        onDirectionChange({ x: 0, y: 0 });
        return;
      }

      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * clampedDist;
      const clampedY = Math.sin(angle) * clampedDist;

      setJoystickThumb({ x: clampedX, y: clampedY });
      onDirectionChange({
        x: clampedX / maxRadius,
        y: clampedY / maxRadius,
      });
    },
    [onDirectionChange]
  );

  const handleJoystickPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (joystickPointerIdRef.current !== e.pointerId) return;

      const base = joystickBaseRef.current;
      if (!base) return;

      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);
      const maxRadius = 48;

      if (dist < 4) {
        setJoystickThumb({ x: 0, y: 0 });
        onDirectionChange({ x: 0, y: 0 });
        return;
      }

      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * clampedDist;
      const clampedY = Math.sin(angle) * clampedDist;

      setJoystickThumb({ x: clampedX, y: clampedY });
      onDirectionChange({
        x: clampedX / maxRadius,
        y: clampedY / maxRadius,
      });
    },
    [onDirectionChange]
  );

  const handleJoystickPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (joystickPointerIdRef.current === e.pointerId) {
        joystickPointerIdRef.current = null;
        setIsJoystickActive(false);
        setJoystickThumb({ x: 0, y: 0 });
        onDirectionChange({ x: 0, y: 0 });
      }
    },
    [onDirectionChange]
  );

  // Debounced tap for action buttons
  const handleSafeActionTrigger = (e?: React.PointerEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastActionTapRef.current < 250) return;
    lastActionTapRef.current = now;
    onActionTrigger();
  };

  const staminaPercent = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));
  const missionProgress = activeMission ? activeMission.progress : 0;

  return (
    <div className="pointer-events-none select-none absolute inset-x-0 bottom-0 p-3 pb-5 flex items-end justify-between z-20">
      {/* LEFT: Clean 360° Virtual Analog Joystick */}
      <div className="pointer-events-auto flex items-center justify-center select-none bg-slate-950/85 backdrop-blur-xl p-2 rounded-full border-2 border-cyan-500/30 shadow-2xl shadow-cyan-950/50">
        <div
          ref={joystickBaseRef}
          onPointerDown={handleJoystickPointerDown}
          onPointerMove={handleJoystickPointerMove}
          onPointerUp={handleJoystickPointerUp}
          onPointerCancel={handleJoystickPointerUp}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center touch-none cursor-pointer transition-colors ${
            isJoystickActive
              ? 'bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-cyan-400 shadow-xl shadow-cyan-500/30'
              : 'bg-slate-950/90 border-2 border-slate-700/80 hover:border-cyan-500/50'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Friendly Cardinal Soft Dot Markers */}
          <div className="absolute top-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50 pointer-events-none" />
          <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50 pointer-events-none" />
          <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50 pointer-events-none" />
          <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50 pointer-events-none" />

          {/* Directional Crosshairs */}
          <div className="absolute inset-5 rounded-full border border-dashed border-slate-700/60 pointer-events-none" />
          <div className="absolute w-full h-[1px] bg-slate-800/80 pointer-events-none" />
          <div className="absolute h-full w-[1px] bg-slate-800/80 pointer-events-none" />

          {/* Draggable Analog Thumb Knob */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center border-2 shadow-2xl transition-transform ${
              isJoystickActive
                ? 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 border-cyan-200 text-slate-950 shadow-cyan-500/60 scale-105'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 border-slate-500 text-slate-300'
            }`}
            style={{
              transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
              pointerEvents: 'none',
            }}
          >
            <div
              className={`w-4 h-4 rounded-full border ${
                isJoystickActive ? 'bg-white border-cyan-200 shadow-sm' : 'bg-slate-500 border-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Action Buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-2.5 select-none">
        {/* Flashlight Toggle & Sprint with Tactical Stamina Bar */}
        <div className="flex items-center gap-2">
          {/* Flashlight Toggle Button */}
          <button
            type="button"
            onClick={onFlashlightToggle}
            className={`h-14 px-3 rounded-2xl flex flex-col items-center justify-center border shadow-lg active:scale-95 transition-all touch-none cursor-pointer ${
              isPowerRestored
                ? 'bg-gradient-to-b from-emerald-500 to-teal-700 border-emerald-300 text-white shadow-emerald-500/30'
                : flashlightOn
                ? 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-cyan-200 text-slate-950 shadow-cyan-500/40 scale-102'
                : 'bg-slate-950/85 backdrop-blur-xl border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40'
            }`}
            title="Linterna (Tecla F)"
          >
            {isPowerRestored ? (
              <>
                <Power className="w-4 h-4 text-emerald-200 animate-pulse" />
                <span className="text-[9px] font-mono font-bold mt-0.5 whitespace-nowrap text-emerald-100">
                  LUZ 100%
                </span>
              </>
            ) : (
              <>
                <Flashlight className={`w-4 h-4 ${flashlightOn ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] font-mono font-bold mt-0.5 whitespace-nowrap">
                  {flashlightOn ? 'LUZ' : 'SIGILO'}
                </span>
              </>
            )}
          </button>

          {/* Tactical Stamina Meter with Live Percentage */}
          <div className="flex flex-col items-center gap-1 bg-slate-950/85 backdrop-blur-xl p-1.5 px-2.5 rounded-2xl border border-slate-800 shadow-md min-w-[76px]">
            <div className="flex items-center justify-between w-full text-[9px] font-mono font-bold leading-none">
              <span className="text-slate-400">STAMINA</span>
              <span className={staminaPercent > 25 ? 'text-amber-400' : 'text-red-400 animate-pulse'}>
                {Math.round(staminaPercent)}%
              </span>
            </div>
            <div className="w-16 bg-slate-900 rounded-full h-2 overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  staminaPercent > 25 ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${staminaPercent}%` }}
              />
            </div>
          </div>

          {/* Sprint Button with Pointer Capture */}
          <button
            type="button"
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {}
              onSprintToggle(true);
            }}
            onPointerUp={(e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}
              onSprintToggle(false);
            }}
            onPointerCancel={(e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {}
              onSprintToggle(false);
            }}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shadow-lg active:scale-95 transition-all touch-none cursor-pointer ${
              isSprinting
                ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-amber-500/40 scale-102'
                : 'bg-slate-950/85 backdrop-blur-xl border-slate-700 text-amber-400 hover:border-amber-400/60'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span className="text-[9px] font-mono font-bold mt-0.5">CORRER</span>
          </button>
        </div>

        {/* Dynamic Contextual Action Button */}
        {canLaunchEscapePod ? (
          <button
            type="button"
            onPointerDown={handleSafeActionTrigger}
            className="px-6 py-4 rounded-3xl flex items-center gap-3 border-2 shadow-2xl transition-all touch-none font-bold text-base bg-gradient-to-r from-red-600 to-amber-600 border-red-300 text-white animate-bounce shadow-red-500/50 hover:scale-105 cursor-pointer"
          >
            <Rocket className="w-7 h-7 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-sm font-tech">¡DESPEGAR ENDEAVOUR!</span>
              <span className="text-[11px] text-amber-200 font-normal">Evacuación NASA 4/4 completa</span>
            </div>
          </button>
        ) : nearbyTaskProp && activeMission ? (
          activeMission.mechanicType !== 'data_download' &&
          activeMission.mechanicType !== 'decontamination' &&
          activeMission.mechanicType !== 'anomalies' ? (
            <button
              type="button"
              onPointerDown={handleSafeActionTrigger}
              className="px-6 py-4 rounded-3xl flex items-center gap-3 border-2 shadow-2xl transition-all touch-none font-bold text-base bg-gradient-to-r from-amber-600 to-yellow-600 border-yellow-300 text-white active:scale-95 shadow-yellow-500/50 hover:scale-105 cursor-pointer relative overflow-hidden"
            >
              <Wrench className="w-7 h-7 relative z-10 animate-bounce" />
              <div className="flex flex-col text-left relative z-10">
                <span className="text-sm font-tech">
                  {activeMission.mechanicType === 'precision'
                    ? '¡INICIAR CALIBRACIÓN!'
                    : activeMission.mechanicType === 'wire_connect'
                    ? '¡RESTAURAR ENERGÍA!'
                    : activeMission.mechanicType === 'memory_sequence'
                    ? '¡ABRIR SECUENCIA!'
                    : activeMission.mechanicType === 'swipe_clean'
                    ? '¡LIMPIAR SENSORES!'
                    : activeMission.mechanicType === 'safe_drag'
                    ? '¡ENRUTAR DATOS!'
                    : activeMission.mechanicType === 'multi_touch_pressure'
                    ? '¡ESTABILIZAR PRESIÓN!'
                    : activeMission.mechanicType === 'dial_rotation'
                    ? '¡SINCRONIZAR ANTENA!'
                    : activeMission.mechanicType === 'spam_tap'
                    ? '¡BOMBEAR OXÍGENO!'
                    : activeMission.mechanicType === 'virus_purge'
                    ? '¡PURGAR VIRUS!'
                    : activeMission.mechanicType === 'dodge_nanobots'
                    ? '¡AISLAR NANOBOTS!'
                    : '¡INICIAR TAREA!'}
                </span>
                <span className="text-[11px] text-yellow-100 font-normal">
                  {activeMission.title}
                </span>
              </div>
            </button>
          ) : activeMission.mechanicType === 'data_download' ? (
            <button
              type="button"
              onPointerDown={onHoldStart}
              onPointerUp={onHoldEnd}
              onPointerLeave={onHoldEnd}
              className="px-6 py-4 rounded-3xl flex items-center gap-3 border-2 shadow-2xl transition-all touch-none font-bold text-base bg-gradient-to-r from-indigo-600 to-cyan-600 border-cyan-300 text-white animate-pulse shadow-cyan-500/50 hover:scale-105 cursor-pointer relative overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-cyan-400/40 transition-all duration-75 pointer-events-none"
                style={{ width: `${missionProgress}%` }}
              />
              <Wrench className="w-7 h-7 relative z-10" />
              <div className="flex flex-col text-left relative z-10">
                <span className="text-sm font-tech">
                  MANTÉN PRESIONADO ({Math.floor(missionProgress)}%)
                </span>
                <span className="text-[11px] text-cyan-100 font-normal">
                  {activeMission.title}
                </span>
              </div>
            </button>
          ) : activeMission.mechanicType === 'decontamination' ? (
            <div className="px-6 py-4 rounded-3xl flex items-center gap-3 border-2 shadow-2xl font-bold text-base bg-gradient-to-r from-teal-700 to-emerald-700 border-emerald-300 text-white animate-pulse shadow-emerald-500/50 relative overflow-hidden">
              <div
                className="absolute inset-0 bg-emerald-400/40 transition-all duration-75 pointer-events-none"
                style={{ width: `${missionProgress}%` }}
              />
              <Sparkles className="w-7 h-7 relative z-10 animate-spin text-emerald-200" />
              <div className="flex flex-col text-left relative z-10">
                <span className="text-sm font-tech">
                  DESCONTAMINANDO ({Math.floor(missionProgress)}%)
                </span>
                <span className="text-[11px] text-teal-200 font-normal">
                  Quédate quieto 4s
                </span>
              </div>
            </div>
          ) : (
            // anomalies
            <div className="px-6 py-4 rounded-3xl flex items-center gap-3 border-2 shadow-2xl font-bold text-base bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-300 text-white shadow-emerald-500/50">
              <Sparkles className="w-7 h-7 animate-bounce text-yellow-300" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-tech">
                  PISA LAS 5 ANOMALÍAS ({activeMission.collectedAnomalies || 0}/5)
                </span>
                <span className="text-[11px] text-emerald-100 font-normal">
                  Camina sobre las orbes doradas
                </span>
              </div>
            </div>
          )
        ) : (
          <button
            type="button"
            onPointerDown={(e) => {
              if (isPlayerHidden || nearbyHidingProp) {
                handleSafeActionTrigger(e);
              }
            }}
            disabled={!isPlayerHidden && !nearbyHidingProp}
            className={`px-6 py-4 rounded-3xl flex items-center gap-3 border-2 shadow-2xl transition-all touch-none font-bold text-base ${
              isPlayerHidden
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-300 text-white animate-pulse shadow-emerald-500/40 hover:scale-105 cursor-pointer'
                : nearbyHidingProp
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-300 text-white animate-bounce shadow-cyan-500/50 hover:scale-105 cursor-pointer'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-500 opacity-60 cursor-not-allowed'
            }`}
          >
            {isPlayerHidden ? (
              <>
                <LogOut className="w-6 h-6" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-tech">SALIR DEL ESCONDITE</span>
                  <span className="text-[11px] text-emerald-200 font-normal">Pulsa para salir</span>
                </div>
              </>
            ) : nearbyHidingProp ? (
              <>
                <Shield className="w-7 h-7 text-cyan-200 fill-cyan-400/40" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-tech tracking-wide">¡ESCONDERSE!</span>
                  <span className="text-[11px] text-cyan-200 font-normal">
                    {nearbyHidingProp.type === 'vent' ? 'Entrar a la rejilla' : 'Ocultarse'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Shield className="w-6 h-6" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-tech">ESCONDERSE</span>
                  <span className="text-[10px] text-slate-400 font-normal">Acércate a un prop</span>
                </div>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
