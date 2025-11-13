import DiagramAssociation from "./DiagramAssociation";
import { DiagramComponent } from "./DiagramComponent";

export type UseCaseAssocType = "extends" | "includes";

export class UseCaseAssociation extends DiagramAssociation {
  assocType: UseCaseAssocType;

  constructor(source: DiagramComponent, target: DiagramComponent, assocType: UseCaseAssocType = "includes", offset?: number) {
    super(source, target, assocType === "includes" ? "<<includes>>" : "<<extends>>", offset);
    this.assocType = assocType;
    (this as any).type = "usecase-association";
  }

  draw(ctx: CanvasRenderingContext2D, scale = 1, options?: { highlight?: boolean; highlightStyle?: "stroke" | "overlay" }) {
    // custom styling based on assocType: dashed for <<includes>>, solid for <<extends>>
    const sa = this.getSourceAnchor();
    const ta = this.getTargetAnchor();

    // build polyline (no intermediate controlPoints in this simplified variant)
    const pts: { x: number; y: number }[] = [sa];
    if (Array.isArray(this.controlPoints) && this.controlPoints.length) pts.push(...this.controlPoints);
    pts.push(ta);

    // compute perpendicular offset if present
    let perp = { x: 0, y: 0 };
    if (this.offset && Math.abs(this.offset) > 0.0001) {
      const dx = ta.x - sa.x;
      const dy = ta.y - sa.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      perp = { x: (-dy / len) * this.offset, y: (dx / len) * this.offset };
    }

    const screenPts = pts.map((p) => ({ x: (p.x + perp.x) * scale, y: (p.y + perp.y) * scale }));

    // If highlighted, draw a cyan stroke behind the main line (and log)
    if (options && options.highlight) {
      try {
        // eslint-disable-next-line no-console
        console.log("UseCaseAssociation.draw (highlight) ->", this.id, { controlPoints: this.controlPoints });
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
        ctx.save();
        ctx.lineWidth = Math.max(4, 6 * (scale || 1));
        ctx.strokeStyle = "rgba(0,200,255,0.18)";
        ctx.beginPath();
        ctx.moveTo(screenPts[0].x, screenPts[0].y);
        for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
        ctx.stroke();
        ctx.restore();
      }
      // small debug label to prove draw invocation and location
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

    const sx = screenPts[0].x;
    const sy = screenPts[0].y;
    const tx = screenPts[screenPts.length - 1].x;
    const ty = screenPts[screenPts.length - 1].y;

    ctx.save();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
    ctx.stroke();

    // arrow head at target (hollow for extends, filled for includes)
    const ang = Math.atan2(ty - sy, tx - sx);
    const ah = 8 * (scale || 1);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - ah * Math.cos(ang - Math.PI / 6), ty - ah * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(tx - ah * Math.cos(ang + Math.PI / 6), ty - ah * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = "#333";
    ctx.fill();
    ctx.stroke();

    // draw label (<<includes>> / <<extends>>) near middle
    if (this.name) {
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      ctx.fillStyle = "#111";
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.name, mx, my - 10 * scale);
    }

    ctx.restore();
  }

  toJSON() {
    const base = super.toJSON();
    return { ...base, assocType: this.assocType } as any;
  }

  static fromJSON(json: any, resolver: (id: string) => DiagramComponent | undefined) {
    const src = resolver(json.sourceId);
    const tgt = resolver(json.targetId);
    if (!src || !tgt) return null;
    const assoc = new UseCaseAssociation(src, tgt, json.assocType ?? "includes", json.offset);
    assoc.id = json.id ?? assoc.id;
    return assoc;
  }
}

export default UseCaseAssociation;
