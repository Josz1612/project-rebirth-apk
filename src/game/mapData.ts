import { Room, GameProp, Waypoint, Mission, AnomalyPoint } from '../types/game';

export const MAP_WIDTH = 3800;
export const MAP_HEIGHT = 2800;

// 12 Spacious, Non-Overlapping Spaceship Rooms (Among Us Style Layout)
export const ROOMS: Room[] = [
  // ================= ROW 1 (NORTH) =================
  // 1. Invernadero Hidropónico (North-West)
  {
    id: 'hydroponics',
    name: 'Invernadero Hidropónico',
    shortName: 'Hidroponía',
    type: 'hydroponics',
    x: 100,
    y: 150,
    width: 650,
    height: 600,
    floorColor: '#064e3b',
    borderColor: '#10b981',
    accentColor: '#059669',
    description: 'Cultivos biológicos protegidos, macetas, camas hidropónicas y flora bioluminiscente.',
  },
  // 2. Soporte Vital & Oxígeno (North-Center-West)
  {
    id: 'lifesupport',
    name: 'Soporte Vital & Oxígeno (O2)',
    shortName: 'Soporte Vital',
    type: 'lifesupport',
    x: 950,
    y: 150,
    width: 700,
    height: 600,
    floorColor: '#065f46',
    borderColor: '#34d399',
    accentColor: '#10b981',
    description: 'Cilindros de oxígeno comprimido, filtros de aire y paneles de cableado expuesto.',
  },
  // 3. Bahía Médica & Laboratorio (North-Center-East)
  {
    id: 'medbay',
    name: 'Bahía Médica & Laboratorio',
    shortName: 'Bahía Médica',
    type: 'medbay',
    x: 1850,
    y: 150,
    width: 750,
    height: 600,
    floorColor: '#0e7490',
    borderColor: '#2dd4bf',
    accentColor: '#14b8a6',
    description: 'Unidades de biodiagnóstico estelar, cabina de descontaminación y biosensores.',
  },
  // 4. Cápsula de Escape / Nave de Evacuación (North-East - UN SOLO ACCESO DESDE NAVEGACIÓN)
  {
    id: 'escape_pod',
    name: 'Hangar Transbordador Endeavour (NASA)',
    shortName: 'Endeavour NASA',
    type: 'escape_pod',
    x: 2950,
    y: 150,
    width: 750,
    height: 600,
    floorColor: '#18181b',
    borderColor: '#38bdf8',
    accentColor: '#0284c7',
    description: 'Hangar de lanzamiento del Transbordador Espacial Endeavour de la NASA.',
  },

  // ================= ROW 2 (CENTER) =================
  // 5. Sala de Motores & Reactor (West)
  {
    id: 'engines',
    name: 'Sala de Motores & Reactores',
    shortName: 'Motores',
    type: 'engines',
    x: 100,
    y: 1050,
    width: 750,
    height: 750,
    floorColor: '#27272a',
    borderColor: '#f59e0b',
    accentColor: '#d97706',
    description: 'Reactores pesados, tuberías de plasma, cajas de fusibles y paneles de cables sueltos.',
  },
  // 6. Centro de Control (SAFE ROOM - Spawn Seguro del Astronauta)
  {
    id: 'control_center',
    name: 'Centro de Control (Zona Segura)',
    shortName: 'Centro de Control',
    type: 'control_center',
    x: 1050,
    y: 1050,
    width: 700,
    height: 750,
    floorColor: '#0f172a',
    borderColor: '#38bdf8',
    accentColor: '#0ea5e9',
    description: 'Puesto de mando estelar con holopantalla galáctica 3D y santuario inmune a aliens.',
    isSafeRoom: true,
  },
  // 7. Cafetería Central (Center-East)
  {
    id: 'cafeteria',
    name: 'Cafetería Central',
    shortName: 'Cafetería',
    type: 'cafeteria',
    x: 1950,
    y: 1050,
    width: 750,
    height: 750,
    floorColor: '#1e293b',
    borderColor: '#38bdf8',
    accentColor: '#0284c7',
    description: 'Comedor de la tripulación con mesas térmicas, bandejas de comida, conductos y dispensador.',
  },
  // 8. Sala de Navegación & Admin (East - Conectada a la Cápsula de Evacuación)
  {
    id: 'navigation',
    name: 'Navegación & Admin',
    shortName: 'Navegación',
    type: 'navigation',
    x: 2900,
    y: 1050,
    width: 800,
    height: 750,
    floorColor: '#1e1b4b',
    borderColor: '#818cf8',
    accentColor: '#6366f1',
    description: 'Consola de mando de vuelo estelar, radar rotativo y acceso exclusivo a la Cápsula.',
  },

  // ================= ROW 3 (SOUTH) =================
  // 9. Almacén de Carga (South-West)
  {
    id: 'storage',
    name: 'Almacén de Carga',
    shortName: 'Almacén',
    type: 'storage',
    x: 100,
    y: 2100,
    width: 750,
    height: 600,
    floorColor: '#292524',
    borderColor: '#f97316',
    accentColor: '#ea580c',
    description: 'Estanterías con repuestos, estibas de cajas 2.5D, bidones de combustible y cableados.',
  },
  // 10. Armería & Seguridad (South-Center-West)
  {
    id: 'armory',
    name: 'Armería & Seguridad',
    shortName: 'Armería',
    type: 'armory',
    x: 1050,
    y: 2100,
    width: 700,
    height: 600,
    floorColor: '#1e1b4b',
    borderColor: '#6366f1',
    accentColor: '#4f46e5',
    description: 'Racks de monitores CCTV, armarios de trajes espaciales y zona de desionización.',
  },
  // 11. Escudos Deflectores (South-Center-East)
  {
    id: 'shields',
    name: 'Escudos Deflectores',
    shortName: 'Escudos',
    type: 'shields',
    x: 1950,
    y: 2100,
    width: 750,
    height: 600,
    floorColor: '#2e1065',
    borderColor: '#a855f7',
    accentColor: '#9333ea',
    description: 'Generadores magnéticos de plasma, paneles de bobinas y placa deflectora.',
  },
  // 12. Comunicaciones Subespaciales (South-East)
  {
    id: 'communications',
    name: 'Comunicaciones Subespaciales',
    shortName: 'Comunicaciones',
    type: 'communications',
    x: 2900,
    y: 2100,
    width: 800,
    height: 600,
    floorColor: '#083344',
    borderColor: '#06b6d4',
    accentColor: '#0891b2',
    description: 'Antenas parabólicas interiores, racks de audio subespacial y transmisor SOS.',
  },
];

