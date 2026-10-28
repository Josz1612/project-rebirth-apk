import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle2, Zap, Power, AlertTriangle, Shuffle } from 'lucide-react';
import { Mission } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { SwipeCleanMinigame } from './minigames/SwipeCleanMinigame';
import { SafeDragMinigame } from './minigames/SafeDragMinigame';
import { MultiTouchPressureMinigame } from './minigames/MultiTouchPressureMinigame';
import { DialRotationMinigame } from './minigames/DialRotationMinigame';
import { SpamTapMinigame } from './minigames/SpamTapMinigame';
import { VirusPurgeMinigame } from './minigames/VirusPurgeMinigame';
import { DodgeNanobotsMinigame } from './minigames/DodgeNanobotsMinigame';

interface InteractiveMinigameModalProps {
  mission: Mission;
  onComplete: () => void;
  onClose: () => void;
  onMissionNoise?: () => void;
}

interface WireDef {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  glowClass: string;
}

const ALL_WIRES: WireDef[] = [
  { id: 'red', name: 'Rojo', color: '#ef4444', bgClass: 'bg-red-500', glowClass: 'shadow-red-500/80 border-red-300' },
  { id: 'blue', name: 'Azul', color: '#3b82f6', bgClass: 'bg-blue-500', glowClass: 'shadow-blue-500/80 border-blue-300' },
  { id: 'yellow', name: 'Amarillo', color: '#eab308', bgClass: 'bg-amber-400', glowClass: 'shadow-amber-400/80 border-yellow-200' },
  { id: 'green', name: 'Verde', color: '#10b981', bgClass: 'bg-emerald-500', glowClass: 'shadow-emerald-500/80 border-emerald-300' },
];

