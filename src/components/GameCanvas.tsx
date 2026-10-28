import React, { useRef, useEffect } from 'react';
import {
  PlayerState,
  AlienEntity,
  GameProp,
  Particle,
  Mission,
  AnomalyPoint,
} from '../types/game';
import { ROOMS, CORRIDORS, WALLS, MAP_WIDTH, MAP_HEIGHT } from '../game/mapData';

interface GameCanvasProps {
  player: PlayerState;
  aliens: AlienEntity[];
  props: GameProp[];
  missions: Mission[];
  nearbyHidingProp: GameProp | null;
  nearbyTaskProp: GameProp | null;
  activeMission: Mission | null;
  escapePodUnlocked: boolean;
  isEscapingCinematic: boolean;
  cameraZoom?: number;
  controlCenterShieldActive?: boolean;
  isPowerRestored?: boolean;
  isGameActive?: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  player,
  aliens,
  props,
  missions,
  nearbyHidingProp,
  nearbyTaskProp,
  activeMission,
  escapePodUnlocked,
  isEscapingCinematic,
  cameraZoom = 1.0,
  controlCenterShieldActive = true,
  isPowerRestored = false,
  isGameActive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<{ x: number; y: number }>({ x: player.x, y: player.y });
  const radarAngleRef = useRef<number>(0);
  const starsRef = useRef<{ x: number; y: number; size: number; alpha: number }[]>([]);
  const cinematicProgressRef = useRef<number>(0);
  const lightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Smooth animation blending state: softens idle-to-walk, turnaround, and flashlight transitions
  const playerAnimRef = useRef<{
    walkWeight: number;
    walkPhase: number;
    scaleX: number;
    lightDir: number;
    lightAlpha: number;
    lastTime: number;
  }>({
    walkWeight: 0,
    walkPhase: 0,
    scaleX: 1,
    lightDir: Math.PI * 0.5,
    lightAlpha: 1,
    lastTime: 0,
  });

  // Generate distant space stars
  useEffect(() => {
    const stars: { x: number; y: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 260; i++) {
      stars.push({
        x: Math.random() * (MAP_WIDTH + 800) - 400,
        y: Math.random() * (MAP_HEIGHT + 800) - 400,
        size: Math.random() * 2.2 + 0.6,
        alpha: Math.random() * 0.8 + 0.2,
      });
    }
    starsRef.current = stars;
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const parent = canvas.parentElement;
      if (parent) {
        if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
      }

      const cw = canvas.width;
      const ch = canvas.height;

      // Handle cinematic escape camera or normal player camera
      if (isEscapingCinematic) {
        cinematicProgressRef.current = Math.min(1, cinematicProgressRef.current + 0.0055);
        const p = cinematicProgressRef.current;
        const launchDist = Math.pow(p, 2.2) * 2800;
        const launchAngle = -Math.PI * 0.52;
        const shuttleX = 3320 + Math.cos(launchAngle) * launchDist;
        const shuttleY = 435 + Math.sin(launchAngle) * launchDist;
        cameraRef.current.x += (shuttleX - cameraRef.current.x) * 0.14;
        cameraRef.current.y += (shuttleY - cameraRef.current.y) * 0.14;
      } else {
        cameraRef.current.x += (player.x - cameraRef.current.x) * 0.12;
        cameraRef.current.y += (player.y - cameraRef.current.y) * 0.12;
      }

      radarAngleRef.current += 0.035;

      // Clear Screen with deep cosmic void
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, cw, ch);

      ctx.save();

      // Camera Transform
      ctx.translate(cw / 2, ch / 2);
      ctx.scale(cameraZoom, cameraZoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // ================= 1. DISTANT STARS =================
      for (const star of starsRef.current) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ================= 2. SHIP HULL SHADOW =================
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(30, 80, MAP_WIDTH - 60, MAP_HEIGHT - 120);

      // ================= 3. ROOM DECKS (AMONG US CELL-SHADING) =================
      for (const room of ROOMS) {
        // Floor tile fill
        ctx.fillStyle = room.floorColor;
        ctx.fillRect(room.x, room.y, room.width, room.height);

        // Floor Plating Grids
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1.5;
        const tileSize = 60;
        for (let gx = room.x; gx < room.x + room.width; gx += tileSize) {
          ctx.beginPath();
          ctx.moveTo(gx, room.y);
          ctx.lineTo(gx, room.y + room.height);
          ctx.stroke();
        }
        for (let gy = room.y; gy < room.y + room.height; gy += tileSize) {
          ctx.beginPath();
          ctx.moveTo(room.x, gy);
          ctx.lineTo(room.x + room.width, gy);
          ctx.stroke();
        }

        // Thick Dark Among Us style room border
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
        ctx.strokeRect(room.x, room.y, room.width, room.height);

        // Inner glowing trim
        ctx.strokeStyle = room.borderColor;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(room.x + 3, room.y + 3, room.width - 6, room.height - 6);

        // Safe Room (Centro de Control) special glowing floor seal
        if (room.isSafeRoom) {
          ctx.save();
          if (controlCenterShieldActive) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
            ctx.lineWidth = 3;
            ctx.setLineDash([12, 10]);
            ctx.strokeRect(room.x + 15, room.y + 15, room.width - 30, room.height - 30);

            // Safe room shield badge stencil
            ctx.font = 'bold 22px "Chakra Petch", monospace';
            ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
            ctx.textAlign = 'center';
            ctx.fillText('🛡️ CAMPO DE FUERZA ACTIVO (SE APAGA AL SALIR)', room.x + room.width / 2, room.y + 120);
          } else {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.lineWidth = 2;
            ctx.strokeRect(room.x + 15, room.y + 15, room.width - 30, room.height - 30);

            ctx.font = 'bold 20px "Chakra Petch", monospace';
            ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ ESCUDO DESACTIVADO • ACCESO ABIERTO A ALIENS', room.x + room.width / 2, room.y + 120);
          }
          ctx.restore();
        }

        // Crisp high-contrast deck floor lettering (Underneath props & walking characters)
        ctx.save();
        ctx.font = '900 36px "Chakra Petch", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.lineWidth = 3;
        ctx.strokeText(room.shortName.toUpperCase(), room.x + room.width / 2, room.y + room.height / 2 + 10);
        ctx.fillText(room.shortName.toUpperCase(), room.x + room.width / 2, room.y + room.height / 2 + 10);
        ctx.restore();
      }

      // ================= 4. CONNECTING CORRIDORS =================
      for (const corr of CORRIDORS) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(corr.x, corr.y, corr.width, corr.height);

        // Corridor grate pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 2;
        const step = 25;
        if (corr.width > corr.height) {
          for (let cx = corr.x; cx < corr.x + corr.width; cx += step) {
            ctx.beginPath();
            ctx.moveTo(cx, corr.y);
            ctx.lineTo(cx, corr.y + corr.height);
            ctx.stroke();
          }
        } else {
          for (let cy = corr.y; cy < corr.y + corr.height; cy += step) {
            ctx.beginPath();
            ctx.moveTo(corr.x, cy);
            ctx.lineTo(corr.x + corr.width, cy);
            ctx.stroke();
          }
        }

        // Thick Dark Outline
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.strokeRect(corr.x, corr.y, corr.width, corr.height);
      }