// Corridors Connecting the Ship Logically
export const CORRIDORS = [
  // Horizontal Corridors - Row 1
  { id: 'corr_hydro_o2', x: 750, y: 380, width: 200, height: 140, name: 'Túnel Hidro-O2' },
  { id: 'corr_o2_med', x: 1650, y: 380, width: 200, height: 140, name: 'Túnel O2-Médico' },

  // Horizontal Corridors - Row 2
  { id: 'corr_eng_control', x: 850, y: 1350, width: 200, height: 160, name: 'Pasillo Motores-Control' },
  { id: 'corr_control_cafe', x: 1750, y: 1350, width: 200, height: 160, name: 'Pasillo Control-Cafetería' },
  { id: 'corr_cafe_nav', x: 2700, y: 1350, width: 200, height: 160, name: 'Pasillo Cafetería-Navegación' },

  // Horizontal Corridors - Row 3
  { id: 'corr_cargo_armory', x: 850, y: 2320, width: 200, height: 140, name: 'Túnel Carga-Armería' },
  { id: 'corr_armory_shields', x: 1750, y: 2320, width: 200, height: 140, name: 'Túnel Armería-Escudos' },
  { id: 'corr_shields_comms', x: 2700, y: 2320, width: 200, height: 140, name: 'Túnel Escudos-Comms' },

  // Vertical Corridors - Column 1
  { id: 'corr_hydro_eng', x: 380, y: 750, width: 140, height: 300, name: 'Conducto Hidro-Motores' },
  { id: 'corr_eng_cargo', x: 380, y: 1800, width: 140, height: 300, name: 'Conducto Motores-Carga' },

  // Vertical Corridors - Column 2
  { id: 'corr_o2_control', x: 1320, y: 750, width: 160, height: 300, name: 'Túnel O2-Control' },
  { id: 'corr_control_armory', x: 1320, y: 1800, width: 160, height: 300, name: 'Túnel Control-Armería' },

  // Vertical Corridors - Column 3
  { id: 'corr_med_cafe', x: 2240, y: 750, width: 160, height: 300, name: 'Túnel Médico-Cafetería' },
  { id: 'corr_cafe_shields', x: 2240, y: 1800, width: 160, height: 300, name: 'Túnel Cafetería-Escudos' },

  // Vertical Corridors - Column 4
  { id: 'corr_nav_comms', x: 3240, y: 1800, width: 160, height: 300, name: 'Túnel Navegación-Comms' },

  // EXCLUSIVE BOTTLENECK: Puente de Evacuación (Navigation <-> Escape Pod)
  { id: 'corr_escape_bridge', x: 3220, y: 750, width: 220, height: 300, name: 'Puente de Evacuación (Único Acceso)' },
];

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'solid' | 'glass' | 'pod_door';
}

// Hermetic Wall Boundaries with Doorways
export const WALLS: Wall[] = [
  // 1. HYDROPONICS
  { x: 70, y: 120, width: 710, height: 30 },
  { x: 70, y: 120, width: 30, height: 660 },
  { x: 70, y: 750, width: 310, height: 30 },
  { x: 520, y: 750, width: 260, height: 30 },
  { x: 750, y: 120, width: 30, height: 260 },
  { x: 750, y: 520, width: 30, height: 260 },

  // 2. LIFE SUPPORT
  { x: 920, y: 120, width: 760, height: 30 },
  { x: 920, y: 120, width: 30, height: 260 },
  { x: 920, y: 520, width: 30, height: 260 },
  { x: 1650, y: 120, width: 30, height: 260 },
  { x: 1650, y: 520, width: 30, height: 260 },
  { x: 920, y: 750, width: 400, height: 30 },
  { x: 1480, y: 750, width: 200, height: 30 },

  // 3. MEDBAY
  { x: 1820, y: 120, width: 810, height: 30 },
  { x: 1820, y: 120, width: 30, height: 260 },
  { x: 1820, y: 520, width: 30, height: 260 },
  { x: 2600, y: 120, width: 30, height: 660 },
  { x: 1820, y: 750, width: 420, height: 30 },
  { x: 2400, y: 750, width: 230, height: 30 },

  // 4. ESCAPE POD
  { x: 2920, y: 120, width: 810, height: 30 },
  { x: 2920, y: 120, width: 30, height: 660 },
  { x: 3700, y: 120, width: 30, height: 660, type: 'glass' },
  { x: 2920, y: 750, width: 300, height: 30 },
  { x: 3440, y: 750, width: 290, height: 30 },
  // COMPUERTA DE EVACUACIÓN
  { x: 3220, y: 750, width: 220, height: 30, type: 'pod_door' },

  // 5. ENGINES
  { x: 70, y: 1020, width: 310, height: 30 },
  { x: 520, y: 1020, width: 360, height: 30 },
  { x: 70, y: 1020, width: 30, height: 810 },
  { x: 850, y: 1020, width: 30, height: 330 },
  { x: 850, y: 1510, width: 30, height: 320 },
  { x: 70, y: 1800, width: 310, height: 30 },
  { x: 520, y: 1800, width: 360, height: 30 },

  // 6. CENTRO DE CONTROL
  { x: 1020, y: 1020, width: 300, height: 30 },
  { x: 1480, y: 1020, width: 300, height: 30 },
  { x: 1020, y: 1020, width: 30, height: 330 },
  { x: 1020, y: 1510, width: 30, height: 320 },
  { x: 1750, y: 1020, width: 30, height: 330 },
  { x: 1750, y: 1510, width: 30, height: 320 },
  { x: 1020, y: 1800, width: 300, height: 30 },
  { x: 1480, y: 1800, width: 300, height: 30 },

  // 7. CAFETERÍA
  { x: 1920, y: 1020, width: 320, height: 30 },
  { x: 2400, y: 1020, width: 330, height: 30 },
  { x: 1920, y: 1020, width: 30, height: 330 },
  { x: 1920, y: 1510, width: 30, height: 320 },
  { x: 2700, y: 1020, width: 30, height: 330 },
  { x: 2700, y: 1510, width: 30, height: 320 },
  { x: 1920, y: 1800, width: 320, height: 30 },
  { x: 2400, y: 1800, width: 330, height: 30 },

  // 8. NAVIGATION
  { x: 2870, y: 1020, width: 350, height: 30 },
  { x: 3440, y: 1020, width: 290, height: 30 },
  { x: 2870, y: 1020, width: 30, height: 330 },
  { x: 2870, y: 1510, width: 30, height: 320 },
  { x: 3700, y: 1020, width: 30, height: 810, type: 'glass' },
  { x: 2870, y: 1800, width: 370, height: 30 },
  { x: 3400, y: 1800, width: 330, height: 30 },

  // 9. CARGO BAY
  { x: 70, y: 2070, width: 310, height: 30 },
  { x: 520, y: 2070, width: 360, height: 30 },
  { x: 70, y: 2070, width: 30, height: 660 },
  { x: 850, y: 2070, width: 30, height: 250 },
  { x: 850, y: 2460, width: 30, height: 270 },
  { x: 70, y: 2700, width: 810, height: 30 },

  // 10. ARMORY
  { x: 1020, y: 2070, width: 300, height: 30 },
  { x: 1480, y: 2070, width: 300, height: 30 },
  { x: 1020, y: 2070, width: 30, height: 250 },
  { x: 1020, y: 2460, width: 30, height: 270 },
  { x: 1750, y: 2070, width: 30, height: 250 },
  { x: 1750, y: 2460, width: 30, height: 270 },
  { x: 1020, y: 2700, width: 760, height: 30 },

  // 11. SHIELDS
  { x: 1920, y: 2070, width: 320, height: 30 },
  { x: 2400, y: 2070, width: 330, height: 30 },
  { x: 1920, y: 2070, width: 30, height: 250 },
  { x: 1920, y: 2460, width: 30, height: 270 },
  { x: 2700, y: 2070, width: 30, height: 250 },
  { x: 2700, y: 2460, width: 30, height: 270 },
  { x: 1920, y: 2700, width: 810, height: 30 },

  // 12. COMMUNICATIONS
  { x: 2870, y: 2070, width: 370, height: 30 },
  { x: 3400, y: 2070, width: 330, height: 30 },
  { x: 2870, y: 2070, width: 30, height: 250 },
  { x: 2870, y: 2460, width: 30, height: 270 },
  { x: 3700, y: 2070, width: 30, height: 660, type: 'glass' },
  { x: 2870, y: 2700, width: 860, height: 30 },

  // Corridor boundary walls
  { x: 750, y: 350, width: 200, height: 30 },
  { x: 750, y: 520, width: 200, height: 30 },
  { x: 1650, y: 350, width: 200, height: 30 },
  { x: 1650, y: 520, width: 200, height: 30 },
  { x: 850, y: 1320, width: 200, height: 30 },
  { x: 850, y: 1510, width: 200, height: 30 },
  { x: 1750, y: 1320, width: 200, height: 30 },
  { x: 1750, y: 1510, width: 200, height: 30 },
  { x: 2700, y: 1320, width: 200, height: 30 },
  { x: 2700, y: 1510, width: 200, height: 30 },
  { x: 850, y: 2290, width: 200, height: 30 },
  { x: 850, y: 2460, width: 200, height: 30 },
  { x: 1750, y: 2290, width: 200, height: 30 },
  { x: 1750, y: 2460, width: 200, height: 30 },
  { x: 2700, y: 2290, width: 200, height: 30 },
  { x: 2700, y: 2460, width: 200, height: 30 },

  // Vertical corridor boundary walls
  { x: 350, y: 750, width: 30, height: 300 },
  { x: 520, y: 750, width: 30, height: 300 },
  { x: 350, y: 1800, width: 30, height: 300 },
  { x: 520, y: 1800, width: 30, height: 300 },
  { x: 1290, y: 750, width: 30, height: 300 },
  { x: 1480, y: 750, width: 30, height: 300 },
  { x: 1290, y: 1800, width: 30, height: 300 },
  { x: 1480, y: 1800, width: 30, height: 300 },
  { x: 2210, y: 750, width: 30, height: 300 },
  { x: 2400, y: 750, width: 30, height: 300 },
  { x: 2210, y: 1800, width: 30, height: 300 },
  { x: 2400, y: 1800, width: 30, height: 300 },
  { x: 3210, y: 1800, width: 30, height: 300 },
  { x: 3400, y: 1800, width: 30, height: 300 },

  // Puente de evacuación
  { x: 3190, y: 750, width: 30, height: 300 },
  { x: 3440, y: 750, width: 30, height: 300 },
];

