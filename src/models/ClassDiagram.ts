import { Diagram } from "./Diagram";
import { UMLClass } from "./UMLClass";
import { UMLClassAssociation } from "./UMLClassAssociation";

export class ClassDiagram extends Diagram {
  classes: UMLClass[] = [];
  associations: UMLClassAssociation[] = [];

  constructor(name: string) {
    super(name, "CLASS");
  }

  validate(): boolean {
    return this.classes.length > 0;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      classes: this.classes,
      associations: this.associations
    };
  }
}
