import Diagram from "./Diagram";
import { DiagramComponent } from "./DiagramComponent";
import DiagramAssociation from "./DiagramAssociation";
import { ClassComponent } from "./ClassComponent";
import { InterfaceComponent } from "./InterfaceComponent";
import { ClassAssociation } from "./ClassAssociation";

/**
 * Container for Class diagrams. Allowed components: ClassComponent,
 * InterfaceComponent. Allowed associations: ClassAssociation.
 */
export class ClassDiagram extends Diagram {
  constructor(name: string, description?: string) {
    super(name, description);
  }

  addComponent(c: DiagramComponent) {
    if (c instanceof ClassComponent || c instanceof InterfaceComponent) {
      return super.addComponent(c);
    }
    // eslint-disable-next-line no-console
    console.warn("ClassDiagram: attempted to add unsupported component type", (c as any).constructor?.name);
    return null as any;
  }

  addAssociation(a: DiagramAssociation) {
    if (a instanceof ClassAssociation) return super.addAssociation(a);
    // eslint-disable-next-line no-console
    console.warn("ClassDiagram: attempted to add unsupported association type", (a as any).constructor?.name);
    return null as any;
  }
}

export default ClassDiagram;
