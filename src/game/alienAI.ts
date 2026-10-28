import { AlienEntity, PlayerState, Mission, Waypoint } from '../types/game';
import { GLOBAL_ALIEN_ROUTES, ALIEN_SPAWN_CANDIDATES, ROOMS, CORRIDORS } from './mapData';
import {
  getDistance,
  hasLineOfSight,
  hasClearPathWithClearance,
  isInsideAlienAllowedDeck,
  circleIntersectsRect,
  resolveMovement,
  Rect,
  Circle,
} from './collision';
import { soundManager } from '../audio/soundManager';

// Navigation Graph Nodes for inter-room door navigation and prop avoidance
export interface NavNode {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

/**
 * Checks whether a node or coordinate is safely walkable and does NOT intersect
 * any wall, prop (like reactors, crates, consoles), or planters (macetas) with safety padding.
 */
export function isNodeWalkable(
  x: number,
  y: number,
  obstacles: Rect[],
  padding: number = 20
): boolean {
  const circle: Circle = { x, y, radius: padding };
  for (let i = 0; i < obstacles.length; i++) {
    if (circleIntersectsRect(circle, obstacles[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Enhanced Navigation Mesh with room perimeter and aisle nodes that circumnavigate
 * props, planters, and reactors, avoiding head-on collisions.
 */
export const NAV_GRAPH: NavNode[] = [
  // ================= 1. HYDROPONICS (Aisle nodes encircling center planters) =================
  { id: 'n_hydro_n', x: 450, y: 240, neighbors: ['n_hydro_w', 'n_hydro_e', 'c_h_o'] },
  { id: 'n_hydro_s', x: 240, y: 620, neighbors: ['n_hydro_w', 'n_hydro_se'] },
  { id: 'n_hydro_se', x: 450, y: 700, neighbors: ['n_hydro_s', 'n_hydro_e', 'c_h_e'] },
  { id: 'n_hydro_e', x: 620, y: 450, neighbors: ['n_hydro_n', 'n_hydro_se', 'c_h_o'] },
  { id: 'n_hydro_w', x: 220, y: 420, neighbors: ['n_hydro_n', 'n_hydro_s'] },

  // ================= 2. ENGINES (Aisles between and around the two reactors) =================
  { id: 'n_eng_c', x: 475, y: 1420, neighbors: ['n_eng_n', 'n_eng_s', 'c_eng_ctrl'] },
  { id: 'n_eng_n', x: 475, y: 1180, neighbors: ['c_h_e', 'n_eng_c', 'n_eng_e'] },
  { id: 'n_eng_s', x: 475, y: 1660, neighbors: ['c_e_cg', 'n_eng_c', 'n_eng_e'] },
  { id: 'n_eng_e', x: 740, y: 1420, neighbors: ['c_eng_ctrl', 'n_eng_n', 'n_eng_s'] },
  { id: 'n_eng_w', x: 170, y: 1550, neighbors: ['n_eng_s'] },

  // ================= 3. LIFE SUPPORT (O2) =================
  { id: 'n_o2_n', x: 1300, y: 240, neighbors: ['c_h_o', 'c_o_m', 'n_o2_w', 'n_o2_e'] },
  { id: 'n_o2_s', x: 1220, y: 600, neighbors: ['c_o2_ctrl', 'n_o2_w'] },
  { id: 'n_o2_w', x: 1120, y: 450, neighbors: ['c_h_o', 'n_o2_n', 'n_o2_s'] },
  { id: 'n_o2_e', x: 1450, y: 350, neighbors: ['c_o_m', 'n_o2_n', 'c_o2_ctrl'] },

  // ================= 4. MEDBAY =================
  { id: 'n_med_w', x: 1920, y: 600, neighbors: ['c_o_m', 'n_med_s'] },
  { id: 'n_med_c', x: 2225, y: 300, neighbors: ['c_o_m', 'n_med_e'] },
  { id: 'n_med_s', x: 2225, y: 600, neighbors: ['c_m_c', 'n_med_w', 'n_med_e'] },
  { id: 'n_med_e', x: 2500, y: 450, neighbors: ['n_med_c', 'n_med_s'] },

  // ================= 5. CENTRO DE CONTROL =================
  { id: 'n_ctrl_n', x: 1400, y: 1200, neighbors: ['c_o2_ctrl', 'n_ctrl_w', 'n_ctrl_e'] },
  { id: 'n_ctrl_s', x: 1400, y: 1650, neighbors: ['c_ctrl_arm', 'n_ctrl_w', 'n_ctrl_e'] },
  { id: 'n_ctrl_w', x: 1200, y: 1425, neighbors: ['c_eng_ctrl', 'n_ctrl_n', 'n_ctrl_s'] },
  { id: 'n_ctrl_e', x: 1600, y: 1425, neighbors: ['c_ctrl_cafe', 'n_ctrl_n', 'n_ctrl_s'] },

  // ================= 6. CAFETERIA =================
  { id: 'n_cafe_n', x: 2325, y: 1200, neighbors: ['c_m_c', 'n_cafe_w', 'n_cafe_e'] },
  { id: 'n_cafe_s', x: 2325, y: 1650, neighbors: ['c_c_s', 'n_cafe_w', 'n_cafe_e'] },
  { id: 'n_cafe_w', x: 2100, y: 1425, neighbors: ['c_ctrl_cafe', 'n_cafe_n', 'n_cafe_s'] },
  { id: 'n_cafe_e', x: 2550, y: 1425, neighbors: ['c_c_n', 'n_cafe_n', 'n_cafe_s'] },

  // ================= 7. NAVIGATION =================
  { id: 'n_nav_c', x: 3300, y: 1425, neighbors: ['c_c_n', 'c_n_cm', 'n_nav_n', 'n_nav_s'] },
  { id: 'n_nav_n', x: 3300, y: 1200, neighbors: ['n_nav_c'] },
  { id: 'n_nav_s', x: 3300, y: 1650, neighbors: ['n_nav_c', 'c_n_cm'] },

  // ================= 8. STORAGE =================
  { id: 'n_storage_c', x: 450, y: 2400, neighbors: ['c_e_cg', 'c_cg_a', 'n_storage_n', 'n_storage_s'] },
  { id: 'n_storage_n', x: 450, y: 2200, neighbors: ['c_e_cg', 'n_storage_c'] },
  { id: 'n_storage_s', x: 450, y: 2580, neighbors: ['c_cg_a', 'n_storage_c'] },

  // ================= 9. ARMORY =================
  { id: 'n_armory_c', x: 1400, y: 2400, neighbors: ['c_cg_a', 'c_a_s', 'c_ctrl_arm', 'n_armory_n'] },
  { id: 'n_armory_n', x: 1400, y: 2200, neighbors: ['c_ctrl_arm', 'n_armory_c'] },

  // ================= 10. SHIELDS =================
  { id: 'n_shields_c', x: 2325, y: 2400, neighbors: ['c_c_s', 'c_a_s', 'c_s_cm', 'n_shields_n'] },
  { id: 'n_shields_n', x: 2325, y: 2200, neighbors: ['c_c_s', 'n_shields_c'] },

  // ================= 11. COMMUNICATIONS =================
  { id: 'n_comms_c', x: 3300, y: 2400, neighbors: ['c_n_cm', 'c_s_cm', 'n_comms_n'] },
  { id: 'n_comms_n', x: 3300, y: 2200, neighbors: ['c_n_cm', 'n_comms_c'] },

  // ================= CORRIDOR DOORWAY NODES =================
  { id: 'c_h_o', x: 850, y: 450, neighbors: ['n_hydro_e', 'n_hydro_n', 'n_o2_w', 'n_o2_n'] },
  { id: 'c_o_m', x: 1750, y: 450, neighbors: ['n_o2_e', 'n_o2_n', 'n_med_w', 'n_med_c'] },
  { id: 'c_h_e', x: 450, y: 900, neighbors: ['n_hydro_s', 'n_hydro_se', 'n_eng_n'] },
  { id: 'c_m_c', x: 2320, y: 900, neighbors: ['n_med_s', 'n_cafe_n'] },
  { id: 'c_c_n', x: 2800, y: 1430, neighbors: ['n_cafe_e', 'n_nav_c'] },
  { id: 'c_e_cg', x: 450, y: 1950, neighbors: ['n_eng_s', 'n_storage_n', 'n_storage_c'] },
  { id: 'c_c_s', x: 2320, y: 1950, neighbors: ['n_cafe_s', 'n_shields_n', 'n_shields_c'] },
  { id: 'c_n_cm', x: 3320, y: 1950, neighbors: ['n_nav_s', 'n_nav_c', 'n_comms_n', 'n_comms_c'] },
  { id: 'c_cg_a', x: 950, y: 2390, neighbors: ['n_storage_c', 'n_storage_s', 'n_armory_c'] },
  { id: 'c_a_s', x: 1850, y: 2390, neighbors: ['n_armory_c', 'n_shields_c'] },
  { id: 'c_s_cm', x: 2800, y: 2390, neighbors: ['n_shields_c', 'n_comms_c'] },

  // Control Center Doorway Connectors (Active when shield is disabled)
  { id: 'c_o2_ctrl', x: 1400, y: 900, neighbors: ['n_o2_s', 'n_ctrl_n'] },
  { id: 'c_eng_ctrl', x: 950, y: 1430, neighbors: ['n_eng_c', 'n_eng_e', 'n_ctrl_w'] },
  { id: 'c_ctrl_cafe', x: 1850, y: 1430, neighbors: ['n_ctrl_e', 'n_cafe_w'] },
  { id: 'c_ctrl_arm', x: 1400, y: 1950, neighbors: ['n_ctrl_s', 'n_armory_n', 'n_armory_c'] },
];

/**
 * Finds the best intermediate nav node to reach target (x, y) using A* pathfinding on NAV_GRAPH.
 * Item 5 & 6: Path Padding & NavMesh obstacle awareness.
 * Props and planters are treated as non-walkable nodes, and clearance padding prevents skimming edges.
 */
function findBestNavWaypoint(
  currentX: number,
  currentY: number,
  targetX: number,
  targetY: number,
  obstacles: Rect[],
  shieldActive: boolean = true
): { x: number; y: number } {
  // Path Padding: clearance radius incorporates alien feet radius + safety margin
  const PADDING_CLEARANCE = 20;

  // Direct line with clearance check:
  if (hasClearPathWithClearance(currentX, currentY, targetX, targetY, obstacles, PADDING_CLEARANCE)) {
    const dist = getDistance(currentX, currentY, targetX, targetY);
    if (dist < 260) {
      return { x: targetX, y: targetY };
    }
  }

  // Filter available nodes: must not collide with any obstacle (props/planters/walls)
  const availableNodes = NAV_GRAPH.filter((node) => {
    if (shieldActive && (node.id === 'n_ctrl' || node.id.includes('ctrl'))) {
      return false;
    }
    return isNodeWalkable(node.x, node.y, obstacles, 18);
  });

  if (!availableNodes || availableNodes.length === 0) {
    return { x: targetX, y: targetY };
  }

  // Find start node: closest node that has clear line with clearance
  let startNode: NavNode | null = null;
  let minStartDist = Infinity;
  let fallbackStartNode = availableNodes[0];
  let minFallbackStartDist = Infinity;

  for (const node of availableNodes) {
    const d = getDistance(currentX, currentY, node.x, node.y);
    if (d < minFallbackStartDist) {
      minFallbackStartDist = d;
      fallbackStartNode = node;
    }
    if (hasClearPathWithClearance(currentX, currentY, node.x, node.y, obstacles, 14)) {
      if (d < minStartDist) {
        minStartDist = d;
        startNode = node;
      }
    }
  }
  if (!startNode) startNode = fallbackStartNode;

  // Find target node: closest node that has clear line with clearance from target
  let targetNode: NavNode | null = null;
  let minTargetDist = Infinity;
  let fallbackTargetNode = availableNodes[0];
  let minFallbackTargetDist = Infinity;

  for (const node of availableNodes) {
    const d = getDistance(targetX, targetY, node.x, node.y);
    if (d < minFallbackTargetDist) {
      minFallbackTargetDist = d;
      fallbackTargetNode = node;
    }
    if (hasClearPathWithClearance(targetX, targetY, node.x, node.y, obstacles, 14)) {
      if (d < minTargetDist) {
        minTargetDist = d;
        targetNode = node;
      }
    }
  }
  if (!targetNode) targetNode = fallbackTargetNode;

  if (startNode.id === targetNode.id) {
    if (hasClearPathWithClearance(currentX, currentY, targetX, targetY, obstacles, 16)) {
      return { x: targetX, y: targetY };
    }
    return { x: targetNode.x, y: targetNode.y };
  }

  // A* Search on NAV_GRAPH
  const openSet = [startNode.id];
  const cameFrom: Record<string, string> = {};
  const gScore: Record<string, number> = { [startNode.id]: 0 };
  const fScore: Record<string, number> = {
    [startNode.id]: getDistance(startNode.x, startNode.y, targetNode.x, targetNode.y),
  };

  const nodeMap = new Map<string, NavNode>();
  for (const n of availableNodes) nodeMap.set(n.id, n);

  while (openSet.length > 0) {
    let currentId = openSet[0];
    let lowestF = fScore[currentId] ?? Infinity;
    let lowestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      const f = fScore[openSet[i]] ?? Infinity;
      if (f < lowestF) {
        lowestF = f;
        currentId = openSet[i];
        lowestIdx = i;
      }
    }

    if (currentId === targetNode.id) {
      // Reconstruct path
      const path = [currentId];
      let curr = currentId;
      while (cameFrom[curr]) {
        curr = cameFrom[curr];
        path.unshift(curr);
      }

      const distToStart = getDistance(currentX, currentY, startNode.x, startNode.y);
      if (path.length > 1) {
        const nextNode = nodeMap.get(path[1]);
        if (
          nextNode &&
          (distToStart < 36 ||
            hasClearPathWithClearance(currentX, currentY, nextNode.x, nextNode.y, obstacles, 16))
        ) {
          return { x: nextNode.x, y: nextNode.y };
        }
      }

      return { x: startNode.x, y: startNode.y };
    }

    openSet.splice(lowestIdx, 1);
    const currentNode = nodeMap.get(currentId);
    if (!currentNode || !Array.isArray(currentNode.neighbors)) continue;

    for (const neighborId of currentNode.neighbors) {
      if (shieldActive && (neighborId === 'n_ctrl' || neighborId.includes('ctrl'))) {
        continue;
      }
      const neighbor = nodeMap.get(neighborId);
      if (!neighbor) continue;

      // Item 5: Props & planters are NON-WALKABLE. Validate edge clearance between nodes:
      if (!hasClearPathWithClearance(currentNode.x, currentNode.y, neighbor.x, neighbor.y, obstacles, 16)) {
        continue;
      }

      const tentativeG =
        (gScore[currentId] ?? Infinity) +
        getDistance(currentNode.x, currentNode.y, neighbor.x, neighbor.y);

      if (tentativeG < (gScore[neighborId] ?? Infinity)) {
        cameFrom[neighborId] = currentId;
        gScore[neighborId] = tentativeG;
        fScore[neighborId] =
          tentativeG + getDistance(neighbor.x, neighbor.y, targetNode.x, targetNode.y);

        if (!openSet.includes(neighborId)) {
          openSet.push(neighborId);
        }
      }
    }
  }

  return startNode ? { x: startNode.x, y: startNode.y } : { x: targetX, y: targetY };
}

// Open Area Nodes for Anti-Stuck Rescue Routine (Rule 2)
export const OPEN_AREA_NODES = [
  { id: 'open_hydro', x: 450, y: 240, room: 'Hidroponía' },
  { id: 'open_o2', x: 1300, y: 240, room: 'Soporte Vital' },
  { id: 'open_med', x: 2225, y: 300, room: 'Bahía Médica' },
  { id: 'open_eng', x: 475, y: 1420, room: 'Motores' },
  { id: 'open_cafe', x: 2325, y: 1250, room: 'Cafetería' },
  { id: 'open_nav', x: 3300, y: 1425, room: 'Navegación' },
  { id: 'open_storage', x: 450, y: 2400, room: 'Almacén' },
  { id: 'open_armory', x: 1400, y: 2400, room: 'Armería' },
  { id: 'open_shields', x: 2325, y: 2400, room: 'Escudos' },
  { id: 'open_comms', x: 3300, y: 2400, room: 'Comunicaciones' },
  // Open corridor centers
  { id: 'open_c_h_o', x: 850, y: 450, room: 'Túnel Hidro-O2' },
  { id: 'open_c_o_m', x: 1750, y: 450, room: 'Túnel O2-Médico' },
  { id: 'open_c_h_e', x: 450, y: 900, room: 'Conducto Hidro-Motores' },
  { id: 'open_c_m_c', x: 2320, y: 900, room: 'Túnel Médico-Cafetería' },
  { id: 'open_c_c_n', x: 2800, y: 1430, room: 'Pasillo Cafetería-Navegación' },
  { id: 'open_c_e_cg', x: 450, y: 1950, room: 'Conducto Motores-Carga' },
  { id: 'open_c_c_s', x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos' },
  { id: 'open_c_n_cm', x: 3320, y: 1950, room: 'Túnel Navegación-Comms' },
  { id: 'open_c_cg_a', x: 950, y: 2390, room: 'Túnel Carga-Armería' },
  { id: 'open_c_a_s', x: 1850, y: 2390, room: 'Túnel Armería-Escudos' },
  { id: 'open_c_s_cm', x: 2800, y: 2390, room: 'Túnel Escudos-Comms' },
];

/**
 * Finds the nearest valid open area waypoint (for Rule 2 Anti-Stuck Rescue Routine)
 */
export function findNearestOpenAreaWaypoint(
  x: number,
  y: number,
  controlCenterShieldActive: boolean = true
): { x: number; y: number; room: string } {
  let closest = OPEN_AREA_NODES[0];
  let minDist = Infinity;
  for (const node of OPEN_AREA_NODES) {
    if (controlCenterShieldActive && (node.id.includes('ctrl') || node.room.includes('Control'))) {
      continue;
    }
    const d = getDistance(x, y, node.x, node.y);
    if (d < minDist) {
      minDist = d;
      closest = node;
    }
  }
  return { x: closest.x, y: closest.y, room: closest.room };
}

/**
 * Picks a random valid walkable target across rooms and corridors throughout the entire ship deck.
 * Item 4: IA de Patrullaje Libre (Roaming) - Aliens periodically select random valid coordinates
 * and roam freely across the ship, rather than cycling fixed predictable waypoints.
 */
/**
 * Picks a random valid walkable target across rooms and corridors throughout the entire ship deck.
 * Item 1: Distribución Espacial Uniforme (Anti-Clustering) con Conciencia Espacial:
 * - Evalúa en qué cuadrantes y salas se encuentran y hacia dónde se dirigen los demás enemigos.
 * - Prioriza y fuerza la selección de coordenadas en las áreas, salas o cuadrantes del mapa
 *   con la MENOR densidad de enemigos en ese momento.
 * - Evita que más de 2 o 3 aliens patrullen la misma zona general al mismo tiempo.
 */
export function getRandomRoamingTarget(
  obstacles: Rect[],
  controlCenterShieldActive: boolean = true,
  currentX?: number,
  currentY?: number,
  otherAliens?: AlienEntity[],
  currentAlienId?: string
): { x: number; y: number } {
  const validRooms = ROOMS.filter((r) => {
    if (r.id === 'escape_pod') return false;
    if (controlCenterShieldActive && r.id === 'control_center') return false;
    return true;
  });

  // 1. Evaluar densidad espacial por cuadrante (NW, NE, SW, SE)
  // Dimensiones del mapa: MAP_WIDTH = 3800, MAP_HEIGHT = 2800 (Centro de división: 1900, 1400)
  type QuadrantKey = 'NW' | 'NE' | 'SW' | 'SE';
  const getQuadrant = (x: number, y: number): QuadrantKey => {
    if (x < 1900 && y < 1400) return 'NW';
    if (x >= 1900 && y < 1400) return 'NE';
    if (x < 1900 && y >= 1400) return 'SW';
    return 'SE';
  };

  const quadDensity: Record<QuadrantKey, number> = { NW: 0, NE: 0, SW: 0, SE: 0 };
  const roomDensity: Record<string, number> = {};
  for (const r of validRooms) {
    roomDensity[r.id] = 0;
  }

  if (otherAliens && otherAliens.length > 0) {
    for (const a of otherAliens) {
      if (currentAlienId && a.id === currentAlienId) continue;
      // Posición actual del otro enemigo
      const curQuad = getQuadrant(a.x, a.y);
      quadDensity[curQuad] += 1.0;

      // Destino hacia el que se dirige (si está definido)
      if (a.targetX > 0 && a.targetY > 0) {
        const targetQuad = getQuadrant(a.targetX, a.targetY);
        quadDensity[targetQuad] += 1.0;
      }

      // Densidad por sala específica
      for (const r of validRooms) {
        const inRoomNow =
          a.x >= r.x && a.x <= r.x + r.width && a.y >= r.y && a.y <= r.y + r.height;
        const targetingRoom =
          a.targetX >= r.x &&
          a.targetX <= r.x + r.width &&
          a.targetY >= r.y &&
          a.targetY <= r.y + r.height;
        if (inRoomNow) roomDensity[r.id] = (roomDensity[r.id] || 0) + 1.0;
        if (targetingRoom) roomDensity[r.id] = (roomDensity[r.id] || 0) + 1.0;
      }
    }
  }

  // Ordenar cuadrantes de MENOR a mayor densidad para priorizar áreas vacías
  const sortedQuadrants = (['NW', 'NE', 'SW', 'SE'] as QuadrantKey[]).sort(
    (a, b) => quadDensity[a] - quadDensity[b]
  );
  const minQuadDensity = quadDensity[sortedQuadrants[0]];

  // Descartar cuadrantes saturados (>= 3 aliens) para evitar agrupamientos excesivos
  const eligibleQuadrants = sortedQuadrants.filter(
    (q) => quadDensity[q] <= minQuadDensity + 1.2 && quadDensity[q] < 3.0
  );
  const prioritizedQuadrants =
    eligibleQuadrants.length > 0 ? eligibleQuadrants : sortedQuadrants.slice(0, 2);

  // Filtrar salas elegibles:
  // - Deben encontrarse en los cuadrantes de menor densidad
  // - No deben tener 2 o más aliens ya patrullando o dirigiéndose a ellas
  const eligibleRooms = validRooms
    .filter((r) => {
      const roomCenterX = r.x + r.width / 2;
      const roomCenterY = r.y + r.height / 2;
      const roomQuad = getQuadrant(roomCenterX, roomCenterY);
      const density = roomDensity[r.id] || 0;
      return prioritizedQuadrants.includes(roomQuad) && density < 2.0;
    })
    .sort((a, b) => (roomDensity[a.id] || 0) - (roomDensity[b.id] || 0));

  const roomPool = eligibleRooms.length > 0 ? eligibleRooms : validRooms;

  // Pasillos elegibles en cuadrantes de baja densidad
  const eligibleCorridors = CORRIDORS.filter((c) => {
    if (c.id.includes('escape') || (controlCenterShieldActive && c.id.includes('control'))) {
      return false;
    }
    const corrCenterX = c.x + c.width / 2;
    const corrCenterY = c.y + c.height / 2;
    const corrQuad = getQuadrant(corrCenterX, corrCenterY);
    return prioritizedQuadrants.includes(corrQuad);
  });
  const corridorPool = eligibleCorridors.length > 0 ? eligibleCorridors : CORRIDORS;

  // Generación probabilística en áreas de menor densidad
  for (let attempt = 0; attempt < 25; attempt++) {
    let candX = 0;
    let candY = 0;

    if (Math.random() < 0.72 && roomPool.length > 0) {
      // Priorizar el tercio superior de salas con menor densidad
      const topRooms = roomPool.slice(0, Math.max(1, Math.min(3, roomPool.length)));
      const room = topRooms[Math.floor(Math.random() * topRooms.length)];
      candX = room.x + 70 + Math.random() * (room.width - 140);
      candY = room.y + 70 + Math.random() * (room.height - 140);
    } else if (corridorPool.length > 0) {
      const corr = corridorPool[Math.floor(Math.random() * corridorPool.length)];
      if (corr.id.includes('escape') || (controlCenterShieldActive && corr.id.includes('control'))) {
        continue;
      }
      candX = corr.x + corr.width / 2 + (Math.random() - 0.5) * Math.min(corr.width * 0.35, 24);
      candY = corr.y + corr.height / 2 + (Math.random() - 0.5) * Math.min(corr.height * 0.35, 24);
    } else {
      continue;
    }

    if (!isInsideAlienAllowedDeck(candX, candY, controlCenterShieldActive)) {
      continue;
    }

    if (!isNodeWalkable(candX, candY, obstacles, 24)) {
      continue;
    }

    if (currentX !== undefined && currentY !== undefined) {
      if (getDistance(currentX, currentY, candX, candY) < 140) {
        continue;
      }
    }

    return { x: Math.round(candX), y: Math.round(candY) };
  }

  // Fallback con conciencia espacial: buscar un nodo del NAV_GRAPH en el cuadrante de menor densidad
  const targetQuad = prioritizedQuadrants[0] || 'NW';
  const availableNodesInTargetQuad = NAV_GRAPH.filter((n) => {
    if (controlCenterShieldActive && n.id.includes('ctrl')) return false;
    if (getQuadrant(n.x, n.y) !== targetQuad) return false;
    return isNodeWalkable(n.x, n.y, obstacles, 20);
  });

  if (availableNodesInTargetQuad.length > 0) {
    const node =
      availableNodesInTargetQuad[Math.floor(Math.random() * availableNodesInTargetQuad.length)];
    return { x: node.x, y: node.y };
  }

  const allAvailableNodes = NAV_GRAPH.filter((n) => {
    if (controlCenterShieldActive && n.id.includes('ctrl')) return false;
    return isNodeWalkable(n.x, n.y, obstacles, 20);
  });

  if (allAvailableNodes.length > 0) {
    const node = allAvailableNodes[Math.floor(Math.random() * allAvailableNodes.length)];
    return { x: node.x, y: node.y };
  }

  return { x: 475, y: 1420 };
}

// Rule 1: Global Inter-Room Patrol Circuits explicitly connecting multiple rooms & corridors
export const ROOM_GLOBAL_CIRCUITS: Record<string, Waypoint[]> = {
  engines: [
    { x: 450, y: 1425, room: 'Motores', waitTime: 1200 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 400 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 400 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1200 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 400 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 1200 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 400 },
  ],
  medbay: [
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1200 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 400 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 400 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1200 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 400 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 1200 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 400 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1200 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 400 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
  ],
  storage: [
    { x: 450, y: 2400, room: 'Almacén', waitTime: 1200 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 400 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 400 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1200 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 400 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 400 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1200 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 400 },
  ],
  shields: [
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1200 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 400 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 400 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1200 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 400 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 1200 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 400 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1200 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 400 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
  ],
  communications: [
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1200 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 400 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 400 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 400 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1200 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 400 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 1200 },
  ],
  hydroponics: [
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 400 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1200 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 400 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 1200 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 400 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1200 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 400 },
  ],
  cafeteria: [
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1200 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 400 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 400 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1200 },
  ],
  armory: [
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 400 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1200 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 400 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 1200 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 400 },
  ],
  lifesupport: [
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1200 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 400 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 2320, y: 1950, room: 'Túnel Cafetería-Escudos', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
  ],
  navigation: [
    { x: 3300, y: 1425, room: 'Navegación', waitTime: 1200 },
    { x: 3320, y: 1950, room: 'Túnel Navegación-Comms', waitTime: 400 },
    { x: 3300, y: 2400, room: 'Comunicaciones', waitTime: 1200 },
    { x: 2800, y: 2400, room: 'Túnel Escudos-Comms', waitTime: 400 },
    { x: 2325, y: 2400, room: 'Escudos', waitTime: 1200 },
    { x: 1850, y: 2400, room: 'Túnel Armería-Escudos', waitTime: 400 },
    { x: 1400, y: 2400, room: 'Armería', waitTime: 1200 },
    { x: 950, y: 2400, room: 'Túnel Carga-Armería', waitTime: 400 },
    { x: 450, y: 2400, room: 'Almacén', waitTime: 1200 },
    { x: 450, y: 1950, room: 'Conducto Motores-Carga', waitTime: 400 },
    { x: 450, y: 1425, room: 'Motores', waitTime: 1200 },
    { x: 450, y: 900, room: 'Conducto Hidro-Motores', waitTime: 400 },
    { x: 425, y: 450, room: 'Hidroponía', waitTime: 1200 },
    { x: 850, y: 450, room: 'Túnel Hidro-O2', waitTime: 400 },
    { x: 1300, y: 450, room: 'Soporte Vital', waitTime: 1200 },
    { x: 1750, y: 450, room: 'Túnel O2-Médico', waitTime: 400 },
    { x: 2225, y: 450, room: 'Bahía Médica', waitTime: 1200 },
    { x: 2320, y: 900, room: 'Túnel Médico-Cafetería', waitTime: 400 },
    { x: 2325, y: 1425, room: 'Cafetería', waitTime: 1200 },
    { x: 2800, y: 1425, room: 'Pasillo Cafetería-Navegación', waitTime: 400 },
  ],
};

/**
 * Builds an inter-room global patrol route tailored to the alien's actual spawn location.
 * Rule 1: Explicitly connects different rooms and corridors so NO alien is confined to one room.
 */
export function buildGlobalPatrolRoute(
  spawn: { x: number; y: number; room?: string; roomId?: string },
  reverse: boolean = false
): Waypoint[] {
  const roomId = spawn.roomId || 'engines';
  const baseCircuit = ROOM_GLOBAL_CIRCUITS[roomId] || ROOM_GLOBAL_CIRCUITS['engines'];

  let route = baseCircuit.map((wp) => ({ ...wp }));
  if (reverse) {
    route = [route[0], ...route.slice(1).reverse()];
  }
  return route;
}

export function createRandomizedAliens(
  missionsOrPlayerX?: Mission[] | number,
  playerXOrY?: number,
  playerY?: number
): AlienEntity[] {
  let missions: Mission[] = [];
  if (Array.isArray(missionsOrPlayerX)) {
    missions = missionsOrPlayerX;
  }

  // 1. One alien MUST spawn inside the room where an active mission is located
  // (Filter out control_center, prioritizing outer ship active missions)
  const targetMission =
    Array.isArray(missions) && missions.length > 0
      ? missions.find((m) => m && m.roomId && m.roomId !== 'control_center') || missions[0]
      : null;
  const missionRoomId = targetMission && targetMission.roomId ? targetMission.roomId : 'engines';

  const candidatePool =
    Array.isArray(ALIEN_SPAWN_CANDIDATES) && ALIEN_SPAWN_CANDIDATES.length > 0
      ? ALIEN_SPAWN_CANDIDATES
      : [
          { x: 450, y: 1425, room: 'Motores', roomId: 'engines' },
          { x: 2225, y: 450, room: 'Bahía Médica', roomId: 'medbay' },
          { x: 3300, y: 2400, room: 'Comunicaciones', roomId: 'communications' },
          { x: 450, y: 2400, room: 'Almacén', roomId: 'storage' },
          { x: 1300, y: 450, room: 'Soporte Vital', roomId: 'lifesupport' },
        ];

  // Find candidate in the mission room
  const spawnMissionCandidate =
    candidatePool.find((c) => c.roomId === missionRoomId) || candidatePool[0];

  // 2. The other 7 aliens spawn in distinct rooms across the ship
  // (strictly excluding control_center, escape_pod, and the mission's room)
  const otherCandidates = candidatePool
    .filter((c) => c.roomId !== missionRoomId)
    .sort(() => Math.random() - 0.5);

  const spawnAlfa = spawnMissionCandidate;
  const spawnBeta = otherCandidates[0] || candidatePool[1] || { x: 2225, y: 450, room: 'Bahía Médica', roomId: 'medbay' };
  const spawnGamma = otherCandidates[1] || candidatePool[2] || { x: 3300, y: 2400, room: 'Comunicaciones', roomId: 'communications' };
  const spawnDelta = otherCandidates[2] || candidatePool[3] || { x: 450, y: 2400, room: 'Almacén', roomId: 'storage' };
  const spawnEpsilon = otherCandidates[3] || candidatePool[4] || { x: 1300, y: 450, room: 'Soporte Vital', roomId: 'lifesupport' };
  const spawnZeta = otherCandidates[4] || candidatePool[5] || { x: 425, y: 450, room: 'Hidroponía', roomId: 'hydroponics' };
  const spawnOmega = otherCandidates[5] || candidatePool[6] || { x: 2325, y: 2400, room: 'Escudos', roomId: 'shields' };
  const spawnTheta = otherCandidates[6] || candidatePool[7] || { x: 1400, y: 2400, room: 'Armería', roomId: 'armory' };

  return [
    // Alien 1: Alfa (Violet) - Spawns inside the room of an active mission!
    // Item 4: IA de Patrullaje Libre (Roaming) - Free dynamic roaming across ship deck
    {
      id: 'alien_alfa',
      name: 'Alien Alfa',
      x: spawnAlfa.x,
      y: spawnAlfa.y,
      targetX: spawnAlfa.x,
      targetY: spawnAlfa.y,
      vx: 0,
      vy: 0,
      radius: 6.8,
      speed: 1.09,
      patrolIndex: 0,
      patrolRoute: [],
      roamTimer: 1.5 + Math.random() * 3.0,
      state: 'patrol',
      suspicion: 0,
      lookAngle: Math.random() * Math.PI * 2,
      fovAngle: Math.PI * 0.35,
      fovDistance: 260,
      hearingRadiusWalk: 95,
      hearingRadiusSprint: 160,
      searchTimer: 0,
      alertText: '😴 Patrullando',
      color: '#8b5cf6',
    },
    // Alien 2: Beta (Magenta)
    {
      id: 'alien_beta',
      name: 'Alien Beta',
      x: spawnBeta.x,
      y: spawnBeta.y,
      targetX: spawnBeta.x,
      targetY: spawnBeta.y,
      vx: 0,
      vy: 0,
      radius: 6.8,
      speed: 1.12,
      patrolIndex: 0,
      patrolRoute: [],
      roamTimer: 2.0 + Math.random() * 3.0,
      state: 'patrol',
      suspicion: 0,
      lookAngle: Math.random() * Math.PI * 2,
      fovAngle: Math.PI * 0.35,
      fovDistance: 260,
      hearingRadiusWalk: 95,
      hearingRadiusSprint: 160,
      searchTimer: 0,
      alertText: '😴 Patrullando',
      color: '#ec4899',
    },
    // Alien 3: Gamma (Cyan)
    {
      id: 'alien_gamma',
      name: 'Alien Gamma',
      x: spawnGamma.x,
      y: spawnGamma.y,
      targetX: spawnGamma.x,
      targetY: spawnGamma.y,
      vx: 0,
      vy: 0,
      radius: 6.8,
      speed: 1.13,
      patrolIndex: 0,
      patrolRoute: [],
      roamTimer: 2.5 + Math.random() * 3.0,
      state: 'patrol',
      suspicion: 0,
      lookAngle: Math.random() * Math.PI * 2,
      fovAngle: Math.PI * 0.35,
      fovDistance: 260,
      hearingRadiusWalk: 95,
      hearingRadiusSprint: 160,
      searchTimer: 0,
      alertText: '😴 Patrullando',
      color: '#06b6d4',
    },
    // Alien 4: Delta (Orange)
    {
      id: 'alien_delta',
      name: 'Alien Delta',
      x: spawnDelta.x,
      y: spawnDelta.y,
      targetX: spawnDelta.x,
      targetY: spawnDelta.y,
      vx: 0,
      vy: 0,
      radius: 6.8,
      speed: 1.10,
      patrolIndex: 0,
      patrolRoute: [],
      roamTimer: 3.0 + Math.random() * 3.0,
      state: 'patrol',
      suspicion: 0,
      lookAngle: Math.random() * Math.PI * 2,
      fovAngle: Math.PI * 0.35,
      fovDistance: 260,
      hearingRadiusWalk: 95,
      hearingRadiusSprint: 160,
      searchTimer: 0,
      alertText: '😴 Patrullando',
      color: '#f97316',
    },
    // Alien 5: Epsilon (Emerald)
    {
      id: 'alien_epsilon',
      name: 'Alien Epsilon',
      x: spawnEpsilon.x,
      y: spawnEpsilon.y,
      targetX: spawnEpsilon.x,
      targetY: spawnEpsilon.y,
      vx: 0,
      vy: 0,
      radius: 6.8,
      speed: 1.11,
      patrolIndex: 0,
      patrolRoute: [],
      roamTimer: 3.5 + Math.random() * 3.0,
      state: 'patrol',
      suspicion: 0,
      lookAngle: Math.random() * Math.PI * 2,
      fovAngle: Math.PI * 0.35,
      fovDistance: 260,
      hearingRadiusWalk: 95,
      hearingRadiusSprint: 160,
      searchTimer: 0,
      alertText: '😴 Patrullando',
      color: '#10b981',
    },
    // Alien 6: Zeta (Lime)
    {
      id: 'alien_zeta',
      name: 'Alien Zeta',
      x: spawnZeta.x,
      y: spawnZeta.y,
      targetX: spawnZeta.x,
      targetY: spawnZeta.y,
      vx: 0,
      vy: 0,
      radius: 6.8,
      speed: 1.12,
      patrolIndex: 0,
      patrolRoute: [],
      roamTimer: 4.0 + Math.random() * 3.0,
      state: 'patrol',
      suspicion: 0,
      lookAngle: Math.random() * Math.PI * 2,
      fovAngle: Math.PI * 0.35,
      fovDistance: 260,
      hearingRadiusWalk: 95,
      hearingRadiusSprint: 160,
      searchTimer: 0,
      alertText: '😴 Patrullando',
      color: '#84cc16',
    },
    // Alien 7: Omega (Ruby)
    {
      id: 'alien_omega',
      name: 'Alien Omega',
      x: spawnOmega.x,
      y: spawnOmega.y,
      targetX: spawnOmega.x,
      targetY: spawnOmega.y,
      vx: 0,
      vy: 0,
      radius: 6.8,
      speed: 1.14,
      patrolIndex: 0,
      patrolRoute: [],
      roamTimer: 4.5 + Math.random() * 3.0,
      state: 'patrol',
      suspicion: 0,
      lookAngle: Math.random() * Math.PI * 2,
      fovAngle: Math.PI * 0.35,
      fovDistance: 260,
      hearingRadiusWalk: 95,
      hearingRadiusSprint: 160,
      searchTimer: 0,
      alertText: '😴 Patrullando',
      color: '#ef4444',
    },
    // Alien 8: Theta (Amber)
    {
      id: 'alien_theta',
      name: 'Alien Theta',
      x: spawnTheta.x,
      y: spawnTheta.y,
      targetX: spawnTheta.x,
      targetY: spawnTheta.y,
      vx: 0,
      vy: 0,
      radius: 6.8,
      speed: 1.12,
      patrolIndex: 0,
      patrolRoute: [],
      roamTimer: 5.0 + Math.random() * 3.0,
      state: 'patrol',
      suspicion: 0,
      lookAngle: Math.random() * Math.PI * 2,
      fovAngle: Math.PI * 0.35,
      fovDistance: 260,
      hearingRadiusWalk: 95,
      hearingRadiusSprint: 160,
      searchTimer: 0,
      alertText: '😴 Patrullando',
      color: '#f59e0b',
    },
  ];
}

interface AlienStuckTracker {
  lastX: number;
  lastY: number;
  stuckDuration: number;
  lastCheckTime: number;
}
const alienStuckData: Record<string, AlienStuckTracker> = {};
const lastAlertSoundPerAlien: Record<string, number> = {};

export function isPlayerInSafeRoom(player: PlayerState): boolean {
  const controlRoom = ROOMS.find((r) => r.id === 'control_center');
  if (!controlRoom) return false;
  return (
    player.x >= controlRoom.x &&
    player.x <= controlRoom.x + controlRoom.width &&
    player.y >= controlRoom.y &&
    player.y <= controlRoom.y + controlRoom.height
  );
}

/**
 * Funneling helper: When inside or near a corridor doorway, aligns the alien along the corridor's
 * longitudinal axis and gently pulls towards the corridor centerline to prevent doorframe clipping.
 */
function applyCorridorFunneling(
  alienX: number,
  alienY: number,
  moveDx: number,
  moveDy: number
): { moveDx: number; moveDy: number } {
  for (const c of CORRIDORS) {
    // Check if within the corridor or approaching within 25px
    const inCorrX = alienX >= c.x - 25 && alienX <= c.x + c.width + 25;
    const inCorrY = alienY >= c.y - 25 && alienY <= c.y + c.height + 25;

    if (inCorrX && inCorrY) {
      if (c.height > c.width) {
        // Vertical corridor: primary movement axis is Y
        const centerX = c.x + c.width / 2;
        const diffX = centerX - alienX;
        const centeringDx = Math.sign(diffX) * Math.min(Math.abs(diffX) * 0.1, 0.65);
        return {
          moveDx: moveDx * 0.3 + centeringDx,
          moveDy: moveDy,
        };
      } else {
        // Horizontal corridor: primary movement axis is X
        const centerY = c.y + c.height / 2;
        const diffY = centerY - alienY;
        const centeringDy = Math.sign(diffY) * Math.min(Math.abs(diffY) * 0.1, 0.65);
        return {
          moveDx: moveDx,
          moveDy: moveDy * 0.3 + centeringDy,
        };
      }
    }
  }
  return { moveDx, moveDy };
}

/**
 * Dynamic Local Avoidance with Proximity Repulsion Vectors:
 * Item 6: Proximity vectors that apply a gentle lateral force pushing the alien
 * towards the center of the aisle or corridor if it gets too close to walls or props.
 */
function computeProximityRepulsion(
  alienX: number,
  alienY: number,
  alienRadius: number,
  desiredDx: number,
  desiredDy: number,
  obstacles: Rect[]
): { moveDx: number; moveDy: number } {
  const currentSpeed = Math.hypot(desiredDx, desiredDy);
  if (currentSpeed < 0.02) {
    return { moveDx: desiredDx, moveDy: desiredDy };
  }

  // Proximity threshold: alien radius + 26px padding (around 33px)
  const threshold = alienRadius + 26;
  let repX = 0;
  let repY = 0;

  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    // Find closest point on obstacle AABB
    const nearX = Math.max(obs.x, Math.min(alienX, obs.x + obs.width));
    const nearY = Math.max(obs.y, Math.min(alienY, obs.y + obs.height));

    const dx = alienX - nearX;
    const dy = alienY - nearY;
    const distSq = dx * dx + dy * dy;

    if (distSq < threshold * threshold && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const ny = dy / dist;

      // Quadratic falloff: strongest when close, dropping to 0 at boundary
      const falloff = Math.pow(1 - dist / threshold, 2);
      repX += nx * falloff;
      repY += ny * falloff;
    }
  }

  // Corridor centerline guidance: pull towards midline when in corridor
  for (let i = 0; i < CORRIDORS.length; i++) {
    const c = CORRIDORS[i];
    if (
      alienX >= c.x - 20 &&
      alienX <= c.x + c.width + 20 &&
      alienY >= c.y - 20 &&
      alienY <= c.y + c.height + 20
    ) {
      if (c.height > c.width) {
        // Vertical corridor
        const midX = c.x + c.width / 2;
        const diffX = midX - alienX;
        repX += (diffX / (c.width / 2)) * 0.45;
      } else {
        // Horizontal corridor
        const midY = c.y + c.height / 2;
        const diffY = midY - alienY;
        repY += (diffY / (c.height / 2)) * 0.45;
      }
    }
  }

  const repMagnitude = Math.hypot(repX, repY);
  if (repMagnitude > 0.001) {
    const repWeight = Math.min(repMagnitude, 1.2) * 0.85;
    const normRepX = repX / repMagnitude;
    const normRepY = repY / repMagnitude;

    const blendedX = desiredDx + normRepX * repWeight;
    const blendedY = desiredDy + normRepY * repWeight;

    const blendedSpeed = Math.hypot(blendedX, blendedY);
    if (blendedSpeed > 0.001) {
      return {
        moveDx: (blendedX / blendedSpeed) * currentSpeed,
        moveDy: (blendedY / blendedSpeed) * currentSpeed,
      };
    }
  }

  return { moveDx: desiredDx, moveDy: desiredDy };
}

/**
 * Whisker / Feeler raycast steering to proactively guide aliens around wall corners
 */
function computeWhiskerAvoidance(
  alienX: number,
  alienY: number,
  desiredDx: number,
  desiredDy: number,
  obstacles: Rect[]
): { moveDx: number; moveDy: number } {
  const speed = Math.hypot(desiredDx, desiredDy);
  if (speed < 0.05) return { moveDx: desiredDx, moveDy: desiredDy };

  // 1. First apply corridor funneling
  const funneled = applyCorridorFunneling(alienX, alienY, desiredDx, desiredDy);
  let curDx = funneled.moveDx;
  let curDy = funneled.moveDy;

  const angle = Math.atan2(curDy, curDx);
  // Compact 18px feeler (approx 2x alien radius of 8.5) so side feelers don't scrape 140px corridor walls
  const feelerLength = 18;

  // Center feeler
  const cx = alienX + Math.cos(angle) * feelerLength;
  const cy = alienY + Math.sin(angle) * feelerLength;

  let centerBlocked = false;
  for (const obs of obstacles) {
    if (cx >= obs.x && cx <= obs.x + obs.width && cy >= obs.y && cy <= obs.y + obs.height) {
      centerBlocked = true;
      break;
    }
  }

  if (!centerBlocked) {
    return { moveDx: curDx, moveDy: curDy };
  }

  // Left and right feelers at narrow angle +/- 26 deg (0.45 rad)
  const angleLeft = angle + 0.45;
  const lx = alienX + Math.cos(angleLeft) * feelerLength;
  const ly = alienY + Math.sin(angleLeft) * feelerLength;
  let leftBlocked = false;
  for (const obs of obstacles) {
    if (lx >= obs.x && lx <= obs.x + obs.width && ly >= obs.y && ly <= obs.y + obs.height) {
      leftBlocked = true;
      break;
    }
  }

  const angleRight = angle - 0.45;
  const rx = alienX + Math.cos(angleRight) * feelerLength;
  const ry = alienY + Math.sin(angleRight) * feelerLength;
  let rightBlocked = false;
  for (const obs of obstacles) {
    if (rx >= obs.x && rx <= obs.x + obs.width && ry >= obs.y && ry <= obs.y + obs.height) {
      rightBlocked = true;
      break;
    }
  }

  let steerAngle = angle;
  if (!leftBlocked && rightBlocked) {
    steerAngle = angleLeft;
  } else if (!rightBlocked && leftBlocked) {
    steerAngle = angleRight;
  } else if (!leftBlocked) {
    steerAngle = angleLeft;
  } else if (!rightBlocked) {
    steerAngle = angleRight;
  } else {
    // Both narrow feelers blocked - test moderate angles (+/- 65 deg) rather than hard 90 into corridor walls
    const checkAngle = (testA: number) => {
      const tx = alienX + Math.cos(testA) * feelerLength;
      const ty = alienY + Math.sin(testA) * feelerLength;
      for (const obs of obstacles) {
        if (tx >= obs.x && tx <= obs.x + obs.width && ty >= obs.y && ty <= obs.y + obs.height) return false;
      }
      return true;
    };

    if (checkAngle(angle + 1.1)) {
      steerAngle = angle + 1.1;
    } else if (checkAngle(angle - 1.1)) {
      steerAngle = angle - 1.1;
    } else {
      // If blocked directly in front, maintain vector so continuous border sliding can seamlessly glide around the obstacle
      return { moveDx: curDx, moveDy: curDy };
    }
  }

  return {
    moveDx: Math.cos(steerAngle) * speed,
    moveDy: Math.sin(steerAngle) * speed,
  };
}

export function updateSingleAlien(
  alien: AlienEntity,
  player: PlayerState,
  obstacles: Rect[],
  dt: number,
  controlCenterShieldActive: boolean = true,
  otherAliens?: AlienEntity[]
): { alien: AlienEntity; caught: boolean } {
  const updated = { ...alien };
  let caught = false;

  const patrolSpeed = updated.speed;
  // High-tension chase speed: 10% reduced speed (2.20 vs previous 2.45)
  const chaseSpeed = 2.20;

  const now = Date.now();
  if (!lastAlertSoundPerAlien[updated.id]) {
    lastAlertSoundPerAlien[updated.id] = 0;
  }
  if (!alienStuckData[updated.id]) {
    alienStuckData[updated.id] = {
      lastX: updated.x,
      lastY: updated.y,
      stuckDuration: 0,
      lastCheckTime: now,
    };
  }

  // Safe Room Protection only applies while the security shield is active!
  // Once the player exits the room for the first time, shield drops and aliens can enter!
  const inSafeRoom = controlCenterShieldActive && isPlayerInSafeRoom(player);
  const distToPlayer = getDistance(updated.x, updated.y, player.x, player.y);
  let playerInVisualSight = false;
  let playerHeardBehind = false;

  if (!inSafeRoom) {
    // 1. VISUAL DETECTION
    // When flashlight is OFF, player is shrouded in darkness: visual detection distance is halved
    const effectiveFovDistance = player.flashlightOn
      ? updated.fovDistance
      : Math.min(135, updated.fovDistance * 0.55);

    if (!player.isHidden && distToPlayer < effectiveFovDistance) {
      const angleToPlayer = Math.atan2(player.y - updated.y, player.x - updated.x);
      let diff = angleToPlayer - updated.lookAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      if (Math.abs(diff) < updated.fovAngle / 2) {
        if (hasLineOfSight(updated.x, updated.y, player.x, player.y, obstacles)) {
          playerInVisualSight = true;
        }
      }
    }

    // 2. PROXIMITY NOISE DETECTION
    if (!player.isHidden && !playerInVisualSight) {
      const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;
      if (isMoving) {
        const hearingRadius = player.isSprinting
          ? updated.hearingRadiusSprint
          : updated.hearingRadiusWalk;

        if (distToPlayer < hearingRadius) {
          playerHeardBehind = true;
        }
      }
    }
  }

  // 3. DETECTION STATE LOGIC
  if (playerInVisualSight) {
    updated.suspicion = Math.min(100, updated.suspicion + 260 * (dt / 1000));
    updated.lookAngle = Math.atan2(player.y - updated.y, player.x - updated.x);
    updated.targetX = player.x;
    updated.targetY = player.y;

    if (updated.suspicion > 25) {
      if (updated.state !== 'chase') {
        updated.state = 'chase';
        updated.alertText = '🚨 ¡TE VIO! ¡CORRE!';
        if (now - lastAlertSoundPerAlien[updated.id] > 2000) {
          soundManager.playAlert(true);
          lastAlertSoundPerAlien[updated.id] = now;
        }
      }
    } else {
      updated.state = 'suspicious';
      updated.alertText = '❓ ¡Te divisó!';
    }
  } else if (playerHeardBehind && updated.state !== 'chase') {
    updated.state = 'suspicious';
    updated.alertText = player.isSprinting ? '❓ ¿¡PASOS CORRIENDO!?' : '❓ ¿Qué fue ese ruido?';
    updated.suspicion = Math.min(40, updated.suspicion + 18 * (dt / 1000));

    const targetAngle = Math.atan2(player.y - updated.y, player.x - updated.x);
    let angleDiff = targetAngle - updated.lookAngle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

    const turnSpeed = 0.05 * (dt / 16);
    if (Math.abs(angleDiff) > turnSpeed) {
      updated.lookAngle += Math.sign(angleDiff) * turnSpeed;
    } else {
      updated.lookAngle = targetAngle;
    }

    if (now - lastAlertSoundPerAlien[updated.id] > 3000) {
      soundManager.playAlert(false);
      lastAlertSoundPerAlien[updated.id] = now;
    }
  } else {
    // Player lost from direct sight or heard sound
    if (updated.state === 'chase' || updated.state === 'suspicious') {
      updated.state = 'search';
      updated.searchTimer = 3.0;
      updated.alertText = inSafeRoom
        ? '🔒 ¡Entró a Zona Segura!'
        : player.isHidden
        ? '🔍 ¿Dónde se escondió?'
        : '🔍 Buscando intruso...';
    }

    if (updated.state === 'search') {
      updated.searchTimer -= dt / 1000;
      updated.lookAngle += Math.sin(now * 0.005) * 0.06;
      updated.suspicion = Math.max(0, updated.suspicion - 25 * (dt / 1000));

      if (updated.searchTimer <= 0) {
        updated.state = 'patrol';
        updated.suspicion = 0;
        updated.alertText = '😴 Patrullando';
      }
    } else if (updated.state === 'patrol') {
      updated.suspicion = Math.max(0, updated.suspicion - 35 * (dt / 1000));
      updated.alertText = '😴 Patrullando';
    }
  }

  // 4. SMART PATHFINDING AND CORNER UNSTICKING
  let moveDx = 0;
  let moveDy = 0;

  if (updated.state === 'chase') {
    let targetX = updated.targetX;
    let targetY = updated.targetY;

    // Path Padding: Test clearance radius rather than single ray line of sight
    if (!hasClearPathWithClearance(updated.x, updated.y, updated.targetX, updated.targetY, obstacles, 18)) {
      const navTarget = findBestNavWaypoint(
        updated.x,
        updated.y,
        updated.targetX,
        updated.targetY,
        obstacles,
        controlCenterShieldActive
      );
      targetX = navTarget.x;
      targetY = navTarget.y;
    }

    const dx = targetX - updated.x;
    const dy = targetY - updated.y;
    const dist = Math.hypot(dx, dy);

    // Rule 1: Aliens move relentlessly towards target without halting early
    if (dist > 0.1) {
      moveDx = (dx / dist) * chaseSpeed;
      moveDy = (dy / dist) * chaseSpeed;
      updated.lookAngle = Math.atan2(dy, dx);
    }
  } else if (updated.state === 'search') {
    const dx = updated.targetX - updated.x;
    const dy = updated.targetY - updated.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 35) {
      let steerX = updated.targetX;
      let steerY = updated.targetY;
      if (!hasClearPathWithClearance(updated.x, updated.y, steerX, steerY, obstacles, 18)) {
        const node = findBestNavWaypoint(
          updated.x,
          updated.y,
          steerX,
          steerY,
          obstacles,
          controlCenterShieldActive
        );
        steerX = node.x;
        steerY = node.y;
      }
      const sdx = steerX - updated.x;
      const sdy = steerY - updated.y;
      const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
      if (sdist > 5) {
        moveDx = (sdx / sdist) * (patrolSpeed * 0.8);
        moveDy = (sdy / sdist) * (patrolSpeed * 0.8);
        updated.lookAngle = Math.atan2(sdy, sdx);
      }
    }
  } else if (updated.state === 'suspicious') {
    let steerX = updated.targetX;
    let steerY = updated.targetY;

    if (!hasClearPathWithClearance(updated.x, updated.y, steerX, steerY, obstacles, 18)) {
      const node = findBestNavWaypoint(
        updated.x,
        updated.y,
        steerX,
        steerY,
        obstacles,
        controlCenterShieldActive
      );
      steerX = node.x;
      steerY = node.y;
    }

    const dx = steerX - updated.x;
    const dy = steerY - updated.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 15) {
      moveDx = (dx / dist) * (patrolSpeed * 0.55);
      moveDy = (dy / dist) * (patrolSpeed * 0.55);
      updated.lookAngle = Math.atan2(dy, dx);
    }
  } else if (updated.state === 'patrol') {
    // Item 4: IA de Patrullaje Libre (Roaming)
    // Periodic random roaming across the entire ship map
    if (updated.roamTimer === undefined) {
      updated.roamTimer = 3 + Math.random() * 8;
    }
    updated.roamTimer -= dt / 1000;

    const distToTarget = getDistance(updated.x, updated.y, updated.targetX, updated.targetY);
    const needsNewTarget =
      distToTarget < 45 ||
      updated.roamTimer <= 0 ||
      (updated.targetX === 0 && updated.targetY === 0);

    if (needsNewTarget) {
      const newTarget = getRandomRoamingTarget(
        obstacles,
        controlCenterShieldActive,
        updated.x,
        updated.y,
        otherAliens,
        updated.id
      );
      updated.targetX = newTarget.x;
      updated.targetY = newTarget.y;
      updated.roamTimer = 10 + Math.random() * 10;
      if (alienStuckData[updated.id]) {
        alienStuckData[updated.id].stuckDuration = 0;
      }
    }

    // Item 5 & 6: Path Padding & NavMesh Routing to roaming target
    let steerTargetX = updated.targetX;
    let steerTargetY = updated.targetY;

    if (!hasClearPathWithClearance(updated.x, updated.y, updated.targetX, updated.targetY, obstacles, 20)) {
      const navWaypoint = findBestNavWaypoint(
        updated.x,
        updated.y,
        updated.targetX,
        updated.targetY,
        obstacles,
        controlCenterShieldActive
      );
      steerTargetX = navWaypoint.x;
      steerTargetY = navWaypoint.y;
    }

    const dx = steerTargetX - updated.x;
    const dy = steerTargetY - updated.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 4) {
      moveDx = (dx / dist) * patrolSpeed;
      moveDy = (dy / dist) * patrolSpeed;
      updated.lookAngle = Math.atan2(dy, dx);
    }
  }

  // 5. PROACTIVE REPULSION FORCES, WHISKER AVOIDANCE & WALL SLIDING
  let nextX = updated.x;
  let nextY = updated.y;

  if (moveDx !== 0 || moveDy !== 0) {
    // 4. Separación de Aliens (Anti-cruces): Steering behavior exclusively between enemies
    // Repel smoothly so aliens never overlap or cross paths
    if (otherAliens && otherAliens.length > 0) {
      let sepDx = 0;
      let sepDy = 0;
      for (const other of otherAliens) {
        if (other.id === updated.id) continue;
        const odx = updated.x - other.x;
        const ody = updated.y - other.y;
        const odist = Math.hypot(odx, ody);
        const feelerRange = updated.radius + other.radius + 14;
        if (odist < feelerRange && odist > 0.001) {
          const force = ((feelerRange - odist) / feelerRange) * 0.9;
          sepDx += (odx / odist) * force;
          sepDy += (ody / odist) * force;
        }
      }

      if (sepDx !== 0 || sepDy !== 0) {
        if (updated.state === 'chase') {
          // Keep chasing the player without overlapping with other chasing aliens
          moveDx += sepDx * 0.35;
          moveDy += sepDy * 0.35;
        } else {
          moveDx += sepDx;
          moveDy += sepDy;
        }
      }
    }

    // 2. Reducción del 10% en el radio de colisión físico (hitbox) del alien
    // EXCLUSIVAMENTE para sus colisiones contra el entorno y props
    const alienEnvRadius = updated.radius * 0.90;

    // 5A. Dynamic Proximity Repulsion Vectors
    // Pushes gently away from walls and props to keep the alien centered in the aisle/corridor
    const repelled = computeProximityRepulsion(
      updated.x,
      updated.y,
      alienEnvRadius,
      moveDx,
      moveDy,
      obstacles
    );
    moveDx = repelled.moveDx;
    moveDy = repelled.moveDy;

    // 5B. Proactive whisker adjustment to steer around wall corners
    const guided = computeWhiskerAvoidance(updated.x, updated.y, moveDx, moveDy, obstacles);
    moveDx = guided.moveDx;
    moveDy = guided.moveDy;

    // 5C. Small Feet Bounding Circle with continuous edge-sliding around props and walls
    const resolved = resolveMovement(
      updated.x,
      updated.y,
      moveDx,
      moveDy,
      alienEnvRadius,
      obstacles,
      false,
      true, // isAlien
      controlCenterShieldActive,
      updated.targetX,
      updated.targetY
    );

    nextX = resolved.newX;
    nextY = resolved.newY;
  }

  // 2. Sistema Anti-Atasco (Unstuck Fallback) para Aliens:
  // Si las coordenadas (X, Y) de un alienígena en movimiento no cambian significativamente
  // durante 1 segundo (lo que indica que está atorado contra un objeto), aborta inmediatamente su ruta actual.
  // Aplícale una fuerza instantánea en reversa para despegarlo del obstáculo
  // y oblígalo a calcular una nueva ruta hacia un destino diferente.
  if (!alienStuckData[updated.id]) {
    alienStuckData[updated.id] = {
      lastX: updated.x,
      lastY: updated.y,
      stuckDuration: 0,
      lastCheckTime: now,
    };
  }
  const stuckInfo = alienStuckData[updated.id];
  const dtSec = dt / 1000;
  const distSinceLastCheck = getDistance(nextX, nextY, stuckInfo.lastX, stuckInfo.lastY);

  const hasMoveIntent =
    Math.hypot(moveDx, moveDy) > 0.04 ||
    updated.state === 'chase' ||
    updated.state === 'search' ||
    updated.state === 'patrol';

  if (hasMoveIntent && distSinceLastCheck < 4.0) {
    stuckInfo.stuckDuration += dtSec;
  } else {
    if (distSinceLastCheck >= 5.0) {
      stuckInfo.lastX = nextX;
      stuckInfo.lastY = nextY;
      stuckInfo.stuckDuration = Math.max(0, stuckInfo.stuckDuration - dtSec * 2.0);
    }
  }

  // Rutina de escape de emergencia (Unstuck Fallback) activada exactamente al alcanzar 1 segundo:
  if (stuckInfo.stuckDuration >= 1.0) {
    const alienEnvRadius = updated.radius * 0.90;

    // 1. Abortar inmediatamente su ruta actual
    updated.targetX = 0;
    updated.targetY = 0;
    updated.patrolRoute = [];

    // 2. Aplicar una fuerza instantánea en reversa para despegarlo del obstáculo
    let revAngle = updated.lookAngle + Math.PI;
    if (Math.hypot(moveDx, moveDy) > 0.01) {
      revAngle = Math.atan2(-moveDy, -moveDx);
    }
    const reverseImpulseDist = 20;
    const revNudge = resolveMovement(
      nextX,
      nextY,
      Math.cos(revAngle) * reverseImpulseDist,
      Math.sin(revAngle) * reverseImpulseDist,
      alienEnvRadius,
      obstacles,
      false,
      true,
      controlCenterShieldActive
    );
    nextX = revNudge.newX;
    nextY = revNudge.newY;

    // 3. Obligarlo a calcular una nueva ruta hacia un destino diferente (con conciencia espacial)
    const newTarget = getRandomRoamingTarget(
      obstacles,
      controlCenterShieldActive,
      nextX,
      nextY,
      otherAliens,
      updated.id
    );
    updated.targetX = newTarget.x;
    updated.targetY = newTarget.y;
    updated.roamTimer = 10 + Math.random() * 8;
    updated.lookAngle = Math.atan2(newTarget.y - nextY, newTarget.x - nextX);

    stuckInfo.stuckDuration = 0;
    stuckInfo.lastX = nextX;
    stuckInfo.lastY = nextY;
  }

  if (moveDx !== 0 || moveDy !== 0) {
    updated.x = nextX;
    updated.y = nextY;
    updated.vx = nextX - alien.x;
    updated.vy = nextY - alien.y;
  } else {
    updated.vx = 0;
    updated.vy = 0;
  }

  // 1. Restaurar Mortalidad (Colisión Jugador-Alien)
  // Constant check regardless of alien state (chase, patrol, search, suspicious, roam):
  const finalDistToPlayer = getDistance(updated.x, updated.y, player.x, player.y);
  if (!inSafeRoom && !player.isHidden && finalDistToPlayer <= updated.radius + player.radius) {
    caught = true;
    soundManager.playCaught();
  }

  return { alien: updated, caught };
}

