import { DiagramComponent } from "../models/DiagramComponent";

export class ComponentRenderer {
  ctx: CanvasRenderingContext2D;
  scale: number;

  constructor(ctx: CanvasRenderingContext2D, scale = 1) {
    this.ctx = ctx;
    this.scale = scale;
  }

  setScale(s: number) {
    this.scale = s;
  }

  render(component: DiagramComponent) {
    const anyComp = component as any;
    if (typeof anyComp.draw === "function") {
      anyComp.draw(this.ctx, this.scale);
    }

  }
}
