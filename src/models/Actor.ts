// models/components/Actor.ts
import { v4 as uuidv4 } from "uuid";

export interface Position {
  x: number;
  y: number;
}

export class Actor {
  id: string;
  name: string;
  stereotype?: string; // e.g. "External System", "User"
  position: Position;

  constructor(name: string, position: Position = { x: 0, y: 0 }, stereotype?: string) {
    this.id = uuidv4();
    this.name = name;
    this.position = position;
    this.stereotype = stereotype;
  }

  rename(newName: string) {
    this.name = newName;
  }

  moveTo(x: number, y: number) {
    this.position = { x, y };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      stereotype: this.stereotype,
      position: this.position
    };
  }
}
