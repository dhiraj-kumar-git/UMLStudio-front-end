

export abstract class DiagramComponent {
  id: string;
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.id = crypto.randomUUID();
    this.x = x;
    this.y = y;
  }

  // Rendering is UI-framework-specific. Return type kept generic to avoid coupling the model
  // to React JSX typings in a plain .ts model file.
  abstract render(): any;
}
