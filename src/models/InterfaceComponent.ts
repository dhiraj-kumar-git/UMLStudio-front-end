import ClassComponent from "./ClassComponent";

export class InterfaceComponent extends ClassComponent {
  constructor(name = "IExample", x = 0, y = 0) {
    super(name, x, y);
    (this as any).type = "interface";
  }

  draw(ctx: CanvasRenderingContext2D, scale = 1) {
    // reuse ClassComponent drawing but add <<interface>> label above the name
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

    // <<interface>> label
  // <<interface>> label - center top
  ctx.fillStyle = "#333";
  ctx.font = `${10 * scale}px sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  const label = "\u00ABinterface\u00BB"; // «interface»
  ctx.fillText(label, x + w / 2, y + this.padding * scale);

  // draw the rest like ClassComponent but center the name under the label
  ctx.font = `${14 * scale}px sans-serif`;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText(this.name, x + w / 2, y + (this.padding + 12) * scale);

    // separator line after name (adjusted)
    const nameH = 30 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y + nameH);
    ctx.lineTo(x + w, y + nameH);
    ctx.stroke();

    // attributes and methods using parent logic but repositioning
    ctx.font = `${12 * scale}px sans-serif`;
    let ay = y + nameH + this.padding * scale;
    for (const a of this.attributes) {
      const txt = `${a.visibility} ${a.name}`;
      ctx.fillText(txt, x + this.padding * scale, ay);
      ay += 16 * scale;
    }

    const sepY = y + h - Math.max(16 * scale, this.methods.length * 16 * scale + this.padding * scale);
    ctx.beginPath();
    ctx.moveTo(x, sepY);
    ctx.lineTo(x + w, sepY);
    ctx.stroke();

    let my = sepY + this.padding * scale;
    for (const m of this.methods) {
      const params = m.params.map((p) => `${p.name}${p.type ? ":" + p.type : ""}`).join(", ");
      const txt = `${m.visibility} ${m.name}(${params})${m.returnType ? ":" + m.returnType : ""}`;
      ctx.fillText(txt, x + this.padding * scale, my);
      my += 16 * scale;
    }

    ctx.restore();
  }
}

export default InterfaceComponent;

// revive helper similar to ClassComponent
;(InterfaceComponent as any).reviveFromJSON = function (json: any) {
  const c = new InterfaceComponent(json?.name ?? "IExample", json.x ?? 0, json.y ?? 0);
  c.id = json.id ?? c.id;
  c.width = json.width ?? c.width;
  c.height = json.height ?? c.height;
  c.attributes = json.attributes ?? [];
  c.methods = json.methods ?? [];
  return c;
};
