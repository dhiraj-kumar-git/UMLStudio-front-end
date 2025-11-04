// models/components/UseCase.ts
import { v4 as uuidv4 } from "uuid";
import type { Position } from "./Actor";

export class UseCase {
  id: string;
  name: string;
  description?: string;
  stereotype?: string; // e.g. "Service", "Subsystem", etc.
  systemBoundary?: string; // e.g. "Payment System"
  position: Position;

  constructor(
    name: string,
    position: Position = { x: 0, y: 0 },
    stereotype?: string,
    systemBoundary?: string,
    description?: string
  ) {
    this.id = uuidv4();
    this.name = name;
    this.position = position;
    this.stereotype = stereotype;
    this.systemBoundary = systemBoundary;
    this.description = description;
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
      description: this.description,
      stereotype: this.stereotype,
      systemBoundary: this.systemBoundary,
      position: this.position
    };
  }
}
