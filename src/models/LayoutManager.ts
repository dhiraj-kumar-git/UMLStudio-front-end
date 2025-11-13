import { CanvasModel } from "./CanvasModel";
import { DiagramComponent } from "./DiagramComponent";

/**
 * LayoutManager finds an empty spot near the canvas center to place new components.
 * It uses a simple outward-spiral search over a grid (based on cellSize) and
 * checks for intersections with existing components' bounding boxes.
 */
export class LayoutManager {
  static findEmptySpot(opts: {
    canvasModel: CanvasModel;
    existing: DiagramComponent[];
    desiredWidth?: number;
    desiredHeight?: number;
    // screen size in CSS pixels (optional). If omitted we fall back to window.innerWidth/innerHeight.
    screenWidth?: number;
    screenHeight?: number;
    // padding around the placed component in world units
    padding?: number;
  }): { x: number; y: number } {
    const { canvasModel, existing, desiredWidth = 80, desiredHeight = 80 } = opts;
    const screenW = opts.screenWidth ?? (typeof window !== "undefined" ? window.innerWidth : 800);
    const screenH = opts.screenHeight ?? (typeof window !== "undefined" ? window.innerHeight : 600);
    const padding = opts.padding ?? Math.min(canvasModel.cellSize, 16);

    const scale = canvasModel.scale;
    const offsetX = canvasModel.offsetX;
    const offsetY = canvasModel.offsetY;

    // Convert screen center to world coordinates
    const centerScreenX = screenW / 2;
    const centerScreenY = screenH / 2;
    const centerWorldX = (centerScreenX - offsetX) / scale;
    const centerWorldY = (centerScreenY - offsetY) / scale;

    // grid step (in world units) — use cellSize to keep placements aligned
    const step = Math.max(8, canvasModel.cellSize / 2);

    const maxRadius = Math.max(screenW, screenH) * 2; // in pixels; but we iterate in world units
    const maxSteps = Math.ceil(maxRadius / step);

    const rectIntersects = (x: number, y: number, w: number, h: number) => {
      const aLeft = x - padding;
      const aTop = y - padding;
      const aRight = x + w + padding;
      const aBottom = y + h + padding;
      for (const c of existing || []) {
        const b = c.boundingBox();
        if (aLeft <= b.x + b.width && aRight >= b.x && aTop <= b.y + b.height && aBottom >= b.y) {
          return true;
        }
      }
      return false;
    };

    // Spiral search starting at centerWorldX, centerWorldY
    if (!rectIntersects(centerWorldX, centerWorldY, desiredWidth, desiredHeight)) {
      return { x: Math.round(centerWorldX), y: Math.round(centerWorldY) };
    }

    for (let layer = 1; layer <= maxSteps; layer++) {
      // iterate around the square ring
      for (let i = -layer; i <= layer; i++) {
        const candidates = [
          { x: centerWorldX + i * step, y: centerWorldY - layer * step },
          { x: centerWorldX + i * step, y: centerWorldY + layer * step },
          { x: centerWorldX - layer * step, y: centerWorldY + i * step },
          { x: centerWorldX + layer * step, y: centerWorldY + i * step },
        ];
        for (const pt of candidates) {
          if (!rectIntersects(pt.x, pt.y, desiredWidth, desiredHeight)) {
            return { x: Math.round(pt.x), y: Math.round(pt.y) };
          }
        }
      }
    }

    // Fallback: place at center
    return { x: Math.round(centerWorldX), y: Math.round(centerWorldY) };
  }

