import { DiagramSession } from "./DiagramSession";
import { Project } from "../models/Project";
import localforage from "localforage";

export class ProjectSession {
  project: Project;
  diagrams: Map<string, DiagramSession> = new Map();

  constructor(project: Project) {
    this.project = project;
  }

  createDiagram(name: string, type: "CLASS" | "USE_CASE") {
    const diagram = new DiagramSession(name, type);
    this.diagrams.set(diagram.id, diagram);
    this.persist();
    return diagram;
  }

  getDiagram(id: string) {
    return this.diagrams.get(id);
  }

  switchDiagram(id: string) {
    this.persist();
    return this.diagrams.get(id);
  }

  async persist() {
    await localforage.setItem(`project-${this.project.id}`, this.toJSON());
  }

  async load() {
    const data = await localforage.getItem(`project-${this.project.id}`);
    if (!data) return;
    const parsed = data as any;
    parsed.diagrams.forEach((d: any) => {
      this.diagrams.set(d.id, DiagramSession.fromJSON(d));
    });
  }

  toJSON() {
    return {
      project: this.project,
      diagrams: Array.from(this.diagrams.values()).map(d => d.toJSON())
    };
  }
}
