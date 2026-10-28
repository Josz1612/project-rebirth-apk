import React, { useRef, useState, useEffect } from 'react';
import { FastForward, Volume2, VolumeX } from 'lucide-react';
import { Animated } from '../utils/animated';

export const INTRO_VIDEO_SRC = '/videos/intro_cinematica.mp4';

export type VideoSource = string | { uri?: string; default?: string };

interface VideoProps {
  source: VideoSource;
  style?: React.CSSProperties;
  className?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch';
  repeat?: boolean;
  controls?: boolean;
  onEnd?: () => void;
  onAutoMuted?: () => void;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

/**
 * React Native Video compatible component for full-screen seamless playback
 */
export function Video({
  source,
  style,
  className,
  resizeMode = 'cover',
  repeat = false,
  controls = false,
  onEnd,
  onAutoMuted,
  autoPlay = true,
  muted = false,
  playsInline = true,
  videoRef,
}: VideoProps) {
  const localRef = useRef<HTMLVideoElement>(null);
  const activeRef = videoRef || localRef;

  const videoSrc =
    typeof source === 'string'
      ? source
      : source?.uri || source?.default || INTRO_VIDEO_SRC;

  useEffect(() => {
    const vid = activeRef.current;
    if (vid && autoPlay) {
      vid.play().catch(() => {
        // If unmuted autoplay is blocked by browser policy, play muted and let user unmute
        vid.muted = true;
        onAutoMuted?.();
        vid.play().catch(() => {});
      });
    }
  }, [autoPlay, activeRef, onAutoMuted]);

  const fitClass =
    resizeMode === 'cover'
      ? 'object-cover'
      : resizeMode === 'stretch'
      ? 'object-fill'
      : 'object-contain';

  return (
    <video
      ref={activeRef}
      src={videoSrc}
      autoPlay={autoPlay}
      controls={controls}
      loop={repeat}
      muted={muted}
      playsInline={playsInline}
      preload="auto"
      onEnded={onEnd}
      className={`w-full h-full ${fitClass} ${className || ''}`}
      style={style}
    />
  );
}

interface IntroCinematicProps {
  onFinished: () => void;
  onEnd?: () => void;
  onSkip?: () => void;
}

/**
 * Pantalla INTRO_CINEMATIC (Capa Superior a pantalla completa)
 * Crossfade suave de opacidad 1 -> 0 durante 1000ms usando Animated.View y Animated.timing.
 * Una vez que la opacidad es 0, se desmonta el reproductor.
 */
export function IntroCinematicScreen({ onFinished, onEnd, onSkip }: IntroCinematicProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [opacityAnim] = useState(() => new Animated.Value(1));
  const isTransitioningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFinish = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);

    // 2. Transición Suave (Crossfade): Anima opacidad de 1 a 0 durante exactamente 1000ms
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        if (onFinished) onFinished();
        if (onEnd) onEnd();
        if (onSkip) onSkip();
      }
    });

    // Desvanecimiento suave del audio durante los 1000ms
    const vid = videoRef.current;
    if (vid) {
      const initialVol = vid.volume;
      const audioStart = performance.now();
      const fadeAudio = (now: number) => {
        const elapsed = now - audioStart;
        const progress = Math.min(1, elapsed / 1000);
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
      className="fixed inset-0 w-full h-full z-10 bg-black overflow-hidden select-none flex items-center justify-center"
    >
      {/* 2. Reproductor de Video a Pantalla Completa */}
      <Video
        source={INTRO_VIDEO_SRC}
        onEnd={handleFinish}
        onAutoMuted={() => setIsMuted(true)}
        autoPlay={true}
        controls={false}
        muted={isMuted}
        resizeMode="cover"
        videoRef={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 4. Botón semitransparente de "Saltar" arriba a la derecha */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {/* Toggle de Audio */}
        <button
          type="button"
          onClick={() => {
            const nextMuted = !isMuted;
            if (videoRef.current) {
              videoRef.current.muted = nextMuted;
            }
            setIsMuted(nextMuted);
          }}
          className="px-3 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/50 backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-mono shadow-lg shadow-black/40 cursor-pointer"
          title="Silenciar / Activar Sonido"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          <span className="hidden sm:inline">{isMuted ? 'MUTE' : 'AUDIO'}</span>
        </button>

        {/* Botón Saltar */}
        <button
          type="button"
          onClick={handleFinish}
          className="px-5 py-2.5 rounded-2xl bg-black/40 hover:bg-black/65 text-white border border-white/20 hover:border-cyan-400/60 backdrop-blur-md shadow-xl shadow-black/60 transition-all transform active:scale-95 flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wider font-mono uppercase group cursor-pointer"
        >
          <span>Saltar</span>
          <FastForward className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Marca de agua / Badge cinemático sutil inferior */}
      <div className="absolute bottom-5 left-6 z-20 pointer-events-none flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-xs font-mono text-cyan-300/80 tracking-widest uppercase drop-shadow-md">
          PROJECT_REBIRTH // INTRUSIÓN ALIENÍGENA DETECTADA
        </span>
      </div>
    </Animated.View>
  );
}

export default IntroCinematicScreen;