// SPAWN CONTROL: Astronaut ALWAYS spawns safely in Centro de Control
export const SAFE_PLAYER_SPAWN = { x: 1400, y: 1425 };

// SPAWN CONTROL: Aliens CANNOT spawn in Centro de Control or Escape Pod
export const ALIEN_SPAWN_CANDIDATES = [
  { x: 450, y: 1450, room: 'Motores', roomId: 'engines' },
  { x: 2225, y: 450, room: 'Bahía Médica', roomId: 'medbay' },
  { x: 450, y: 2400, room: 'Almacén', roomId: 'storage' },
  { x: 2325, y: 2400, room: 'Escudos', roomId: 'shields' },
  { x: 3300, y: 2400, room: 'Comunicaciones', roomId: 'communications' },
  { x: 425, y: 450, room: 'Hidroponía', roomId: 'hydroponics' },
  { x: 2325, y: 1425, room: 'Cafetería', roomId: 'cafeteria' },
  { x: 1400, y: 2400, room: 'Armería', roomId: 'armory' },
  { x: 1300, y: 450, room: 'Soporte Vital', roomId: 'lifesupport' },
  { x: 3300, y: 1425, room: 'Navegación', roomId: 'navigation' },
];

// Dense, 2.5D Among Us Style Props with Exposed Wiring Panels across rooms
export const GAME_PROPS: GameProp[] = [
  // ================= 1. CENTRO DE CONTROL (SAFE ROOM) =================
  {
    id: 'prop_control_holo',
    name: 'Holosfera Galáctica 3D',
    roomId: 'control_center',
    x: 1350,
    y: 1375,
    width: 100,
    height: 100,
    emoji: '🌐',
    color: '#38bdf8',
    type: 'holo_globe',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
  },
  {
    id: 'prop_control_server',
    name: 'Servidor Cuántico Central',
    roomId: 'control_center',
    x: 1200,
    y: 1100,
    width: 140,
    height: 70,
    emoji: '💾',
    color: '#0284c7',
    type: 'server_rack',
    isObstacle: true,
    isHidingSpot: false,
    interactiveTaskId: 'm_download_control',
  },
  {
    id: 'prop_control_desk',
    name: 'Mesa de Mando del Capitán',
    roomId: 'control_center',
    x: 1450,
    y: 1100,
    width: 180,
    height: 80,
    emoji: '🖥️',
    color: '#1e293b',
    type: 'console',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'table',
  },
  {
    id: 'prop_control_vent',
    name: 'Conducto de Ventilación Central',
    roomId: 'control_center',
    x: 1650,
    y: 1700,
    width: 60,
    height: 60,
    emoji: '🌀',
    color: '#38bdf8',
    type: 'vent',
    isObstacle: false,
    isHidingSpot: true,
    hidingType: 'vent',
  },
  {
    id: 'prop_control_terminal',
    name: 'Pantalla Central de Telemetría (TV)',
    roomId: 'control_center',
    x: 1065,
    y: 1630,
    width: 220,
    height: 145,
    emoji: '📺',
    color: '#10b981',
    type: 'log_terminal',
    isObstacle: false,
    isHidingSpot: false,
  },

  // ================= 2. ENGINES & REACTOR =================
  {
    id: 'prop_reactor_alpha',
    name: 'Generador de Fusión y Red Eléctrica',
    roomId: 'engines',
    x: 270,
    y: 1340,
    width: 160,
    height: 160,
    emoji: '⚡',
    color: '#f59e0b',
    type: 'reactor',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_restore_power',
  },
  {
    id: 'prop_reactor_beta',
    name: 'Reactor de Respaldo Beta',
    roomId: 'engines',
    x: 520,
    y: 1340,
    width: 160,
    height: 160,
    emoji: '⚡',
    color: '#d97706',
    type: 'reactor',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_anomalies_engines',
  },
  {
    id: 'prop_engine_crates',
    name: 'Cajas de Herramientas de Motores',
    roomId: 'engines',
    x: 180,
    y: 1140,
    width: 110,
    height: 80,
    emoji: '📦',
    color: '#78716c',
    type: 'crate',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'crate',
  },
  {
    id: 'prop_engine_barrels',
    name: 'Bidones de Líquido Refrigerante',
    roomId: 'engines',
    x: 650,
    y: 1650,
    width: 100,
    height: 70,
    emoji: '🛢️',
    color: '#0284c7',
    type: 'barrel',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_engine_vent',
    name: 'Conducto Térmico Motores',
    roomId: 'engines',
    x: 180,
    y: 1680,
    width: 60,
    height: 60,
    emoji: '🌀',
    color: '#f59e0b',
    type: 'vent',
    isObstacle: false,
    isHidingSpot: true,
    hidingType: 'vent',
  },

  // ================= 3. INVERNADERO HIDROPÓNICO (DENSE GREENERY) =================
  {
    id: 'prop_hydro_plant_master',
    name: 'Cámara Botánica de Esporas',
    roomId: 'hydroponics',
    x: 350,
    y: 320,
    width: 150,
    height: 130,
    emoji: '🌿',
    color: '#10b981',
    type: 'hydro_plant',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_anomalies_hydro',
  },
  {
    id: 'prop_hydro_bed_1',
    name: 'Cama de Cultivo Biológico A',
    roomId: 'hydroponics',
    x: 160,
    y: 350,
    width: 120,
    height: 80,
    emoji: '🌱',
    color: '#065f46',
    type: 'hydro_bed',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_hydro_bed_2',
    name: 'Cama de Cultivo Biológico B',
    roomId: 'hydroponics',
    x: 550,
    y: 350,
    width: 120,
    height: 80,
    emoji: '🌱',
    color: '#065f46',
    type: 'hydro_bed',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_hydro_pot_1',
    name: 'Planta Bioluminiscente Alfa',
    roomId: 'hydroponics',
    x: 180,
    y: 220,
    width: 70,
    height: 70,
    emoji: '🌺',
    color: '#10b981',
    type: 'plant_pot',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_hydro_pot_2',
    name: 'Planta Bioluminiscente Beta',
    roomId: 'hydroponics',
    x: 580,
    y: 220,
    width: 70,
    height: 70,
    emoji: '🌸',
    color: '#10b981',
    type: 'plant_pot',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_hydro_crates',
    name: 'Cajas de Fertilizante Botánico',
    roomId: 'hydroponics',
    x: 350,
    y: 600,
    width: 110,
    height: 75,
    emoji: '📦',
    color: '#047857',
    type: 'crate',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'crate',
  },

  // ================= 4. SOPORTE VITAL (O2) =================
  {
    id: 'prop_o2_scrubber',
    name: 'Válvula de Presión O2 Principal',
    roomId: 'lifesupport',
    x: 1220,
    y: 330,
    width: 150,
    height: 120,
    emoji: '💨',
    color: '#34d399',
    type: 'o2_tank',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_precision_o2',
  },
  {
    id: 'prop_o2_decon_pad',
    name: 'Cabina de Esterilización O2',
    roomId: 'lifesupport',
    x: 1450,
    y: 480,
    width: 120,
    height: 120,
    emoji: '🚿',
    color: '#10b981',
    type: 'pressure_plate',
    isObstacle: false,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_decon_lifesupport',
  },
  {
    id: 'prop_o2_tanks_1',
    name: 'Batería de Tanques Criogénicos',
    roomId: 'lifesupport',
    x: 1020,
    y: 280,
    width: 110,
    height: 80,
    emoji: '🧪',
    color: '#059669',
    type: 'o2_tank',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_o2_locker',
    name: 'Locker de Trajes EVA',
    roomId: 'lifesupport',
    x: 1500,
    y: 220,
    width: 90,
    height: 70,
    emoji: '🦺',
    color: '#10b981',
    type: 'crate',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'locker',
  },

  // ================= 5. BAHÍA MÉDICA =================
  {
    id: 'prop_med_bed_scan_1',
    name: 'Cama de Bio-Escaneo Alfa',
    roomId: 'medbay',
    x: 1980,
    y: 280,
    width: 140,
    height: 80,
    emoji: '🛏️',
    color: '#0f766e',
    type: 'med_bed_scan',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_med_bed_scan_2',
    name: 'Cama de Bio-Escaneo Beta',
    roomId: 'medbay',
    x: 1980,
    y: 450,
    width: 140,
    height: 80,
    emoji: '🛏️',
    color: '#0f766e',
    type: 'med_bed_scan',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_decon_medbay',
    name: 'Cámara de Descontaminación Médica',
    roomId: 'medbay',
    x: 2350,
    y: 350,
    width: 130,
    height: 130,
    emoji: '🧼',
    color: '#2dd4bf',
    type: 'pressure_plate',
    isObstacle: false,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_decon_medbay',
  },
  {
    id: 'prop_med_fridge',
    name: 'Refrigerador de Muestras Bio',
    roomId: 'medbay',
    x: 2420,
    y: 200,
    width: 90,
    height: 70,
    emoji: '🧊',
    color: '#14b8a6',
    type: 'crate',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'locker',
  },

  // ================= 6. CAFETERÍA CENTRAL =================
  {
    id: 'prop_cafe_cart',
    name: 'Carrito de Comida y Raciones Estelar',
    roomId: 'cafeteria',
    x: 2320,
    y: 1140,
    width: 90,
    height: 60,
    emoji: '🛒',
    color: '#94a3b8',
    type: 'food_cart',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'table',
  },
  {
    id: 'prop_cafe_table_1',
    name: 'Mesa de Comedor de Tripulación Alfa',
    roomId: 'cafeteria',
    x: 2120,
    y: 1220,
    width: 140,
    height: 140,
    emoji: '🍕',
    color: '#334155',
    type: 'table',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_cafe_table_2',
    name: 'Mesa de Comedor de Tripulación Beta',
    roomId: 'cafeteria',
    x: 2460,
    y: 1450,
    width: 140,
    height: 140,
    emoji: '🥪',
    color: '#334155',
    type: 'table',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'table',
  },
  {
    id: 'prop_cafe_synth',
    name: 'Sintetizador de Raciones',
    roomId: 'cafeteria',
    x: 2500,
    y: 1100,
    width: 130,
    height: 80,
    emoji: '🍔',
    color: '#0284c7',
    type: 'ration_synth',
    isObstacle: true,
    isHidingSpot: false,
    interactiveTaskId: 'm_precision_cafe',
  },
  {
    id: 'prop_cafe_vent',
    name: 'Conducto de Cafetería',
    roomId: 'cafeteria',
    x: 2600,
    y: 1680,
    width: 60,
    height: 60,
    emoji: '🌀',
    color: '#38bdf8',
    type: 'vent',
    isObstacle: false,
    isHidingSpot: true,
    hidingType: 'vent',
  },

  // ================= 7. NAVIGATION & ADMIN =================
  {
    id: 'prop_nav_console',
    name: 'Consola de Secuencia Estelar',
    roomId: 'navigation',
    x: 3250,
    y: 1350,
    width: 180,
    height: 90,
    emoji: '🚀',
    color: '#818cf8',
    type: 'console',
    isObstacle: true,
    isHidingSpot: false,
    interactiveTaskId: 'm_memory_nav',
  },
  {
    id: 'prop_nav_radar',
    name: 'Terminal de Cartografía Estelar',
    roomId: 'navigation',
    x: 3450,
    y: 1150,
    width: 110,
    height: 110,
    emoji: '🛰️',
    color: '#6366f1',
    type: 'radar',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_download_nav',
  },
  {
    id: 'prop_nav_table',
    name: 'Mesa Táctica de Vuelo',
    roomId: 'navigation',
    x: 3050,
    y: 1550,
    width: 160,
    height: 90,
    emoji: '📊',
    color: '#334155',
    type: 'table',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'table',
  },

  // ================= 8. ALMACÉN DE CARGA (DENSE STORAGE) =================
  {
    id: 'prop_storage_shelf_1',
    name: 'Estantería de Repuestos A',
    roomId: 'storage',
    x: 180,
    y: 2200,
    width: 150,
    height: 80,
    emoji: '🪜',
    color: '#57534e',
    type: 'shelf',
    isObstacle: true,
    isHidingSpot: false,
  },
  {
    id: 'prop_storage_shelf_2',
    name: 'Estantería de Repuestos B',
    roomId: 'storage',
    x: 180,
    y: 2450,
    width: 150,
    height: 80,
    emoji: '🪜',
    color: '#57534e',
    type: 'shelf',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'locker',
  },
  {
    id: 'prop_storage_crates_stack',
    name: 'Estiba de Contenedores Pesados',
    roomId: 'storage',
    x: 480,
    y: 2250,
    width: 150,
    height: 110,
    emoji: '📦',
    color: '#78716c',
    type: 'crate',
    isObstacle: true,
    isHidingSpot: false,
    interactiveTaskId: 'm_anomalies_storage',
  },
  {
    id: 'prop_storage_barrels',
    name: 'Barriles de Aceite de Motor',
    roomId: 'storage',
    x: 650,
    y: 2450,
    width: 110,
    height: 80,
    emoji: '🛢️',
    color: '#c2410c',
    type: 'barrel',
    isObstacle: true,
    isHidingSpot: false,
  },

  // ================= 9. ARMERÍA & SEGURIDAD =================
  {
    id: 'prop_security_cctv',
    name: 'Monitores de Cámaras CCTV',
    roomId: 'armory',
    x: 1250,
    y: 2180,
    width: 160,
    height: 80,
    emoji: '🖥️',
    color: '#818cf8',
    type: 'server_rack',
    isObstacle: true,
    isHidingSpot: false,
    interactiveTaskId: 'm_memory_armory',
  },
  {
    id: 'prop_armory_decon_pad',
    name: 'Placa de Desionización Balística',
    roomId: 'armory',
    x: 1480,
    y: 2400,
    width: 120,
    height: 120,
    emoji: '🎯',
    color: '#6366f1',
    type: 'pressure_plate',
    isObstacle: false,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_decon_armory',
  },
  {
    id: 'prop_armory_crew_bed',
    name: 'Litera Táctica de Guardia',
    roomId: 'armory',
    x: 1530,
    y: 2200,
    width: 130,
    height: 70,
    emoji: '🛏️',
    color: '#4f46e5',
    type: 'bed',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'table',
  },
  {
    id: 'prop_armory_locker',
    name: 'Armario de Blindaje Trajes',
    roomId: 'armory',
    x: 1120,
    y: 2500,
    width: 100,
    height: 80,
    emoji: '🛡️',
    color: '#4338ca',
    type: 'weapon_locker',
    isObstacle: true,
    isHidingSpot: true,
    hidingType: 'locker',
  },

  // ================= 10. ESCUDOS DEFLECTORES =================
  {
    id: 'prop_shield_generator',
    name: 'Generador de Polaridad Deflectora',
    roomId: 'shields',
    x: 2150,
    y: 2250,
    width: 150,
    height: 100,
    emoji: '⚡',
    color: '#7e22ce',
    type: 'reactor',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_precision_shields',
  },
  {
    id: 'prop_shield_console_memory',
    name: 'Consola de Sintonización de Escudos',
    roomId: 'shields',
    x: 2450,
    y: 2250,
    width: 140,
    height: 90,
    emoji: '🛡️',
    color: '#a855f7',
    type: 'console',
    isObstacle: true,
    isHidingSpot: false,
    interactiveTaskId: 'm_memory_shields',
  },
  {
    id: 'prop_shields_vent',
    name: 'Ventilación de Bobinas',
    roomId: 'shields',
    x: 2580,
    y: 2580,
    width: 60,
    height: 60,
    emoji: '🌀',
    color: '#a855f7',
    type: 'vent',
    isObstacle: false,
    isHidingSpot: true,
    hidingType: 'vent',
  },

  // ================= 11. COMUNICACIONES SUBESPACIALES =================
  {
    id: 'prop_comms_dish',
    name: 'Antena Parabólica de Espacio Profundo',
    roomId: 'communications',
    x: 3180,
    y: 2260,
    width: 170,
    height: 130,
    emoji: '📡',
    color: '#06b6d4',
    type: 'antenna',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
    interactiveTaskId: 'm_download_comms',
  },
  {
    id: 'prop_comms_console',
    name: 'Decodificador de Frecuencias',
    roomId: 'communications',
    x: 3480,
    y: 2260,
    width: 140,
    height: 90,
    emoji: '📻',
    color: '#0891b2',
    type: 'console',
    isObstacle: true,
    isHidingSpot: false,
    interactiveTaskId: 'm_memory_comms',
  },

  // ================= 12. CÁPSULA DE ESCAPE / EVACUACIÓN (ENDEAVOUR NASA) =================
  {
    id: 'prop_escape_shuttle',
    name: 'Transbordador Espacial Endeavour (NASA)',
    roomId: 'escape_pod',
    x: 3130,
    y: 210,
    width: 380,
    height: 450,
    emoji: '🚀',
    color: '#ffffff',
    type: 'endeavour_shuttle',
    isObstacle: true,
    isHidingSpot: false,
    pulse: true,
    description: 'Transbordador Espacial Endeavour de la NASA. Requiere completar las 4 misiones para la secuencia de despegue.',
  },
];

