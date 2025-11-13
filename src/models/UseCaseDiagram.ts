import Diagram from "./Diagram";
import { DiagramComponent } from "./DiagramComponent";
import DiagramAssociation from "./DiagramAssociation";
import { UseCaseComponent } from "./UseCaseComponent";
import { ActorComponent } from "./ActorComponent";
import SystemBoundary from "./SystemBoundary";
import { UseCaseAssociation } from "./UseCaseAssociation";
import { ActorUseCaseAssociation } from "./ActorUseCaseAssociation";

/**
 * Container for Use Case diagrams. Allowed components: UseCaseComponent,
 * ActorComponent, SystemBoundary. Allowed associations: UseCaseAssociation,
 * ActorUseCaseAssociation.
 */
export class UseCaseDiagram extends Diagram {
  constructor(name: string, description?: string) {
    super(name, description);
  }

  addComponent(c: DiagramComponent) {
    if (c instanceof UseCaseComponent || c instanceof ActorComponent || c instanceof SystemBoundary) {
      return super.addComponent(c);
    }
    // runtime guard — refuse other types
    // eslint-disable-next-line no-console
    console.warn("UseCaseDiagram: attempted to add unsupported component type", (c as any).constructor?.name);
    return null as any;
  }

  addAssociation(a: DiagramAssociation) {
    if (a instanceof UseCaseAssociation || a instanceof ActorUseCaseAssociation) {
      return super.addAssociation(a);
    }
    // eslint-disable-next-line no-console
    console.warn("UseCaseDiagram: attempted to add unsupported association type", (a as any).constructor?.name);
    return null as any;
  }
}

export default UseCaseDiagram;