/**
 * 4. Separación de Aliens (Anti-cruces):
 * Los aliens deben patrullar libremente por todo el mapa, pero NUNCA cruzarse ni empalmarse entre sí.
 * Implementa una fuerza de separación (steering behavior) EXCLUSIVAMENTE entre enemigos:
 * si los Bounding Circles de dos aliens se tocan, deben repelerse suavemente en direcciones opuestas
 * para que cada uno tome su propio camino, sin afectar su cacería del jugador.
 */
function resolveInterAlienCollisions(
  aliens: AlienEntity[],
  obstacles: Rect[],
  controlCenterShieldActive: boolean
): AlienEntity[] {
  const result = aliens.map((a) => ({ ...a }));
  const n = result.length;

  // 2 passes of soft separation & depenetration so chains of aliens resolve cleanly
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a1 = result[i];
        const a2 = result[j];

        const dx = a2.x - a1.x;
        const dy = a2.y - a1.y;
        let dist = Math.hypot(dx, dy);

        // Required minimal distance: Bounding Circles contact distance + safety buffer
        const minDistance = a1.radius + a2.radius + 6.0;

        if (dist < minDistance) {
          let nx = 0;
          let ny = 0;
          if (dist > 0.001) {
            nx = dx / dist;
            ny = dy / dist;
          } else {
            // Fallback for identical coordinates
            const angle = ((i + j) * 1.35) % (Math.PI * 2);
            nx = Math.cos(angle);
            ny = Math.sin(angle);
            dist = 0.001;
          }

          // Gentle steering repulsion in opposite directions
          const overlap = minDistance - dist;
          const pushAmount = overlap * 0.52;

          // Repulsion vectors in strictly opposite directions along normal
          const move1X = -nx * pushAmount;
          const move1Y = -ny * pushAmount;
          const move2X = nx * pushAmount;
          const move2Y = ny * pushAmount;

          // Resolve against walls and props with 10% reduced env hitbox
          const test1 = resolveMovement(
            a1.x,
            a1.y,
            move1X,
            move1Y,
            a1.radius * 0.90,
            obstacles,
            false,
            true,
            controlCenterShieldActive
          );
          a1.x = test1.newX;
          a1.y = test1.newY;

          const test2 = resolveMovement(
            a2.x,
            a2.y,
            move2X,
            move2Y,
            a2.radius * 0.90,
            obstacles,
            false,
            true,
            controlCenterShieldActive
          );
          a2.x = test2.newX;
          a2.y = test2.newY;

          // Redirect paths for non-chasing aliens so each one takes its own distinct path
          // (Chasing aliens remain in chase towards the player without disruption)
          if (a1.state !== 'chase' && a2.state !== 'chase') {
            a1.lookAngle = Math.atan2(-ny, -nx);
            a2.lookAngle = Math.atan2(ny, nx);

            if (dist < a1.radius + a2.radius + 3) {
              const newTarget1 = getRandomRoamingTarget(
                obstacles,
                controlCenterShieldActive,
                a1.x,
                a1.y,
                result,
                a1.id
              );
              a1.targetX = newTarget1.x;
              a1.targetY = newTarget1.y;
              a1.roamTimer = 6 + Math.random() * 8;

              const newTarget2 = getRandomRoamingTarget(
                obstacles,
                controlCenterShieldActive,
                a2.x,
                a2.y,
                result,
                a2.id
              );
              a2.targetX = newTarget2.x;
              a2.targetY = newTarget2.y;
              a2.roamTimer = 6 + Math.random() * 8;
            }
          }
        }
      }
    }
  }

  return result;
}