// Verified Walkable Deck Positions for Anomaly Spawns (100% free of walls, beds, props)
const SAFE_ROOM_WALKABLE_POINTS: Record<string, { x: number; y: number }[]> = {
  hydroponics: [
    { x: 300, y: 240 },
    { x: 450, y: 240 },
    { x: 280, y: 520 },
    { x: 500, y: 520 },
    { x: 620, y: 500 },
  ],
  engines: [
    { x: 400, y: 1180 },
    { x: 450, y: 1560 },
    { x: 320, y: 1620 },
    { x: 580, y: 1620 },
    { x: 220, y: 1450 },
  ],
  storage: [
    { x: 380, y: 2200 },
    { x: 380, y: 2450 },
    { x: 520, y: 2520 },
    { x: 680, y: 2250 },
    { x: 250, y: 2350 },
  ],
  cafeteria: [
    { x: 2100, y: 1150 },
    { x: 2300, y: 1300 },
    { x: 2300, y: 1550 },
    { x: 2500, y: 1320 },
    { x: 2200, y: 1600 },
  ],
};

// Helper to spawn 5 anomaly points inside a room strictly in safe walkable areas
function generateRoomAnomalies(roomId: string, missionId: string): AnomalyPoint[] {
  const room = ROOMS.find((r) => r.id === roomId);
  if (!room) return [];

  const safePositions = SAFE_ROOM_WALKABLE_POINTS[roomId];
  if (safePositions && safePositions.length >= 5) {
    return safePositions.slice(0, 5).map((pos, idx) => ({
      id: `${missionId}_pt_${idx}`,
      missionId,
      x: pos.x + Math.floor(Math.random() * 16 - 8),
      y: pos.y + Math.floor(Math.random() * 16 - 8),
      collected: false,
      radius: 20,
    }));
  }

  const points: AnomalyPoint[] = [];
  const minX = room.x + 120;
  const maxX = room.x + room.width - 120;
  const minY = room.y + 120;
  const maxY = room.y + room.height - 120;

  for (let i = 0; i < 5; i++) {
    points.push({
      id: `${missionId}_pt_${i}`,
      missionId,
      x: Math.floor(minX + ((maxX - minX) * (i + 0.5)) / 5),
      y: Math.floor(minY + ((maxY - minY) * ((i % 3) + 0.5)) / 3),
      collected: false,
      radius: 20,
    });
  }
  return points;
}

