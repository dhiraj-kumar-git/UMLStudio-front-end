export type CanvasOptions = {
  cellSize?: number;
  majorEvery?: number;
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
};

export class CanvasModel {
  cellSize: number;
  majorEvery: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  minScale: number;
  maxScale: number;

  constructor(opts: CanvasOptions = {}) {
    this.cellSize = opts.cellSize ?? 64;
    this.majorEvery = opts.majorEvery ?? 10;
    this.scale = opts.initialScale ?? 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.minScale = opts.minScale ?? 0.1;
    this.maxScale = opts.maxScale ?? 5;
  }

  zoom(factor: number, centerX = 0, centerY = 0) {
    const prev = this.scale;
    const next = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
    // adjust offsets so the zoom keeps the center point stable
    this.offsetX = centerX - ((centerX - this.offsetX) * next) / prev;
    this.offsetY = centerY - ((centerY - this.offsetY) * next) / prev;
    this.scale = next;
  }

  pan(dx: number, dy: number) {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  reset() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  toJSON() {
    return {
      cellSize: this.cellSize,
      majorEvery: this.majorEvery,
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      minScale: this.minScale,
      maxScale: this.maxScale,
    };
  }

  static fromJSON(json: any) {
    const m = new CanvasModel({
      cellSize: json?.cellSize,
      majorEvery: json?.majorEvery,
      initialScale: json?.scale,
      minScale: json?.minScale,
      maxScale: json?.maxScale,
    });
    m.offsetX = json?.offsetX ?? 0;
    m.offsetY = json?.offsetY ?? 0;
    return m;
  }
}
