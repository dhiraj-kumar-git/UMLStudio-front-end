
import { Diagram } from "./Diagram";
import { Actor } from "./Actor";
import { UseCase } from "./UseCase";

export class UseCaseDiagram extends Diagram {
  actors: Actor[] = [];
  useCases: UseCase[] = [];

  constructor(name: string) {
    super(name, "USE_CASE");
  }

  validate(): boolean {
    return this.useCases.length > 0;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      actors: this.actors,
      useCases: this.useCases
    };
  }
}
