import type { DiagramType } from "../models/Diagram";
import type { DiagramComponent } from "../models/DiagramComponent";

export class DiagramSession {
  id: string;
  name: string;
  type: DiagramType;
  components: DiagramComponent[];
  lastModified: number;

  constructor(name: string, type: DiagramType) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.type = type;
    this.components = [];
    this.lastModified = Date.now();
  }

  addComponent(component: DiagramComponent) {
    this.components.push(component);
    this.lastModified = Date.now();
  }

  removeComponent(id: string) {
    this.components = this.components.filter(c => c.id !== id);
    this.lastModified = Date.now();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      components: this.components,
      lastModified: this.lastModified
    };
  }

  static fromJSON(data: any): DiagramSession {
    const d = new DiagramSession(data.name, data.type);
    d.id = data.id;
    d.components = data.components;
    d.lastModified = data.lastModified;
    return d;
  }
}