  /**
   * Compute a perpendicular offset (in world units) for a new association between
   * source and target so multiple associations between the same pair are drawn
   * with small parallel offsets to reduce overlap.
   *
   * Algorithm: count existing associations between the same unordered pair; for
   * the new association (placed at the end), compute its index i = existingCount
   * and total t = existingCount + 1, then offset = (i - (t-1)/2) * spacing.
   */
  static computeAssociationOffset(opts: {
    source: import("./DiagramComponent").DiagramComponent;
    target: import("./DiagramComponent").DiagramComponent;
    associations?: Array<import("./DiagramAssociation").DiagramAssociation> | null;
    spacing?: number; // in world units
  }): number {
    const { source, target, associations = [], spacing = 12 } = opts;
    const sId = (source as any).id;
    const tId = (target as any).id;
    if (!sId || !tId) return 0;
    const existing = (associations || []).filter((a) => {
      try {
        const aSrc = (a as any).source?.id;
        const aTgt = (a as any).target?.id;
        if (!aSrc || !aTgt) return false;
        return (aSrc === sId && aTgt === tId) || (aSrc === tId && aTgt === sId);
      } catch {
        return false;
      }
    });
    const c = existing.length;
    const t = c + 1;
    const i = c; // new one will be at the end
    const offset = (i - (t - 1) / 2) * spacing;
    return offset;
  }

  /**
   * Assign symmetric perpendicular offsets to all associations that connect the
   * same unordered pair (source <-> target). This ensures the group of
   * parallel edges are spaced evenly around the centerline.
   *
   * The method mutates the association objects in the provided `associations`
   * array (so call it before you set state) and also returns the new offsets
   * for convenience.
   */
  static assignOffsetsForPair(opts: {
    source: import("./DiagramComponent").DiagramComponent;
    target: import("./DiagramComponent").DiagramComponent;
    associations: Array<import("./DiagramAssociation").DiagramAssociation>;
    spacing?: number;
  }): number[] {
    const { source, target, associations, spacing = 12 } = opts;
    const sId = (source as any).id;
    const tId = (target as any).id;
    if (!sId || !tId) return [];

    // collect indices of associations that connect these two nodes (unordered)
    const groupIndices: number[] = [];
    associations.forEach((a, idx) => {
      try {
        const aSrc = (a as any).source?.id;
        const aTgt = (a as any).target?.id;
        if (!aSrc || !aTgt) return;
        if ((aSrc === sId && aTgt === tId) || (aSrc === tId && aTgt === sId)) {
          groupIndices.push(idx);
        }
      } catch {
        // ignore
      }
    });

    const t = groupIndices.length;
    if (t === 0) return [];

    // assign symmetric offsets: for j in [0..t-1], offset = (j - (t-1)/2) * spacing
    const offsets: number[] = [];
    groupIndices.forEach((assocIdx, j) => {
      const off = (j - (t - 1) / 2) * spacing;
      const a = associations[assocIdx] as any;
      a.offset = off;
      offsets.push(off);
    });

    return offsets;
  }

  /**
   * Assign offsets for all associations in the list, grouping by unordered
   * endpoint pair. This mutates the provided associations array and returns a
   * map of pairKey -> offsets array for callers who need them.
   */
  static assignOffsetsForAll(associations: Array<import("./DiagramAssociation").DiagramAssociation>, spacing = 12) {
    // group indices by unordered pair key
    const groups = new Map<string, number[]>();
    associations.forEach((a, idx) => {
      try {
        const aSrc = (a as any).source?.id;
        const aTgt = (a as any).target?.id;
        if (!aSrc || !aTgt) return;
        const key = aSrc < aTgt ? `${aSrc}|${aTgt}` : `${aTgt}|${aSrc}`;
        const arr = groups.get(key) || [];
        arr.push(idx);
        groups.set(key, arr);
      } catch {
        // ignore
      }
    });

    const result = new Map<string, number[]>();
    for (const [key, indices] of groups.entries()) {
      const t = indices.length;
      const offsets: number[] = [];
      indices.forEach((assocIdx, j) => {
        const off = (j - (t - 1) / 2) * spacing;
        const a = associations[assocIdx] as any;
        a.offset = off;
        offsets.push(off);
      });
      result.set(key, offsets);
    }

    return result;
  }
}

export default LayoutManager;
