import DiagramSession from "./DiagramSession";
import type { StoredDiagramSession } from "./DiagramSession";

export type AccessPolicy = "Developer" | "Viewer";

export type ProjectJSON = {
  id: string;
  name: string;
  description?: string;
  accessPolicy: AccessPolicy;
  createdAt: string;
  diagrams: StoredDiagramSession[];
};

export class Project {
  id: string;
  name: string;
  description?: string;
  accessPolicy: AccessPolicy;
  createdAt: Date;
  diagrams: DiagramSession[];

  static STORAGE_KEY = "umlstudio.project";

  constructor(name: string, description?: string, accessPolicy: AccessPolicy = "Developer", createdAt?: Date, id?: string) {
    this.id = id ?? (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2, 9));
    this.name = name;
    this.description = description;
    this.accessPolicy = accessPolicy ?? "Developer";
    this.createdAt = createdAt ?? new Date();
    this.diagrams = [];
  }

  addDiagram(session: DiagramSession) {
    this.diagrams.push(session);
    return session;
  }

  removeDiagramById(id: string) {
    const idx = this.diagrams.findIndex((d) => d.id === id);
    if (idx >= 0) this.diagrams.splice(idx, 1);
  }

  toJSON(): ProjectJSON {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      accessPolicy: this.accessPolicy,
      createdAt: this.createdAt.toISOString(),
      diagrams: this.diagrams.map((d) => d.toJSON()),
    };
  }

  static fromJSON(json: ProjectJSON) {
    const p = new Project(json.name, json.description, json.accessPolicy, new Date(json.createdAt), json.id);
    p.diagrams = (json.diagrams || []).map((ds) => DiagramSession.fromJSON(ds));
    return p;
  }

  static saveToLocalStore(projectJSON: ProjectJSON) {
    try {
      localStorage.setItem(Project.STORAGE_KEY, JSON.stringify(projectJSON));
      // eslint-disable-next-line no-console
      console.log("Project.saveToLocalStore ->", projectJSON);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Project.saveToLocalStore failed", err);
    }
  }

  static loadFromLocalStore(): Project | null {
    try {
      const raw = localStorage.getItem(Project.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ProjectJSON;
      return Project.fromJSON(parsed);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Project.loadFromLocalStore failed", err);
      return null;
    }
  }
}

export default Project;
