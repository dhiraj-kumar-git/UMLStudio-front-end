

export abstract class DiagramComponent {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width = 100, height = 60) {
    this.id = crypto.randomUUID();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  moveTo(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  boundingBox() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  containsPoint(px: number, py: number) {
    const b = this.boundingBox();
    return px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height;
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      type: (this as any).type ?? "component",
    };
  }

  // Rendering: components can draw themselves onto a CanvasRenderingContext2D.
  // Implementations should provide draw(ctx, scale) to describe how the component is painted.
  abstract draw(ctx: CanvasRenderingContext2D, scale?: number): void;
}