export function updateAllAliens(
  aliens: AlienEntity[],
  player: PlayerState,
  obstacles: Rect[],
  dt: number,
  controlCenterShieldActive: boolean = true
): { aliens: AlienEntity[]; caught: boolean } {
  let anyCaught = false;
  const inSafeRoom = controlCenterShieldActive && isPlayerInSafeRoom(player);

  const updatedAliens = aliens.map((a) => {
    const res = updateSingleAlien(a, player, obstacles, dt, controlCenterShieldActive, aliens);
    if (res.caught) anyCaught = true;
    return res.alien;
  });

  // 4. Separación de Aliens (Anti-cruces)
  const separatedAliens = resolveInterAlienCollisions(
    updatedAliens,
    obstacles,
    controlCenterShieldActive
  );

  // 1. Restaurar Mortalidad: verificar colisión post-separación con el jugador
  if (!inSafeRoom && !player.isHidden) {
    for (const a of separatedAliens) {
      const d = Math.hypot(a.x - player.x, a.y - player.y);
      if (d <= a.radius + player.radius) {
        anyCaught = true;
        soundManager.playCaught();
        break;
      }
    }
  }

  return { aliens: separatedAliens, caught: anyCaught };
}

/**
 * Attracts the closest alien to the player's position when a mission action occurs
 */
export function alertNearestAlienToPosition(
  aliens: AlienEntity[],
  targetX: number,
  targetY: number,
  controlCenterShieldActive: boolean = true
): AlienEntity[] {
  let closestAlien: AlienEntity | null = null;
  let minDistance = Infinity;

  for (const alien of aliens) {
    if (alien.state === 'chase') continue;
    const d = getDistance(alien.x, alien.y, targetX, targetY);
    if (d < minDistance) {
      minDistance = d;
      closestAlien = alien;
    }
  }

  if (!closestAlien) return aliens;

  return aliens.map((a) => {
    if (a.id === closestAlien!.id) {
      return {
        ...a,
        state: 'suspicious',
        suspicion: 40,
        targetX,
        targetY,
        lookAngle: Math.atan2(targetY - a.y, targetX - a.x),
        alertText: '❓ ¡Ruido de Misión!',
      };
    }
    return a;
  });
}
