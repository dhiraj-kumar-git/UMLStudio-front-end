// models/components/UMLClassAssociation.ts
import { v4 as uuidv4 } from "uuid";

export type AssociationType =
  | "ASSOCIATION"
  | "AGGREGATION"
  | "COMPOSITION"
  | "INHERITANCE";

export class UMLClassAssociation {
  id: string;
  sourceId: string;
  targetId: string;
  type: AssociationType;
  sourceMultiplicity?: string;
  targetMultiplicity?: string;
  label?: string;

  constructor(
    sourceId: string,
    targetId: string,
    type: AssociationType = "ASSOCIATION",
    sourceMultiplicity?: string,
    targetMultiplicity?: string,
    label?: string
  ) {
    this.id = uuidv4();
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.type = type;
    this.sourceMultiplicity = sourceMultiplicity;
    this.targetMultiplicity = targetMultiplicity;
    this.label = label;
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      type: this.type,
      sourceMultiplicity: this.sourceMultiplicity,
      targetMultiplicity: this.targetMultiplicity,
      label: this.label
    };
  }
}