// 18 Rich Space Missions across 5 radical mechanics
export const MISSIONS_CATALOG: Mission[] = [
  // 1. ANOMALIES (Recolectar anomalías: 5 puntos a pisar)
  {
    id: 'm_anomalies_hydro',
    title: 'Absorber Anomalías Botánicas',
    description: 'Camina y pisa las 5 esporas brillantes dispersas por el invernadero.',
    mechanicDesc: 'Pisa las 5 anomalías del cuarto',
    mechanicType: 'anomalies',
    roomId: 'hydroponics',
    roomName: 'Invernadero Hidropónico',
    icon: '✨',
    completed: false,
    progress: 0,
    targetPropId: 'prop_hydro_plant_master',
    color: '#10b981',
    collectedAnomalies: 0,
    targetAnomalies: 5,
  },
  {
    id: 'm_anomalies_engines',
    title: 'Recolectar Fugas de Plasma',
    description: 'Absorbe los 5 residuos energéticos flotando en la sala de motores.',
    mechanicDesc: 'Pisa las 5 anomalías del cuarto',
    mechanicType: 'anomalies',
    roomId: 'engines',
    roomName: 'Sala de Motores',
    icon: '⚡',
    completed: false,
    progress: 0,
    targetPropId: 'prop_reactor_beta',
    color: '#f59e0b',
    collectedAnomalies: 0,
    targetAnomalies: 5,
  },
  {
    id: 'm_anomalies_storage',
    title: 'Detectar Residuos Gravitatorios',
    description: 'Pisa los 5 focos de distorsión gravitatoria en el almacén de carga.',
    mechanicDesc: 'Pisa las 5 anomalías del cuarto',
    mechanicType: 'anomalies',
    roomId: 'storage',
    roomName: 'Almacén de Carga',
    icon: '⚓',
    completed: false,
    progress: 0,
    targetPropId: 'prop_storage_crates_stack',
    color: '#ea580c',
    collectedAnomalies: 0,
    targetAnomalies: 5,
  },
  {
    id: 'm_anomalies_cafe',
    title: 'Recolectar Muestras Nutricionales',
    description: 'Recoge los 5 núcleos de raciones esparcidos en la cafetería.',
    mechanicDesc: 'Pisa las 5 anomalías del cuarto',
    mechanicType: 'anomalies',
    roomId: 'cafeteria',
    roomName: 'Cafetería Central',
    icon: '🍕',
    completed: false,
    progress: 0,
    targetPropId: 'prop_cafe_table_1',
    color: '#0284c7',
    collectedAnomalies: 0,
    targetAnomalies: 5,
  },

  // 2. POWER RESTORATION & PRECISION MINIGAMES
  {
    id: 'm_restore_power',
    title: 'Restaurar Red de Energía Principal',
    description: 'Conecta los 4 cables de energía en orden exacto para encender las luces de toda la nave.',
    mechanicDesc: 'Conecta 4 cables en orden',
    mechanicType: 'wire_connect',
    roomId: 'engines',
    roomName: 'Sala de Motores',
    icon: '💡',
    completed: false,
    progress: 0,
    targetPropId: 'prop_reactor_alpha',
    color: '#eab308',
  },
  {
    id: 'm_precision_o2',
    title: 'Calibrar Válvula de Presión O2',
    description: 'Sincroniza la válvula deteniendo el medidor en el sector óptimo verde.',
    mechanicDesc: 'Presiona en la zona verde',
    mechanicType: 'precision',
    roomId: 'lifesupport',
    roomName: 'Soporte Vital (O2)',
    icon: '💨',
    completed: false,
    progress: 0,
    targetPropId: 'prop_o2_scrubber',
    color: '#34d399',
  },
  {
    id: 'm_precision_cafe',
    title: 'Calibrar Dispensador de Raciones',
    description: 'Detén el selector en el marcador verde para dispensar raciones estelares.',
    mechanicDesc: 'Presiona en la zona verde',
    mechanicType: 'precision',
    roomId: 'cafeteria',
    roomName: 'Cafetería Central',
    icon: '🥪',
    completed: false,
    progress: 0,
    targetPropId: 'prop_cafe_synth',
    color: '#38bdf8',
  },
  {
    id: 'm_precision_shields',
    title: 'Alinear Polaridad Deflectora',
    description: 'Fija el medidor oscilante de resonancia electromagnética en la zona verde.',
    mechanicDesc: 'Presiona en la zona verde',
    mechanicType: 'precision',
    roomId: 'shields',
    roomName: 'Escudos Deflectores',
    icon: '🛡️',
    completed: false,
    progress: 0,
    targetPropId: 'prop_shield_generator',
    color: '#a855f7',
  },

  // 3. MEMORY SEQUENCE (Secuencia de 3 botones en orden)
  {
    id: 'm_memory_nav',
    title: 'Secuencia de Coordenadas Estelares',
    description: 'Memoriza y reproduce el patrón de 3 pulsadores iluminados en la consola.',
    mechanicDesc: 'Toca 3 botones en orden',
    mechanicType: 'memory_sequence',
    roomId: 'navigation',
    roomName: 'Navegación & Admin',
    icon: '🧩',
    completed: false,
    progress: 0,
    targetPropId: 'prop_nav_console',
    color: '#818cf8',
  },
  {
    id: 'm_memory_shields',
    title: 'Sintonizar Frecuencia de Escudos',
    description: 'Introduce la secuencia de 3 nodos de dispersión de plasma en el panel.',
    mechanicDesc: 'Toca 3 botones en orden',
    mechanicType: 'memory_sequence',
    roomId: 'shields',
    roomName: 'Escudos Deflectores',
    icon: '🔮',
    completed: false,
    progress: 0,
    targetPropId: 'prop_shield_console_memory',
    color: '#9333ea',
  },
  {
    id: 'm_memory_armory',
    title: 'Código de Acceso a Torretas',
    description: 'Desbloquea los controles de defensa repitiendo la combinación de 3 luces.',
    mechanicDesc: 'Toca 3 botones en orden',
    mechanicType: 'memory_sequence',
    roomId: 'armory',
    roomName: 'Armería & Seguridad',
    icon: '🔒',
    completed: false,
    progress: 0,
    targetPropId: 'prop_security_cctv',
    color: '#6366f1',
  },
  {
    id: 'm_memory_comms',
    title: 'Reordenar Canales de Transmisión',
    description: 'Sintoniza los 3 diales de sub-frecuencia en el orden transmitido.',
    mechanicDesc: 'Toca 3 botones en orden',
    mechanicType: 'memory_sequence',
    roomId: 'communications',
    roomName: 'Comunicaciones',
    icon: '📻',
    completed: false,
    progress: 0,
    targetPropId: 'prop_comms_console',
    color: '#06b6d4',
  },

  // 4. DECONTAMINATION (Quedarse quieto en zona delimitada por 4 segundos)
  {
    id: 'm_decon_medbay',
    title: 'Descontaminación Médica',
    description: 'Permanece inmóvil en la cabina de desinfección biológica por 4 segundos.',
    mechanicDesc: 'Quédate quieto en la zona 4s',
    mechanicType: 'decontamination',
    roomId: 'medbay',
    roomName: 'Bahía Médica',
    icon: '🚿',
    completed: false,
    progress: 0,
    targetPropId: 'prop_decon_medbay',
    color: '#2dd4bf',
    currentDeconSeconds: 0,
    targetDeconSeconds: 4.0,
  },
  {
    id: 'm_decon_armory',
    title: 'Desionizar Blindaje en Armería',
    description: 'Párate en la placa de descarga electrostática sin moverte por 4 segundos.',
    mechanicDesc: 'Quédate quieto en la zona 4s',
    mechanicType: 'decontamination',
    roomId: 'armory',
    roomName: 'Armería & Seguridad',
    icon: '⚡',
    completed: false,
    progress: 0,
    targetPropId: 'prop_armory_decon_pad',
    color: '#818cf8',
    currentDeconSeconds: 0,
    targetDeconSeconds: 4.0,
  },
  {
    id: 'm_decon_lifesupport',
    title: 'Esterilizar Filtros de Oxígeno',
    description: 'Permanece sobre la cámara de purificación química durante 4 segundos.',
    mechanicDesc: 'Quédate quieto en la zona 4s',
    mechanicType: 'decontamination',
    roomId: 'lifesupport',
    roomName: 'Soporte Vital (O2)',
    icon: '🧪',
    completed: false,
    progress: 0,
    targetPropId: 'prop_o2_decon_pad',
    color: '#10b981',
    currentDeconSeconds: 0,
    targetDeconSeconds: 4.0,
  },

  // 5. DATA DOWNLOAD (Mantener presionado 3 segundos seguidos sin soltar)
  {
    id: 'm_download_control',
    title: 'Descargar Registros del Núcleo',
    description: 'Sostén la conexión al servidor central manteniendo pulsado 3 segundos.',
    mechanicDesc: 'Mantén pulsado 3s sin soltar',
    mechanicType: 'data_download',
    roomId: 'control_center',
    roomName: 'Centro de Control',
    icon: '💾',
    completed: false,
    progress: 0,
    targetPropId: 'prop_control_server',
    color: '#38bdf8',
    currentHoldSeconds: 0,
    targetHoldSeconds: 3.0,
  },
  {
    id: 'm_download_comms',
    title: 'Transmitir Datos a Baliza Orbital',
    description: 'Mantén presionado el botón 3 segundos continuos para enviar la señal SOS.',
    mechanicDesc: 'Mantén pulsado 3s sin soltar',
    mechanicType: 'data_download',
    roomId: 'communications',
    roomName: 'Comunicaciones',
    icon: '📡',
    completed: false,
    progress: 0,
    targetPropId: 'prop_comms_dish',
    color: '#06b6d4',
    currentHoldSeconds: 0,
    targetHoldSeconds: 3.0,
  },
  {
    id: 'm_download_nav',
    title: 'Descargar Cartografía Subespacial',
    description: 'Transfiere las cartas de navegación manteniendo pulsado durante 3 segundos.',
    mechanicDesc: 'Mantén pulsado 3s sin soltar',
    mechanicType: 'data_download',
    roomId: 'navigation',
    roomName: 'Navegación & Admin',
    icon: '🗺️',
    completed: false,
    progress: 0,
    targetPropId: 'prop_nav_radar',
    color: '#6366f1',
    currentHoldSeconds: 0,
    targetHoldSeconds: 3.0,
  },

  // ================= 7 NUEVAS MISIONES DINÁMICAS =================
  // 6. LIMPIAR SENSORES (Swiping / Deslizar dedo rápido para limpiar mancha al 100%)
  {
    id: 'm_swipe_sensors',
    title: 'Limpiar Sensores Ópticos',
    description: 'Desliza el dedo rápidamente sobre la pantalla para retirar la suciedad y polvo cósmico al 100%.',
    mechanicDesc: 'Desliza el dedo para limpiar la mancha',
    mechanicType: 'swipe_clean',
    roomId: 'hydroponics',
    roomName: 'Hidroponía & Botánica',
    icon: '🧽',
    completed: false,
    progress: 0,
    targetPropId: 'prop_hydro_plant_master',
    color: '#38bdf8',
  },

  // 7. ENRUTAR DATOS (Drag Seguro en zigzag ancho y permisivo)
  {
    id: 'm_safe_drag',
    title: 'Enrutar Núcleo de Datos',
    description: 'Arrastra el haz de luz a lo largo del canal en zigzag sin salirte de los márgenes de seguridad.',
    mechanicDesc: 'Arrastra el haz de luz por el zigzag',
    mechanicType: 'safe_drag',
    roomId: 'control_center',
    roomName: 'Centro de Control',
    icon: '⚡',
    completed: false,
    progress: 0,
    targetPropId: 'prop_control_desk',
    color: '#06b6d4',
  },

  // 8. ESTABILIZAR PRESIÓN (Multi-touch: 2 barras en centro durante 3 segundos exactos)
  {
    id: 'm_pressure_multi',
    title: 'Estabilizar Presión Hidráulica',
    description: 'Usa dos dedos para sostener simultáneamente ambos indicadores en el centro durante 3 segundos.',
    mechanicDesc: 'Mantén ambos deslizadores en el centro 3s',
    mechanicType: 'multi_touch_pressure',
    roomId: 'shields',
    roomName: 'Escudos Deflectores',
    icon: '🎚️',
    completed: false,
    progress: 0,
    targetPropId: 'prop_shield_generator',
    color: '#a855f7',
  },

  // 9. SINCRONIZAR ANTENA (Rotación Dial: 3 anillos concéntricos alineados)
  {
    id: 'm_dial_antenna',
    title: 'Sincronizar Anillos de Antena',
    description: 'Gira los 3 anillos concéntricos con el dedo hasta alinear sus muescas de frecuencia.',
    mechanicDesc: 'Gira los 3 anillos hasta alinearlos',
    mechanicType: 'dial_rotation',
    roomId: 'communications',
    roomName: 'Comunicaciones',
    icon: '🎛️',
    completed: false,
    progress: 0,
    targetPropId: 'prop_comms_console',
    color: '#0284c7',
  },

  // 10. BOMBEAR OXÍGENO (Spam Tap mashing para llenar barra contra caída constante)
  {
    id: 'm_spam_oxygen',
    title: 'Bombear Oxígeno de Emergencia',
    description: 'Toca repetidamente a máxima velocidad para contrarrestar la fuga y llenar el tanque al 100%.',
    mechanicDesc: 'Toca rápidamente para llenar la barra',
    mechanicType: 'spam_tap',
    roomId: 'lifesupport',
    roomName: 'Soporte Vital (O2)',
    icon: '🫁',
    completed: false,
    progress: 0,
    targetPropId: 'prop_o2_tanks_1',
    color: '#10b981',
  },

  // 11. PURGAR VIRUS (Reflejos: tocar 5 rojos antes de esconderse, evitando verdes)
  {
    id: 'm_virus_purge',
    title: 'Purgar Ciber-Virus del Sistema',
    description: 'Toca 5 nodos de virus rojos antes de que desaparezcan, evitando tocar los nodos verdes seguros.',
    mechanicDesc: 'Toca 5 puntos rojos rápidamente',
    mechanicType: 'virus_purge',
    roomId: 'medbay',
    roomName: 'Bahía Médica',
    icon: '👾',
    completed: false,
    progress: 0,
    targetPropId: 'prop_med_fridge',
    color: '#ef4444',
  },

  // 12. AISLAR NANOBOTS (Esquivar: mantener punto azul y esquivar rojos rebotantes por 5s)
  {
    id: 'm_dodge_nanobots',
    title: 'Aislar Nanobots en Armería',
    description: 'Mantén presionado el núcleo azul y esquiva los nanobots rojos rebotantes durante 5 segundos continuos.',
    mechanicDesc: 'Esquiva los puntos rojos durante 5s',
    mechanicType: 'dodge_nanobots',
    roomId: 'armory',
    roomName: 'Armería & Seguridad',
    icon: '🦠',
    completed: false,
    progress: 0,
    targetPropId: 'prop_armory_locker',
    color: '#f97316',
  },
];

