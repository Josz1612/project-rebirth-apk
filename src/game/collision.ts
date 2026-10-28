import { GameProp } from '../types/game';
import { WALLS, Wall, ROOMS, CORRIDORS } from './mapData';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Checks if a circle intersects an axis-aligned bounding box (AABB)
 */
export function circleIntersectsRect(circle: Circle, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;

  const distanceSquared = distanceX * distanceX + distanceY * distanceY;
  return distanceSquared < circle.radius * circle.radius;
}

// Doorway Barrier Rects for Centro de Control while force field is active
export const CONTROL_CENTER_SHIELD_BARRIERS: Rect[] = [
  { x: 1320, y: 1010, width: 160, height: 40 }, // North Doorway
  { x: 1320, y: 1790, width: 160, height: 40 }, // South Doorway
  { x: 1010, y: 1350, width: 40, height: 160 }, // West Doorway
  { x: 1740, y: 1350, width: 40, height: 160 }, // East Doorway
];

/**
 * Returns all solid collision boxes (walls + solid props + optional control shield)
 */
export function getAllObstacles(
  props: GameProp[],
  podDoorUnlocked: boolean = false,
  controlCenterShieldActive: boolean = false,
  isAlien: boolean = false
): Rect[] {
  const rects: Rect[] = [];

  // Add walls (skip escape pod door if unlocked)
  for (const w of WALLS) {
    if (w.type === 'pod_door' && podDoorUnlocked) {
      continue;
    }
    rects.push({
      x: w.x,
      y: w.y,
      width: w.width,
      height: w.height,
    });
  }

  // If shield is active and obstacle list is for aliens, add the 4 doorway barriers
  if (controlCenterShieldActive && isAlien) {
    for (const barrier of CONTROL_CENTER_SHIELD_BARRIERS) {
      rects.push(barrier);
    }
  }

  // Add solid props (exclude wires_panel / corner cables so they never block passage)
  for (const p of props) {
    if (p.isObstacle && p.type !== 'wires_panel') {
      rects.push({
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
      });
    }
  }

  return rects;
}

/**
 * Checks if a position is safely inside valid ship deck space (any room or corridor)
 */
