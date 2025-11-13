import { DiagramComponent } from "./DiagramComponent";

export class ActorComponent extends DiagramComponent {
  name: string;

  constructor(name: string, x = 0, y = 0) {
    super(x, y, 60, 120);
    this.name = name;
    (this as any).type = "actor";
  }

  render() {
    return {
      type: "actor",
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  draw(ctx: CanvasRenderingContext2D, scale = 1) {
    const x = this.x * scale;
    const y = this.y * scale;
    const w = this.width * scale;
    const h = this.height * scale;

    ctx.save();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#fff";

    // head
    const headR = Math.min(w * 0.25, 12 * scale);
    const cx = x + w / 2;
    const cy = y + headR + 4 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // body
    ctx.beginPath();
    ctx.moveTo(cx, cy + headR);
    ctx.lineTo(cx, y + h * 0.6);
    ctx.stroke();

    // arms
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.35, y + h * 0.35);
    ctx.lineTo(cx + w * 0.35, y + h * 0.35);
    ctx.stroke();

    // legs
    ctx.beginPath();
    ctx.moveTo(cx, y + h * 0.6);
    ctx.lineTo(cx - w * 0.25, y + h);
    ctx.moveTo(cx, y + h * 0.6);
    ctx.lineTo(cx + w * 0.25, y + h);
    ctx.stroke();

    // name
    ctx.fillStyle = "#111";
    ctx.font = `${Math.max(12 * scale, 10)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(this.name ?? "Actor", cx, y + h + 6 * scale);

    ctx.restore();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
    };
  }

  static fromJSON(json: any) {
    const a = new ActorComponent(json.name ?? "Actor", json.x ?? 0, json.y ?? 0);
    if (json.id) a.id = json.id;
    a.width = json.width ?? a.width;
    a.height = json.height ?? a.height;
    return a;
  }
}
