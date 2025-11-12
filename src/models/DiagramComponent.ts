// Each DiagramComponent has a position and can be moved around. It also has a size and a shape. 
// The rendering of the Diagram Component based on its properties is to be done by the diagramContext.


export class Position {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export abstract class DiagramComponent {
  id: string;
  position: Position;

  constructor(position: Position) {
    this.id = crypto.randomUUID();
    this.position = position;
  }

  moveTo(x: number, y: number) {
    this.position = { x, y };
  }

  moveBy(dx: number, dy: number) {
    this.position = { x: this.position.x + dx, y: this.position.y + dy };
  }

  setPosition(position: Position) {
    this.position = { ...position };
  }

  // Rendering is UI-framework-specific. Return type kept generic to avoid coupling the model
  // to React JSX typings in a plain .ts model file.
  abstract render(): any;
}
