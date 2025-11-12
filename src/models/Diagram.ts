import { DiagramComponent } from "./DiagramComponent";
import DiagramAssociation from "./DiagramAssociation";

export type DiagramJSON = {
  id: string;
  type?: string;
  name: string;
  description?: string;
  components: any[];
  associations: any[];
};

/**
 * Abstract container for components and associations. Concrete diagram types
 * (UseCaseDiagram, ClassDiagram) enforce which component/association types
 * are allowed.
 */
export abstract class Diagram {
  id: string;
  name: string;
  description?: string;
  components: DiagramComponent[];
  associations: DiagramAssociation[];

  constructor(name: string, description?: string) {
    this.id = (typeof crypto !== "undefined" && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2, 9);
    this.name = name;
    this.description = description;
    this.components = [];
    this.associations = [];
  }

  /** Add a component to the diagram. Concrete subclasses may validate type. */
  addComponent(c: DiagramComponent) {
    this.components.push(c);
    return c;
  }

  getComponentById(id: string) {
    return this.components.find((c) => (c as any).id === id);
  }

  /** Remove a component and any associations that reference it. */
  removeComponentById(id: string) {
    // remove associations referencing this component
    this.associations = this.associations.filter((a) => (a.source as any).id !== id && (a.target as any).id !== id);
    const idx = this.components.findIndex((c) => (c as any).id === id);
    if (idx >= 0) this.components.splice(idx, 1);
  }

  addAssociation(a: DiagramAssociation) {
    this.associations.push(a);
    return a;
  }

  getAssociationById(id: string) {
    return this.associations.find((a) => (a as any).id === id);
  }

  removeAssociationById(id: string) {
    const idx = this.associations.findIndex((a) => (a as any).id === id);
    if (idx >= 0) this.associations.splice(idx, 1);
  }

  /** Dispose of this diagram: cascade-delete components and associations. */
  dispose() {
    // clear arrays (caller should drop references to this Diagram instance)
    this.associations.length = 0;
    this.components.length = 0;
  }

  toJSON(): DiagramJSON {
    return {
      id: this.id,
      type: (this as any).constructor?.name,
      name: this.name,
      description: this.description,
      components: this.components.map((c) => (c as any).toJSON ? (c as any).toJSON() : { id: (c as any).id }),
      associations: this.associations.map((a) => (a as any).toJSON ? (a as any).toJSON() : { id: (a as any).id }),
    };
  }
}

export default Diagram;
