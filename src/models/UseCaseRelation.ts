// models/components/UseCaseRelation.ts
import { v4 as uuidv4 } from "uuid";

export type UseCaseRelationType = "ASSOCIATION" | "INCLUDE" | "EXTEND" | "USES";

export class UseCaseRelation {
  id: string;
  sourceId: string; // can be actor or use case
  targetId: string; // can be actor or use case
  type: UseCaseRelationType;
  label?: string; // e.g. <<include>>, <<extend>>

  constructor(sourceId: string, targetId: string, type: UseCaseRelationType = "ASSOCIATION", label?: string) {
    this.id = uuidv4();
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.type = type;
    this.label = label ?? this.getDefaultLabel(type);
  }

  private getDefaultLabel(type: UseCaseRelationType): string {
    switch (type) {
      case "INCLUDE":
        return "<<include>>";
      case "EXTEND":
        return "<<extend>>";
      case "USES":
        return "<<uses>>";
      default:
        return "";
    }
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      type: this.type,
      label: this.label
    };
  }
}
