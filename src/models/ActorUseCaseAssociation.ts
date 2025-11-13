import DiagramAssociation from "./DiagramAssociation";
import { DiagramComponent } from "./DiagramComponent";

/**
 * Simple association between an Actor and a UseCase. No extra labels or types.
 */
export class ActorUseCaseAssociation extends DiagramAssociation {
  constructor(src: DiagramComponent, tgt: DiagramComponent, offset?: number) {
    super(src, tgt, undefined, offset);
    (this as any).type = "actor-usecase-association";
  }

  

  draw(ctx: CanvasRenderingContext2D, scale = 1, options?: { highlight?: boolean; highlightStyle?: "stroke" | "overlay" }) {
    // reuse base routing but render a plain unobtrusive line (no label)
    const sa = this.getSourceAnchor();
    const ta = this.getTargetAnchor();
    const pts: { x: number; y: number }[] = [sa];
    if (Array.isArray(this.controlPoints) && this.controlPoints.length) pts.push(...this.controlPoints);
    pts.push(ta);

    let perp = { x: 0, y: 0 };
    if (this.offset && Math.abs(this.offset) > 0.0001) {
      const dx = ta.x - sa.x;
      const dy = ta.y - sa.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      perp = { x: (-dy / len) * this.offset, y: (dx / len) * this.offset };
    }

    const screenPts = pts.map((p) => ({ x: (p.x + perp.x) * scale, y: (p.y + perp.y) * scale }));

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
    ctx.strokeStyle = "#333";
    ctx.lineWidth = Math.max(1, 2 * (scale || 1));
    ctx.beginPath();
    ctx.moveTo(screenPts[0].x, screenPts[0].y);
    for (let i = 1; i < screenPts.length; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y);
    ctx.stroke();
    // draw a normal filled arrow at the target (use case)
    if (screenPts.length >= 2) {
      const sP = screenPts[screenPts.length - 2];
      const tP = screenPts[screenPts.length - 1];
      const ang = Math.atan2(tP.y - sP.y, tP.x - sP.x);
      const ah = 8 * (scale || 1);
      ctx.beginPath();
      ctx.moveTo(tP.x, tP.y);
      ctx.lineTo(tP.x - ah * Math.cos(ang - Math.PI / 6), tP.y - ah * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(tP.x - ah * Math.cos(ang + Math.PI / 6), tP.y - ah * Math.sin(ang + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = "#333";
      ctx.fill();
    }
    ctx.restore();
  }
}

export default ActorUseCaseAssociation;