      // ================= 5. ESCAPE BRIDGE STATUS =================
      const bridge = CORRIDORS.find((c) => c.id === 'corr_escape_bridge');
      if (bridge) {
        ctx.save();
        if (escapePodUnlocked) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fillRect(bridge.x, bridge.y, bridge.width, bridge.height);
          ctx.font = 'bold 15px "Chakra Petch", monospace';
          ctx.fillStyle = '#10b981';
          ctx.textAlign = 'center';
          ctx.fillText('<<< PUENTE ABIERTO >>>', bridge.x + bridge.width / 2, bridge.y + bridge.height / 2);
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          ctx.fillRect(bridge.x, bridge.y, bridge.width, bridge.height);
          ctx.font = 'bold 13px "Chakra Petch", monospace';
          ctx.fillStyle = '#ef4444';
          ctx.textAlign = 'center';
          ctx.fillText('🔒 COMPUERTA BLOQUEADA (4/4)', bridge.x + bridge.width / 2, bridge.y + bridge.height / 2);
        }
        ctx.restore();
      }

      // ================= 6. WALLS & BLAST DOORS =================
      for (const w of WALLS) {
        if (w.type === 'pod_door') {
          if (escapePodUnlocked) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.fillRect(w.x, w.y, w.width, w.height);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 3;
            ctx.strokeRect(w.x, w.y, w.width, w.height);
          } else {
            ctx.fillStyle = '#b91c1c';
            ctx.fillRect(w.x, w.y, w.width, w.height);
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 4;
            ctx.strokeRect(w.x, w.y, w.width, w.height);

            // Warning stripes on door
            ctx.save();
            ctx.fillStyle = '#fbbf24';
            for (let bx = w.x + 10; bx < w.x + w.width; bx += 30) {
              ctx.fillRect(bx, w.y + 4, 15, w.height - 8);
            }
            ctx.restore();
          }
        } else if (w.type === 'glass') {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.fillRect(w.x, w.y, w.width, w.height);
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;
          ctx.strokeRect(w.x, w.y, w.width, w.height);
        } else {
          // Titanium Wall with Among Us style heavy outline
          ctx.fillStyle = '#334155';
          ctx.fillRect(w.x, w.y, w.width, w.height);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(w.x + 4, w.y + 4, Math.max(1, w.width - 8), Math.max(1, w.height - 8));
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 3;
          ctx.strokeRect(w.x, w.y, w.width, w.height);
        }
      }

      // ================= 6B. CENTRO DE CONTROL DOORWAY FORCE FIELD BARRIERS =================
      const shieldBarriers = [
        { x: 1320, y: 1010, width: 160, height: 40, dir: 'horizontal' }, // North Door
        { x: 1320, y: 1790, width: 160, height: 40, dir: 'horizontal' }, // South Door
        { x: 1010, y: 1350, width: 40, height: 160, dir: 'vertical' },   // West Door
        { x: 1740, y: 1350, width: 40, height: 160, dir: 'vertical' },   // East Door
      ];

      for (const bar of shieldBarriers) {
        ctx.save();
        if (controlCenterShieldActive) {
          const time = Date.now();
          const pulse = Math.sin(time * 0.008) * 0.15 + 0.85;

          // Emitter Posts at ends
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2.5;
          if (bar.dir === 'horizontal') {
            ctx.fillRect(bar.x - 4, bar.y, 14, bar.height);
            ctx.strokeRect(bar.x - 4, bar.y, 14, bar.height);
            ctx.fillRect(bar.x + bar.width - 10, bar.y, 14, bar.height);
            ctx.strokeRect(bar.x + bar.width - 10, bar.y, 14, bar.height);
          } else {
            ctx.fillRect(bar.x, bar.y - 4, bar.width, 14);
            ctx.strokeRect(bar.x, bar.y - 4, bar.width, 14);
            ctx.fillRect(bar.x, bar.y + bar.height - 10, bar.width, 14);
            ctx.strokeRect(bar.x, bar.y + bar.height - 10, bar.width, 14);
          }

          // Force Field Energy Mesh
          const grad = ctx.createLinearGradient(
            bar.x,
            bar.y,
            bar.dir === 'horizontal' ? bar.x + bar.width : bar.x,
            bar.dir === 'vertical' ? bar.y + bar.height : bar.y
          );
          grad.addColorStop(0, `rgba(6, 182, 212, ${0.45 * pulse})`);
          grad.addColorStop(0.5, `rgba(56, 189, 248, ${0.8 * pulse})`);
          grad.addColorStop(1, `rgba(6, 182, 212, ${0.45 * pulse})`);
          ctx.fillStyle = grad;
          ctx.fillRect(bar.x, bar.y, bar.width, bar.height);

          // Pulsing Laser Core Beams
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 14;

          ctx.beginPath();
          if (bar.dir === 'horizontal') {
            const midY = bar.y + bar.height / 2;
            ctx.moveTo(bar.x + 8, midY);
            ctx.lineTo(bar.x + bar.width - 8, midY);
          } else {
            const midX = bar.x + bar.width / 2;
            ctx.moveTo(midX, bar.y + 8);
            ctx.lineTo(midX, bar.y + bar.height - 8);
          }
          ctx.stroke();

          // Hexagonal / cross energy lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          if (bar.dir === 'horizontal') {
            ctx.moveTo(bar.x + 10, bar.y + bar.height / 2 - 8);
            ctx.lineTo(bar.x + bar.width - 10, bar.y + bar.height / 2 - 8);
            ctx.moveTo(bar.x + 10, bar.y + bar.height / 2 + 8);
            ctx.lineTo(bar.x + bar.width - 10, bar.y + bar.height / 2 + 8);
          } else {
            ctx.moveTo(bar.x + bar.width / 2 - 8, bar.y + 10);
            ctx.lineTo(bar.x + bar.width / 2 - 8, bar.y + bar.height - 10);
            ctx.moveTo(bar.x + bar.width / 2 + 8, bar.y + 10);
            ctx.lineTo(bar.x + bar.width / 2 + 8, bar.y + bar.height - 10);
          }
          ctx.stroke();

          // Floating label in door center
          ctx.font = 'bold 10px "Chakra Petch", monospace';
          ctx.fillStyle = '#e0f2fe';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡ ESCUDO', bar.x + bar.width / 2, bar.y + bar.height / 2);
        } else {
          // DEACTIVATED: Offline emitter posts with dim red / gray status LEDs
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          if (bar.dir === 'horizontal') {
            ctx.fillRect(bar.x, bar.y, 10, bar.height);
            ctx.strokeRect(bar.x, bar.y, 10, bar.height);
            ctx.fillRect(bar.x + bar.width - 10, bar.y, 10, bar.height);
            ctx.strokeRect(bar.x + bar.width - 10, bar.y, 10, bar.height);
          } else {
            ctx.fillRect(bar.x, bar.y, bar.width, 10);
            ctx.strokeRect(bar.x, bar.y, bar.width, 10);
            ctx.fillRect(bar.x, bar.y + bar.height - 10, bar.width, 10);
            ctx.strokeRect(bar.x, bar.y + bar.height - 10, bar.width, 10);
          }
        }
        ctx.restore();
      }

      // ================= 7. ANOMALY OBJECTIVES ON THE DECK FLOOR =================
      for (const mission of missions) {
        if (mission.mechanicType === 'anomalies' && !mission.completed && mission.anomalies) {
          for (const anomaly of mission.anomalies) {
            if (!anomaly.collected) {
              ctx.save();
              const floatY = anomaly.y + Math.sin(Date.now() * 0.007 + anomaly.x) * 4;

              // Outer glowing halo
              const halo = ctx.createRadialGradient(anomaly.x, floatY, 2, anomaly.x, floatY, 24);
              halo.addColorStop(0, 'rgba(250, 204, 21, 0.8)');
              halo.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
              halo.addColorStop(1, 'rgba(245, 158, 11, 0)');
              ctx.fillStyle = halo;
              ctx.beginPath();
              ctx.arc(anomaly.x, floatY, 24, 0, Math.PI * 2);
              ctx.fill();

              // Glowing anomaly orb
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(anomaly.x, floatY, 9, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2.5;
              ctx.stroke();

              // Pulsing ring
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(anomaly.x, floatY, 14 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }

      // ================= 8. DENSE AMONG US 2.5D PROPS & WIRING PANELS =================
      for (const prop of props) {
        // Deep drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(
          prop.x + prop.width / 2,
          prop.y + prop.height + 4,
          prop.width / 2 + 4,
          prop.height / 5 + 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        switch (prop.type) {
          case 'wires_panel': {
            // EXPOSED ELECTRICAL WIRING PANEL (Among Us Wall Wires)
            ctx.save();
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y, prop.width, prop.height, 6);
            ctx.fill();
            ctx.stroke();

            // Inner dark circuit board
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(prop.x + 6, prop.y + 6, prop.width - 12, prop.height - 12);

            // Exposed Wires: Red, Blue, Yellow hanging/intertwined
            // Red Wire
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(prop.x + 15, prop.y + 12);
            ctx.bezierCurveTo(prop.x + 25, prop.y + 35, prop.x + 35, prop.y + 10, prop.x + prop.width - 15, prop.y + 14);
            ctx.stroke();

            // Blue Wire
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(prop.x + 15, prop.y + 22);
            ctx.bezierCurveTo(prop.x + 30, prop.y + 5, prop.x + 45, prop.y + 40, prop.x + prop.width - 15, prop.y + 24);
            ctx.stroke();

            // Yellow Wire
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(prop.x + 15, prop.y + 32);
            ctx.bezierCurveTo(prop.x + 40, prop.y + 42, prop.x + 50, prop.y + 18, prop.x + prop.width - 15, prop.y + 34);
            ctx.stroke();

            // Connection terminals
            ctx.fillStyle = '#64748b';
            ctx.fillRect(prop.x + 8, prop.y + 10, 6, 26);
            ctx.fillRect(prop.x + prop.width - 14, prop.y + 10, 6, 26);
            ctx.restore();
            break;
          }

          case 'holo_globe': {
            // Rotating Holographic Galaxy in Centro de Control
            ctx.save();
            const cx = prop.x + prop.width / 2;
            const cy = prop.y + prop.height / 2;
            const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 45);
            grad.addColorStop(0, '#38bdf8');
            grad.addColorStop(0.6, 'rgba(14, 165, 233, 0.5)');
            grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, 45, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 40, 16, radarAngleRef.current * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            // Vector holographic core & meridians (Zero emojis)
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(cx, cy, 22, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy, 12, 22, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 22, cy);
            ctx.lineTo(cx + 22, cy);
            ctx.stroke();

            ctx.restore();
            break;
          }

          case 'reactor': {
            // Fusion Reactor (Among Us 2.5D with heavy dark border & cel-shading)
            ctx.save();
            const cx = prop.x + prop.width / 2;
            const cy = prop.y + prop.height / 2;

            // Base body
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(cx, cy, prop.width / 2 - 4, 0, Math.PI * 2);
            ctx.fill();

            // Cel-shaded top highlight
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(cx, cy - 6, prop.width / 2 - 10, 0, Math.PI * 2);
            ctx.fill();

            // Dark heavy outline
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 4.5;
            ctx.beginPath();
            ctx.arc(cx, cy, prop.width / 2 - 4, 0, Math.PI * 2);
            ctx.stroke();

            // Core glow
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(cx, cy, 18, 0, Math.PI * 2);
            ctx.fill();

            // Spinning containment ring
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(cx, cy, prop.width / 2 - 14, (prop.height / 2 - 14) * 0.4, radarAngleRef.current, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            break;
          }

          case 'table': {
            // Among Us Style Round Dining Table with round chairs
            ctx.save();
            const cx = prop.x + prop.width / 2;
            const cy = prop.y + prop.height / 2;
            const r = prop.width / 2;

            // Round chairs around table
            const chairAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
            for (const ang of chairAngles) {
              const chX = cx + Math.cos(ang) * (r + 12);
              const chY = cy + Math.sin(ang) * (r + 12);
              ctx.fillStyle = '#1e293b';
              ctx.strokeStyle = '#020617';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(chX, chY, 14, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            // Table 2.5D body
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(cx, cy + 4, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Table center metallic console hub
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(cx, cy, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
          }

          case 'bed':
          case 'hydro_bed':
          case 'med_bed_scan': {
            // High-Tech Ergonomic Medical & Crew Bunk (2.5D Vector - Zero Emojis)
            ctx.save();
            const bx = prop.x;
            const by = prop.y;
            const bw = prop.width;
            const bh = prop.height;

            // Deep drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.roundRect(bx + 4, by + 8, bw - 8, bh - 6, 12);
            ctx.fill();

            // Metallic Titanium Chassis Bed Frame
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 12);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Beveled Headboard
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(bx + 4, by + 4, 22, bh - 8, 6);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Padded Quilted Medical Mattress
            const padX = bx + 28;
            const padW = bw - 34;
            const padH = bh - 10;
            ctx.fillStyle = prop.type === 'med_bed_scan' ? '#0f766e' : '#1e3a5f';
            ctx.beginPath();
            ctx.roundRect(padX, by + 5, padW, padH, 8);
            ctx.fill();
            ctx.strokeStyle = prop.type === 'med_bed_scan' ? '#14b8a6' : '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Quilted cushion seams
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
            for (let qx = padX + 16; qx < padX + padW - 10; qx += 18) {
              ctx.beginPath();
              ctx.moveTo(qx, by + 7);
              ctx.lineTo(qx, by + 5 + padH);
              ctx.stroke();
            }

            // Articulated Biometric Life-Monitor Display Arm
            const monX = bx + 16;
            const monY = by - 8;
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(monX - 2, by + 8, 4, -14);
            ctx.fillStyle = '#020617';
            ctx.fillRect(monX - 10, monY - 14, 20, 14);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(monX - 10, monY - 14, 20, 14);

            // Pulsing ECG Vital Wave on Screen
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(monX - 8, monY - 7);
            ctx.lineTo(monX - 4, monY - 7);
            ctx.lineTo(monX - 2, monY - 12);
            ctx.lineTo(monX + 1, monY - 3);
            ctx.lineTo(monX + 4, monY - 7);
            ctx.lineTo(monX + 8, monY - 7);
            ctx.stroke();

            // Holographic overhead scanner beam for medical scan beds
            if (prop.type === 'med_bed_scan') {
              const scanPulse = Math.sin(Date.now() * 0.005) * (padW - 24);
              const laserX = padX + 12 + Math.abs(scanPulse);
              ctx.fillStyle = 'rgba(45, 212, 191, 0.2)';
              ctx.fillRect(padX + 4, by + 7, padW - 8, padH - 4);
              ctx.strokeStyle = '#2dd4bf';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(laserX, by + 6);
              ctx.lineTo(laserX, by + 6 + padH);
              ctx.stroke();
            }

            ctx.restore();
            break;
          }

          case 'food_cart': {
            // Stainless Steel Space Station Meal Distribution Cart (2.5D Vector)
            ctx.save();
            const cx = prop.x + prop.width / 2;
            const cy = prop.y + prop.height / 2;

            // Rubber Caster Wheels
            const wheelOffsets = [
              { x: prop.x + 10, y: prop.y + 6 },
              { x: prop.x + prop.width - 10, y: prop.y + 6 },
              { x: prop.x + 10, y: prop.y + prop.height - 6 },
              { x: prop.x + prop.width - 10, y: prop.y + prop.height - 6 },
            ];
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            for (const w of wheelOffsets) {
              ctx.beginPath();
              ctx.arc(w.x, w.y, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            // Brushed Stainless Steel Trolley Base
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.roundRect(prop.x + 4, prop.y + 4, prop.width - 8, prop.height - 8, 8);
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.roundRect(prop.x + 6, prop.y + 6, prop.width - 12, prop.height - 12, 6);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Domed Food Warming Cloches (Silver serving covers with brass finials)
            const dome1X = prop.x + prop.width * 0.32;
            const dome2X = prop.x + prop.width * 0.68;
            const domeY = cy - 2;

            [dome1X, dome2X].forEach((dx) => {
              // Platter rim
              ctx.fillStyle = '#cbd5e1';
              ctx.beginPath();
              ctx.ellipse(dx, domeY + 6, 16, 7, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Polished Cloche Dome
              ctx.fillStyle = '#e2e8f0';
              ctx.beginPath();
              ctx.ellipse(dx, domeY, 13, 10, 0, Math.PI, 0);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Brass Handle
              ctx.fillStyle = '#fbbf24';
              ctx.beginPath();
              ctx.arc(dx, domeY - 11, 2.5, 0, Math.PI * 2);
              ctx.fill();
            });

            // Insulated thermos beverage container
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(prop.x + prop.width - 18, prop.y + 10, 8, 14);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(prop.x + prop.width - 17, prop.y + 8, 6, 3);

            // Chrome Push Handlebar
            ctx.fillStyle = '#cbd5e1';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.strokeRect(prop.x + 2, cy - 14, 4, 28);

            ctx.restore();
            break;
          }

          case 'antenna':
          case 'subspace_dish': {
            // Detailed Deep Space Parabolic Antenna (2.5D Vector)
            ctx.save();
            const cx = prop.x + prop.width / 2;
            const cy = prop.y + prop.height / 2;

            // Octagonal Azimuth Pedestal Mounting Base
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(cx, cy + 12, 38, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Rotating Gimbal Turret
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.arc(cx, cy + 8, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Parabolic Dish (Metallic Alloy with Depth & Radial Ribs)
            ctx.fillStyle = '#0891b2';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 4, prop.width * 0.44, prop.height * 0.36, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 6, prop.width * 0.4, prop.height * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Radial Structural Dish Ribs (Spider struts)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.5;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
              ctx.beginPath();
              ctx.moveTo(cx, cy - 6);
              ctx.lineTo(
                cx + Math.cos(a) * (prop.width * 0.38),
                cy - 6 + Math.sin(a) * (prop.height * 0.3)
              );
              ctx.stroke();
            }

            // Central Sub-reflector & Tripod Feed Horn
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 24, cy + 10);
            ctx.lineTo(cx, cy - 14);
            ctx.lineTo(cx + 24, cy + 10);
            ctx.stroke();

            // Glowing High-Frequency Emitter Feed
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cx, cy - 14, 6, 0, Math.PI * 2);
            ctx.fill();

            // Radio Wave Pulse Rings Expanding Outwards
            const wavePulse = (Date.now() * 0.003) % 1;
            ctx.strokeStyle = `rgba(6, 182, 212, ${1 - wavePulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy - 14, 14 + wavePulse * 28, -Math.PI * 0.8, -Math.PI * 0.2);
            ctx.stroke();

            ctx.restore();
            break;
          }

          case 'hydro_plant':
          case 'plant_pot': {
            // High-Tech Aeroponic Bio-Incubator Chamber (2.5D Vector)
            ctx.save();
            const cx = prop.x + prop.width / 2;
            const cy = prop.y + prop.height / 2;

            // Reservoir Base
            ctx.fillStyle = '#064e3b';
            ctx.beginPath();
            ctx.roundRect(prop.x + 8, prop.y + prop.height - 24, prop.width - 16, 22, 6);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Nutrient fluid level gauge
            ctx.fillStyle = '#10b981';
            ctx.fillRect(prop.x + 14, prop.y + prop.height - 18, prop.width - 28, 6);

            // Cylindrical Glass Terrarium Dome
            ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
            ctx.beginPath();
            ctx.arc(cx, cy - 6, prop.width * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Bioluminescent Organic Flora Leaves
            const leafColors = ['#059669', '#10b981', '#34d399', '#6ee7b7'];
            for (let i = 0; i < 6; i++) {
              const ang = (i * Math.PI) / 3 + 0.3;
              const lx = cx + Math.cos(ang) * 14;
              const ly = cy - 6 + Math.sin(ang) * 12;
              ctx.fillStyle = leafColors[i % leafColors.length];
              ctx.beginPath();
              ctx.ellipse(lx, ly, 10, 6, ang, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#020617';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            // Central Bioluminescent Bio-Node
            ctx.fillStyle = '#fef08a';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(cx, cy - 6, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            break;
          }

          case 'shelf': {
            // Industrial Alloy Cargo Shelving Unit (2.5D Vector)
            ctx.save();
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y + 4, prop.width, prop.height, 6);
            ctx.fill();

            ctx.fillStyle = '#57534e';
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y, prop.width, prop.height, 6);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Structural Perforated Uprights
            ctx.fillStyle = '#78716c';
            ctx.fillRect(prop.x + 8, prop.y + 6, 6, prop.height - 12);
            ctx.fillRect(prop.x + prop.width - 14, prop.y + 6, 6, prop.height - 12);

            // Horizontal Cargo Shelves
            const shelfLevels = [prop.y + prop.height * 0.35, prop.y + prop.height * 0.7];
            for (const sy of shelfLevels) {
              ctx.fillStyle = '#292524';
              ctx.fillRect(prop.x + 14, sy - 1, prop.width - 28, 4);
              ctx.strokeStyle = '#020617';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(prop.x + 14, sy - 1, prop.width - 28, 4);
            }

            // Stored Tools & Component Bins on Shelves
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(prop.x + 22, prop.y + 12, 18, 12);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(prop.x + 48, prop.y + 10, 24, 14);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(prop.x + 28, prop.y + prop.height * 0.42, 22, 13);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(prop.x + 58, prop.y + prop.height * 0.44, 20, 11);

            ctx.restore();
            break;
          }

          case 'crate': {
            // 2.5D Titanium Cargo Crate with Hazard Chevron Accents (Zero Emojis)
            ctx.save();
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y + 5, prop.width, prop.height, 8);
            ctx.fill();

            ctx.fillStyle = '#78716c';
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y, prop.width, prop.height, 8);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Diagonal Hazard Warning Striping along center
            ctx.save();
            ctx.beginPath();
            ctx.rect(prop.x + 8, prop.y + prop.height / 2 - 8, prop.width - 16, 16);
            ctx.clip();
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(prop.x + 8, prop.y + prop.height / 2 - 8, prop.width - 16, 16);
            ctx.fillStyle = '#0f172a';
            for (let hx = prop.x - 20; hx < prop.x + prop.width + 20; hx += 16) {
              ctx.beginPath();
              ctx.moveTo(hx, prop.y + prop.height / 2 - 8);
              ctx.lineTo(hx + 10, prop.y + prop.height / 2 + 8);
              ctx.lineTo(hx + 18, prop.y + prop.height / 2 + 8);
              ctx.lineTo(hx + 8, prop.y + prop.height / 2 - 8);
              ctx.fill();
            }
            ctx.restore();

            // Corner Reinforcement Plates & Rivets
            const corners = [
              { x: prop.x + 5, y: prop.y + 5 },
              { x: prop.x + prop.width - 11, y: prop.y + 5 },
              { x: prop.x + 5, y: prop.y + prop.height - 11 },
              { x: prop.x + prop.width - 11, y: prop.y + prop.height - 11 },
            ];
            ctx.fillStyle = '#0f172a';
            for (const c of corners) {
              ctx.fillRect(c.x, c.y, 6, 6);
            }

            ctx.restore();
            break;
          }

          case 'barrel': {
            // Industrial Pressurized Coolant Drum (2.5D Vector)
            ctx.save();
            const cx = prop.x + prop.width / 2;
            const cy = prop.y + prop.height / 2;

            // Drum Body
            ctx.fillStyle = '#9a3412';
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y + 4, prop.width, prop.height, 10);
            ctx.fill();

            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y, prop.width, prop.height, 10);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Heavy Circumferential Reinforcement Ribs
            ctx.strokeStyle = '#7c2d12';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(prop.x + 4, prop.y + prop.height * 0.33);
            ctx.lineTo(prop.x + prop.width - 4, prop.y + prop.height * 0.33);
            ctx.moveTo(prop.x + 4, prop.y + prop.height * 0.66);
            ctx.lineTo(prop.x + prop.width - 4, prop.y + prop.height * 0.66);
            ctx.stroke();

            // Pressure Relief Dial & Gauge
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(cx, cy, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Gauge Needle
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + 6, cy - 5);
            ctx.stroke();

            ctx.restore();
            break;
          }

          case 'pressure_plate': {
            // Ionized Decontamination Platform Plate (2.5D Vector)
            const cx = prop.x + prop.width / 2;
            const cy = prop.y + prop.height / 2;
            const radius = prop.width / 2;
            ctx.save();

            // Steel Outer Rim with Safety Chamfer
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(cx, cy + 3, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = prop.color;
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Non-slip Floor Grating Crosshatch
            ctx.strokeStyle = 'rgba(45, 212, 191, 0.25)';
            ctx.lineWidth = 1.5;
            const stepG = 14;
            for (let gx = cx - radius + 10; gx < cx + radius - 10; gx += stepG) {
              ctx.beginPath();
              ctx.moveTo(gx, cy - radius + 10);
              ctx.lineTo(gx, cy + radius - 10);
              ctx.stroke();
            }

            // Animated Ionized Containment Pulse Ring
            const pulseRadius = radius * (0.65 + 0.2 * Math.sin(Date.now() * 0.005));
            ctx.strokeStyle = prop.color;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = prop.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
            break;
          }

          case 'endeavour_shuttle':
          case 'pod_console': {
            // ================= NASA SPACE SHUTTLE "ENDEAVOUR" (2.5D Vector Orbiter - SIN SOMBRAS) =================
            let cx = prop.x + prop.width / 2;
            let cy = prop.y + prop.height / 2;

            // Escaping Cinematic: Shuttle takes off accelerating into deep space
            if (isEscapingCinematic) {
              const p = cinematicProgressRef.current;
              const launchDist = Math.pow(p, 2.2) * 2800;
              const launchAngle = -Math.PI * 0.52;
              cx += Math.cos(launchAngle) * launchDist;
              cy += Math.sin(launchAngle) * launchDist;
            }

            ctx.save();
            // Strict compliance: NO SHADOWS on the Endeavour shuttle ("SIN SOMBRAS")

            // 2. Black Thermal Protection Heat Shield Underside (Double-Delta Wing Geometry)
            ctx.fillStyle = '#09090b';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 195); // Nose Tip
            ctx.lineTo(cx - 30, cy - 80); // Forward chine
            ctx.lineTo(cx - 165, cy + 110); // Left Wing Tip
            ctx.lineTo(cx - 150, cy + 140); // Left Wing Elevon
            ctx.lineTo(cx - 65, cy + 140); // Left Wing Root
            ctx.lineTo(cx + 65, cy + 140); // Right Wing Root
            ctx.lineTo(cx + 150, cy + 140); // Right Wing Elevon
            ctx.lineTo(cx + 165, cy + 110); // Right Wing Tip
            ctx.lineTo(cx + 30, cy - 80); // Forward chine
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 5;
            ctx.stroke();

            // 3. White Ceramic Thermal Tile Fuselage (Orbiter Upper Body)
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 190);
            ctx.lineTo(cx - 24, cy - 80);
            ctx.lineTo(cx - 150, cy + 105);
            ctx.lineTo(cx - 140, cy + 132);
            ctx.lineTo(cx - 55, cy + 132);
            ctx.lineTo(cx + 55, cy + 132);
            ctx.lineTo(cx + 140, cy + 132);
            ctx.lineTo(cx + 150, cy + 105);
            ctx.lineTo(cx + 24, cy - 80);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // 4. Black Reinforced Carbon-Carbon (RCC) Nose Cap
            ctx.fillStyle = '#09090b';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 192);
            ctx.bezierCurveTo(cx - 14, cy - 190, cx - 18, cy - 172, cx - 18, cy - 160);
            ctx.lineTo(cx + 18, cy - 160);
            ctx.bezierCurveTo(cx + 18, cy - 172, cx + 14, cy - 190, cx, cy - 192);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // 5. Black Leading Edge Tiles along Wings
            ctx.fillStyle = '#18181b';
            // Left Leading Edge
            ctx.beginPath();
            ctx.moveTo(cx - 24, cy - 80);
            ctx.lineTo(cx - 150, cy + 105);
            ctx.lineTo(cx - 138, cy + 108);
            ctx.lineTo(cx - 20, cy - 74);
            ctx.closePath();
            ctx.fill();
            // Right Leading Edge
            ctx.beginPath();
            ctx.moveTo(cx + 24, cy - 80);
            ctx.lineTo(cx + 150, cy + 105);
            ctx.lineTo(cx + 138, cy + 108);
            ctx.lineTo(cx + 20, cy - 74);
            ctx.closePath();
            ctx.fill();

            // 6. Cockpit Windshield (Authentic 6-Pane Flight Deck Wraparound)
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.moveTo(cx - 22, cy - 140);
            ctx.lineTo(cx + 22, cy - 140);
            ctx.lineTo(cx + 18, cy - 124);
            ctx.lineTo(cx - 18, cy - 124);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Windshield Panes Glass Tint & Glare
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(cx - 16, cy - 138, 7, 10);
            ctx.fillRect(cx - 7, cy - 138, 6, 10);
            ctx.fillRect(cx + 1, cy - 138, 6, 10);
            ctx.fillRect(cx + 9, cy - 138, 7, 10);

            // 7. Payload Bay Door Center Seam
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 110);
            ctx.lineTo(cx, cy + 90);
            ctx.stroke();

            // 8. Vertical Tail Fin & Twin Orbital Maneuvering System (OMS) Pods
            // OMS Pod Left
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.roundRect(cx - 36, cy + 85, 20, 42, 6);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // OMS Pod Right
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.roundRect(cx + 16, cy + 85, 20, 42, 6);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Vertical Stabilizer Fin
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 20);
            ctx.lineTo(cx - 7, cy + 115);
            ctx.lineTo(cx + 7, cy + 115);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Black Leading Edge on Tail Fin
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 20);
            ctx.lineTo(cx - 7, cy + 40);
            ctx.lineTo(cx, cy + 40);
            ctx.closePath();
            ctx.fill();

            // 9. Three Space Shuttle Main Engine (SSME) Bell Nozzles
            const engineBells = [
              { x: cx, y: cy + 138 }, // Top Center Engine
              { x: cx - 26, y: cy + 144 }, // Bottom Left Engine
              { x: cx + 26, y: cy + 144 }, // Bottom Right Engine
            ];

            for (const eng of engineBells) {
              ctx.fillStyle = '#334155';
              ctx.beginPath();
              ctx.arc(eng.x, eng.y, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#020617';
              ctx.lineWidth = 2.5;
              ctx.stroke();

              ctx.fillStyle = '#0f172a';
              ctx.beginPath();
              ctx.arc(eng.x, eng.y, 7, 0, Math.PI * 2);
              ctx.fill();
            }

            // 10. Authentic NASA Insignia & "ENDEAVOUR" Markings
            // NASA Meatball Blue Sphere on Left Wing
            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath();
            ctx.arc(cx - 75, cy + 35, 12, 0, Math.PI * 2);
            ctx.fill();
            // Red Vector Chevron
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 84, cy + 39);
            ctx.lineTo(cx - 75, cy + 28);
            ctx.lineTo(cx - 66, cy + 39);
            ctx.stroke();

            // "United States" text on Starboard Wing
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.fillText('United States', cx + 75, cy + 32);

            // "ENDEAVOUR" Lettering
            ctx.font = '900 12px "Chakra Petch", monospace';
            ctx.fillStyle = '#020617';
            ctx.fillText('ENDEAVOUR', cx, cy - 30);
            ctx.font = 'bold 9px "Chakra Petch", monospace';
            ctx.fillStyle = '#475569';
            ctx.fillText('NASA • OV-105', cx, cy - 14);

            // 11. Escaping Cinematic: Roaring Triple-Engine Plumes & Mach Diamonds
            if (isEscapingCinematic) {
              for (const eng of engineBells) {
                const flameLength = 110 + Math.random() * 35;
                const flameGrad = ctx.createLinearGradient(
                  eng.x,
                  eng.y,
                  eng.x,
                  eng.y + flameLength
                );
                flameGrad.addColorStop(0, '#ffffff');
                flameGrad.addColorStop(0.2, '#fef08a');
                flameGrad.addColorStop(0.6, '#f97316');
                flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

                ctx.fillStyle = flameGrad;
                ctx.beginPath();
                ctx.moveTo(eng.x - 9, eng.y);
                ctx.quadraticCurveTo(eng.x - 14, eng.y + flameLength * 0.5, eng.x, eng.y + flameLength);
                ctx.quadraticCurveTo(eng.x + 14, eng.y + flameLength * 0.5, eng.x + 9, eng.y);
                ctx.closePath();
                ctx.fill();

                // Supersonic Shock Diamonds (Mach Disks)
                ctx.fillStyle = '#ffffff';
                for (let si = 1; si <= 3; si++) {
                  const sDist = eng.y + si * 22;
                  ctx.beginPath();
                  ctx.ellipse(eng.x, sDist, 4, 2, 0, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }

            ctx.restore();
            break;
          }

          case 'log_terminal': {
            // ================= PANTALLA DE CONTROL // MONITOR TV DE ESTADO DE LA NAVE =================
            ctx.save();
            const tx = prop.x;
            const ty = prop.y;
            const tw = prop.width;
            const th = prop.height;

            // 1. Soft green ambient illumination projected onto the deck floor beneath the TV
            const floorGlow = ctx.createRadialGradient(tx + tw / 2, ty + th + 10, 10, tx + tw / 2, ty + th + 10, tw * 0.7);
            floorGlow.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
            floorGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.fillStyle = floorGlow;
            ctx.beginPath();
            ctx.ellipse(tx + tw / 2, ty + th + 10, tw * 0.65, 25, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Heavy wall-mounting struts & articulation brackets
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(tx + 20, ty - 8, 12, 10);
            ctx.fillRect(tx + tw - 32, ty - 8, 12, 10);
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(tx + 26, ty - 3, 3, 0, Math.PI * 2);
            ctx.arc(tx + tw - 26, ty - 3, 3, 0, Math.PI * 2);
            ctx.fill();

            // 3. Main television chassis (industrial bevel frame)
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(tx, ty + 4, tw, th, 12);
            ctx.fill();

            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(tx, ty, tw, th, 12);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Inner chamfer bevel
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx + 5, ty + 5, tw - 10, th - 10);

            // 4. CRT High-Definition Glass Display Matrix
            const scrX = tx + 10;
            const scrY = ty + 20;
            const scrW = tw - 20;
            const scrH = th - 34;

            ctx.fillStyle = '#021814'; // Deep phosphor black/emerald
            ctx.beginPath();
            ctx.roundRect(scrX, scrY, scrW, scrH, 6);
            ctx.fill();

            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Curved glass glare reflection gradient across upper-left
            const glareGrad = ctx.createLinearGradient(scrX, scrY, scrX + scrW * 0.5, scrY + scrH * 0.5);
            glareGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
            glareGrad.addColorStop(0.4, 'rgba(52, 211, 153, 0.04)');
            glareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glareGrad;
            ctx.beginPath();
            ctx.roundRect(scrX, scrY, scrW, scrH, 6);
            ctx.fill();

            // Animated vertical scanlines across display
            const timeNow = Date.now();
            const scanY = scrY + (timeNow * 0.05) % scrH;
            ctx.fillStyle = 'rgba(52, 211, 153, 0.28)';
            ctx.fillRect(scrX, scanY, scrW, 2.5);

            // Subtle horizontal CRT phosphor lines
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
            ctx.lineWidth = 1;
            for (let ly = scrY + 4; ly < scrY + scrH; ly += 6) {
              ctx.beginPath();
              ctx.moveTo(scrX + 2, ly);
              ctx.lineTo(scrX + scrW - 2, ly);
              ctx.stroke();
            }

            // TV Top Frame Header Laser Engraving
            ctx.font = 'bold 9px "Chakra Petch", monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'center';
            ctx.fillText('📺 MONITOR CENTRAL • SISTEMA STAR-REBIRTH v2.4', tx + tw / 2, ty + 13);

            // 5. Dynamic Live Telemetry Readouts (Removed from player screen, rendered on TV!)
            const completedTasks = missions.filter((m) => m.completed).length;
            const totalTasks = missions.length;
            const shieldStatus = controlCenterShieldActive ? 'ACTIVO 100%' : 'DESACTIVADO';
            const powerStatus = isPowerRestored ? '100% ILUMINADA' : 'MODO AUXILIAR';
            const shuttleStatus = escapePodUnlocked ? 'COMPUERTA ABIERTA' : 'SELLADA (4/4 REC)';

            ctx.textAlign = 'left';

            // Top Status Bar
            ctx.font = 'bold 8.5px monospace';
            ctx.fillStyle = '#34d399';
            ctx.fillText('● EN VIVO | CONTROL', scrX + 6, scrY + 11);

            ctx.font = '8px monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`SYS.OK [${Math.floor(timeNow / 1000) % 1000}s]`, scrX + scrW - 68, scrY + 11);

            // Divider
            ctx.strokeStyle = '#064e3b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(scrX + 4, scrY + 15);
            ctx.lineTo(scrX + scrW - 4, scrY + 15);
            ctx.stroke();

            // Line 1: ESTADO NAVE
            ctx.font = 'bold 8.5px monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('> ESTADO NAVE: ', scrX + 6, scrY + 25);
            ctx.fillStyle = '#34d399';
            ctx.fillText('OPERACIONAL', scrX + 78, scrY + 25);

            // Line 2: ESCUDO SEGURIDAD
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('> ESCUDO: ', scrX + 6, scrY + 35);
            ctx.fillStyle = controlCenterShieldActive ? '#38bdf8' : '#f87171';
            ctx.fillText(shieldStatus, scrX + 54, scrY + 35);

            // Line 3: RED ENERGÉTICA
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('> RED ENERGÍA: ', scrX + 6, scrY + 45);
            ctx.fillStyle = isPowerRestored ? '#34d399' : '#fbbf24';
            ctx.fillText(powerStatus, scrX + 78, scrY + 45);

            // Line 4: RADAR BIOMÉTRICO (Crucial: EXACTLY 8 HOSTILE FORMS!)
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('> RADAR: ', scrX + 6, scrY + 55);
            const radarBlink = Math.sin(timeNow * 0.006) > 0;
            ctx.fillStyle = radarBlink ? '#f43f5e' : '#fb7185';
            ctx.fillText('8 FORMAS HOSTILES', scrX + 50, scrY + 55);

            // Divider
            ctx.strokeStyle = '#064e3b';
            ctx.beginPath();
            ctx.moveTo(scrX + 4, scrY + 60);
            ctx.lineTo(scrX + scrW - 4, scrY + 60);
            ctx.stroke();

            // Line 5: Misiones Header
            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = '#34d399';
            ctx.fillText(`> MISIONES (${completedTasks}/${totalTasks}):`, scrX + 6, scrY + 69);

            // Mission items list
            missions.forEach((m, mIdx) => {
              const my = scrY + 79 + mIdx * 9.5;
              if (my > scrY + scrH - 14) return;
              ctx.font = '7.5px monospace';
              const isDone = m.completed;
              ctx.fillStyle = isDone ? '#34d399' : '#e2e8f0';
              const titleTrunc = m.title.length > 21 ? m.title.slice(0, 20) + '..' : m.title;
              ctx.fillText(`${isDone ? '✔' : '○'} ${titleTrunc}`, scrX + 8, my);

              ctx.fillStyle = isDone ? '#10b981' : '#facc15';
              ctx.fillText(isDone ? 'LISTO' : 'PEND.', scrX + scrW - 32, my);
            });

            // Bottom line: NASA ENDEAVOUR
            const btmY = scrY + scrH - 5;
            ctx.strokeStyle = '#064e3b';
            ctx.beginPath();
            ctx.moveTo(scrX + 4, btmY - 8);
            ctx.lineTo(scrX + scrW - 4, btmY - 8);
            ctx.stroke();

            ctx.font = 'bold 8px monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('> ENDEAVOUR: ', scrX + 6, btmY);
            ctx.fillStyle = escapePodUnlocked ? '#34d399' : '#fbbf24';
            ctx.fillText(shuttleStatus, scrX + 68, btmY);

            // 6. Bottom TV Bezel Control Panel & Status Diodes
            const btmBezelY = ty + th - 10;
            // Power LED (pulsing emerald)
            ctx.fillStyle = Math.sin(timeNow * 0.005) > 0 ? '#34d399' : '#059669';
            ctx.beginPath();
            ctx.arc(tx + 20, btmBezelY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Shield status LED (cyan)
            ctx.fillStyle = controlCenterShieldActive ? '#38bdf8' : '#ef4444';
            ctx.beginPath();
            ctx.arc(tx + 32, btmBezelY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Radar threat LED (blinking red)
            ctx.fillStyle = radarBlink ? '#ef4444' : '#7f1d1d';
            ctx.beginPath();
            ctx.arc(tx + 44, btmBezelY, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            break;
          }

          case 'console': {
            // Futuristic Tactical Command Desk (2.5D Vector)
            ctx.save();
            const cx = prop.x;
            const cy = prop.y;
            const cw = prop.width;
            const ch = prop.height;

            // Base desk shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.roundRect(cx + 4, cy + 6, cw - 8, ch - 4, 8);
            ctx.fill();

            // Desk Main Body (dark slate titanium)
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(cx, cy, cw, ch, 8);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Angled 2.5D Upper Chamfer
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(cx + 4, cy + 4, cw - 8, ch * 0.45, 6);
            ctx.fill();

            // Dual Angled Monitor Screens
            const monW = (cw - 24) / 2;
            const monH = ch * 0.38;
            // Screen 1 (Left: Orbit / Graph)
            ctx.fillStyle = '#031713';
            ctx.fillRect(cx + 8, cy + 6, monW, monH);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(cx + 8, cy + 6, monW, monH);
            // Wireframe curve
            ctx.strokeStyle = '#34d399';
            ctx.beginPath();
            ctx.moveTo(cx + 12, cy + 6 + monH * 0.7);
            ctx.quadraticCurveTo(cx + 8 + monW * 0.5, cy + 10, cx + 6 + monW, cy + 6 + monH * 0.4);
            ctx.stroke();

            // Screen 2 (Right: Diagnostics / Waveform)
            ctx.fillStyle = '#082f49';
            ctx.fillRect(cx + 16 + monW, cy + 6, monW, monH);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(cx + 16 + monW, cy + 6, monW, monH);
            // Waveform
            ctx.strokeStyle = '#7dd3fc';
            ctx.beginPath();
            ctx.moveTo(cx + 18 + monW, cy + 6 + monH * 0.5);
            ctx.lineTo(cx + 24 + monW, cy + 6 + monH * 0.2);
            ctx.lineTo(cx + 30 + monW, cy + 6 + monH * 0.8);
            ctx.lineTo(cx + 36 + monW, cy + 6 + monH * 0.5);
            ctx.lineTo(cx + 14 + monW * 2, cy + 6 + monH * 0.5);
            ctx.stroke();

            // Keyboard & control interface deck
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(cx + 10, cy + ch * 0.55, cw - 20, ch * 0.35);
            for (let ki = 0; ki < 8; ki++) {
              ctx.fillStyle = ki % 3 === 0 ? '#38bdf8' : ki % 3 === 1 ? '#34d399' : '#64748b';
              ctx.fillRect(cx + 14 + ki * ((cw - 28) / 8), cy + ch * 0.62, ((cw - 28) / 8) - 3, 5);
            }
            ctx.restore();
            break;
          }

          case 'server_rack': {
            // Quantum Supercomputing Server Tower (2.5D Vector)
            ctx.save();
            const sx = prop.x;
            const sy = prop.y;
            const sw = prop.width;
            const sh = prop.height;

            // Floor shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(sx + 4, sy + 6, sw - 8, sh);

            // Server Main Enclosure
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(sx, sy, sw, sh, 6);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // 2.5D Top Chamfer Plate
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(sx + 3, sy + 3, sw - 6, 10, 4);
            ctx.fill();

            // Vertical blade slots
            const bladeCount = Math.max(3, Math.floor(sw / 28));
            const bladeW = (sw - 12) / bladeCount;
            const t = Date.now();

            for (let bi = 0; bi < bladeCount; bi++) {
              const bx = sx + 6 + bi * bladeW;
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(bx + 1, sy + 16, bladeW - 2, sh - 22);
              ctx.strokeStyle = '#020617';
              ctx.lineWidth = 1;
              ctx.strokeRect(bx + 1, sy + 16, bladeW - 2, sh - 22);

              // Hard drive caddy lines
              for (let ci = 0; ci < 4; ci++) {
                const dy = sy + 20 + ci * ((sh - 30) / 4);
                ctx.fillStyle = '#475569';
                ctx.fillRect(bx + 3, dy, bladeW - 6, 3);

                // Flashing Activity LEDs
                const isBlinking = ((t + bi * 137 + ci * 211) % 500) < 250;
                ctx.fillStyle = isBlinking ? (bi % 2 === 0 ? '#10b981' : '#06b6d4') : '#064e3b';
                ctx.fillRect(bx + bladeW - 6, dy, 2, 3);
              }
            }

            // Top Status Header Glow
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(sx + sw / 2 - 15, sy + 6, 30, 3);

            ctx.restore();
            break;
          }

          case 'vent': {
            // Among Us Floor Ventilation Shaft (2.5D Recessed Grate)
            ctx.save();
            const vx = prop.x;
            const vy = prop.y;
            const vw = prop.width;
            const vh = prop.height;

            // Recessed metallic floor rim
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(vx, vy, vw, vh, 6);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Inner dark duct chamber
            ctx.fillStyle = '#020617';
            ctx.fillRect(vx + 6, vy + 6, vw - 12, vh - 12);

            // Interior ominous duct glow (pulsing)
            const ventPulse = Math.sin(Date.now() * 0.004) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + ventPulse * 0.15})`;
            ctx.fillRect(vx + 6, vy + 6, vw - 12, vh - 12);

            // Metal Ventilation Slats (heavy cast iron grates)
            const slatCount = 5;
            const slatH = (vh - 16) / slatCount;
            for (let si = 0; si < slatCount; si++) {
              const sy = vy + 8 + si * slatH;
              // Slat drop shadow inside duct
              ctx.fillStyle = '#020617';
              ctx.fillRect(vx + 8, sy + 3, vw - 16, 4);
              // Slat metal bar
              ctx.fillStyle = '#64748b';
              ctx.fillRect(vx + 8, sy, vw - 16, slatH - 3);
              ctx.strokeStyle = '#1e293b';
              ctx.lineWidth = 1;
              ctx.strokeRect(vx + 8, sy, vw - 16, slatH - 3);
            }

            // Corner industrial anchor bolts
            const bolts = [
              { x: vx + 4, y: vy + 4 },
              { x: vx + vw - 4, y: vy + 4 },
              { x: vx + 4, y: vy + vh - 4 },
              { x: vx + vw - 4, y: vy + vh - 4 },
            ];
            ctx.fillStyle = '#94a3b8';
            for (const b of bolts) {
              ctx.beginPath();
              ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
            break;
          }

          case 'weapon_locker': {
            // Ballistic Armory Weapon Locker (2.5D Heavy Steel Cabinet)
            ctx.save();
            const wx = prop.x;
            const wy = prop.y;
            const ww = prop.width;
            const wh = prop.height;

            // Deep cabinet shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(wx + 4, wy + 6, ww - 8, wh);

            // Steel armor cabinet
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.roundRect(wx, wy, ww, wh, 6);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Hazard warning stripes along the top edge
            const stripeW = 12;
            for (let st = wx + 4; st < wx + ww - 8; st += stripeW * 2) {
              ctx.fillStyle = '#facc15';
              ctx.fillRect(st, wy + 4, stripeW, 6);
              ctx.fillStyle = '#020617';
              ctx.fillRect(st + stripeW, wy + 4, stripeW, 6);
            }

            // Reinforced dual ballistic doors
            const doorW = (ww - 14) / 2;
            [wx + 5, wx + 9 + doorW].forEach((dx) => {
              ctx.fillStyle = '#312e81';
              ctx.fillRect(dx, wy + 14, doorW, wh - 20);
              ctx.strokeStyle = '#4338ca';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(dx, wy + 14, doorW, wh - 20);

              // Vertical door rib reinforcements
              ctx.fillStyle = '#1e1b4b';
              ctx.fillRect(dx + doorW * 0.35, wy + 20, 4, wh - 32);
              ctx.fillRect(dx + doorW * 0.65, wy + 20, 4, wh - 32);
            });

            // Biometric Handprint Scanner
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(wx + ww / 2, wy + wh * 0.5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
            break;
          }

          case 'o2_tank': {
            // High-Pressure Cryogenic Oxygen Tank (2.5D Cylinder)
            ctx.save();
            const ox = prop.x;
            const oy = prop.y;
            const ow = prop.width;
            const oh = prop.height;

            // Ground shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.ellipse(ox + ow / 2, oy + oh + 2, ow * 0.45, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cylinder body with cyan/teal metallic gradient
            const cylGrad = ctx.createLinearGradient(ox, oy, ox + ow, oy);
            cylGrad.addColorStop(0, '#064e3b');
            cylGrad.addColorStop(0.3, '#10b981');
            cylGrad.addColorStop(0.6, '#34d399');
            cylGrad.addColorStop(1, '#064e3b');

            ctx.fillStyle = cylGrad;
            ctx.beginPath();
            ctx.roundRect(ox + 4, oy + 4, ow - 8, oh - 8, 12);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Industrial Steel Retention Straps
            ctx.fillStyle = '#334155';
            ctx.fillRect(ox + 4, oy + oh * 0.3, ow - 8, 6);
            ctx.fillRect(ox + 4, oy + oh * 0.7, ow - 8, 6);

            // Brass Pressure Gauge Dial
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.arc(ox + ow / 2, oy + oh * 0.45, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Needle
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ox + ow / 2, oy + oh * 0.45);
            ctx.lineTo(ox + ow / 2 + 4, oy + oh * 0.45 - 4);
            ctx.stroke();

            // "O2" Lettering
            ctx.font = 'bold 9px "Chakra Petch", sans-serif';
            ctx.fillStyle = '#f0fdf4';
            ctx.textAlign = 'center';
            ctx.fillText('O₂', ox + ow / 2, oy + oh * 0.62);

            ctx.restore();
            break;
          }

          case 'radar': {
            // Rotating Holographic Orbital Navigation Radar (2.5D Pedestal)
            ctx.save();
            const rx = prop.x + prop.width / 2;
            const ry = prop.y + prop.height / 2;
            const rad = Math.min(prop.width, prop.height) / 2 - 4;

            // Octagonal base plate
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.arc(rx, ry, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Inner CRT Radar Screen
            ctx.fillStyle = '#031713';
            ctx.beginPath();
            ctx.arc(rx, ry, rad - 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Concentric range rings
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(rx, ry, (rad - 6) * 0.33, 0, Math.PI * 2);
            ctx.arc(rx, ry, (rad - 6) * 0.66, 0, Math.PI * 2);
            ctx.stroke();

            // Crosshairs
            ctx.beginPath();
            ctx.moveTo(rx - rad + 6, ry);
            ctx.lineTo(rx + rad - 6, ry);
            ctx.moveTo(rx, ry - rad + 6);
            ctx.lineTo(rx, ry + rad - 6);
            ctx.stroke();

            // Rotating Radar Sweep Needle
            const rAng = radarAngleRef.current;
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(rAng) * (rad - 6), ry + Math.sin(rAng) * (rad - 6));
            ctx.stroke();

            // Radar sweep trail cone
            ctx.fillStyle = 'rgba(52, 211, 153, 0.18)';
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.arc(rx, ry, rad - 6, rAng - 0.45, rAng);
            ctx.closePath();
            ctx.fill();

            // Random blips
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(rx + (rad - 12) * 0.5, ry - (rad - 12) * 0.3, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            break;
          }

          case 'ration_synth': {
            // Automated Food & Ration Synthesizer (2.5D Dispenser Unit)
            ctx.save();
            const fx = prop.x;
            const fy = prop.y;
            const fw = prop.width;
            const fh = prop.height;

            // Stainless steel body
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.roundRect(fx, fy, fw, fh, 8);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Glowing nutrient fluid vials
            const vialW = (fw - 24) / 3;
            const vialH = fh * 0.38;
            const fluidColors = ['#10b981', '#f59e0b', '#06b6d4'];
            fluidColors.forEach((fc, fi) => {
              const vx = fx + 6 + fi * (vialW + 4);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(vx, fy + 8, vialW, vialH);
              ctx.fillStyle = fc;
              ctx.fillRect(vx + 2, fy + 12, vialW - 4, vialH - 6);
              ctx.strokeStyle = '#475569';
              ctx.lineWidth = 1;
              ctx.strokeRect(vx, fy + 8, vialW, vialH);
            });

            // Delivery alcove tray slot
            ctx.fillStyle = '#020617';
            ctx.fillRect(fx + 10, fy + fh * 0.55, fw - 20, fh * 0.35);
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(fx + 10, fy + fh * 0.55, fw - 20, fh * 0.35);

            // Food tray inside slot
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(fx + 16, fy + fh * 0.72, fw - 32, 6);

            ctx.restore();
            break;
          }

          default: {
            // General High-Tech Modular Computer Terminal (2.5D Vector - Zero Emojis)
            ctx.save();
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y + 4, prop.width, prop.height, 8);
            ctx.fill();

            ctx.fillStyle = prop.color || '#334155';
            ctx.beginPath();
            ctx.roundRect(prop.x, prop.y, prop.width, prop.height, 8);
            ctx.fill();
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Computer Display Screen
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.roundRect(prop.x + 8, prop.y + 8, prop.width - 16, prop.height - 22, 4);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Status LEDs
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(prop.x + 14, prop.y + prop.height - 8, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.arc(prop.x + 24, prop.y + prop.height - 8, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            break;
          }
        }

        // Active Mission Beacon Above Prop (only when gameplay is active)
        const isObjective = isGameActive && missions.some(
          (m) => !m.completed && m.targetPropId === prop.id
        );

        if (isObjective && isGameActive) {
          ctx.save();
          const targetMission = missions.find((m) => m.targetPropId === prop.id)!;
          const bcX = prop.x + prop.width / 2;
          const bcY = prop.y - 25;
          const floatY = bcY + Math.sin(Date.now() * 0.006) * 6;

          // Glowing diamond
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(bcX, floatY - 14);
          ctx.lineTo(bcX + 11, floatY);
          ctx.lineTo(bcX, floatY + 14);
          ctx.lineTo(bcX - 11, floatY);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Title Tag
          ctx.font = 'bold 12px "Chakra Petch", sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.fillText(`! ${targetMission.icon} ${targetMission.title}`, bcX, floatY - 20);
          ctx.restore();
        }

        // Terminal de Logs Holographic Beacon (Centro de Control TV Monitor - only when gameplay is active)
        if (prop.type === 'log_terminal' && isGameActive) {
          ctx.save();
          const bcX = prop.x + prop.width / 2;
          const bcY = prop.y - 18;
          ctx.font = 'bold 12px "Chakra Petch", sans-serif';
          ctx.fillStyle = '#34d399';
          ctx.textAlign = 'center';
          ctx.fillText('📺 MONITOR CENTRAL // ESTADO DE LA NAVE', bcX, bcY);
          ctx.restore();
        }

        // Endeavour Shuttle Boarding Beacon & Open Gantry
        if (prop.id === 'prop_escape_shuttle' && escapePodUnlocked) {
          ctx.save();
          const hatchX = prop.x + prop.width / 2; // 3320
          const hatchY = prop.y + prop.height; // 660
          const floatOffset = Math.sin(Date.now() * 0.007) * 4;

          // Green Gantry Runway Beacons
          const runwayOffsets = [-120, -60, 0, 60, 120];
          for (const rOff of runwayOffsets) {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(hatchX + rOff, hatchY + 12, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Open Air-lock Hatch Visual
          ctx.fillStyle = '#15803d';
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(hatchX - 28, hatchY - 32, 56, 32, 6);
          ctx.fill();
          ctx.stroke();

          // Warm pressurized interior light beam leaking out
          const hatchGlow = ctx.createRadialGradient(hatchX, hatchY - 16, 5, hatchX, hatchY - 16, 55);
          hatchGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
          hatchGlow.addColorStop(0.5, 'rgba(74, 222, 128, 0.35)');
          hatchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = hatchGlow;
          ctx.beginPath();
          ctx.arc(hatchX, hatchY - 16, 55, 0, Math.PI * 2);
          ctx.fill();

          // Floating Boarding Prompt Banner
          ctx.fillStyle = 'rgba(2, 44, 34, 0.95)';
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(hatchX - 160, hatchY + 28 + floatOffset, 320, 32, 10);
          ctx.fill();
          ctx.stroke();

          ctx.font = 'bold 13px "Chakra Petch", sans-serif';
          ctx.fillStyle = '#86efac';
          ctx.textAlign = 'center';
          ctx.fillText('🚀 ¡COMPUERTA ABIERTA! • [SUBIR A NAVE / DESPEGAR]', hatchX, hatchY + 49 + floatOffset);
          ctx.restore();
        }

        // Hiding Prompt
        if (nearbyHidingProp?.id === prop.id && !player.isHidden) {
          ctx.save();
          ctx.fillStyle = 'rgba(6, 182, 212, 0.95)';
          ctx.font = 'bold 12px "Chakra Petch", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🛡️ [ESPACIO PARA ESCONDERSE]', prop.x + prop.width / 2, prop.y - 12);
          ctx.restore();
        }
      }

      // ================= 8B. OVERHEAD SUSPENDED ROOM NAME BADGES (FORCED Z-INDEX OVER ALL PROPS & WALLS) =================
      for (const room of ROOMS) {
        ctx.save();
        const badgeWidth = Math.min(340, room.width - 60);
        const badgeHeight = 40;
        const badgeX = room.x + (room.width - badgeWidth) / 2;
        const badgeY = room.y + 22;

        // Elevated drop shadow for 2.5D ceiling suspension
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        // Suspended industrial brackets connecting to ceiling/wall
        ctx.fillStyle = '#334155';
        ctx.fillRect(badgeX + 26, badgeY - 14, 6, 14);
        ctx.fillRect(badgeX + badgeWidth - 32, badgeY - 14, 6, 14);

        // Heavy dark titanium armor plate backing
        ctx.fillStyle = 'rgba(10, 15, 30, 0.96)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
        ctx.fill();

        // Neon illuminated border matching room theme
        ctx.strokeStyle = room.borderColor || '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Corner mounting hex rivets
        const boltOffsets = [
          { bx: badgeX + 7, by: badgeY + 7 },
          { bx: badgeX + badgeWidth - 7, by: badgeY + 7 },
          { bx: badgeX + 7, by: badgeY + badgeHeight - 7 },
          { bx: badgeX + badgeWidth - 7, by: badgeY + badgeHeight - 7 },
        ];
        ctx.fillStyle = '#94a3b8';
        for (const bolt of boltOffsets) {
          ctx.beginPath();
          ctx.arc(bolt.bx, bolt.by, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Status indicator LED
        const isSafe = room.id === 'control_center';
        ctx.fillStyle = isSafe ? '#10b981' : room.accentColor || '#38bdf8';
        ctx.beginPath();
        ctx.arc(badgeX + 22, badgeY + badgeHeight / 2, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Room Name Text (Guaranteed 100% visible over every prop and wall)
        ctx.shadowColor = 'transparent';
        ctx.font = '900 16px "Chakra Petch", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `📍 ${room.name.toUpperCase()}`,
          badgeX + badgeWidth / 2 + 6,
          badgeY + badgeHeight / 2
        );
        ctx.restore();
      }

      // ================= 9. 8 ALIENS RENDERING =================
      for (const alien of aliens) {
        // Vision Cone
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(alien.x, alien.y);
        ctx.arc(
          alien.x,
          alien.y,
          alien.fovDistance,
          alien.lookAngle - alien.fovAngle / 2,
          alien.lookAngle + alien.fovAngle / 2
        );
        ctx.closePath();

        const coneGrad = ctx.createRadialGradient(
          alien.x,
          alien.y,
          5,
          alien.x,
          alien.y,
          alien.fovDistance
        );

        if (alien.state === 'chase') {
          coneGrad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
          coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
        } else if (alien.state === 'suspicious') {
          coneGrad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
          coneGrad.addColorStop(1, 'rgba(245, 158, 11, 0.02)');
        } else {
          coneGrad.addColorStop(0, 'rgba(34, 197, 94, 0.28)');
          coneGrad.addColorStop(1, 'rgba(34, 197, 94, 0.01)');
        }

        ctx.fillStyle = coneGrad;
        ctx.fill();
        ctx.restore();

        // Hearing Radius
        if (alien.state === 'suspicious' || player.isSprinting) {
          ctx.save();
          ctx.strokeStyle = player.isSprinting ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(
            alien.x,
            alien.y,
            player.isSprinting ? alien.hearingRadiusSprint : alien.hearingRadiusWalk,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          ctx.restore();
        }

        // ================= XENOMORPH BIO-PREDATOR 2.5D SPRITE =================
        ctx.save();
        ctx.translate(alien.x, alien.y);
        ctx.rotate(alien.lookAngle);

        const timeNow = Date.now();
        const bioCycle = timeNow * 0.005 + (alien.x + alien.y) * 0.02;
        const tailWriggle = Math.sin(bioCycle) * 6;
        const jawSnap = alien.state === 'chase' ? Math.abs(Math.sin(bioCycle * 3)) * 4 : 0;
        const isChasing = alien.state === 'chase';
        const isSuspicious = alien.state === 'suspicious';

        // 1. Soft 2.5D Drop Shadow on Floor
        ctx.fillStyle = isChasing ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-2, 10, alien.radius + 12, alien.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Animated Writhing Prehensile Tail & Sensory Tentacles
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Tail Outline
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(-18, tailWriggle * 0.8, -26, tailWriggle);
        ctx.lineTo(-32, tailWriggle * 1.4);
        ctx.stroke();

        // Tail Body
        ctx.strokeStyle = alien.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(-18, tailWriggle * 0.8, -26, tailWriggle);
        ctx.lineTo(-32, tailWriggle * 1.4);
        ctx.stroke();

        // Stinger / Barbed Tail Tip
        ctx.fillStyle = isChasing ? '#ef4444' : '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(-32, tailWriggle * 1.4);
        ctx.lineTo(-37, tailWriggle * 1.4 - 3);
        ctx.lineTo(-35, tailWriggle * 1.4);
        ctx.lineTo(-37, tailWriggle * 1.4 + 3);
        ctx.closePath();
        ctx.fill();

        // Lateral writhing sensory tentacles (2 bio-appendages)
        const tentacle1 = Math.sin(bioCycle * 1.5) * 5;
        const tentacle2 = Math.cos(bioCycle * 1.5) * 5;

        ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.quadraticCurveTo(-14, -14 + tentacle1, -20, -10 + tentacle1);
        ctx.moveTo(-6, 8);
        ctx.quadraticCurveTo(-14, 14 + tentacle2, -20, 10 + tentacle2);
        ctx.stroke();

        ctx.strokeStyle = alien.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.quadraticCurveTo(-14, -14 + tentacle1, -20, -10 + tentacle1);
        ctx.moveTo(-6, 8);
        ctx.quadraticCurveTo(-14, 14 + tentacle2, -20, 10 + tentacle2);
        ctx.stroke();

        // Bioluminescent Spore nodes at tentacle tips
        ctx.fillStyle = isChasing ? '#ef4444' : alien.color;
        ctx.beginPath();
        ctx.arc(-20, -10 + tentacle1, 2.5, 0, Math.PI * 2);
        ctx.arc(-20, 10 + tentacle2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 3. Segmented Chitinous Exoskeleton (Thorax and Abdomen)
        // Dorsal Spine Spikes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-17, -8);
        ctx.lineTo(-11, -2);
        ctx.moveTo(-12, 4);
        ctx.lineTo(-17, 8);
        ctx.lineTo(-11, 2);
        ctx.fill();

        // Segmented Thorax / Back Plates
        const thoraxGrad = ctx.createLinearGradient(-16, -14, 18, 14);
        thoraxGrad.addColorStop(0, '#090d16');
        thoraxGrad.addColorStop(0.35, alien.color);
        thoraxGrad.addColorStop(0.8, '#0f172a');

        ctx.fillStyle = thoraxGrad;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3;

        // Posterior Abdomen Shell
        ctx.beginPath();
        ctx.ellipse(-6, 0, 11, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Segmented Chitin Ridge Ribs
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-7, 0, 9, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-3, 0, 11, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // 4. Elongated Xenomorph Cranial Crest (Dome)
        const crestGrad = ctx.createLinearGradient(-14, 0, 18, 0);
        crestGrad.addColorStop(0, '#020617');
        crestGrad.addColorStop(0.2, alien.color);
        crestGrad.addColorStop(0.65, alien.color);
        crestGrad.addColorStop(1, '#090d16');

        ctx.fillStyle = crestGrad;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3;

        // Sleek aerodynamic predatory head dome
        ctx.beginPath();
        ctx.moveTo(-15, -4);
        // Back of head dome
        ctx.bezierCurveTo(-18, -9, -8, -13, 4, -10);
        // Front snout taper
        ctx.bezierCurveTo(12, -8, 18, -5, 20, 0);
        ctx.bezierCurveTo(18, 5, 12, 8, 4, 10);
        // Lower jawline to back
        ctx.bezierCurveTo(-8, 13, -18, 9, -15, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glossy Specular Highlight along Cranial Crest
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-10, -7);
        ctx.quadraticCurveTo(0, -9, 12, -5);
        ctx.stroke();

        // Pulsing Bio-Vessel along central crest
        const pulseAlpha = 0.4 + Math.sin(bioCycle * 2) * 0.35;
        ctx.strokeStyle = isChasing ? `rgba(239, 68, 68, ${pulseAlpha})` : `rgba(255, 255, 255, ${pulseAlpha * 0.6})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();

        // 5. Outer Predatory Mandibles (Insectoid / Bio-mech pincer jaws)
        const mandibleFlare = isChasing ? 5 + jawSnap : isSuspicious ? 3 : 1;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;

        // Top Mandible
        ctx.beginPath();
        ctx.moveTo(12, -7);
        ctx.quadraticCurveTo(18, -11 - mandibleFlare, 23, -6 - mandibleFlare);
        ctx.lineTo(17, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bottom Mandible
        ctx.beginPath();
        ctx.moveTo(12, 7);
        ctx.quadraticCurveTo(18, 11 + mandibleFlare, 23, 6 + mandibleFlare);
        ctx.lineTo(17, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Mandible sharp tips
        ctx.fillStyle = isChasing ? '#ef4444' : '#e2e8f0';
        ctx.beginPath();
        ctx.arc(23, -6 - mandibleFlare, 1.5, 0, Math.PI * 2);
        ctx.arc(23, 6 + mandibleFlare, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 6. Razor-sharp Fangs & Inner Maw
        ctx.fillStyle = '#f8fafc';
        // Upper sharp fangs
        ctx.beginPath();
        ctx.moveTo(15, -3);
        ctx.lineTo(19, -2);
        ctx.lineTo(17, -4);
        ctx.closePath();
        ctx.fill();

        // Lower sharp fangs
        ctx.beginPath();
        ctx.moveTo(15, 3);
        ctx.lineTo(19, 2);
        ctx.lineTo(17, 4);
        ctx.closePath();
        ctx.fill();

        // Acid saliva drop if chasing
        if (isChasing) {
          ctx.fillStyle = 'rgba(74, 222, 128, 0.85)';
          ctx.beginPath();
          ctx.arc(20, 2 + Math.sin(bioCycle * 4) * 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // 7. Multi-Ocular Bioluminescent Eye Cluster (4 Menacing Alien Eyes)
        const eyeColor = isChasing ? '#ef4444' : isSuspicious ? '#f59e0b' : '#22d3ee';
        const eyeGlow = isChasing ? 'rgba(239, 68, 68, 0.8)' : isSuspicious ? 'rgba(245, 158, 11, 0.6)' : 'rgba(34, 211, 238, 0.5)';

        // Eye glow radial backing
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.ellipse(11, -4, 4, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(11, 4, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front primary eyes
        ctx.fillStyle = eyeColor;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.arc(11, -4, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(11, 4, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Secondary sensory eyes
        ctx.beginPath();
        ctx.arc(7, -6, 2, 0, Math.PI * 2);
        ctx.arc(7, 6, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Slit pupils or white specular pinpoints
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(12, -4, 1, 0, Math.PI * 2);
        ctx.arc(12, 4, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Status bubble
        ctx.save();
        ctx.font = 'bold 12px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';

        let bubbleBg = 'rgba(15, 23, 42, 0.9)';
        let statusIcon = '😴';
        if (alien.state === 'chase') {
          bubbleBg = 'rgba(239, 68, 68, 0.95)';
          statusIcon = '🚨 ¡TE SIGUE!';
        } else if (alien.state === 'suspicious') {
          bubbleBg = 'rgba(245, 158, 11, 0.95)';
          statusIcon = '❓ ¿RUIDO?';
        } else if (alien.state === 'search') {
          bubbleBg = 'rgba(99, 102, 241, 0.95)';
          statusIcon = '🔍 BUSCANDO';
        }

        ctx.fillStyle = bubbleBg;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        const textWidth = ctx.measureText(statusIcon).width + 16;
        ctx.beginPath();
        ctx.roundRect(alien.x - textWidth / 2, alien.y - alien.radius - 28, textWidth, 20, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(statusIcon, alien.x, alien.y - alien.radius - 14);
        ctx.restore();
      }

      // ================= 10. DETAILED ORIGINAL PROPORTIONED ASTRONAUT =================
      if (!isEscapingCinematic) {
        ctx.save();

        const now = performance.now();
        const deltaSec = playerAnimRef.current.lastTime
          ? Math.min(0.05, Math.max(0.001, (now - playerAnimRef.current.lastTime) / 1000))
          : 0.016;
        playerAnimRef.current.lastTime = now;

        const isMoving = Math.abs(player.vx) > 0.06 || Math.abs(player.vy) > 0.06;

        // 1. ANIMATION CALCULATIONS
        // A. Smooth Walk Weight (blends 0 -> 1 smoothly over ~65ms, eliminating the abrupt start pop)
        const targetWeight = isMoving ? 1 : 0;
        playerAnimRef.current.walkWeight += (targetWeight - playerAnimRef.current.walkWeight) * Math.min(1, deltaSec * 16);
        const walkWeight = playerAnimRef.current.walkWeight;

        // B. Continuous Step Phase (accumulates continuously; never teleports from 0 to random position)
        const stepRate = player.isSprinting ? 16 : 11;
        if (walkWeight > 0.01) {
          playerAnimRef.current.walkPhase += stepRate * deltaSec * Math.max(0.25, walkWeight);
        } else {
          playerAnimRef.current.walkPhase = 0;
        }
        const walkCycle = playerAnimRef.current.walkPhase;

        // C. Facing direction & smooth turnaround scaling (prevents 1-frame flip pop)
        const facingLeft = player.facing === 'left';
        const facingUp = player.facing === 'up';
        const facingDown = player.facing === 'down';
        const targetScaleX = facingLeft ? -1 : 1;
        playerAnimRef.current.scaleX += (targetScaleX - playerAnimRef.current.scaleX) * Math.min(1, deltaSec * 22);
        const rawScaleX = playerAnimRef.current.scaleX;
        // Non-zero guard to prevent singular matrix
        const scaleX = Math.abs(rawScaleX) < 0.06 ? (rawScaleX < 0 ? -0.06 : 0.06) : rawScaleX;

        // D. Idle Breathing Animation (Smoothly fades out as walkWeight increases)
        const breath = Math.sin(now * 0.0035);
        const idleFactor = Math.max(0, 1 - walkWeight);
        const breathChestX = breath * 1.2 * idleFactor;
        const breathChestY = breath * 0.8 * idleFactor;
        const breathHelmetY = breath * 0.5 * idleFactor;

        // E. Fluid Walk Cycle Animation & Vertical Bobbing (Smoothly blends in with walkWeight)
        const legSwingL = Math.sin(walkCycle) * 8 * walkWeight;
        const legSwingR = Math.sin(walkCycle + Math.PI) * 8 * walkWeight;
        const armSwingL = Math.sin(walkCycle + Math.PI) * 6 * walkWeight;
        const armSwingR = Math.sin(walkCycle) * 6 * walkWeight;

        // F. Vertical Bobbing: subtle sine bounce simulating steps, smoothly scaled by walkWeight
        const walkBob = Math.abs(Math.sin(walkCycle)) * 3.2 * walkWeight;
        const stepBob = 0;
        const walkLean = (facingLeft ? -0.07 : player.facing === 'right' ? 0.07 : 0) * walkWeight;

        // G. Smooth Helmet Spotlight Direction & Opacity
        const targetLightDir = facingDown ? Math.PI * 0.5 : 0;
        playerAnimRef.current.lightDir += (targetLightDir - playerAnimRef.current.lightDir) * Math.min(1, deltaSec * 16);
        const lightDir = playerAnimRef.current.lightDir;

        const targetLightAlpha = facingUp ? 0 : 1;
        playerAnimRef.current.lightAlpha += (targetLightAlpha - playerAnimRef.current.lightAlpha) * Math.min(1, deltaSec * 16);
        const lightAlpha = playerAnimRef.current.lightAlpha;

        // 1. Draw static ground contact shadow on deck floor (stays firmly on ground)
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(0, 18, 16 + (walkWeight * 1.5 - walkBob * 0.35 + breath * 0.8 * idleFactor), 7, 0, 0, Math.PI * 2);
        ctx.fill();

        if (walkWeight > 0.15) {
          // Dynamic Mag-Boot Energy Sparks on deck floor
          const sparkPhase = (now * 0.02) % (Math.PI * 2);
          ctx.fillStyle = player.isSprinting ? '#38bdf8' : 'rgba(56, 189, 248, 0.45)';
          const sparkX = Math.sin(sparkPhase) * 9 * (rawScaleX < 0 ? -1 : 1);
          ctx.beginPath();
          ctx.arc(sparkX, 17, (player.isSprinting ? 2.5 : 1.5) * walkWeight, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 2. Position astronaut model with vertical bobbing applied to entire body
        ctx.translate(player.x, player.y - walkBob);

        if (player.isHidden) {
          ctx.globalAlpha = 0.45;
        }

        ctx.scale(scaleX, 1);
        ctx.rotate(walkLean);

        // Helmet Spotlights Light Cone (Exploration Flashlight)
        if (lightAlpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = (player.isHidden ? 0.45 : 1.0) * lightAlpha;
          const flashGrad = ctx.createRadialGradient(8, -8, 2, 28, -6, 55);
          flashGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
          flashGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.1)');
          flashGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = flashGrad;
          ctx.beginPath();
          ctx.moveTo(8, -8);
          ctx.arc(8, -8, 60, lightDir - 0.45, lightDir + 0.45);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // C. BACKPACK PLSS (Portable Life Support System - Full Suit Color)
        // If facing up, backpack is in front; otherwise it sits on the back
        if (!facingUp) {
          // Backpack on the back (Color matches astronaut suit)
          ctx.fillStyle = player.suitColor;
          ctx.beginPath();
          ctx.roundRect(-16, -14 - stepBob, 8, 24, 4);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Oxygen cylinder on backpack
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.roundRect(-15, -12 - stepBob, 6, 10, 3);
          ctx.fill();

          // Thruster nozzle
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-14, 8 - stepBob, 4, 3);

          // Agile Sprint Plasma Plume
          if (player.isSprinting) {
            const flameH = 6 + (Date.now() % 4);
            const flameGrad = ctx.createLinearGradient(-12, 11 - stepBob, -12, 11 - stepBob + flameH);
            flameGrad.addColorStop(0, '#38bdf8');
            flameGrad.addColorStop(0.5, '#67e8f9');
            flameGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(-14, 11 - stepBob);
            ctx.lineTo(-10, 11 - stepBob);
            ctx.lineTo(-12, 11 - stepBob + flameH);
            ctx.closePath();
            ctx.fill();
          }
        }

        // D. LEGS AND MAGNETIC BOOTS
        // Left Leg
        ctx.save();
        ctx.translate(-6, 8 - stepBob);
        ctx.rotate(legSwingL * 0.06);
        ctx.fillStyle = player.suitColor;
        ctx.beginPath();
        ctx.roundRect(-4, 0, 7, 10, 3);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Knee reinforcement pad
        ctx.fillStyle = '#334155';
        ctx.fillRect(-3, 3, 5, 4);

        // Boot
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-5, 9, 9, 6, 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // Right Leg
        ctx.save();
        ctx.translate(6, 8 - stepBob);
        ctx.rotate(legSwingR * 0.06);
        ctx.fillStyle = player.suitColor;
        ctx.beginPath();
        ctx.roundRect(-3, 0, 7, 10, 3);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Knee reinforcement pad
        ctx.fillStyle = '#334155';
        ctx.fillRect(-2, 3, 5, 4);

        // Boot
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-4, 9, 9, 6, 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        // E. SPACESUIT TORSO (Chest Plate & Thermal Layer - Entire Suit Color!)
        ctx.save();
        ctx.translate(0, -stepBob);

        // Torso Suit Body
        ctx.fillStyle = player.suitColor;
        ctx.beginPath();
        ctx.roundRect(-10 - breathChestX * 0.5, -8, 20 + breathChestX, 17 + breathChestY, 5);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Thermal padded chest segments (Full suit color with 3D gradient highlight!)
        const chestGrad = ctx.createLinearGradient(0, -6, 0, 6);
        chestGrad.addColorStop(0, '#ffffff');
        chestGrad.addColorStop(0.25, player.suitColor);
        chestGrad.addColorStop(1, player.suitColor);
        ctx.fillStyle = chestGrad;
        ctx.beginPath();
        ctx.roundRect(-8, -6, 16, 12, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (!facingUp) {
          // Chest Life Support Module (Control unit with telemetry lights)
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(-5, -4, 10, 8, 2);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Breathing LED lights on chest module
          const ledBlink = Math.sin(Date.now() * 0.008) > 0;
          ctx.fillStyle = ledBlink ? '#10b981' : '#047857';
          ctx.beginPath();
          ctx.arc(-2, -1, 1.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(2, -1, 1.3, 0, Math.PI * 2);
          ctx.fill();

          // Mission Patch Insignia
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(4, -5);
          ctx.lineTo(7, -3);
          ctx.lineTo(4, -1);
          ctx.closePath();
          ctx.fill();
        } else {
          // If facing UP, draw detailed PLSS backpack centered on back (Full suit color!)
          ctx.fillStyle = player.suitColor;
          ctx.beginPath();
          ctx.roundRect(-8, -6, 16, 18, 4);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Dual oxygen tanks
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-6, -4, 4, 12);
          ctx.fillRect(2, -4, 4, 12);
        }

        // F. ARMS AND PRESSURIZED GLOVES
        // Left Arm
        ctx.save();
        ctx.translate(-10, -5);
        ctx.rotate(armSwingL * 0.08);
        ctx.fillStyle = player.suitColor;
        ctx.beginPath();
        ctx.roundRect(-3, 0, 5, 12, 2.5);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Left Glove
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(-0.5, 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right Arm
        ctx.save();
        ctx.translate(10, -5);
        ctx.rotate(armSwingR * 0.08);
        ctx.fillStyle = player.suitColor;
        ctx.beginPath();
        ctx.roundRect(-2, 0, 5, 12, 2.5);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Right Glove
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0.5, 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore(); // End torso transform

        // G. SPACESUIT HELMET (Spherical EVA Helmet with Panoramic Reflective Visor)
        ctx.save();
        ctx.translate(0, -17 + breathHelmetY);

        // Metallic Neck Collar Ring
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(0, 7, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Helmet Shell Outer Sphere (Dynamically colored to match entire astronaut suit!)
        const helmetGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 11);
        helmetGrad.addColorStop(0, '#ffffff'); // bright 3D specular light reflection
        helmetGrad.addColorStop(0.35, player.suitColor);
        helmetGrad.addColorStop(1, player.suitColor);
        ctx.fillStyle = helmetGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Helmet Side Spotlights
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(8, -3, 3.5, 5);
        ctx.fillRect(-11.5, -3, 3.5, 5);

        // Antenna
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(7, -8);
        ctx.lineTo(10, -14);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(10, -14, 1.5, 0, Math.PI * 2);
        ctx.fill();

        if (!facingUp) {
          // Panoramic Gold / Electric Cyan Visor
          const visorGrad = ctx.createLinearGradient(0, -7, 0, 5);
          visorGrad.addColorStop(0, '#38bdf8');
          visorGrad.addColorStop(0.5, '#0284c7');
          visorGrad.addColorStop(1, '#082f49');

          ctx.fillStyle = visorGrad;
          ctx.beginPath();
          ctx.roundRect(-7, -4, 14, 9, [3, 3, 5, 5]);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Curved Horizon & Star Specular Reflection
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.beginPath();
          ctx.ellipse(-2, -2, 4, 1.8, -0.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(3, 1, 1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Back of Helmet (Reinforced thermal ridges)
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 7, -Math.PI * 0.8, -Math.PI * 0.2);
          ctx.stroke();
        }

        ctx.restore(); // End helmet transform

        // Hidden Badge & Stealth Shroud
        if (player.isHidden) {
          ctx.scale(scaleX, 1);
          ctx.globalAlpha = 1.0;

          // Holographic stealth indicator badge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(-42, -player.radius - 28, 84, 18, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#6ee7b7';
          ctx.font = 'bold 10px "Chakra Petch", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('[MODO SIGILO]', 0, -player.radius - 16);
        }

        ctx.restore();
      }

      ctx.restore(); // Restore camera transform to screen space

      // ================= DYNAMIC LIGHTING & FOG-OF-WAR (STEALTH ATMOSPHERE) =================
      if (!isEscapingCinematic && !isPowerRestored) {
        if (!lightCanvasRef.current) {
          lightCanvasRef.current = document.createElement('canvas');
        }
        const lightCanvas = lightCanvasRef.current;
        if (lightCanvas.width !== cw || lightCanvas.height !== ch) {
          lightCanvas.width = cw;
          lightCanvas.height = ch;
        }

        const lctx = lightCanvas.getContext('2d');
        if (lctx) {
          // Fill screen with deep atmospheric darkness shroud
          lctx.globalCompositeOperation = 'source-over';
          lctx.fillStyle = 'rgba(2, 6, 18, 0.94)';
          lctx.fillRect(0, 0, cw, ch);

          // Carve out illuminated regions using destination-out
          lctx.globalCompositeOperation = 'destination-out';

          const screenPx = cw / 2 + (player.x - cameraRef.current.x) * cameraZoom;
          const screenPy = ch / 2 + (player.y - cameraRef.current.y) * cameraZoom;

          const flashlightOn = player.flashlightOn !== false;
          const aimAngle =
            player.aimAngle ??
            (player.facing === 'down'
              ? Math.PI / 2
              : player.facing === 'up'
              ? -Math.PI / 2
              : player.facing === 'left'
              ? Math.PI
              : 0);

          if (flashlightOn) {
            // A. Long Directional Flashlight Cone (440px reach)
            const beamDist = 440 * cameraZoom;
            const beamSpread = 0.68; // ~39 deg half-angle (~78 deg beam)

            const beamGrad = lctx.createRadialGradient(
              screenPx,
              screenPy,
              12,
              screenPx,
              screenPy,
              beamDist
            );
            beamGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
            beamGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.95)');
            beamGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.7)');
            beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

            lctx.fillStyle = beamGrad;
            lctx.beginPath();
            lctx.moveTo(screenPx, screenPy);
            lctx.arc(screenPx, screenPy, beamDist, aimAngle - beamSpread, aimAngle + beamSpread);
            lctx.closePath();
            lctx.fill();

            // B. Immediate Personal Ambient Aura (surroundings around feet)
            const haloRadius = 125 * cameraZoom;
            const haloGrad = lctx.createRadialGradient(
              screenPx,
              screenPy,
              8,
              screenPx,
              screenPy,
              haloRadius
            );
            haloGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
            haloGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.95)');
            haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

            lctx.fillStyle = haloGrad;
            lctx.beginPath();
            lctx.arc(screenPx, screenPy, haloRadius, 0, Math.PI * 2);
            lctx.fill();
          } else {
            // Stealth Mode (Flashlight OFF):
            // Narrow, dim emergency helmet visor glow
            const stealthRadius = 80 * cameraZoom;
            const stealthGrad = lctx.createRadialGradient(
              screenPx,
              screenPy,
              8,
              screenPx,
              screenPy,
              stealthRadius
            );
            stealthGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
            stealthGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
            stealthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

            lctx.fillStyle = stealthGrad;
            lctx.beginPath();
            lctx.arc(screenPx, screenPy, stealthRadius, 0, Math.PI * 2);
            lctx.fill();
          }

          // C. Centro de Control Safe Shield Glow (when active)
          if (controlCenterShieldActive) {
            const ctrlScreenX = cw / 2 + (1400 - cameraRef.current.x) * cameraZoom;
            const ctrlScreenY = ch / 2 + (1425 - cameraRef.current.y) * cameraZoom;
            const ctrlRadius = 380 * cameraZoom;
            const ctrlGrad = lctx.createRadialGradient(
              ctrlScreenX,
              ctrlScreenY,
              30,
              ctrlScreenX,
              ctrlScreenY,
              ctrlRadius
            );
            ctrlGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
            ctrlGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.92)');
            ctrlGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

            lctx.fillStyle = ctrlGrad;
            lctx.beginPath();
            lctx.arc(ctrlScreenX, ctrlScreenY, ctrlRadius, 0, Math.PI * 2);
            lctx.fill();
          }

          // D. Active Mission Console Beacon Glow (pulse through darkness)
          if (activeMission && !activeMission.completed) {
            const tProp = props.find((p) => p.id === activeMission.targetPropId);
            if (tProp) {
              const bX = cw / 2 + (tProp.x + tProp.width / 2 - cameraRef.current.x) * cameraZoom;
              const bY = ch / 2 + (tProp.y + tProp.height / 2 - cameraRef.current.y) * cameraZoom;
              const bRadius = 115 * cameraZoom;
              const bGrad = lctx.createRadialGradient(bX, bY, 15, bX, bY, bRadius);
              bGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
              bGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

              lctx.fillStyle = bGrad;
              lctx.beginPath();
              lctx.arc(bX, bY, bRadius, 0, Math.PI * 2);
              lctx.fill();
            }
          }

          // Reset composite mode
          lctx.globalCompositeOperation = 'source-over';

          // Render Darkness onto main screen
          ctx.drawImage(lightCanvas, 0, 0);

          // E. Volumetric Atmospheric Cyan Light Ray & Dust Motes (on main canvas)
          if (flashlightOn) {
            ctx.save();
            const beamDist = 440 * cameraZoom;
            const beamSpread = 0.68;

            const rayGrad = ctx.createRadialGradient(
              screenPx,
              screenPy,
              10,
              screenPx,
              screenPy,
              beamDist
            );
            rayGrad.addColorStop(0, 'rgba(217, 249, 255, 0.16)');
            rayGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.08)');
            rayGrad.addColorStop(1, 'rgba(2, 132, 199, 0.0)');

            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(screenPx, screenPy);
            ctx.arc(screenPx, screenPy, beamDist, aimAngle - beamSpread, aimAngle + beamSpread);
            ctx.closePath();
            ctx.fill();

            // Optical Dust Particulates in Flashlight Beam
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            const nowTime = Date.now() * 0.001;
            for (let di = 0; di < 6; di++) {
              const dDist = (di * 65 + (nowTime * 25) % 65 + 30) * cameraZoom;
              const dOffsetAngle = aimAngle + Math.sin(nowTime + di) * 0.25;
              const dx = screenPx + Math.cos(dOffsetAngle) * dDist;
              const dy = screenPy + Math.sin(dOffsetAngle) * dDist;
              ctx.beginPath();
              ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // F. Menacing Alien Eyes Lurking in the Shadows
          ctx.save();
          for (const alien of aliens) {
            const aScreenX = cw / 2 + (alien.x - cameraRef.current.x) * cameraZoom;
            const aScreenY = ch / 2 + (alien.y - cameraRef.current.y) * cameraZoom;

            if (aScreenX >= -50 && aScreenX <= cw + 50 && aScreenY >= -50 && aScreenY <= ch + 50) {
              const dx = alien.x - player.x;
              const dy = alien.y - player.y;
              const dist = Math.hypot(dx, dy);

              let isIlluminated = false;
              if (flashlightOn) {
                const angleToAlien = Math.atan2(dy, dx);
                let diff = angleToAlien - aimAngle;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                if (Math.abs(diff) < 0.72 && dist < 430) {
                  isIlluminated = true;
                }
              }
              if (dist < 85) {
                isIlluminated = true;
              }

              // In the dark, render menacing glowing alien eyes
              if (!isIlluminated) {
                const eyePulse = 0.55 + 0.35 * Math.sin(Date.now() * 0.007 + alien.x);
                ctx.fillStyle = alien.color;
                ctx.shadowColor = alien.color;
                ctx.shadowBlur = 8;
                ctx.globalAlpha = eyePulse;

                const eyeOffset = 4.5 * cameraZoom;
                const eyeAngle = alien.lookAngle;
                const perpX = Math.cos(eyeAngle + Math.PI / 2);
                const perpY = Math.sin(eyeAngle + Math.PI / 2);

                ctx.beginPath();
                ctx.arc(aScreenX + perpX * eyeOffset, aScreenY + perpY * eyeOffset, 2.5 * cameraZoom, 0, Math.PI * 2);
                ctx.arc(aScreenX - perpX * eyeOffset, aScreenY - perpY * eyeOffset, 2.5 * cameraZoom, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
          ctx.restore();
        }
      }

      // ================= ESCAPING CINEMATIC OVERLAY (NASA TAKEOFF) =================
      if (isEscapingCinematic) {
        ctx.save();
        // Top and Bottom Cinematic Letterbox Bars
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, cw, 52);
        ctx.fillRect(0, ch - 52, cw, 52);

        // Top Launch Status Banner
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 15px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EVACUACIÓN EN CURSO • DESPEGUE TRANSBORDADOR NASA ENDEAVOUR', cw / 2, 34);

        // Subtitle Status
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px "Chakra Petch", sans-serif';
        ctx.fillText('IGNICIÓN DE MOTORES PRINCIPALES • RUMBO A ÓRBITA SEGURA', cw / 2, ch - 20);

        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [
    player,
    aliens,
    props,
    missions,
    nearbyHidingProp,
    nearbyTaskProp,
    activeMission,
    escapePodUnlocked,
    isEscapingCinematic,
    controlCenterShieldActive,
    cameraZoom,
    isGameActive,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
    />
  );
};
