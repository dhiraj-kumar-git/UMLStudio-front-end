import { DiagramComponent } from "./DiagramComponent";

export class SystemBoundary extends DiagramComponent {
  name: string;
  constructor(name = "System", x = 0, y = 0, width = 600, height = 400) {
    super(x, y, width, height);
    this.name = name;
    (this as any).type = "system-boundary";
  }

  draw(ctx: CanvasRenderingContext2D, scale = 1) {
    const bb = this.boundingBox();
    const x = bb.x * scale;
    const y = bb.y * scale;
    const w = bb.width * scale;
    const h = bb.height * scale;

    ctx.save();
    ctx.fillStyle = "rgba(250,250,255,0.9)";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = Math.max(2, 2 * scale);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // title
    ctx.fillStyle = "#133";
    ctx.font = `${16 * scale}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(this.name, x + 8 * scale, y + 6 * scale);
    ctx.restore();
  }

  toJSON() {
    return { ...(super.toJSON() as any), name: this.name } as any;
  }

  static reviveFromJSON(json: any) {
    const s = new SystemBoundary(json?.name ?? "System", json.x ?? 0, json.y ?? 0, json.width ?? 600, json.height ?? 400);
    s.id = json.id ?? s.id;
    return s;
  }
}

export default SystemBoundary;
