import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { VirtualControls } from './components/VirtualControls';
import { GameHUD } from './components/GameHUD';
import { VictoryModal, CaughtModal } from './components/GameOverModals';
import { InteractiveMinigameModal } from './components/InteractiveMinigameModal';
import { IntroCinematicScreen } from './components/IntroCinematic';
import { MainMenu } from './components/MainMenu';
import { EscapeCinematicScreen } from './components/EscapeCinematic';

export type ScreenState = 'INTRO_CINEMATIC' | 'MAIN_MENU' | 'GAME';
import {
  PlayerState,
  AlienEntity,
  GameProp,
  Room,
  Mission,
} from './types/game';
import {
  MAP_WIDTH,
  MAP_HEIGHT,
  ROOMS,
  GAME_PROPS,
  SAFE_PLAYER_SPAWN,
  getRandomMissionsSelection,
} from './game/mapData';
import { getAllObstacles, resolveMovement, getDistance, Rect } from './game/collision';
import {
  createRandomizedAliens,
  updateAllAliens,
  alertNearestAlienToPosition,
  isPlayerInSafeRoom,
} from './game/alienAI';
import { soundManager } from './audio/soundManager';

// Speeds maintained strictly intact as requested
const PLAYER_BASE_SPEED = 2.025;
const PLAYER_SPRINT_SPEED = 2.88;
const PLAYER_MAX_STAMINA = 180; // Upgraded stamina capacity (previously 100)
const STAMINA_DRAIN_RATE = 32; // Allows ~5.6s of sustained sprinting
const STAMINA_RECOVERY_RATE = 28; // Rapid, continuous regeneration

