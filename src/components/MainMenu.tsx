import React, { useState } from 'react';
import {
  Play,
  Film,
  HelpCircle,
  ChevronRight,
  X,
  Compass,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { Animated } from '../utils/animated';

interface MainMenuProps {
  onStartGame: () => void;
  onWatchIntro: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  selectedColor?: string;
  onChangeColor?: (color: string) => void;
}

export function MainMenu({
  onStartGame,
  onWatchIntro,
}: MainMenuProps) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [opacityAnim] = useState(() => new Animated.Value(1));

  // Transición Suave de Inicio (Fade Out 800ms) usando Animated.timing
  const handleStart = () => {
    if (isStarting) return;
    setIsStarting(true);
    soundManager.playDoorUnlock();

    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onStartGame();
      }
    });
  };

  return (
    <Animated.View
      className="absolute inset-0 w-screen h-screen overflow-hidden flex flex-col items-center justify-between select-none z-10"
      style={{
        backgroundColor: 'transparent',
        opacity: opacityAnim,
        pointerEvents: isStarting ? 'none' : 'auto',
      }}
    >
      {/* 3. Banda Cinematográfica Superior: franja negra (height: 10% o 60px, backgroundColor: '#000') */}
      <div
        className="w-full h-[10%] min-h-[60px] pointer-events-none z-20 shrink-0"
        style={{ backgroundColor: '#000' }}
      />

      {/* 4. Esquineros Reticulares en las 4 Esquinas Interiores ('⌜ ⌝ ⌞ ⌟' en rgba(255,255,255,0.3)) */}
      <div
        className="absolute top-[10%] left-6 sm:left-10 mt-3 text-lg sm:text-xl font-mono leading-none select-none pointer-events-none z-20"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        ⌜
      </div>
      <div
        className="absolute top-[10%] right-6 sm:right-10 mt-3 text-lg sm:text-xl font-mono leading-none select-none pointer-events-none z-20"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        ⌝
      </div>
      <div
        className="absolute bottom-[10%] left-6 sm:left-10 mb-3 text-lg sm:text-xl font-mono leading-none select-none pointer-events-none z-20"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        ⌞
      </div>
      <div
        className="absolute bottom-[10%] right-6 sm:right-10 mb-3 text-lg sm:text-xl font-mono leading-none select-none pointer-events-none z-20"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        ⌟
      </div>

      {/* Center Action & Title Area (Minimalista, sin HUD) */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center max-w-xl w-full px-4 my-auto">
        {/* Título Modificado: exactamente "PROJECT REBIRTH" (con espacio normal, sin guion bajo) */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-8 sm:mb-10 font-mono drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] drop-shadow-[0_0_35px_rgba(6,182,212,0.5)]">
          PROJECT REBIRTH
        </h1>

        {/* Action Buttons Column */}
        <div className="w-full max-w-sm flex flex-col items-center gap-3">
          {/* 1. Botón Principal: "INICIAR MISIÓN" */}
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base tracking-wider uppercase font-mono shadow-xl shadow-cyan-500/30 hover:shadow-cyan-400/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950 transition-transform group-hover:scale-110" />
            <span>INICIAR MISIÓN</span>
            <ChevronRight className="w-5 h-5 text-slate-950/80 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* 2 & 3. Botones Secundarios: "VER CINEMÁTICA DE INTRO" y "GUÍA DE SUPERVIVENCIA" */}
          <div className="flex items-center justify-center gap-3 pt-2 w-full flex-wrap">
            <button
              type="button"
              onClick={onWatchIntro}
              className="py-1 px-2.5 bg-transparent border-0 text-cyan-400/80 hover:text-cyan-300 font-mono text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] cursor-pointer hover:underline"
            >
              <Film className="w-3.5 h-3.5 text-cyan-400/80" />
              <span>VER CINEMÁTICA DE INTRO</span>
            </button>
            <span className="text-slate-600/80 select-none">•</span>
            <button
              type="button"
              onClick={() => setShowInstructions(true)}
              className="py-1 px-2.5 bg-transparent border-0 text-slate-400 hover:text-slate-200 font-mono text-xs tracking-wider uppercase transition-colors flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] cursor-pointer hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>GUÍA DE SUPERVIVENCIA</span>
            </button>
          </div>
        </div>
      </main>

      {/* 3 & 4. Banda Cinematográfica Inferior con Firma: (height: 10% o 60px, backgroundColor: '#000') */}
      <div
        className="w-full h-[10%] min-h-[60px] pointer-events-none z-20 flex items-center justify-end px-6 sm:px-10 shrink-0"
        style={{ backgroundColor: '#000' }}
      >
        <span
          className="text-xs font-mono tracking-widest uppercase select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
          style={{ color: 'rgba(255, 255, 255, 0.45)' }}
        >
          SYS.v1.0 // ONLINE_
        </span>
      </div>

      {/* Survival Guide Modal (Abierto al pulsar GUÍA DE SUPERVIVENCIA) */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-left relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              title="Cerrar manual"
              aria-label="Cerrar manual"
              onClick={() => setShowInstructions(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center">
                <Compass className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-mono text-white">MANUAL DE EVACUACIÓN</h3>
                <span className="text-xs text-cyan-400 font-mono">PROTOCOLOS DE SEGURIDAD ESTELAR</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 font-sans leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-cyan-300 font-mono block mb-1">
                  1. ZONA SEGURA (CENTRO DE CONTROL)
                </span>
                Inicias en el santuario inmune protegido por un campo de fuerza. Al salir de la sala por primera vez, el escudo caerá permanentemente.
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-purple-300 font-mono block mb-1">
                  2. LOS 8 ALIENS Y SIGILO
                </span>
                Un alien patrulla la zona de misión activa; otros 7 rondan los pasillos. Escóndete en taquillas y respiraderos para que pasen de largo.
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-amber-300 font-mono block mb-1">
                  3. MINIJUEGOS Y 4 MISIONES
                </span>
                Completa reactores, empalme de cables y memorización en consolas. Hacer ruido en minijuegos puede alertar a la bestia más cercana.
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-emerald-300 font-mono block mb-1">
                  4. DESBLOQUEO DE LA CÁPSULA
                </span>
                Al completar las 4 tareas, el puente en Sala de Navegación se abre. Corre a la Cápsula de Evacuación y lánzate para ganar.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstructions(false)}
              className="mt-5 w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              ENTENDIDO, VOLVER AL MENÚ
            </button>
          </div>
        </div>
      )}
    </Animated.View>
  );
}

export default MainMenu;