function shuffleArray<T>(arr: readonly T[] | T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export const InteractiveMinigameModal: React.FC<InteractiveMinigameModalProps> = ({
  mission,
  onComplete,
  onClose,
  onMissionNoise,
}) => {
  // ================= 1. PRECISION MINIGAME (OSCILACIÓN CONTINUA) =================
  const [gaugePos, setGaugePos] = useState<number>(4);
  const [precisionFeedback, setPrecisionFeedback] = useState<'idle' | 'success' | 'fail'>('idle');
  const precisionLockRef = useRef<boolean>(false);

  useEffect(() => {
    if (mission.mechanicType !== 'precision') return;

    let animId: number;
    const period = 1750; // 1.75s for full back-and-forth oscillation
    const startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const norm = (Math.sin((elapsed / period) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      const pos = 4 + norm * 92;
      setGaugePos(pos);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [mission.mechanicType]);

  const handlePrecisionTrigger = () => {
    if (precisionLockRef.current || precisionFeedback === 'success') return;
    precisionLockRef.current = true;

    // Attract nearest alien with noise
    onMissionNoise?.();
    soundManager.playMissionButtonClick(3);

    // Green target precision zone: 40% to 60%
    if (gaugePos >= 40 && gaugePos <= 60) {
      setPrecisionFeedback('success');
      soundManager.playTaskComplete();
      setTimeout(() => {
        onComplete();
      }, 700);
    } else {
      setPrecisionFeedback('fail');
      soundManager.playMissionSoftError();
      setTimeout(() => {
        setPrecisionFeedback('idle');
        precisionLockRef.current = false;
      }, 650);
    }
  };

  // ================= 2. MEMORY SEQUENCE MINIGAME (SIN DOBLE CLIC) =================
  const [memorySequence] = useState<number[]>(() => [
    Math.floor(Math.random() * 3),
    Math.floor(Math.random() * 3),
    Math.floor(Math.random() * 3),
  ]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [activeFlashIndex, setActiveFlashIndex] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState<boolean>(true);
  const [memoryFeedback, setMemoryFeedback] = useState<'idle' | 'success' | 'fail'>('idle');
  const isMemoryLockedRef = useRef<boolean>(false);

  useEffect(() => {
    if (mission.mechanicType !== 'memory_sequence') return;

    setIsShowingSequence(true);
    let step = 0;

    const interval = setInterval(() => {
      if (step < memorySequence.length) {
        const btnIndex = memorySequence[step];
        setActiveFlashIndex(btnIndex);
        soundManager.playMissionButtonClick(btnIndex);

        setTimeout(() => {
          setActiveFlashIndex(null);
        }, 340);

        step++;
      } else {
        clearInterval(interval);
        setIsShowingSequence(false);
      }
    }, 650);

    return () => clearInterval(interval);
  }, [mission.mechanicType, memorySequence]);

  const handleMemoryButtonClick = (index: number) => {
    if (isShowingSequence || isMemoryLockedRef.current || memoryFeedback !== 'idle') return;
    isMemoryLockedRef.current = true;

    onMissionNoise?.();
    soundManager.playMissionButtonClick(index);
    const nextInput = [...playerSequence, index];
    setPlayerSequence(nextInput);

    setActiveFlashIndex(index);
    setTimeout(() => {
      setActiveFlashIndex(null);
    }, 180);

    const stepIndex = nextInput.length - 1;
    if (nextInput[stepIndex] !== memorySequence[stepIndex]) {
      setMemoryFeedback('fail');
      soundManager.playMissionSoftError();
      setTimeout(() => {
        setPlayerSequence([]);
        setMemoryFeedback('idle');
        isMemoryLockedRef.current = false;

        setIsShowingSequence(true);
        let s = 0;
        const reInterval = setInterval(() => {
          if (s < memorySequence.length) {
            const fbIndex = memorySequence[s];
            setActiveFlashIndex(fbIndex);
            soundManager.playMissionButtonClick(fbIndex);
            setTimeout(() => setActiveFlashIndex(null), 320);
            s++;
          } else {
            clearInterval(reInterval);
            setIsShowingSequence(false);
          }
        }, 580);
      }, 850);
      return;
    }

    if (nextInput.length === memorySequence.length) {
      setMemoryFeedback('success');
      soundManager.playTaskComplete();
      setTimeout(() => {
        onComplete();
      }, 750);
    } else {
      setTimeout(() => {
        isMemoryLockedRef.current = false;
      }, 350);
    }
  };

  // ================= 3. RED DE ENERGÍA (TOTALMENTE ALEATORIZADA CADA VEZ) =================
  const [leftWires, setLeftWires] = useState<WireDef[]>(() => shuffleArray(ALL_WIRES));
  const [rightSockets, setRightSockets] = useState<WireDef[]>(() => {
    let s = shuffleArray(ALL_WIRES);
    return s;
  });
  const [requiredOrder, setRequiredOrder] = useState<string[]>(() => shuffleArray(['red', 'blue', 'yellow', 'green']));
  const [connectedWires, setConnectedWires] = useState<string[]>([]);
  const [selectedLeftWire, setSelectedLeftWire] = useState<string | null>(null);
  const [wireFeedback, setWireFeedback] = useState<'idle' | 'success' | 'fail'>('idle');
  const [wireFeedbackMsg, setWireFeedbackMsg] = useState<string>('');

  // Randomize all wire positions & sequence dynamically
  const randomizeWirePuzzle = useCallback(() => {
    const newLeft = shuffleArray(ALL_WIRES);
    let newRight = shuffleArray(ALL_WIRES);
    // Ensure right sockets have different order than left for realistic cross-over wiring
    if (newLeft.map((w) => w.id).join(',') === newRight.map((w) => w.id).join(',')) {
      newRight = [newRight[1], newRight[2], newRight[3], newRight[0]];
    }
    const newOrder = shuffleArray(['red', 'blue', 'yellow', 'green']);
    setLeftWires(newLeft);
    setRightSockets(newRight);
    setRequiredOrder(newOrder);
    setConnectedWires([]);
    setSelectedLeftWire(newOrder[0] || 'red');
    setWireFeedback('idle');
    setWireFeedbackMsg('');
  }, []);

  // Guarantee re-randomization on every mount and open
  useEffect(() => {
    if (mission.mechanicType === 'wire_connect') {
      randomizeWirePuzzle();
    }
  }, [mission.mechanicType, randomizeWirePuzzle]);

  const currentRequiredWire = requiredOrder[connectedWires.length];

  const handleSelectLeftWire = (wireId: string) => {
    if (connectedWires.includes(wireId)) return;
    setSelectedLeftWire(wireId);
    onMissionNoise?.();
    const wireIdx = ALL_WIRES.findIndex((w) => w.id === wireId);
    soundManager.playMissionButtonClick(wireIdx >= 0 ? wireIdx : 0);
  };

  const handleConnectRightSocket = (socketId: string) => {
    if (wireFeedback === 'success' || wireFeedback === 'fail') return;
    if (connectedWires.includes(socketId)) return;

    onMissionNoise?.();

    // Check color matching
    if (selectedLeftWire !== socketId) {
      setWireFeedback('fail');
      setWireFeedbackMsg('¡Error de Polaridad! El color del terminal no coincide con el enchufe receptor.');
      soundManager.playMissionSoftError();

      // Re-scramble positions on failure so order is dynamic on every attempt
      setTimeout(() => {
        randomizeWirePuzzle();
      }, 750);
      return;
    }

    // Check sequence requirement
    if (selectedLeftWire !== currentRequiredWire) {
      const correctWireDef = ALL_WIRES.find((w) => w.id === currentRequiredWire);
      setWireFeedback('fail');
      setWireFeedbackMsg(`¡Secuencia incorrecta! Debes conectar primero el cable ${correctWireDef?.name.toUpperCase()}.`);
      soundManager.playMissionSoftError();
      setTimeout(() => {
        randomizeWirePuzzle();
      }, 750);
      return;
    }

    // Success connection for this wire!
    soundManager.playMissionToolPing();
    const updated = [...connectedWires, socketId];
    setConnectedWires(updated);

    // Auto-select next required wire for frictionless gameplay
    const nextIdx = updated.length;
    if (nextIdx < requiredOrder.length) {
      setSelectedLeftWire(requiredOrder[nextIdx]);
    } else {
      setSelectedLeftWire(null);
    }

    // If all 4 connected: Mission Complete!
    if (updated.length === 4) {
      setWireFeedback('success');
      soundManager.playPowerRestore();
      setTimeout(() => {
        onComplete();
      }, 950);
    }
  };

  const memoryButtonDefs = [
    { name: 'Rojo Alfa', bg: 'bg-red-500', active: 'bg-red-300 ring-4 ring-red-300 shadow-red-500/80 scale-95' },
    { name: 'Amarillo Beta', bg: 'bg-amber-400', active: 'bg-yellow-200 ring-4 ring-yellow-200 shadow-amber-400/80 scale-95' },
    { name: 'Azul Gamma', bg: 'bg-cyan-500', active: 'bg-cyan-200 ring-4 ring-cyan-200 shadow-cyan-400/80 scale-95' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/88 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none touch-manipulation animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 border-2 border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-cyan-950/70 text-slate-100 relative overflow-hidden">
        {/* Ambient Top Glow Laser Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          title="Cerrar terminal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Clean Modern Tech Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-2xl shadow-inner shadow-cyan-950">
            {mission.icon}
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              TERMINAL // {mission.roomName}
            </div>
            <h3 className="text-base font-black font-tech text-white leading-tight">
              {mission.title}
            </h3>
          </div>
        </div>

        {/* ================= 1. MINIGAME: PRECISION OSCILLATOR ================= */}
        {mission.mechanicType === 'precision' && (
          <div className="space-y-4 my-2">
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              Detén el indicador móvil cuando cruce la zona verde central para calibrar el sistema.
            </p>

            {/* Gauge Track */}
            <div className="relative h-14 bg-slate-950 rounded-2xl border-2 border-slate-700 p-1 flex items-center overflow-hidden shadow-inner">
              {/* Target Green Zone: 40% to 60% */}
              <div className="absolute inset-y-1 left-[40%] w-[20%] bg-emerald-500/30 border-x-2 border-emerald-400 rounded-lg flex items-center justify-center">
                <span className="text-[10px] font-tech font-bold text-emerald-300 uppercase tracking-widest animate-pulse">
                  ÓPTIMO
                </span>
              </div>

              {/* Oscillating Needle / Indicator */}
              <div
                className="absolute top-1 bottom-1 w-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/80 -translate-x-1/2 border border-white"
                style={{ left: `${gaugePos}%` }}
              />
            </div>

            {/* Trigger Button */}
            <button
              type="button"
              disabled={precisionFeedback === 'success'}
              onClick={handlePrecisionTrigger}
              className={`w-full py-4 rounded-2xl font-tech font-black text-base tracking-wider transition-all cursor-pointer active:scale-95 touch-manipulation ${
                precisionFeedback === 'success'
                  ? 'bg-emerald-600 text-white shadow-emerald-500/50 shadow-lg'
                  : precisionFeedback === 'fail'
                  ? 'bg-red-600 text-white animate-shake'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/40 shadow-lg'
              }`}
            >
              {precisionFeedback === 'success'
                ? '¡SINCRONIZACIÓN EXITOSA!'
                : precisionFeedback === 'fail'
                ? '¡FUERA DE ZONA! REINTENTA'
                : '⚡ DETENER EN ZONA VERDE'}
            </button>
          </div>
        )}

        {/* ================= 2. MINIGAME: MEMORY SEQUENCE ================= */}
        {mission.mechanicType === 'memory_sequence' && (
          <div className="space-y-4 my-2">
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              {isShowingSequence
                ? 'Observa y memoriza el orden de los 3 pulsadores iluminados...'
                : '¡Reproduce la secuencia de 3 botones tocándolos en orden!'}
            </p>

            {/* 3 Memory Buttons */}
            <div className="grid grid-cols-3 gap-4">
              {memoryButtonDefs.map((btn, idx) => {
                const isFlashing = activeFlashIndex === idx;
                return (
                  <button
                    key={btn.name}
                    type="button"
                    disabled={isShowingSequence || memoryFeedback !== 'idle'}
                    onClick={() => handleMemoryButtonClick(idx)}
                    className={`h-24 rounded-2xl border-2 border-slate-700 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 touch-manipulation ${
                      isFlashing ? btn.active : btn.bg
                    } ${isShowingSequence ? 'opacity-70' : 'hover:brightness-110'}`}
                  >
                    <span className="text-2xl font-black font-tech text-slate-950">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-slate-900 tracking-wider">
                      {btn.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback message */}
            {memoryFeedback === 'success' && (
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce">
                <CheckCircle2 className="w-5 h-5" /> ¡SECUENCIA CORRECTA!
              </div>
            )}
            {memoryFeedback === 'fail' && (
              <div className="flex items-center justify-center gap-2 text-red-400 font-tech font-bold text-sm">
                <AlertTriangle className="w-5 h-5" /> ¡ERROR! REINICIANDO SECUENCIA...
              </div>
            )}
          </div>
        )}

        {/* ================= 3. MINIGAME: RED DE ENERGÍA (ALEATORIZADA) ================= */}
        {mission.mechanicType === 'wire_connect' && (
          <div className="space-y-4 my-2">
            {/* Required Connection Sequence Banner */}
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-3 shadow-inner">
              <div className="text-[10px] font-tech text-amber-300 font-bold uppercase mb-1.5 flex items-center justify-between">
                <span>SECUENCIA REQUERIDA (ALEATORIA)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={randomizeWirePuzzle}
                    className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-600 transition-all cursor-pointer active:scale-95"
                    title="Aleatorizar colores y secuencia nuevamente"
                  >
                    <Shuffle className="w-2.5 h-2.5" /> REORGANIZAR CABLES
                  </button>
                  <span className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{connectedWires.length}/4</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {requiredOrder.map((wireId, idx) => {
                  const wireInfo = ALL_WIRES.find((w) => w.id === wireId)!;
                  const isDone = connectedWires.includes(wireId);
                  const isCurrent = currentRequiredWire === wireId;

                  return (
                    <div
                      key={`seq_${wireId}`}
                      className={`py-1 px-1.5 rounded-lg border text-center transition-all ${
                        isDone
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 line-through'
                          : isCurrent
                          ? 'bg-amber-950/80 border-amber-400 text-amber-200 ring-2 ring-amber-400 animate-pulse'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="text-[9px] font-tech font-bold block truncate">
                        {idx + 1}. {wireInfo.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-slate-300 text-center leading-relaxed">
              Toca el terminal a la izquierda y conéctalo al enchufe receptor a la derecha según el orden requerido.
            </p>

            {/* Wire Junction Board with Real Vector Cables */}
            <div className="relative bg-slate-950 rounded-2xl border-2 border-slate-700 p-4 flex items-center justify-between min-h-[220px]">
              {/* Left Input Terminals */}
              <div className="flex flex-col gap-3 z-10">
                <div className="text-[9px] font-tech font-bold text-slate-400 uppercase text-center mb-0.5">
                  ENTRADA
                </div>
                {leftWires.map((wire) => {
                  const isConnected = connectedWires.includes(wire.id);
                  const isSelected = selectedLeftWire === wire.id;
                  const isCurrentTarget = currentRequiredWire === wire.id;

                  return (
                    <button
                      key={`left_${wire.id}`}
                      type="button"
                      disabled={isConnected}
                      onClick={() => handleSelectLeftWire(wire.id)}
                      className={`h-10 px-3 rounded-xl border-2 flex items-center gap-2 font-tech font-bold text-xs transition-all cursor-pointer touch-manipulation ${
                        isConnected
                          ? 'bg-slate-800/80 border-emerald-500 text-emerald-400 cursor-default opacity-85'
                          : isSelected
                          ? `${wire.bgClass} text-slate-950 ring-2 ring-white scale-105 shadow-lg`
                          : isCurrentTarget
                          ? 'bg-slate-900 border-amber-400 text-white animate-pulse'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                        style={{ backgroundColor: wire.color }}
                      />
                      <span>{wire.name}</span>
                      {isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Central Vector Cables Layer (SVG Curves connecting left terminals to right sockets) */}
              <div className="flex-1 self-stretch mx-2 relative pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  {/* Draw Connected Wires with Cross-Over Curves */}
                  {connectedWires.map((wireId) => {
                    const wireDef = ALL_WIRES.find((w) => w.id === wireId)!;
                    const leftIdx = leftWires.findIndex((w) => w.id === wireId);
                    const rightIdx = rightSockets.findIndex((w) => w.id === wireId);
                    if (leftIdx === -1 || rightIdx === -1) return null;

                    // Height of each button row: 40px + 12px gap = 52px; center offset = 38px
                    const y1 = 38 + leftIdx * 52;
                    const y2 = 38 + rightIdx * 52;

                    return (
                      <g key={`cable_${wireId}`}>
                        {/* Glow halo */}
                        <path
                          d={`M 0 ${y1} C 60 ${y1}, 60 ${y2}, 100% ${y2}`}
                          fill="none"
                          stroke={wireDef.color}
                          strokeWidth="8"
                          strokeOpacity="0.3"
                          strokeLinecap="round"
                        />
                        {/* Core solid wire */}
                        <path
                          d={`M 0 ${y1} C 60 ${y1}, 60 ${y2}, 100% ${y2}`}
                          fill="none"
                          stroke={wireDef.color}
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                        {/* Spark pulse indicator */}
                        <circle cx="50%" cy={(y1 + y2) / 2} r="3" fill="#ffffff" />
                      </g>
                    );
                  })}

                  {/* Draw selected active wire preview stretching across */}
                  {selectedLeftWire && !connectedWires.includes(selectedLeftWire) && (() => {
                    const wireDef = ALL_WIRES.find((w) => w.id === selectedLeftWire);
                    const leftIdx = leftWires.findIndex((w) => w.id === selectedLeftWire);
                    if (!wireDef || leftIdx === -1) return null;
                    const y1 = 38 + leftIdx * 52;

                    return (
                      <path
                        d={`M 0 ${y1} C 40 ${y1}, 70 ${y1 + 10}, 85% ${y1}`}
                        fill="none"
                        stroke={wireDef.color}
                        strokeWidth="3.5"
                        strokeDasharray="6,4"
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                    );
                  })()}
                </svg>
              </div>

              {/* Right Output Sockets */}
              <div className="flex flex-col gap-3 z-10">
                <div className="text-[9px] font-tech font-bold text-slate-400 uppercase text-center mb-0.5">
                  RECEPTOR
                </div>
                {rightSockets.map((sock) => {
                  const isConnected = connectedWires.includes(sock.id);

                  return (
                    <button
                      key={`right_${sock.id}`}
                      type="button"
                      disabled={isConnected}
                      onClick={() => handleConnectRightSocket(sock.id)}
                      className={`h-10 px-3 rounded-xl border-2 flex items-center gap-2 font-tech font-bold text-xs transition-all cursor-pointer touch-manipulation ${
                        isConnected
                          ? 'bg-slate-800/80 border-emerald-500 text-emerald-400 cursor-default opacity-85'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400 hover:scale-105 active:scale-95'
                      }`}
                    >
                      {isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mr-1" />}
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                        style={{ backgroundColor: sock.color }}
                      />
                      <span>{sock.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error or feedback messages */}
            {wireFeedbackMsg && (
              <div className="text-center text-xs font-tech font-bold text-red-400 animate-pulse bg-red-950/60 p-2 rounded-xl border border-red-500/50">
                {wireFeedbackMsg}
              </div>
            )}

            {wireFeedback === 'success' && (
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-tech font-bold text-sm animate-bounce">
                <Power className="w-5 h-5 text-emerald-400" /> ¡RED ELÉCTRICA RESTAURADA! TODAS LAS LUCES ENCENDIDAS
              </div>
            )}
          </div>
        )}

        {/* ================= 4. MINIGAME: LIMPIAR SENSORES (SWIPING) ================= */}
        {mission.mechanicType === 'swipe_clean' && (
          <SwipeCleanMinigame onComplete={onComplete} onMissionNoise={onMissionNoise} />
        )}

        {/* ================= 5. MINIGAME: ENRUTAR DATOS (DRAG SEGURO) ================= */}
        {mission.mechanicType === 'safe_drag' && (
          <SafeDragMinigame onComplete={onComplete} onMissionNoise={onMissionNoise} />
        )}

        {/* ================= 6. MINIGAME: ESTABILIZAR PRESIÓN (MULTI-TOUCH) ================= */}
        {mission.mechanicType === 'multi_touch_pressure' && (
          <MultiTouchPressureMinigame onComplete={onComplete} onMissionNoise={onMissionNoise} />
        )}

        {/* ================= 7. MINIGAME: SINCRONIZAR ANTENA (ROTACIÓN DIAL) ================= */}
        {mission.mechanicType === 'dial_rotation' && (
          <DialRotationMinigame onComplete={onComplete} onMissionNoise={onMissionNoise} />
        )}

        {/* ================= 8. MINIGAME: BOMBEAR OXÍGENO (SPAM TAP) ================= */}
        {mission.mechanicType === 'spam_tap' && (
          <SpamTapMinigame onComplete={onComplete} onMissionNoise={onMissionNoise} />
        )}

        {/* ================= 9. MINIGAME: PURGAR VIRUS (REFLEJOS) ================= */}
        {mission.mechanicType === 'virus_purge' && (
          <VirusPurgeMinigame onComplete={onComplete} onMissionNoise={onMissionNoise} />
        )}

        {/* ================= 10. MINIGAME: AISLAR NANOBOTS (ESQUIVAR) ================= */}
        {mission.mechanicType === 'dodge_nanobots' && (
          <DodgeNanobotsMinigame onComplete={onComplete} onMissionNoise={onMissionNoise} />
        )}
      </div>
    </div>
  );
};