export default function App() {
  // 1. Estado Inicial: arranca obligatoriamente en la pantalla INTRO_CINEMATIC
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('INTRO_CINEMATIC');
  const [showCinematicOverlay, setShowCinematicOverlay] = useState<boolean>(true);
  const [gameStatus, setGameStatus] = useState<
    'playing' | 'cinematic_escaping' | 'won' | 'caught'
  >('playing');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Control Center Force Field: Active at start, permanently deactivated upon first exit
  const [controlCenterShieldActive, setControlCenterShieldActive] = useState<boolean>(true);
  const [shieldDeactivatedAlert, setShieldDeactivatedAlert] = useState<boolean>(false);

  // Ship-wide Emergency Power Grid Restoration state (eliminates fog of war & darkness)
  const [isPowerRestored, setIsPowerRestored] = useState<boolean>(false);
  const [powerRestoredAlert, setPowerRestoredAlert] = useState<boolean>(false);

  // Auto-hide "¡ENERGÍA PRINCIPAL RESTAURADA!" notification after 10 seconds (10000ms)
  useEffect(() => {
    if (powerRestoredAlert) {
      const timer = setTimeout(() => {
        setPowerRestoredAlert(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [powerRestoredAlert]);

  // Astronaut ALWAYS spawns safely inside Centro de Control
  const [player, setPlayer] = useState<PlayerState>({
    x: SAFE_PLAYER_SPAWN.x,
    y: SAFE_PLAYER_SPAWN.y,
    vx: 0,
    vy: 0,
    radius: 18,
    speed: PLAYER_BASE_SPEED,
    facing: 'down',
    isHidden: false,
    hidingSpotId: null,
    suitColor: '#06b6d4',
    stamina: PLAYER_MAX_STAMINA,
    maxStamina: PLAYER_MAX_STAMINA,
    isSprinting: false,
    isInteracting: false,
    walkFrame: 0,
    flashlightOn: true,
    aimAngle: Math.PI / 2,
    taskHoldSeconds: {},
    taskDeconSeconds: {},
  });

  // Exactly 4 missions selected per run
  const [missions, setMissions] = useState<Mission[]>(() => getRandomMissionsSelection());

  // Exactly 8 Aliens Patrolling globally through corridors (1 in active mission room, 7 roaming)
  const [aliens, setAliens] = useState<AlienEntity[]>(() => {
    const initialMissions = getRandomMissionsSelection();
    return createRandomizedAliens(initialMissions, SAFE_PLAYER_SPAWN.x, SAFE_PLAYER_SPAWN.y);
  });

  const [currentRoom, setCurrentRoom] = useState<Room | null>(
    ROOMS.find((r) => r.id === 'control_center') || ROOMS[0]
  );

  // Escape Pod Status
  const [escapePodUnlocked, setEscapePodUnlocked] = useState<boolean>(false);
  const [canLaunchEscapePod, setCanLaunchEscapePod] = useState<boolean>(false);

  // Interactive Minigame Modal state (for precision, memory_sequence, and wire_connect)
  const [minigameMission, setMinigameMission] = useState<Mission | null>(null);
  const [minigameSessionId, setMinigameSessionId] = useState<number>(0);

  // Interaction State
  const [nearbyHidingProp, setNearbyHidingProp] = useState<GameProp | null>(null);
  const [nearbyTaskProp, setNearbyTaskProp] = useState<GameProp | null>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const isHoldingTaskRef = useRef<boolean>(false);

  // Synchronized refs to decouple 60 FPS Game Loop from React component re-render teardown
  const playerRef = useRef<PlayerState>(player);
  playerRef.current = player;

  const aliensRef = useRef<AlienEntity[]>(aliens);
  aliensRef.current = aliens;

  const missionsRef = useRef<Mission[]>(missions);
  missionsRef.current = missions;

  const escapePodUnlockedRef = useRef<boolean>(escapePodUnlocked);
  escapePodUnlockedRef.current = escapePodUnlocked;

  const controlCenterShieldActiveRef = useRef<boolean>(controlCenterShieldActive);
  controlCenterShieldActiveRef.current = controlCenterShieldActive;

  // Exhaustion state: when stamina reaches 0, player cannot sprint until stamina >= 25%
  const isExhaustedRef = useRef<boolean>(false);

  // Input direction tracking & smooth velocity momentum
  const dpadDir = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keyboardKeys = useRef<{ [key: string]: boolean }>({});
  const isSprintingRef = useRef<boolean>(false);
  const playerVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  // Audio timers
  const lastStepTimeRef = useRef<number>(0);
  const lastTaskTickTimeRef = useRef<number>(0);

  // Check if all 4 missions are completed
  const checkMissionsCompletion = useCallback((updatedMissions: Mission[]) => {
    const allDone = updatedMissions.every((m) => m.completed);
    if (allDone && !escapePodUnlockedRef.current) {
      setEscapePodUnlocked(true);
      escapePodUnlockedRef.current = true;
      soundManager.playDoorUnlock();
    }
  }, []);

  // Escape Cinematic completion: transitions cleanly to victory screen with fanfare
  const handleEscapeCinematicFinished = useCallback(() => {
    setGameStatus('won');
    soundManager.playVictory();
  }, []);

  // Primary Interaction Trigger (Tapping button or pressing Space / E)
  const handleInteractTrigger = useCallback(() => {
    // 1. Launch Escape Pod & Play High-Impact Takeoff Cinematic
    if (canLaunchEscapePod) {
      setGameStatus('cinematic_escaping');
      soundManager.stopBGM();
      soundManager.playRocketLaunch();
      return;
    }

    // 2. Open Minigame (Precision, Memory Sequence, or Wire Connect)
    if (nearbyTaskProp && activeMission && !activeMission.completed) {
      if (
        activeMission.mechanicType !== 'anomalies' &&
        activeMission.mechanicType !== 'decontamination' &&
        activeMission.mechanicType !== 'data_download'
      ) {
        soundManager.playMissionToolPing();
        setAliens((prev) => alertNearestAlienToPosition(prev, player.x, player.y, controlCenterShieldActive));
        setMinigameSessionId((s) => s + 1);
        setMinigameMission(activeMission);
        return;
      }
    }

    // 3. Hide / Unhide in prop
    setPlayer((prev) => {
      if (prev.isHidden) {
        soundManager.playHide(false);
        return {
          ...prev,
          isHidden: false,
          hidingSpotId: null,
        };
      }

      if (nearbyHidingProp) {
        soundManager.playHide(true);
        return {
          ...prev,
          isHidden: true,
          hidingSpotId: nearbyHidingProp.id,
          x: nearbyHidingProp.x + nearbyHidingProp.width / 2,
          y: nearbyHidingProp.y + nearbyHidingProp.height / 2,
        };
      }

      return prev;
    });
  }, [canLaunchEscapePod, nearbyHidingProp, nearbyTaskProp, activeMission, player.x, player.y, controlCenterShieldActive]);

  // Handle Minigame Completion
  const handleMinigameComplete = useCallback(() => {
    if (!minigameMission) return;
    const missionId = minigameMission.id;

    // Emit mission sound and lure nearest alien to player's location
    soundManager.playMissionToolPing();
    setAliens((prev) => alertNearestAlienToPosition(prev, player.x, player.y, controlCenterShieldActive));

    // If this was the power restore mission, illuminate the entire map!
    if (minigameMission.id === 'm_restore_power' || minigameMission.mechanicType === 'wire_connect') {
      setIsPowerRestored(true);
      setPowerRestoredAlert(true);
      soundManager.playPowerRestore();
    }

    setMissions((prevMissions) => {
      const nextMissions = prevMissions.map((m) => {
        if (m.id === missionId) {
          return {
            ...m,
            progress: 100,
            completed: true,
          };
        }
        return m;
      });
      checkMissionsCompletion(nextMissions);
      return nextMissions;
    });

    setMinigameMission(null);
  }, [minigameMission, checkMissionsCompletion, player.x, player.y, controlCenterShieldActive]);

  // Tactical Flashlight Switcher (Toggles fog-of-war beam on/off)
  const handleToggleFlashlight = useCallback(() => {
    setPlayer((prev) => {
      const nextState = !prev.flashlightOn;
      soundManager.playFlashlightToggle(nextState);
      return {
        ...prev,
        flashlightOn: nextState,
      };
    });
  }, []);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      keyboardKeys.current[e.key.toLowerCase()] = true;

      if (e.key === 'Shift') {
        isSprintingRef.current = true;
      }

      if (e.key === 'f' || e.key === 'F') {
        handleToggleFlashlight();
      }

      if (e.key === ' ' || e.key === 'e' || e.key === 'E') {
        isHoldingTaskRef.current = true;
        handleInteractTrigger();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyboardKeys.current[e.key.toLowerCase()] = false;

      if (e.key === 'Shift') {
        isSprintingRef.current = false;
      }

      if (e.key === ' ' || e.key === 'e' || e.key === 'E') {
        isHoldingTaskRef.current = false;
      }
    };

    const handleBlur = () => {
      keyboardKeys.current = {};
      isSprintingRef.current = false;
      isHoldingTaskRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleInteractTrigger, handleToggleFlashlight]);

  // Virtual Controls Handlers
  const handleDpadChange = useCallback((dir: { x: number; y: number }) => {
    dpadDir.current = dir;
  }, []);

  const handleSprintToggle = useCallback((active: boolean) => {
    isSprintingRef.current = active;
  }, []);

  const handleTaskHoldStart = useCallback(() => {
    isHoldingTaskRef.current = true;
    handleInteractTrigger();
  }, [handleInteractTrigger]);

  const handleTaskHoldEnd = useCallback(() => {
    isHoldingTaskRef.current = false;
  }, []);

  // Permadeath Game Restart: Generates 4 strictly unique missions, restores shield, and resets all entities
  const handleFullRestart = useCallback(() => {
    setGameStatus('playing');
    setControlCenterShieldActive(true);
    setShieldDeactivatedAlert(false);
    playerVelocityRef.current = { vx: 0, vy: 0 };
    setPlayer({
      x: SAFE_PLAYER_SPAWN.x,
      y: SAFE_PLAYER_SPAWN.y,
      vx: 0,
      vy: 0,
      radius: 18,
      speed: PLAYER_BASE_SPEED,
      facing: 'down',
      isHidden: false,
      hidingSpotId: null,
      suitColor: player.suitColor,
      stamina: PLAYER_MAX_STAMINA,
      maxStamina: PLAYER_MAX_STAMINA,
      isSprinting: false,
      isInteracting: false,
      walkFrame: 0,
      flashlightOn: true,
      aimAngle: Math.PI / 2,
      taskHoldSeconds: {},
      taskDeconSeconds: {},
    });
    const newMissions = getRandomMissionsSelection();
    setMissions(newMissions);
    setAliens(createRandomizedAliens(newMissions, SAFE_PLAYER_SPAWN.x, SAFE_PLAYER_SPAWN.y));
    setEscapePodUnlocked(false);
    setCanLaunchEscapePod(false);
    setIsPowerRestored(false);
    setPowerRestoredAlert(false);
    isExhaustedRef.current = false;
    isSprintingRef.current = false;
    escapePodUnlockedRef.current = false;
    controlCenterShieldActiveRef.current = true;
    isHoldingTaskRef.current = false;
  }, [player.suitColor]);

  // Sound Toggle
  const handleToggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  }, [soundEnabled]);

  // Main Game Loop (60 FPS)
  useEffect(() => {
    let animId: number;
    let lastTimestamp = 0;

    const loop = (timestamp: number) => {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        animId = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(40, Math.max(10, timestamp - lastTimestamp));
      lastTimestamp = timestamp;

      if (currentScreen === 'GAME' && gameStatus === 'playing') {
        const obstacles = getAllObstacles(
          GAME_PROPS,
          escapePodUnlockedRef.current,
          controlCenterShieldActiveRef.current,
          false
        );
        const alienObstacles = getAllObstacles(
          GAME_PROPS,
          escapePodUnlockedRef.current,
          controlCenterShieldActiveRef.current,
          true
        );

        // ================= 1. PLAYER INPUT & MOVEMENT =================
        let inputX = 0;
        let inputY = 0;

        if (dpadDir.current.x !== 0 || dpadDir.current.y !== 0) {
          inputX = dpadDir.current.x;
          inputY = dpadDir.current.y;
        } else {
          if (keyboardKeys.current['arrowleft'] || keyboardKeys.current['a']) inputX -= 1;
          if (keyboardKeys.current['arrowright'] || keyboardKeys.current['d']) inputX += 1;
          if (keyboardKeys.current['arrowup'] || keyboardKeys.current['w']) inputY -= 1;
          if (keyboardKeys.current['arrowdown'] || keyboardKeys.current['s']) inputY += 1;
        }

        const mag = Math.sqrt(inputX * inputX + inputY * inputY);
        if (mag > 0) {
          inputX /= mag;
          inputY /= mag;
        }

        setPlayer((prev) => {
          if (prev.isHidden) {
            if (mag > 0.3) {
              soundManager.playHide(false);
              const next = { ...prev, isHidden: false, hidingSpotId: null };
              playerRef.current = next;
              return next;
            }
            playerRef.current = prev;
            return prev;
          }

          let currentStamina = prev.stamina;
          const isSprintPressed = isSprintingRef.current;
          const isMoving = mag > 0.05;

          // Exhaustion check: if exhausted, player cannot sprint until stamina recovers past 20%
          if (isExhaustedRef.current) {
            if (currentStamina >= prev.maxStamina * 0.2) {
              isExhaustedRef.current = false;
            }
          }

          // Active sprint condition: sprint pressed, moving, not exhausted, stamina > 0
          let isRunning = isSprintPressed && isMoving && !isExhaustedRef.current && currentStamina > 0;

          if (isRunning) {
            // Drain stamina while actively sprinting
            const drainAmount = (dt / 1000) * STAMINA_DRAIN_RATE;
            currentStamina = Math.max(0, currentStamina - drainAmount);
            if (currentStamina <= 0) {
              currentStamina = 0;
              isExhaustedRef.current = true;
              isRunning = false;
            }
          } else {
            // Smooth continuous recovery whenever not actively sprinting
            const regenAmount = (dt / 1000) * STAMINA_RECOVERY_RATE;
            currentStamina = Math.min(prev.maxStamina, currentStamina + regenAmount);
          }

          // Natural, responsive ease-in (~45ms / 3 frames): eliminates the abrupt 1-frame visual pop
          // while keeping instant tactile responsiveness (55% speed in frame 1, 80% in frame 2, 100% in frame 3)
          const speed = isRunning ? PLAYER_SPRINT_SPEED : PLAYER_BASE_SPEED;
          const targetVx = isMoving ? inputX * speed : 0;
          const targetVy = isMoving ? inputY * speed : 0;

          if (isMoving) {
            const accel = 0.55;
            playerVelocityRef.current.vx += (targetVx - playerVelocityRef.current.vx) * accel;
            playerVelocityRef.current.vy += (targetVy - playerVelocityRef.current.vy) * accel;
          } else {
            const decel = 0.65;
            playerVelocityRef.current.vx += (0 - playerVelocityRef.current.vx) * decel;
            playerVelocityRef.current.vy += (0 - playerVelocityRef.current.vy) * decel;
            if (Math.hypot(playerVelocityRef.current.vx, playerVelocityRef.current.vy) < 0.04) {
              playerVelocityRef.current.vx = 0;
              playerVelocityRef.current.vy = 0;
            }
          }

          const moveVx = playerVelocityRef.current.vx;
          const moveVy = playerVelocityRef.current.vy;

          const resolved = resolveMovement(
            prev.x,
            prev.y,
            moveVx,
            moveVy,
            prev.radius,
            obstacles,
            escapePodUnlockedRef.current,
            false,
            controlCenterShieldActiveRef.current
          );

          const isPhysicallyMoving = Math.hypot(moveVx, moveVy) > 0.08;

          if (isPhysicallyMoving && timestamp - lastStepTimeRef.current > (isRunning ? 250 : 360)) {
            soundManager.playStep();
            lastStepTimeRef.current = timestamp;
          }

          let facing = prev.facing;
          if (Math.abs(inputX) > Math.abs(inputY) && Math.abs(inputX) > 0.1) {
            facing = inputX > 0 ? 'right' : 'left';
          } else if (Math.abs(inputY) > 0.1) {
            facing = inputY > 0 ? 'down' : 'up';
          }

          let targetAngle = prev.aimAngle ?? Math.PI / 2;
          if (mag > 0.05) {
            targetAngle = Math.atan2(inputY, inputX);
          } else if (facing === 'down') {
            targetAngle = Math.PI / 2;
          } else if (facing === 'up') {
            targetAngle = -Math.PI / 2;
          } else if (facing === 'right') {
            targetAngle = 0;
          } else if (facing === 'left') {
            targetAngle = Math.PI;
          }

          // Smooth angular sweep for flashlight cone & head orientation
          const curAngle = prev.aimAngle ?? targetAngle;
          let angleDiff = targetAngle - curAngle;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          const aimAngle = curAngle + angleDiff * 0.32;

          const nextPlayer: PlayerState = {
            ...prev,
            x: resolved.newX,
            y: resolved.newY,
            vx: resolved.newX - prev.x,
            vy: resolved.newY - prev.y,
            facing,
            aimAngle,
            stamina: currentStamina,
            isSprinting: isRunning,
            walkFrame: isPhysicallyMoving ? prev.walkFrame + (isRunning ? 1.5 : 1) : 0,
          };
          playerRef.current = nextPlayer;
          return nextPlayer;
        });

        const currentPlayer = playerRef.current;

        // ================= 2. ROOM & FORCE FIELD DEACTIVATION CHECK =================
        let playerRoom: Room | null = null;
        for (const r of ROOMS) {
          if (
            currentPlayer.x >= r.x &&
            currentPlayer.x <= r.x + r.width &&
            currentPlayer.y >= r.y &&
            currentPlayer.y <= r.y + r.height
          ) {
            playerRoom = r;
            break;
          }
        }
        setCurrentRoom(playerRoom);

        // Strict Rule: The instant the player exits Centro de Control for the first time,
        // the force field security shield is permanently deactivated!
        const controlRoom = ROOMS.find((r) => r.id === 'control_center');
        const isPlayerInsideControlCenter = controlRoom
          ? currentPlayer.x >= controlRoom.x &&
            currentPlayer.x <= controlRoom.x + controlRoom.width &&
            currentPlayer.y >= controlRoom.y &&
            currentPlayer.y <= controlRoom.y + controlRoom.height
          : false;

        if (controlCenterShieldActiveRef.current && !isPlayerInsideControlCenter) {
          setControlCenterShieldActive(false);
          controlCenterShieldActiveRef.current = false;
          setShieldDeactivatedAlert(true);
          soundManager.playDoorUnlock();
          setTimeout(() => {
            setShieldDeactivatedAlert(false);
          }, 4500);
        }

        // Nearest hiding spot
        let nearestHiding: GameProp | null = null;
        let minHidingDist = 85;
        for (const prop of GAME_PROPS) {
          if (prop.isHidingSpot) {
            const centerX = prop.x + prop.width / 2;
            const centerY = prop.y + prop.height / 2;
            const dist = getDistance(currentPlayer.x, currentPlayer.y, centerX, centerY);
            if (dist < minHidingDist) {
              nearestHiding = prop;
              minHidingDist = dist;
            }
          }
        }
        setNearbyHidingProp(nearestHiding);

        // Nearest interactive mission prop (Generous 115px radius so interaction never trabas)
        let nearestTask: GameProp | null = null;
        let matchingMission: Mission | null = null;
        let minTaskDist = 115;

        for (const mission of missionsRef.current) {
          if (!mission.completed) {
            const prop = GAME_PROPS.find((p) => p.id === mission.targetPropId);
            if (prop) {
              const centerX = prop.x + prop.width / 2;
              const centerY = prop.y + prop.height / 2;
              const dist = getDistance(currentPlayer.x, currentPlayer.y, centerX, centerY);
              if (dist < minTaskDist) {
                nearestTask = prop;
                matchingMission = mission;
                minTaskDist = dist;
              }
            }
          }
        }
        setNearbyTaskProp(nearestTask);
        setActiveMission(matchingMission);

        // Strict bugfix: If an active mission is in range, suppress nearbyHiding so the action button never collides
        if (nearestTask && matchingMission && !currentPlayer.isHidden) {
          nearestHiding = null;
        }
        setNearbyHidingProp(nearestHiding);

        // Escape Pod Launch console proximity (Fix for Critical Bug: Check boarding hatch and gantry area)
        const podProp = GAME_PROPS.find((p) => p.id === 'prop_escape_shuttle');
        if (podProp && escapePodUnlockedRef.current) {
          const hatchX = podProp.x + podProp.width / 2; // 3320
          const hatchY = podProp.y + podProp.height; // 660 (bottom boarding hatch)
          const distToHatch = getDistance(currentPlayer.x, currentPlayer.y, hatchX, hatchY);
          const inBoardingArea =
            currentPlayer.x >= podProp.x - 40 &&
            currentPlayer.x <= podProp.x + podProp.width + 40 &&
            currentPlayer.y >= podProp.y + podProp.height - 80 &&
            currentPlayer.y <= podProp.y + podProp.height + 140;

          setCanLaunchEscapePod(distToHatch < 185 || inBoardingArea);
        } else {
          setCanLaunchEscapePod(false);
        }

        // ================= 3. ACTIVE MISSION MECHANICS PROGRESSION =================
        // A. ANOMALIES COLLECTION (Walking over floating anomalies)
        for (const mission of missionsRef.current) {
          if (mission.mechanicType === 'anomalies' && !mission.completed && mission.anomalies) {
            let collectedInFrame = false;
            let updatedAnomalies = mission.anomalies.map((pt) => {
              if (!pt.collected && getDistance(currentPlayer.x, currentPlayer.y, pt.x, pt.y) < 28) {
                collectedInFrame = true;
                soundManager.playTaskTick();
                return { ...pt, collected: true };
              }
              return pt;
            });

            if (collectedInFrame) {
              soundManager.playMissionToolPing();
              setAliens((prev) => {
                const nextAliens = alertNearestAlienToPosition(
                  prev,
                  currentPlayer.x,
                  currentPlayer.y,
                  controlCenterShieldActiveRef.current
                );
                aliensRef.current = nextAliens;
                return nextAliens;
              });
              const totalCollected = updatedAnomalies.filter((pt) => pt.collected).length;
              const isAllDone = totalCollected >= 5;

              setMissions((prevMissions) => {
                const nextMissions = prevMissions.map((m) => {
                  if (m.id === mission.id) {
                    return {
                      ...m,
                      anomalies: updatedAnomalies,
                      collectedAnomalies: totalCollected,
                      progress: Math.min(100, (totalCollected / 5) * 100),
                      completed: isAllDone,
                    };
                  }
                  return m;
                });
                missionsRef.current = nextMissions;
                if (isAllDone) {
                  soundManager.playTaskComplete();
                  checkMissionsCompletion(nextMissions);
                }
                return nextMissions;
              });
            }
          }
        }

        // B. DECONTAMINATION (Standing still in decontamination zone for 4s)
        if (matchingMission && matchingMission.mechanicType === 'decontamination' && !matchingMission.completed) {
          const missionId = matchingMission.id;
          const isStandingStill = Math.abs(currentPlayer.vx) < 0.1 && Math.abs(currentPlayer.vy) < 0.1;

          if (isStandingStill) {
            const targetDecon = matchingMission.targetDeconSeconds || 4.0;
            const currentDecon = (currentPlayer.taskDeconSeconds[missionId] || 0) + dt / 1000;

            if (timestamp - lastTaskTickTimeRef.current > 400) {
              soundManager.playMissionToolPing();
              setAliens((prev) => {
                const nextAliens = alertNearestAlienToPosition(
                  prev,
                  currentPlayer.x,
                  currentPlayer.y,
                  controlCenterShieldActiveRef.current
                );
                aliensRef.current = nextAliens;
                return nextAliens;
              });
              lastTaskTickTimeRef.current = timestamp;
            }

            setPlayer((prev) => {
              const next = {
                ...prev,
                taskDeconSeconds: { ...prev.taskDeconSeconds, [missionId]: currentDecon },
              };
              playerRef.current = next;
              return next;
            });

            setMissions((prevMissions) => {
              const nextMissions = prevMissions.map((m) => {
                if (m.id === missionId) {
                  const done = currentDecon >= targetDecon;
                  return {
                    ...m,
                    currentDeconSeconds: currentDecon,
                    progress: Math.min(100, (currentDecon / targetDecon) * 100),
                    completed: done,
                  };
                }
                return m;
              });
              missionsRef.current = nextMissions;
              if (currentDecon >= targetDecon) {
                soundManager.playTaskComplete();
                checkMissionsCompletion(nextMissions);
              }
              return nextMissions;
            });
          }
        }

        // C. DATA DOWNLOAD (Holding action button for 3s continuously)
        if (matchingMission && matchingMission.mechanicType === 'data_download' && !matchingMission.completed) {
          const missionId = matchingMission.id;

          if (isHoldingTaskRef.current) {
            const targetHold = matchingMission.targetHoldSeconds || 3.0;
            const currentHold = (currentPlayer.taskHoldSeconds[missionId] || 0) + dt / 1000;

            if (timestamp - lastTaskTickTimeRef.current > 350) {
              soundManager.playMissionToolPing();
              setAliens((prev) => {
                const nextAliens = alertNearestAlienToPosition(
                  prev,
                  currentPlayer.x,
                  currentPlayer.y,
                  controlCenterShieldActiveRef.current
                );
                aliensRef.current = nextAliens;
                return nextAliens;
              });
              lastTaskTickTimeRef.current = timestamp;
            }

            setPlayer((prev) => {
              const next = {
                ...prev,
                taskHoldSeconds: { ...prev.taskHoldSeconds, [missionId]: currentHold },
              };
              playerRef.current = next;
              return next;
            });

            setMissions((prevMissions) => {
              const nextMissions = prevMissions.map((m) => {
                if (m.id === missionId) {
                  const done = currentHold >= targetHold;
                  return {
                    ...m,
                    currentHoldSeconds: currentHold,
                    progress: Math.min(100, (currentHold / targetHold) * 100),
                    completed: done,
                  };
                }
                return m;
              });
              missionsRef.current = nextMissions;
              if (currentHold >= targetHold) {
                soundManager.playTaskComplete();
                checkMissionsCompletion(nextMissions);
              }
              return nextMissions;
            });
          }
        }

        // ================= 4. ALIEN AI UPDATE (8 ALIENS GLOBAL PATROL) =================
        const alienResult = updateAllAliens(
          aliensRef.current,
          currentPlayer,
          alienObstacles,
          dt,
          controlCenterShieldActiveRef.current
        );
        aliensRef.current = alienResult.aliens;
        setAliens(alienResult.aliens);

        // Dynamic Space BGM: Ambient Space vs Intense Chase Crossfade
        const isAnyAlienChasing = alienResult.aliens.some((a) => a.state === 'chase');
        soundManager.updateMusicState(isAnyAlienChasing);

        // 1. Restaurar Mortalidad (Colisión Jugador-Alien):
        // Verifica constantemente la distancia entre el jugador y los aliens en cada frame del Game Loop.
        // Si la distancia es menor o igual a la suma de sus radios (colisión), DEBE dispararse INMEDIATAMENTE
        // el estado de muerte / 'caught'.
        let playerCaught = alienResult.caught;
        if (!playerCaught && !currentPlayer.isHidden) {
          const isSafeRoomProtected = controlCenterShieldActiveRef.current && isPlayerInSafeRoom(currentPlayer);
          if (!isSafeRoomProtected) {
            for (const alien of alienResult.aliens) {
              const dist = Math.hypot(alien.x - currentPlayer.x, alien.y - currentPlayer.y);
              if (dist <= currentPlayer.radius + alien.radius) {
                playerCaught = true;
                soundManager.playCaught();
                break;
              }
            }
          }
        }

        if (playerCaught) {
          setGameStatus('caught');
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    currentScreen,
    gameStatus,
    checkMissionsCompletion,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans select-none touch-none">
      {/* Capa Inferior 1: 2D Canvas Engine (Astronauta en el Centro de Control) */}
      <GameCanvas
        player={player}
        aliens={aliens}
        props={GAME_PROPS}
        missions={missions}
        nearbyHidingProp={nearbyHidingProp}
        nearbyTaskProp={nearbyTaskProp}
        activeMission={activeMission}
        escapePodUnlocked={escapePodUnlocked}
        isEscapingCinematic={gameStatus === 'cinematic_escaping'}
        controlCenterShieldActive={controlCenterShieldActive}
        isPowerRestored={isPowerRestored}
        isGameActive={currentScreen === 'GAME'}
      />

      {/* 1. Pre-renderizado (Evitar Desfase): Menú Principal en la capa inferior
          Se renderiza tanto en MAIN_MENU como mientras el video (INTRO_CINEMATIC) se reproduce
          en la capa superior, eliminando cualquier desfase, carga o parpadeo al terminar el video. */}
      {currentScreen !== 'GAME' && (
        <MainMenu
          onStartGame={() => {
            handleFullRestart();
            setCurrentScreen('GAME');
          }}
          onWatchIntro={() => {
            setShowCinematicOverlay(true);
            setCurrentScreen('INTRO_CINEMATIC');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          selectedColor={player.suitColor}
          onChangeColor={(col) => setPlayer((p) => ({ ...p, suitColor: col }))}
        />
      )}

      {/* Interfaz de Juego en Vivo (HUD, controles virtuales y modales): solo activa durante la partida */}
      {currentScreen === 'GAME' && (
        <>
          {/* Security Shield Deactivation Alert Overlay */}
          {shieldDeactivatedAlert && !isPowerRestored && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-red-500/70 rounded-2xl px-4 py-2.5 shadow-2xl shadow-red-950/80 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none max-w-md backdrop-blur-xl">
              <div className="w-8 h-8 rounded-xl bg-red-950/80 border border-red-500/60 flex items-center justify-center shrink-0">
                <span className="text-base text-red-400 animate-pulse font-bold">⚡</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-red-300 font-mono font-bold text-xs tracking-wider uppercase">
                  ¡CAMPO DE FUERZA DESACTIVADO!
                </span>
                <span className="text-slate-300 text-[11px] leading-tight">
                  Has salido del Centro de Control. Los 8 aliens tienen ahora acceso al sector.
                </span>
              </div>
            </div>
          )}

          {/* Power Restored Notification Banner */}
          {powerRestoredAlert && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 border-2 border-emerald-400/70 rounded-2xl px-4 py-2.5 shadow-2xl shadow-emerald-950/80 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none max-w-md backdrop-blur-xl">
              <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-400/60 flex items-center justify-center shrink-0">
                <span className="text-base text-emerald-300 animate-pulse font-bold">💡</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-emerald-300 font-mono font-bold text-xs tracking-wider uppercase">
                  ¡ENERGÍA PRINCIPAL RESTAURADA!
                </span>
                <span className="text-slate-300 text-[11px] leading-tight">
                  Red eléctrica iluminada al 100%. Niebla de guerra desactivada en toda la nave.
                </span>
              </div>
            </div>
          )}

          {/* Top HUD */}
          <GameHUD
            player={player}
            aliens={aliens}
            missions={missions}
            currentRoom={currentRoom}
            escapePodUnlocked={escapePodUnlocked}
            canLaunchEscapePod={canLaunchEscapePod}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onRestart={handleFullRestart}
            onReturnToMenu={() => setCurrentScreen('MAIN_MENU')}
            onChangeColor={(col) => setPlayer((p) => ({ ...p, suitColor: col }))}
            controlCenterShieldActive={controlCenterShieldActive}
            isPowerRestored={isPowerRestored}
          />

          {/* Virtual D-Pad & Action Controls */}
          <VirtualControls
            onDirectionChange={handleDpadChange}
            onSprintToggle={handleSprintToggle}
            onActionTrigger={handleInteractTrigger}
            onHoldStart={handleTaskHoldStart}
            onHoldEnd={handleTaskHoldEnd}
            isPlayerHidden={player.isHidden}
            nearbyHidingProp={nearbyHidingProp}
            nearbyTaskProp={nearbyTaskProp}
            activeMission={activeMission}
            canLaunchEscapePod={canLaunchEscapePod}
            stamina={player.stamina}
            maxStamina={player.maxStamina}
            isSprinting={player.isSprinting}
            flashlightOn={player.flashlightOn}
            onFlashlightToggle={handleToggleFlashlight}
            isPowerRestored={isPowerRestored}
          />

          {/* Interactive Minigame Modal */}
          {minigameMission && (
            <InteractiveMinigameModal
              key={`${minigameMission.id}_${minigameSessionId}`}
              mission={minigameMission}
              onComplete={handleMinigameComplete}
              onClose={() => setMinigameMission(null)}
              onMissionNoise={() => {
                setAliens((prev) => alertNearestAlienToPosition(prev, player.x, player.y, controlCenterShieldActive));
              }}
            />
          )}

          {/* Victory Modal */}
          {gameStatus === 'won' && (
            <VictoryModal
              onRestart={handleFullRestart}
              onReturnToMenu={() => setCurrentScreen('MAIN_MENU')}
              tasksCompleted={4}
              playerSuitColor={player.suitColor}
            />
          )}

          {/* Permadeath Caught Modal */}
          {gameStatus === 'caught' && (
            <CaughtModal
              onFullRestart={handleFullRestart}
              onReturnToMenu={() => setCurrentScreen('MAIN_MENU')}
              missionsCompleted={missions.filter((m) => m.completed).length}
              totalMissions={missions.length}
              playerSuitColor={player.suitColor}
              lastRoomName={currentRoom ? currentRoom.name : 'Pasillos de la Nave'}
              onChangeColor={(color) => setPlayer((p) => ({ ...p, suitColor: color }))}
            />
          )}
        </>
      )}

      {/* 2. Capa Superior: Video Cinemático de Introducción (position: 'absolute', zIndex: 10)
          Crossfade suave de 1 a 0 con Animated.View y Animated.timing (1000ms).
          Una vez que la opacidad llega a 0, se desmonta el reproductor. */}
      {showCinematicOverlay && (
        <IntroCinematicScreen
          onFinished={() => {
            setShowCinematicOverlay(false);
            if (currentScreen === 'INTRO_CINEMATIC') {
              setCurrentScreen('MAIN_MENU');
            }
          }}
        />
      )}

      {/* 3. Capa Cinemática de Escape y Despegue de la Nave al Abordar el Transbordador */}
      {gameStatus === 'cinematic_escaping' && (
        <EscapeCinematicScreen onFinished={handleEscapeCinematicFinished} />
      )}
    </div>
  );
}