export function isInsideShipDeck(x: number, y: number, podDoorUnlocked: boolean = false): boolean {
  // Check 12 rooms
  for (const r of ROOMS) {
    if (r.id === 'escape_pod' && !podDoorUnlocked) {
      continue;
    }
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
      return true;
    }
  }

  // Check corridors
  for (const c of CORRIDORS) {
    if (x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a position is valid for an alien to step onto:
 * - Must be inside valid ship deck
 * - CANNOT be inside Centro de Control IF controlCenterShieldActive is true!
 * - When controlCenterShieldActive is false, aliens CAN enter Centro de Control!
 * - CANNOT be inside Escape Pod
 */
export function isInsideAlienAllowedDeck(
  x: number,
  y: number,
  controlCenterShieldActive: boolean = true
): boolean {
  // If shield is active, disallow Centro de Control
  if (controlCenterShieldActive) {
    const controlRoom = ROOMS.find((r) => r.id === 'control_center');
    if (controlRoom) {
      if (
        x >= controlRoom.x &&
        x <= controlRoom.x + controlRoom.width &&
        y >= controlRoom.y &&
        y <= controlRoom.y + controlRoom.height
      ) {
        return false;
      }
    }
  }

  // Disallow Escape Pod
  const escapeRoom = ROOMS.find((r) => r.id === 'escape_pod');
  if (escapeRoom) {
    if (
      x >= escapeRoom.x &&
      x <= escapeRoom.x + escapeRoom.width &&
      y >= escapeRoom.y &&
      y <= escapeRoom.y + escapeRoom.height
    ) {
      return false;
    }
  }

  // Must be inside other valid ship deck space
  return isInsideShipDeck(x, y, false);
}

/**
 * Checks if a coordinate is inside or close to any ship corridor or doorway
 */
export function isInOrNearCorridor(x: number, y: number, padding: number = 32): boolean {
  for (const c of CORRIDORS) {
    if (
      x >= c.x - padding &&
      x <= c.x + c.width + padding &&
      y >= c.y - padding &&
      y <= c.y + c.height + padding
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Resolves movement for enemy AI using a small Bounding Circle anchored at the base/feet.
 * Implements continuous border sliding along rectangular collision boxes (walls and props like reactors),
 * allowing the enemy to smoothly glide along surfaces and round corners without halting.
 */
export function resolveAlienCircleSlide(
  currentX: number,
  currentY: number,
  deltaX: number,
  deltaY: number,
  obstacles: Rect[],
  controlCenterShieldActive: boolean = true,
  targetX?: number,
  targetY?: number
): { newX: number; newY: number; hitX: boolean; hitY: boolean } {
  // Bounding Circle muy pequeño anclado a la base / pies
  const ALIEN_FEET_RADIUS = 3.6;
  const FEET_OFFSET_Y = 2.0;

  let hitX = false;
  let hitY = false;

  let posX = currentX;
  let posY = currentY + FEET_OFFSET_Y;

  let remVx = deltaX;
  let remVy = deltaY;
  const totalSpeed = Math.hypot(deltaX, deltaY);

  if (totalSpeed < 0.0001) {
    return { newX: currentX, newY: currentY, hitX: false, hitY: false };
  }

  // Iterative continuous collision & border sliding (up to 3 passes to smoothly navigate multi-corner obstacles)
  for (let iter = 0; iter < 3; iter++) {
    const remSpeed = Math.hypot(remVx, remVy);
    if (remSpeed < 0.001) break;

    const candX = posX + remVx;
    const candY = posY + remVy;

    let deepestPen = 0;
    let bestNormalX = 0;
    let bestNormalY = 0;
    let hasCollision = false;

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];

      // Closest point on obstacle bounding box to candidate circle center
      const nearX = Math.max(obs.x, Math.min(candX, obs.x + obs.width));
      const nearY = Math.max(obs.y, Math.min(candY, obs.y + obs.height));

      const diffX = candX - nearX;
      const diffY = candY - nearY;
      const distSq = diffX * diffX + diffY * diffY;

      if (distSq < ALIEN_FEET_RADIUS * ALIEN_FEET_RADIUS) {
        hasCollision = true;
        const dist = Math.sqrt(distSq);

        let nx = 0;
        let ny = 0;
        let pen = 0;

        if (dist > 0.0001) {
          nx = diffX / dist;
          ny = diffY / dist;
          pen = ALIEN_FEET_RADIUS - dist;
        } else {
          // Circle center penetrated inside obstacle box: push outward towards closest edge
          const dLeft = candX - obs.x;
          const dRight = obs.x + obs.width - candX;
          const dTop = candY - obs.y;
          const dBottom = obs.y + obs.height - candY;

          const minEdge = Math.min(dLeft, dRight, dTop, dBottom);
          pen = minEdge + ALIEN_FEET_RADIUS;

          if (minEdge === dLeft) {
            nx = -1;
            ny = 0;
          } else if (minEdge === dRight) {
            nx = 1;
            ny = 0;
          } else if (minEdge === dTop) {
            nx = 0;
            ny = -1;
          } else {
            nx = 0;
            ny = 1;
          }
        }

        if (pen > deepestPen) {
          deepestPen = pen;
          bestNormalX = nx;
          bestNormalY = ny;
        }
      }
    }

    if (!hasCollision) {
      posX = candX;
      posY = candY;
      break;
    }

    if (Math.abs(bestNormalX) > 0.25) hitX = true;
    if (Math.abs(bestNormalY) > 0.25) hitY = true;

    // 1. Depenetrate: eject the circle to the exact boundary of the obstacle
    posX = candX + bestNormalX * (deepestPen + 0.06);
    posY = candY + bestNormalY * (deepestPen + 0.06);

    // 2. Project remaining velocity onto the surface tangent: cancels perpendicular force
    const dot = remVx * bestNormalX + remVy * bestNormalY;
    let tangentVx = remVx;
    let tangentVy = remVy;

    if (dot < 0) {
      tangentVx = remVx - dot * bestNormalX;
      tangentVy = remVy - dot * bestNormalY;
    }

    // 3. Smooth sliding deflection for steep / head-on collisions with walls and props (reactors, etc.):
    // If the tangential speed drops significantly, guide the alien smoothly along the edge
    const tangentSpeed = Math.hypot(tangentVx, tangentVy);
    if (tangentSpeed < remSpeed * 0.45) {
      // Orthogonal tangents along the obstacle edge
      const t1x = -bestNormalY;
      const t1y = bestNormalX;
      const t2x = bestNormalY;
      const t2y = -bestNormalX;

      let chooseT1 = true;
      if (targetX !== undefined && targetY !== undefined) {
        const goalDirX = targetX - posX;
        const goalDirY = targetY - posY;
        chooseT1 = goalDirX * t1x + goalDirY * t1y >= goalDirX * t2x + goalDirY * t2y;
      } else {
        chooseT1 = deltaX * t1x + deltaY * t1y >= deltaX * t2x + deltaY * t2y;
      }

      const tx = chooseT1 ? t1x : t2x;
      const ty = chooseT1 ? t1y : t2y;
      const slideSpeed = Math.max(tangentSpeed, remSpeed * 0.95);

      tangentVx = tx * slideSpeed;
      tangentVy = ty * slideSpeed;
    }

    // Prepare velocity for subsequent slide pass
    remVx = tangentVx * 0.85;
    remVy = tangentVy * 0.85;
  }

  let finalX = posX;
  let finalY = posY - FEET_OFFSET_Y;

  // Containment check for ship deck boundaries
  if (!isInsideAlienAllowedDeck(finalX, finalY, controlCenterShieldActive)) {
    if (isInsideAlienAllowedDeck(finalX, currentY, controlCenterShieldActive)) {
      finalY = currentY;
      hitY = true;
    } else if (isInsideAlienAllowedDeck(currentX, finalY, controlCenterShieldActive)) {
      finalX = currentX;
      hitX = true;
    } else {
      finalX = currentX;
      finalY = currentY;
      hitX = true;
      hitY = true;
    }
  }

  return { newX: finalX, newY: finalY, hitX, hitY };
}

/**
 * Resolves movement with corner-sliding assistance and deck containment.
 */
export function resolveMovement(
  currentX: number,
  currentY: number,
  deltaX: number,
  deltaY: number,
  radius: number,
  obstacles: Rect[],
  podDoorUnlocked: boolean = false,
  isAlien: boolean = false,
  controlCenterShieldActive: boolean = true,
  targetX?: number,
  targetY?: number
): { newX: number; newY: number; hitX: boolean; hitY: boolean } {
  // If entity is an enemy/alien, resolve using small feet Bounding Circle and continuous edge-sliding
  if (isAlien) {
    return resolveAlienCircleSlide(
      currentX,
      currentY,
      deltaX,
      deltaY,
      obstacles,
      controlCenterShieldActive,
      targetX,
      targetY
    );
  }

  let hitX = false;
  let hitY = false;

  const effectiveRadius = radius;

  // Step 1: Try moving X
  let newX = currentX + deltaX;

  // Collision with obstacles along X
  for (let pass = 0; pass < 2; pass++) {
    const circleX: Circle = { x: newX, y: currentY, radius: effectiveRadius };
    for (const obs of obstacles) {
      if (circleIntersectsRect(circleX, obs)) {
        hitX = true;
        if (deltaX > 0) {
          newX = Math.min(newX, obs.x - effectiveRadius - 0.1);
        } else if (deltaX < 0) {
          newX = Math.max(newX, obs.x + obs.width + effectiveRadius + 0.1);
        }
      }
    }
  }

  // Airtight ship deck boundary check along X
  if (isAlien) {
    if (!isInsideAlienAllowedDeck(newX, currentY, controlCenterShieldActive)) {
      newX = currentX;
      hitX = true;
    }
  } else {
    if (!isInsideShipDeck(newX, currentY, podDoorUnlocked)) {
      newX = currentX;
      hitX = true;
    }
  }

  // Step 2: Try moving Y from the updated newX (enables classic frictionless wall sliding)
  let newY = currentY + deltaY;

  for (let pass = 0; pass < 2; pass++) {
    const circleY: Circle = { x: newX, y: newY, radius: effectiveRadius };
    for (const obs of obstacles) {
      if (circleIntersectsRect(circleY, obs)) {
        hitY = true;
        if (deltaY > 0) {
          newY = Math.min(newY, obs.y - effectiveRadius - 0.1);
        } else if (deltaY < 0) {
          newY = Math.max(newY, obs.y + obs.height + effectiveRadius + 0.1);
        }
      }
    }
  }

  // Airtight ship deck boundary check along Y
  if (isAlien) {
    if (!isInsideAlienAllowedDeck(newX, newY, controlCenterShieldActive)) {
      newY = currentY;
      hitY = true;
    }
  } else {
    if (!isInsideShipDeck(newX, newY, podDoorUnlocked)) {
      newY = currentY;
      hitY = true;
    }
  }

  // 3B. Wall-Sliding (Deslizamiento):
  // Si el vector de movimiento de un alien choca contra una pared, no detengas su velocidad a cero;
  // anula solo la fuerza perpendicular para que el alien "resbale" por la pared hacia la puerta.
  if (isAlien) {
    if (hitX && Math.abs(deltaY) < 0.25) {
      // Choque contra pared vertical: proyectar fuerza tangencial Y hacia apertura/pasillo más cercano
      let targetDirY = 0;
      for (const c of CORRIDORS) {
        if (Math.abs(currentX - (c.x + c.width / 2)) < c.width / 2 + 50) {
          targetDirY = Math.sign(c.y + c.height / 2 - currentY);
          break;
        }
      }
      if (targetDirY === 0) {
        targetDirY = currentY < 1400 ? 1 : -1;
      }
      const slideDist = Math.max(Math.abs(deltaX), 1.2) * 0.85;
      const testSlideY = currentY + targetDirY * slideDist;
      const circleSlideY: Circle = { x: newX, y: testSlideY, radius: effectiveRadius };
      let blockedY = false;
      for (const obs of obstacles) {
        if (circleIntersectsRect(circleSlideY, obs)) {
          blockedY = true;
          break;
        }
      }
      if (!blockedY && isInsideAlienAllowedDeck(newX, testSlideY, controlCenterShieldActive)) {
        newY = testSlideY;
      }
    }

    if (hitY && Math.abs(deltaX) < 0.25) {
      // Choque contra pared horizontal: proyectar fuerza tangencial X hacia apertura/pasillo más cercano
      let targetDirX = 0;
      for (const c of CORRIDORS) {
        if (Math.abs(currentY - (c.y + c.height / 2)) < c.height / 2 + 50) {
          targetDirX = Math.sign(c.x + c.width / 2 - currentX);
          break;
        }
      }
      if (targetDirX === 0) {
        targetDirX = currentX < 1900 ? 1 : -1;
      }
      const slideDist = Math.max(Math.abs(deltaY), 1.2) * 0.85;
      const testSlideX = currentX + targetDirX * slideDist;
      const circleSlideX: Circle = { x: testSlideX, y: newY, radius: effectiveRadius };
      let blockedX = false;
      for (const obs of obstacles) {
        if (circleIntersectsRect(circleSlideX, obs)) {
          blockedX = true;
          break;
        }
      }
      if (!blockedX && isInsideAlienAllowedDeck(testSlideX, newY, controlCenterShieldActive)) {
        newX = testSlideX;
      }
    }
  }

  // Angular Wall & Box Sliding: If an obstacle or corner blocked both axes diagonally,
  // do not come to a dead stop! Slide along whichever tangential axis has clearance.
  if (hitX && hitY) {
    // 1. Try sliding along Y alone
    if (Math.abs(deltaY) > 0.05) {
      const testSlideY = currentY + deltaY;
      let blockedSlideY = false;
      const circleSlideY: Circle = { x: currentX, y: testSlideY, radius: effectiveRadius };
      for (const obs of obstacles) {
        if (circleIntersectsRect(circleSlideY, obs)) {
          blockedSlideY = true;
          break;
        }
      }
      const deckValidY = isAlien
        ? isInsideAlienAllowedDeck(currentX, testSlideY, controlCenterShieldActive)
        : isInsideShipDeck(currentX, testSlideY, podDoorUnlocked);

      if (!blockedSlideY && deckValidY) {
        newX = currentX;
        newY = testSlideY;
        hitY = false;
      }
    }

    // 2. Try sliding along X alone if Y sliding was blocked
    if (hitY && Math.abs(deltaX) > 0.05) {
      const testSlideX = currentX + deltaX;
      let blockedSlideX = false;
      const circleSlideX: Circle = { x: testSlideX, y: currentY, radius: effectiveRadius };
      for (const obs of obstacles) {
        if (circleIntersectsRect(circleSlideX, obs)) {
          blockedSlideX = true;
          break;
        }
      }
      const deckValidX = isAlien
        ? isInsideAlienAllowedDeck(testSlideX, currentY, controlCenterShieldActive)
        : isInsideShipDeck(testSlideX, currentY, podDoorUnlocked);

      if (!blockedSlideX && deckValidX) {
        newX = testSlideX;
        newY = currentY;
        hitX = false;
      }
    }
  }

  // ================= DOORWAY & CORRIDOR CORNER ASSIST (Player & Alien Navigation) =================
  // When an entity grazes a doorway frame or corridor entrance, gently guide them into the opening
  // 1. Moving vertically into a vertical corridor entrance
  if (hitY && Math.abs(deltaY) > 0.05) {
    for (const c of CORRIDORS) {
      if (c.height > c.width) {
        const nearTop = Math.abs(currentY - c.y) < 42;
        const nearBottom = Math.abs(currentY - (c.y + c.height)) < 42;
        if (nearTop || nearBottom) {
          const centerX = c.x + c.width / 2;
          const diffX = centerX - currentX;
          if (Math.abs(diffX) < c.width / 2 + 18) {
            const nudgeX = Math.sign(diffX) * Math.min(Math.abs(diffX), 2.8);
            const testX = currentX + nudgeX;

            // Check if testX is free of obstacles at currentY
            let blockedX = false;
            const circleTestX: Circle = { x: testX, y: currentY, radius: effectiveRadius };
            for (const obs of obstacles) {
              if (circleIntersectsRect(circleTestX, obs)) {
                blockedX = true;
                break;
              }
            }
            const deckValidX = isAlien
              ? isInsideAlienAllowedDeck(testX, currentY, controlCenterShieldActive)
              : isInsideShipDeck(testX, currentY, podDoorUnlocked);

            if (!blockedX && deckValidX) {
              newX = testX;
              // Check if moving forward in Y from testX is free of obstacles
              const testY = currentY + deltaY;
              let blockedY = false;
              const circleTestY: Circle = { x: testX, y: testY, radius: effectiveRadius };
              for (const obs of obstacles) {
                if (circleIntersectsRect(circleTestY, obs)) {
                  blockedY = true;
                  break;
                }
              }
              const deckValidY = isAlien
                ? isInsideAlienAllowedDeck(testX, testY, controlCenterShieldActive)
                : isInsideShipDeck(testX, testY, podDoorUnlocked);

              if (!blockedY && deckValidY) {
                newY = testY;
                hitY = false;
              }
              break;
            }
          }
        }
      }
    }
  }

  // 2. Moving horizontally into a horizontal corridor entrance
  if (hitX && Math.abs(deltaX) > 0.05) {
    for (const c of CORRIDORS) {
      if (c.width > c.height) {
        const nearLeft = Math.abs(currentX - c.x) < 42;
        const nearRight = Math.abs(currentX - (c.x + c.width)) < 42;
        if (nearLeft || nearRight) {
          const centerY = c.y + c.height / 2;
          const diffY = centerY - currentY;
          if (Math.abs(diffY) < c.height / 2 + 18) {
            const nudgeY = Math.sign(diffY) * Math.min(Math.abs(diffY), 2.8);
            const testY = currentY + nudgeY;

            // Check if testY is free of obstacles at currentX
            let blockedY = false;
            const circleTestY: Circle = { x: currentX, y: testY, radius: effectiveRadius };
            for (const obs of obstacles) {
              if (circleIntersectsRect(circleTestY, obs)) {
                blockedY = true;
                break;
              }
            }
            const deckValidY = isAlien
              ? isInsideAlienAllowedDeck(currentX, testY, controlCenterShieldActive)
              : isInsideShipDeck(currentX, testY, podDoorUnlocked);

            if (!blockedY && deckValidY) {
              newY = testY;
              // Check if moving forward in X from testY is free of obstacles
              const testX = currentX + deltaX;
              let blockedX = false;
              const circleTestX: Circle = { x: testX, y: testY, radius: effectiveRadius };
              for (const obs of obstacles) {
                if (circleIntersectsRect(circleTestX, obs)) {
                  blockedX = true;
                  break;
                }
              }
              const deckValidX = isAlien
                ? isInsideAlienAllowedDeck(testX, testY, controlCenterShieldActive)
                : isInsideShipDeck(testX, testY, podDoorUnlocked);

              if (!blockedX && deckValidX) {
                newX = testX;
                hitX = false;
              }
              break;
            }
          }
        }
      }
    }
  }

  return { newX, newY, hitX, hitY };
}

/**
 * Checks if line of sight between two points is blocked by any obstacle.
 */
export function hasLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  obstacles: Rect[]
): boolean {
  const steps = 18;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;

    for (const obs of obstacles) {
      if (px >= obs.x && px <= obs.x + obs.width && py >= obs.y && py <= obs.y + obs.height) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Checks if a path has generous CLEARANCE for an entity of radius clearanceRadius.
 * Tests circle intersections along the path to ensure the entity won't scrape or stick on corners.
 */
export function hasClearPathWithClearance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  obstacles: Rect[],
  clearanceRadius: number = 16
): boolean {
  const dist = getDistance(x1, y1, x2, y2);
  const steps = Math.max(6, Math.ceil(dist / 16));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;

    const circle: Circle = { x: px, y: py, radius: clearanceRadius };
    for (const obs of obstacles) {
      if (circleIntersectsRect(circle, obs)) {
        return false;
      }
    }
  }
  return true;
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
