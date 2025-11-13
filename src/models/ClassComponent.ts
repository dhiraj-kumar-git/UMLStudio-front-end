import { DiagramComponent } from "./DiagramComponent";

export type Attribute = { visibility: "+" | "-" | "*"; name: string };
export type Param = { name: string; type?: string };
export type Method = { visibility: "+" | "-" | "*"; name: string; params: Param[]; returnType?: string };

export class ClassComponent extends DiagramComponent {
  name: string;
  attributes: Attribute[];
  methods: Method[];
  // internal content padding
  padding = 8;

  constructor(name = "ClassName", x = 0, y = 0) {
    super(x, y, 160, 120);
    this.name = name;
    this.attributes = [];
    this.methods = [];
    (this as any).type = "class";
  }

  ensureSizeForText(ctx: CanvasRenderingContext2D, scale = 1) {
    // compute required width and height based on name, attributes and methods
    ctx.save();
    ctx.font = `${14 * scale}px sans-serif`;
    let maxW = ctx.measureText(this.name).width;
    ctx.font = `${12 * scale}px sans-serif`;
    for (const a of this.attributes) {
      const txt = `${a.visibility} ${a.name}`;
      maxW = Math.max(maxW, ctx.measureText(txt).width);
    }
    for (const m of this.methods) {
      const params = m.params.map((p) => `${p.name}${p.type ? ":" + p.type : ""}`).join(", ");
      const txt = `${m.visibility} ${m.name}(${params})${m.returnType ? ":" + m.returnType : ""}`;
      maxW = Math.max(maxW, ctx.measureText(txt).width);
    }
    const desiredW = Math.max(120 * scale, (maxW + this.padding * 2));

    // heights
    const nameH = 20 * scale;
    const attrH = this.attributes.length * (16 * scale) + (this.attributes.length ? 6 * scale : 0);
    const methodH = this.methods.length * (16 * scale) + (this.methods.length ? 6 * scale : 0);
    const desiredH = nameH + attrH + methodH + this.padding * 4;
    ctx.restore();

    this.width = Math.max(this.width, desiredW / scale);
    this.height = Math.max(this.height, desiredH / scale);
  }

  draw(ctx: CanvasRenderingContext2D, scale = 1) {
    // auto-resize to fit text
    this.ensureSizeForText(ctx, scale);

    const bb = this.boundingBox();
    const x = bb.x * scale;
    const y = bb.y * scale;
    const w = bb.width * scale;
    const h = bb.height * scale;

    ctx.save();
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#222";
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // title
    ctx.fillStyle = "#000";
    ctx.font = `${14 * scale}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(this.name, x + this.padding * scale, y + this.padding * scale);

    // separator line after name
    const nameH = 20 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y + nameH);
    ctx.lineTo(x + w, y + nameH);
    ctx.stroke();

    // attributes
    ctx.font = `${12 * scale}px sans-serif`;
    let ay = y + nameH + this.padding * scale;
    for (const a of this.attributes) {
      const txt = `${a.visibility} ${a.name}`;
      ctx.fillText(txt, x + this.padding * scale, ay);
      ay += 16 * scale;
    }

    // separator before methods
    const sepY = y + h - Math.max(16 * scale, this.methods.length * 16 * scale + this.padding * scale);
    ctx.beginPath();
    ctx.moveTo(x, sepY);
    ctx.lineTo(x + w, sepY);
    ctx.stroke();

    // methods
    ctx.font = `${12 * scale}px sans-serif`;
    let my = sepY + this.padding * scale;
    for (const m of this.methods) {
      const params = m.params.map((p) => `${p.name}${p.type ? ":" + p.type : ""}`).join(", ");
      const txt = `${m.visibility} ${m.name}(${params})${m.returnType ? ":" + m.returnType : ""}`;
      ctx.fillText(txt, x + this.padding * scale, my);
      my += 16 * scale;
    }

    ctx.restore();
  }

  toJSON() {
    return { ...(super.toJSON() as any), name: this.name, attributes: this.attributes, methods: this.methods } as any;
  }

  static reviveFromJSON(json: any) {
    const c = new ClassComponent(json?.name ?? "Class", json.x ?? 0, json.y ?? 0);
    c.id = json.id ?? c.id;
    c.width = json.width ?? c.width;
    c.height = json.height ?? c.height;
    c.attributes = json.attributes ?? [];
    c.methods = json.methods ?? [];
    return c;
  }
}

export default ClassComponent;
