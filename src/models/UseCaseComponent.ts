import { DiagramComponent } from "./DiagramComponent";

export class UseCaseComponent extends DiagramComponent {
  name: string;

  constructor(name = "UseCase", x = 0, y = 0) {
    // typical use case is a wide ellipse
    super(x, y, 180, 80);
    this.name = name;
    (this as any).type = "usecase";
  }

  draw(ctx: CanvasRenderingContext2D, scale = 1) {
    const x = this.x * scale;
    const y = this.y * scale;
    const w = this.width * scale;
    const h = this.height * scale;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.fill();
    ctx.stroke();

    // name
    ctx.fillStyle = "#111";
    ctx.font = `${14 * scale}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.name, x + w / 2, y + h / 2);

    ctx.restore();
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
    };
  }

  static fromJSON(json: any) {
    const u = new UseCaseComponent(json.name ?? "UseCase", json.x ?? 0, json.y ?? 0);
    if (json.id) u.id = json.id;
    u.width = json.width ?? u.width;
    u.height = json.height ?? u.height;
    return u;
  }
}

export default UseCaseComponent;
