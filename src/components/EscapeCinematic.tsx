import React, { useRef, useState, useEffect } from 'react';
import { FastForward, Volume2, VolumeX, Rocket } from 'lucide-react';
import { Animated } from '../utils/animated';

interface EscapeCinematicProps {
  onFinished: () => void;
}

export const ESCAPE_VIDEO_SRC = '/videos/gemini_generated_video_2854ddfc.mp4';

/**
 * Pantalla Cinemática de Evacuación (Escape Pod Takeoff)
 * Se reproduce al interactuar con el Transbordador tras completar las 4 misiones:
 * - Astronauta huyendo del alien por el pasillo
 * - Salto de emergencia al interior de la nave y cierre de compuerta en las narices del alien
 * - Cabina de mando con ignición de motores
 * - Despegue del transbordador impulsado por plasma alejándose de la estación hacia el espacio
 */
export function EscapeCinematicScreen({ onFinished }: EscapeCinematicProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [opacityAnim] = useState(() => new Animated.Value(1));
  const isTransitioningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.currentTime = 0;
      vid.play().catch(() => {
        // If unmuted autoplay is blocked by browser policy, fallback to muted playback
        vid.muted = true;
        setIsMuted(true);
        vid.play().catch(() => {});
      });
    }
  }, []);

  const handleFinish = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);

    // Smooth 700ms crossfade to victory screen
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 700,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onFinished();
      }
    });

    // Fade out audio alongside the video opacity
    const vid = videoRef.current;
    if (vid) {
      const initialVol = vid.volume;
      const audioStart = performance.now();
      const fadeAudio = (now: number) => {
        const elapsed = now - audioStart;
        const progress = Math.min(1, elapsed / 700);
        vid.volume = Math.max(0, initialVol * (1 - progress));
        if (progress < 1) {
          requestAnimationFrame(fadeAudio);
        } else {
          vid.volume = 0;
        }
      };
      requestAnimationFrame(fadeAudio);
    }
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        pointerEvents: isTransitioning ? 'none' : 'auto',
      }}
      className="fixed inset-0 w-full h-full z-45 bg-black overflow-hidden select-none flex items-center justify-center font-sans"
    >
      {/* 1. Full-screen Video Player */}
      <video
        ref={videoRef}
        src={ESCAPE_VIDEO_SRC}
        autoPlay
        playsInline
        preload="auto"
        muted={isMuted}
        controls={false}
        onEnded={handleFinish}
        className="w-full h-full object-cover absolute inset-0"
      />

      {/* 2. Top Cinematic Letterbox Overlay */}
      <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/95 via-black/70 to-transparent pointer-events-none z-10 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-900/40">
            <Rocket className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
              EVACUACIÓN EN CURSO • TRANSBORDADOR NASA ENDEAVOUR
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono text-slate-300/80">
              SECUENCIA DE DESPEGUE // MOTORES DE PLASMA AL 100%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons (Skip & Audio Toggle) */}
      <div className="absolute top-4 sm:top-5 right-4 sm:right-8 z-30 flex items-center gap-2.5">
        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => {
            const vid = videoRef.current;
            const nextMuted = !isMuted;
            if (vid) {
              vid.muted = nextMuted;
            }
            setIsMuted(nextMuted);
          }}
          className="px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-white/20 hover:border-cyan-400/60 backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-mono shadow-xl shadow-black/60 cursor-pointer active:scale-95"
          title="Silenciar / Activar Sonido"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          <span className="text-[10px] font-bold">{isMuted ? 'MUTE' : 'AUDIO'}</span>
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleFinish}
          className="px-4 py-2 rounded-xl bg-cyan-500/30 hover:bg-cyan-500/50 text-white border border-cyan-400/60 backdrop-blur-md shadow-xl shadow-cyan-950/60 transition-all transform active:scale-95 flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider group cursor-pointer"
        >
          <span>Saltar</span>
          <FastForward className="w-3.5 h-3.5 text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4. Bottom Cinematic Subtitles & Telemetry Status Bar */}
      <div className="absolute bottom-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none z-10 flex items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] sm:text-xs font-mono text-emerald-300 tracking-widest uppercase drop-shadow">
            COMPUERTA BLINDADA SELLADA • INICIANDO SALTO A VELOCIDAD DE ESCAPE
          </span>
        </div>
        <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
          SYS.v1.0 // POD_ESCAPE_ONLINE
        </span>
      </div>
    </Animated.View>
  );
}

export default EscapeCinematicScreen;
