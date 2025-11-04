import { DiagramComponent } from "./DiagramComponent";
export type DiagramType = "CLASS" | "USE_CASE";

export abstract class Diagram {
  id: string;
  name: string;
  type: DiagramType;
  components: DiagramComponent[];

  constructor(name: string, type: DiagramType) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.type = type;
    this.components = [];
  }

  abstract validate(): boolean;
  abstract toJSON(): any;
}
