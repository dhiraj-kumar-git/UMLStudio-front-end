import { DiagramComponent } from "./DiagramComponent";

export type AssociationJSON = {
  id: string;
  type?: string;
  name?: string;
  sourceId: string;
  targetId: string;
};

/**
 * Abstract base for associations/edges between two DiagramComponent instances.
 *
 * The base class provides anchor-point calculations (so the edge always attaches
 * to the component border) and a default visual renderer (line + arrow + label).
 * Subclasses may override drawing style or routing logic.
 */
export abstract class DiagramAssociation {
  id: string;
  name?: string;
  source: DiagramComponent;
  target: DiagramComponent;
  // optional perpendicular offset (in world units) applied to the routed line
  offset?: number;
  // optional intermediate control points (world coordinates) to allow manual routing
  controlPoints?: { x: number; y: number }[];

  constructor(source: DiagramComponent, target: DiagramComponent, name?: string, offset?: number) {
    this.id = (typeof crypto !== "undefined" && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2, 9);
    this.source = source;
    this.target = target;
    this.name = name;
    this.offset = offset;
    this.controlPoints = [];
  }

  getCenterOf(rect: { x: number; y: number; width: number; height: number }) {
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }

  /**
   * Compute an anchor point on the border of `rect` that lies on the line from
   * the rectangle center to the `toward` point. Returns coordinates in world units.
   */
  pointOnRectEdge(rect: { x: number; y: number; width: number; height: number }, toward: { x: number; y: number }) {
    const center = this.getCenterOf(rect);
    const tx = toward.x - center.x;
    const ty = toward.y - center.y;
    // If the target is exactly at center, return center
    if (Math.abs(tx) < 1e-6 && Math.abs(ty) < 1e-6) return center;

    const hx = rect.width / 2;
    const hy = rect.height / 2;

    // scale factors to reach the border along x or y
    const sx = Math.abs(tx) < 1e-6 ? Infinity : hx / Math.abs(tx);
    const sy = Math.abs(ty) < 1e-6 ? Infinity : hy / Math.abs(ty);
    const s = Math.min(sx, sy);
    const ax = center.x + tx * s;
    const ay = center.y + ty * s;
    return { x: ax, y: ay };
  }

  getSourceAnchor() {
    const rect = this.source.boundingBox();
    const targetCenter = this.getCenterOf(this.target.boundingBox());
    return this.pointOnRectEdge(rect, targetCenter);
  }

  getTargetAnchor() {
    const rect = this.target.boundingBox();
    const sourceCenter = this.getCenterOf(this.source.boundingBox());
    return this.pointOnRectEdge(rect, sourceCenter);
  }

