import DiagramAssociation from "./DiagramAssociation";
import { DiagramComponent } from "./DiagramComponent";

export type ClassAssocKind = "association" | "aggregation" | "composition" | "generalization" | "realization";

export class ClassAssociation extends DiagramAssociation {
  kind: ClassAssocKind;
  assocName?: string;
  cardinalitySource?: number | undefined;
  cardinalityTarget?: number | undefined;

  constructor(
    src: DiagramComponent,
    tgt: DiagramComponent,
    kind: ClassAssocKind = "association",
    name?: string,
    cardinalitySource?: number | undefined,
    cardinalityTarget?: number | undefined,
    offset?: number,
  ) {
    super(src, tgt, name, offset);
    this.kind = kind;
    this.assocName = name;
    this.cardinalitySource = cardinalitySource;
    this.cardinalityTarget = cardinalityTarget;
    (this as any).type = "class-association";
  }

  draw(ctx: CanvasRenderingContext2D, scale = 1, options?: { highlight?: boolean; highlightStyle?: "stroke" | "overlay" }) {
    const sa = this.getSourceAnchor();
    const ta = this.getTargetAnchor();
    const pts: { x: number; y: number }[] = [sa];
    if (Array.isArray(this.controlPoints) && this.controlPoints.length) pts.push(...this.controlPoints);
    pts.push(ta);

    // compute perp offset
    let perp = { x: 0, y: 0 };
    if (this.offset && Math.abs(this.offset) > 0.0001) {
      const dx = ta.x - sa.x;
      const dy = ta.y - sa.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      perp = { x: (-dy / len) * this.offset, y: (dx / len) * this.offset };
    }

    const screenPts = pts.map((p) => ({ x: (p.x + perp.x) * scale, y: (p.y + perp.y) * scale }));

    // highlight stroke if requested
    if (options && options.highlight) {
      ctx.save();
      ctx.lineWidth = Math.max(4, 6 * (scale || 1));
      ctx.strokeStyle = "#00c8ff";
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    // dashed for realization
    if (this.kind === "realization") ctx.setLineDash([6 * scale, 4 * scale]);
    ctx.lineWidth = Math.max(1, 2 * (scale || 1));
    ctx.strokeStyle = "#333";
    ctx.beginPath();
    ctx.moveTo(screenPts[0].x, screenPts[0].y);
    for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
    ctx.stroke();

    // draw adornments depending on kind
    // first point (source anchor) is screenPts[0], not used directly here
    const last = screenPts[screenPts.length - 1];
    const beforeLast = screenPts.length > 1 ? screenPts[screenPts.length - 2] : last;

    // helper to draw diamond at target (hollow or filled)
    const drawDiamondAtTarget = (filled: boolean) => {
      const ang = Math.atan2(beforeLast.y - last.y, beforeLast.x - last.x); // direction from target inward
      const d = 12 * (scale || 1);
      const cx = last.x;
      const cy = last.y;
      const p2 = { x: cx + d * Math.cos(ang), y: cy + d * Math.sin(ang) };
      const perpAng = ang + Math.PI / 2;
      const p3 = { x: cx + (d / 2) * Math.cos(ang) + (d / 2) * Math.cos(perpAng), y: cy + (d / 2) * Math.sin(ang) + (d / 2) * Math.sin(perpAng) };
      const p4 = { x: cx + (d / 2) * Math.cos(ang) - (d / 2) * Math.cos(perpAng), y: cy + (d / 2) * Math.sin(ang) - (d / 2) * Math.sin(perpAng) };
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      if (filled) ctx.fillStyle = "#333";
      if (filled) ctx.fill();
      ctx.stroke();
    };

    // helper to draw hollow triangle at target (generalization)
    const drawHollowTriangleAtTarget = () => {
      const ang = Math.atan2(last.y - beforeLast.y, last.x - beforeLast.x);
      const d = 14 * (scale || 1);
      const tip = { x: last.x, y: last.y };
      const p1 = { x: tip.x - d * Math.cos(ang), y: tip.y - d * Math.sin(ang) };
      const perpAng = ang + Math.PI / 2;
      const p2 = { x: p1.x + (d / 2) * Math.cos(perpAng), y: p1.y + (d / 2) * Math.sin(perpAng) };
      const p3 = { x: p1.x - (d / 2) * Math.cos(perpAng), y: p1.y - (d / 2) * Math.sin(perpAng) };
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.stroke();
    };

    // helper to draw normal filled arrow at target
    const drawFilledArrowAtTarget = () => {
      const ang = Math.atan2(last.y - beforeLast.y, last.x - beforeLast.x);
      const ah = 8 * (scale || 1);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x - ah * Math.cos(ang - Math.PI / 6), last.y - ah * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(last.x - ah * Math.cos(ang + Math.PI / 6), last.y - ah * Math.sin(ang + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = "#333";
      ctx.fill();
    };

    if (this.kind === "aggregation") {
      // diamond at target, no arrows
      drawDiamondAtTarget(false);
    } else if (this.kind === "composition") {
      // filled diamond at target
      drawDiamondAtTarget(true);
    } else if (this.kind === "generalization") {
      // hollow triangle at target
      drawHollowTriangleAtTarget();
    } else if (this.kind === "realization") {
      // dashed line and a normal arrow at target; source must be interface (enforced by UI)
      drawFilledArrowAtTarget();
    } else {
      // plain association: no arrows/adornments (bidirectional)
    }

    // label (name) near midpoint, cardinalities near source and target ends
    if (this.assocName) {
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
      ctx.font = `${12 * (scale || 1)}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = "#111";
      ctx.fillText(this.assocName, mid.x, mid.y - 8 * (scale || 1));
    }

    // draw numeric cardinalities near source / target (if provided)
    ctx.font = `${12 * (scale || 1)}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    if (typeof this.cardinalitySource === "number") {
      // place slightly offset from first segment towards the source
      const p0 = screenPts[0];
      const p1 = screenPts.length > 1 ? screenPts[1] : screenPts[0];
      const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const ox = -10 * (scale || 1) * Math.cos(ang);
      const oy = -10 * (scale || 1) * Math.sin(ang);
      ctx.fillText(String(this.cardinalitySource), p0.x + ox, p0.y + oy);
    }
    if (typeof this.cardinalityTarget === "number") {
      const pN = screenPts[screenPts.length - 1];
      const pBefore = screenPts.length > 1 ? screenPts[screenPts.length - 2] : pN;
      const ang2 = Math.atan2(pN.y - pBefore.y, pN.x - pBefore.x);
      const ox2 = 6 * (scale || 1) * Math.cos(ang2);
      const oy2 = 6 * (scale || 1) * Math.sin(ang2);
      // align right near target
      ctx.textAlign = "right";
      ctx.fillText(String(this.cardinalityTarget), pN.x + ox2, pN.y + oy2);
    }

    ctx.restore();
  }

  toJSON() {
    const base = super.toJSON();
    return { ...base, kind: this.kind, assocName: this.assocName, cardinalitySource: this.cardinalitySource, cardinalityTarget: this.cardinalityTarget } as any;
  }

  static fromJSON(json: any, resolver: (id: string) => DiagramComponent | undefined) {
    const src = resolver(json.sourceId);
    const tgt = resolver(json.targetId);
    if (!src || !tgt) return null;
  const a = new ClassAssociation(src, tgt, json.kind ?? "association", json.assocName, json.cardinalitySource, json.cardinalityTarget, json.offset);
    a.id = json.id ?? a.id;
    if (json.controlPoints) a.controlPoints = json.controlPoints;
    return a;
  }
}

export default ClassAssociation;
