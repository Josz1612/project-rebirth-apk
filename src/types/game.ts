export type RoomType =
  | 'control_center'
  | 'cafeteria'
  | 'navigation'
  | 'engines'
  | 'medbay'
  | 'lifesupport'
  | 'storage'
  | 'shields'
  | 'communications'
  | 'armory'
  | 'hydroponics'
  | 'escape_pod'
  | 'corridor';

export interface Room {
  id: string;
  name: string;
  shortName: string;
  type: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
  floorColor: string;
  borderColor: string;
  accentColor: string;
  description: string;
  isSafeRoom?: boolean;
}

export type PropVisualType =
  | 'table'
  | 'chair'
  | 'console'
  | 'screen'
  | 'reactor'
  | 'crate'
  | 'pipe'
  | 'vent'
  | 'door'
  | 'light'
  | 'radar'
  | 'tool'
  | 'bed'
  | 'pod_console'
  | 'o2_tank'
  | 'hazard_panel'
  | 'hydro_plant'
  | 'pressure_plate'
  | 'server_rack'
  | 'holo_globe'
  | 'subspace_dish'
  | 'weapon_locker'
  | 'ration_synth'
  | 'wires_panel'
  | 'shelf'
  | 'plant_pot'
  | 'hydro_bed'
  | 'med_bed_scan'
  | 'barrel'
  | 'food_cart'
  | 'antenna'
  | 'endeavour_shuttle'
  | 'log_terminal';

export interface GameProp {
  id: string;
  name: string;
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  emoji: string;
  color: string;
  type: PropVisualType;
  isObstacle: boolean;
  isHidingSpot: boolean;
  hidingType?: 'vent' | 'table' | 'crate' | 'locker';
  description?: string;
  pulse?: boolean;
  interactiveTaskId?: string;
}

export interface AnomalyPoint {
  id: string;
  missionId: string;
  x: number;
  y: number;
  collected: boolean;
  radius: number;
}

export type MissionMechanic =
  | 'anomalies'
  | 'precision'
  | 'memory_sequence'
  | 'decontamination'
  | 'data_download'
  | 'wire_connect'
  | 'swipe_clean'
  | 'safe_drag'
  | 'multi_touch_pressure'
  | 'dial_rotation'
  | 'spam_tap'
  | 'virus_purge'
  | 'dodge_nanobots';

export interface Mission {
  id: string;
  title: string;
  description: string;
  mechanicDesc: string;
  mechanicType: MissionMechanic;
  roomId: string;
  roomName: string;
  icon: string;
  completed: boolean;
  progress: number; // 0 to 100
  targetPropId: string;
  color: string;
  // Specific data for each of the 5 mechanics
  anomalies?: AnomalyPoint[];
  collectedAnomalies?: number;
  targetAnomalies?: number; // 5
  memorySequence?: number[]; // [0, 2, 1] for 3 buttons
  currentMemoryStep?: number;
  currentHoldSeconds?: number;
  targetHoldSeconds?: number; // 3.0 seconds
  currentDeconSeconds?: number;
  targetDeconSeconds?: number; // 4.0 seconds
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  facing: 'up' | 'down' | 'left' | 'right';
  isHidden: boolean;
  hidingSpotId: string | null;
  suitColor: string;
  stamina: number;
  maxStamina: number;
  isSprinting: boolean;
  isInteracting: boolean;
  walkFrame: number;
  flashlightOn: boolean;
  aimAngle: number;
  // Mechanical counters
  taskHoldSeconds: Record<string, number>;
  taskDeconSeconds: Record<string, number>;
}

export type AlienState = 'patrol' | 'suspicious' | 'chase' | 'search';

export interface Waypoint {
  x: number;
  y: number;
  room: string;
  waitTime: number;
}

export interface AlienEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  patrolIndex: number;
  patrolRoute: Waypoint[];
  state: AlienState;
  suspicion: number; // 0 to 100
  lookAngle: number;
  fovAngle: number; // in radians
  fovDistance: number;
  hearingRadiusWalk: number;
  hearingRadiusSprint: number;
  searchTimer: number;
  alertText: string;
  color: string;
  roamTimer?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type?: 'spark' | 'smoke' | 'plasma' | 'star' | 'steam' | 'leaf' | 'holo' | 'decon_steam';
}

export interface MinigameState {
  type: 'precision' | 'memory_sequence' | 'wire_connect';
  missionId: string;
  missionTitle: string;
  // Precision minigame fields
  cursorPos: number; // 0 to 100
  cursorDir: number; // 1 or -1
  speed: number;
  targetZoneStart: number; // e.g. 40
  targetZoneEnd: number; // e.g. 60
  // Memory sequence fields
  sequence: number[]; // e.g. [1, 0, 2]
  playerInput: number[];
  phase: 'display' | 'input' | 'success' | 'fail';
  flashButtonIndex: number | null;
}