  /**
   * Default renderer for a unidirectional association: a stroked line with an
   * arrow head at the target and an optional name label near the middle.
   *
   * The method assumes world coordinates (component x/y/width/height are in
   * world units); the caller should pass the canvas context and the current
   * scale (so points are multiplied by scale to convert to screen space).
   */
  draw(ctx: CanvasRenderingContext2D, scale = 1, options?: { highlight?: boolean; highlightStyle?: "stroke" | "overlay" }) {
    const sa = this.getSourceAnchor();
    const ta = this.getTargetAnchor();

    // build the polyline in world coordinates: source anchor -> controlPoints -> target anchor
    const pts: { x: number; y: number }[] = [sa];
    if (Array.isArray(this.controlPoints) && this.controlPoints.length > 0) pts.push(...this.controlPoints);
    pts.push(ta);

    // optionally shift the whole polyline perpendicular to the main edge by `offset`
    let perp = { x: 0, y: 0 };
    if (this.offset && Math.abs(this.offset) > 0.0001) {
      const dx = ta.x - sa.x;
      const dy = ta.y - sa.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len; // perp unit
      const py = dx / len;
      perp = { x: px * this.offset, y: py * this.offset };
    }

    const screenPts = pts.map((p) => ({ x: (p.x + perp.x) * scale, y: (p.y + perp.y) * scale }));

    // If highlighting requested, draw a highlighted stroke (as border) behind the main line.
    if (options && options.highlight) {
      try {
        // eslint-disable-next-line no-console
        console.log("DiagramAssociation.draw (highlight) ->", this.id, { controlPoints: this.controlPoints });
      } catch {}
      const style = options.highlightStyle || "stroke";
      if (style === "stroke") {
        ctx.save();
        ctx.lineWidth = Math.max(4, 6 * (scale || 1));
        ctx.strokeStyle = "#00c8ff";
        ctx.beginPath();
        ctx.moveTo(screenPts[0].x, screenPts[0].y);
        for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
        ctx.stroke();
        ctx.restore();
      } else {
        // overlay style (semi-transparent fill behind path)
        ctx.save();
        ctx.lineWidth = Math.max(4, 6 * (scale || 1));
        ctx.strokeStyle = "rgba(0,200,255,0.18)";
        ctx.beginPath();
        ctx.moveTo(screenPts[0].x, screenPts[0].y);
        for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
        ctx.stroke();
        ctx.restore();
      }

      // --- debug tracer: render a tiny label near the first segment to prove draw() is being called
      try {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.font = `${10 * (scale || 1)}px sans-serif`;
        const label = `(id:${this.id})`;
        const px = screenPts[0].x + 6 * (scale || 1);
        const py = screenPts[0].y + 6 * (scale || 1);
        ctx.fillText(label, px, py);
        ctx.restore();
      } catch {}
    }

    ctx.save();
    ctx.strokeStyle = "#333";
    ctx.fillStyle = "#333";
    ctx.lineWidth = Math.max(1, 2 * (scale || 1));
    ctx.beginPath();
    ctx.moveTo(screenPts[0].x, screenPts[0].y);
    for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
    ctx.stroke();

    // draw arrowhead at target (use last two screen pts to compute angle)
    if (screenPts.length >= 2) {
      const sP = screenPts[screenPts.length - 2];
      const tP = screenPts[screenPts.length - 1];
      const ang = Math.atan2(tP.y - sP.y, tP.x - sP.x);
      const ah = 8 * (scale || 1); // arrow size in pixels
      ctx.beginPath();
      ctx.moveTo(tP.x, tP.y);
      ctx.lineTo(tP.x - ah * Math.cos(ang - Math.PI / 6), tP.y - ah * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(tP.x - ah * Math.cos(ang + Math.PI / 6), tP.y - ah * Math.sin(ang + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    // label (if provided) — draw near midpoint with a small background
    if (this.name) {
      // compute midpoint along the polyline (in screen space) for label placement
      let totalLen = 0;
      for (let i = 1; i < screenPts.length; i++) {
        const dx = screenPts[i].x - screenPts[i - 1].x;
        const dy = screenPts[i].y - screenPts[i - 1].y;
        totalLen += Math.sqrt(dx * dx + dy * dy);
      }
      let acc = 0;
      let mid = { x: screenPts[0].x, y: screenPts[0].y };
      const targetLen = totalLen / 2;
      for (let i = 1; i < screenPts.length; i++) {
        const a = screenPts[i - 1];
        const b = screenPts[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const segLen = Math.sqrt(dx * dx + dy * dy);
        if (acc + segLen >= targetLen) {
          const remain = targetLen - acc;
          const t = remain / segLen;
          mid = { x: a.x + dx * t, y: a.y + dy * t };
          break;
        }
        acc += segLen;
      }
      const padding = 6 * (scale || 1);
      ctx.font = `${12 * (scale || 1)}px sans-serif`;
      ctx.textBaseline = "middle";
      const text = this.name;
      const w = ctx.measureText(text).width;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(mid.x - w / 2 - padding / 2, mid.y - 10 * (scale || 1) / 2 - padding / 2, w + padding, 10 * (scale || 1) + padding / 2);
      ctx.fillStyle = "#111";
      ctx.fillText(text, mid.x, mid.y);
    }

    ctx.restore();
  }

  toJSON(): AssociationJSON {
    return {
      id: this.id,
      type: (this as any).type ?? undefined,
      name: this.name,
      sourceId: (this.source as any).id,
      targetId: (this.target as any).id,
      // include optional offset so routing can be restored
      ...(this.offset !== undefined ? { offset: this.offset } : {}),
      ...(this.controlPoints && this.controlPoints.length ? { controlPoints: this.controlPoints } : {}),
    };
  }

  /**
   * Helper to revive associations from JSON. `resolver` must map a component id
   * to a live DiagramComponent instance.
   */
  static reviveFromJSON(json: AssociationJSON & { offset?: number; controlPoints?: { x: number; y: number }[] }, resolver: (id: string) => DiagramComponent | undefined): DiagramAssociation | null {
    const src = resolver(json.sourceId);
    const tgt = resolver(json.targetId);
    if (!src || !tgt) return null;
    // The base class is abstract; callers should instantiate concrete subclasses.
    // Here we return a minimal anonymous subclass instance that uses base drawing.
    class _Assoc extends DiagramAssociation {}
    const a = new _Assoc(src, tgt, json.name, json.offset);
    a.id = json.id;
    if (json.controlPoints) a.controlPoints = json.controlPoints;
    return a;
  }

  // distance from point to segment in world units
  private static _pointToSegmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const projx = ax + t * dx;
    const projy = ay + t * dy;
    return Math.hypot(px - projx, py - projy);
  }

  /**
   * Hit-test point (world coords) against the polyline of this association.
   * tolerance is in world units.
   */
  containsPoint(pt: { x: number; y: number }, tolerance = 6 / 1) {
    const sa = this.getSourceAnchor();
    const ta = this.getTargetAnchor();
    const pts: { x: number; y: number }[] = [sa];
    if (Array.isArray(this.controlPoints) && this.controlPoints.length) pts.push(...this.controlPoints);
    pts.push(ta);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const d = DiagramAssociation._pointToSegmentDistance(pt.x, pt.y, a.x, a.y, b.x, b.y);
      if (d <= tolerance) return true;
    }
    return false;
  }

  addControlPoint(p: { x: number; y: number }) {
    if (!this.controlPoints) this.controlPoints = [];
    this.controlPoints.push(p);
  }

  moveControlPoint(index: number, p: { x: number; y: number }) {
    if (!this.controlPoints) return;
    if (index < 0 || index >= this.controlPoints.length) return;
    this.controlPoints[index] = p;
    try {
      // eslint-disable-next-line no-console
      console.log("DiagramAssociation: moveControlPoint ->", this.id, index, p);
    } catch {}
  }

  removeControlPoint(index: number) {
    if (!this.controlPoints) return;
    if (index < 0 || index >= this.controlPoints.length) return;
    this.controlPoints.splice(index, 1);
  }

  /**
   * Insert a control point on the closest segment to the given point (world coords).
   * Returns the index at which the control point was inserted.
   */
  insertControlPointAtPoint(p: { x: number; y: number }) {
    const sa = this.getSourceAnchor();
    const ta = this.getTargetAnchor();
    const pts: { x: number; y: number }[] = [sa];
    if (Array.isArray(this.controlPoints) && this.controlPoints.length) pts.push(...this.controlPoints);
    pts.push(ta);
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const d = DiagramAssociation._pointToSegmentDistance(p.x, p.y, a.x, a.y, b.x, b.y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i - 1; // insert after segment start -> controlPoints index = i-1
      }
    }

    const insertAt = bestIdx + 1; // controlPoints index where to insert
    if (!this.controlPoints) this.controlPoints = [];
    // splice into controlPoints at position (insertAt -1)
    const spliceAt = Math.max(0, Math.min(this.controlPoints.length, insertAt - 1));
    this.controlPoints.splice(spliceAt, 0, { x: p.x, y: p.y });
    try {
      // eslint-disable-next-line no-console
      console.log("DiagramAssociation: insertControlPointAtPoint ->", this.id, spliceAt, p);
    } catch {}
    return spliceAt;
  }
}

export default DiagramAssociation;