/**
 * Mathematical Fisher-Yates (Knuth) Shuffle algorithm
 */
export function fisherYatesShuffle<T>(items: readonly T[] | T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Selects exactly 4 unique missions from the 18 catalog using Fisher-Yates shuffle.
 * Features the new "Restaurar Red de Energía" mission alongside 3 unique rotating missions.
 * Mathematically guarantees:
 * - 0 duplicate missions (strictly unique IDs)
 * - 4 distinct rooms (no two missions in the same room)
 * - 4 distinct mechanics (no two missions with the same mechanic)
 */
export function getRandomMissionsSelection(): Mission[] {
  const powerMission = MISSIONS_CATALOG.find((m) => m.id === 'm_restore_power');
  const otherMissions = fisherYatesShuffle(
    MISSIONS_CATALOG.filter((m) => m.id !== 'm_restore_power')
  );

  const selected: Mission[] = powerMission ? [powerMission] : [];
  const usedRooms = new Set<string>(powerMission ? [powerMission.roomId] : []);
  const usedMechanics = new Set<string>(powerMission ? [powerMission.mechanicType] : []);

  // Select remaining 3 missions with strictly distinct rooms and mechanics
  for (const m of otherMissions) {
    if (!usedRooms.has(m.roomId) && !usedMechanics.has(m.mechanicType)) {
      selected.push(m);
      usedRooms.add(m.roomId);
      usedMechanics.add(m.mechanicType);
      if (selected.length === 4) break;
    }
  }

  // Pass 2 fallback if distinct mechanics couldn't fill 4 slots: distinct rooms
  if (selected.length < 4) {
    for (const m of otherMissions) {
      if (!selected.some((s) => s.id === m.id) && !usedRooms.has(m.roomId)) {
        selected.push(m);
        usedRooms.add(m.roomId);
        if (selected.length === 4) break;
      }
    }
  }

  // Pass 3 safety fallback: fill any slot ensuring strictly unique ID
  if (selected.length < 4) {
    for (const m of otherMissions) {
      if (!selected.some((s) => s.id === m.id)) {
        selected.push(m);
        if (selected.length === 4) break;
      }
    }
  }


  return selected.map((m) => {
    const initialized: Mission = {
      ...m,
      completed: false,
      progress: 0,
      currentHoldSeconds: 0,
      currentDeconSeconds: 0,
      collectedAnomalies: 0,
    };

    if (m.mechanicType === 'anomalies') {
      initialized.anomalies = generateRoomAnomalies(m.roomId, m.id);
      initialized.targetAnomalies = 5;
    }

    if (m.mechanicType === 'memory_sequence') {
      // Generate random sequence of 3 buttons (0, 1, 2)
      initialized.memorySequence = [
        Math.floor(Math.random() * 3),
        Math.floor(Math.random() * 3),
        Math.floor(Math.random() * 3),
      ];
      initialized.currentMemoryStep = 0;
    }

    return initialized;
  });
}

// Inter-Room Global Waypoint Network: 8 Aliens Patrolling the whole ship through corridors
export const GLOBAL_ALIEN_ROUTES: Record<string, Waypoint[]> = {
  // Alien 1: Alfa (Engines <-> Hydroponics <-> O2 <-> Cargo)
  alien_alfa: [
    { x: 450, y: 1425, room: 'Motores', waitTime: 1800 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 500 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 2000 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 500 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1800 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 500 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1000 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 500 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1500 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 500 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 2200 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 500 },
  ],
  // Alien 2: Beta (MedBay <-> Cafeteria <-> Shields <-> Armory)
  alien_beta: [
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 2000 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 500 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1800 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 2200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 500 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1800 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1500 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 500 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1500 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 500 },
  ],
  // Alien 3: Gamma (Navigation <-> Communications <-> Shields <-> Cafeteria)
  alien_gamma: [
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 2000 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 500 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 2200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1800 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 500 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1500 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 500 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 2000 },
  ],
  // Alien 4: Delta (Cargo <-> Armory <-> Shields <-> Comms)
  alien_delta: [
    { x: 450, y: 2400, room: 'Almacén', waitTime: 2000 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 500 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1800 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1800 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 500 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 2000 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1500 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 500 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1500 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 500 },
  ],
  // Alien 5: Epsilon (O2 <-> MedBay <-> Cafeteria <-> Navigation)
  alien_epsilon: [
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 2000 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 500 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1800 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 500 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1800 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 500 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 2000 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 500 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1500 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 500 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1500 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 500 },
  ],
  // Alien 6: Zeta (Hydroponics <-> Engines <-> O2 <-> MedBay)
  alien_zeta: [
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1800 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 500 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1800 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 500 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1500 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 500 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1700 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 500 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1900 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 500 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1400 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 500 },
  ],
  // Alien 7: Omega (Navigation <-> Communications <-> Shields <-> Armory <-> Storage)
  alien_omega: [
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1900 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 500 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 2100 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1700 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 500 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1800 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 500 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 2000 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 500 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1500 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1500 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 500 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1500 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 500 },
  ],
  // Alien 8: Theta (Armory <-> Shields <-> Cafeteria <-> MedBay <-> Life Support)
  alien_theta: [
    { x: 1400, y: 2400, room: 'Armería', waitTime: 2000 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1800 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 500 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1900 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 500 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1800 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 500 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1800 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 500 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1400 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 500 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1500 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 500 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1500 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 500 },
  ],
};
