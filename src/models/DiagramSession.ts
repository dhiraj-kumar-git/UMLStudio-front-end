export type StoredDiagramSession = {
  id: string;
  name?: string;
  createdAt: string;
  modifiedAt: string;
  diagramJSON: any;
};

export class DiagramSession {
  id: string;
  name?: string;
  createdAt: Date;
  modifiedAt: Date;
  diagramJSON: any;

  static STORAGE_KEY = "umlstudio.diagram.sessions";

  constructor(diagramJSON: any, name?: string, id?: string) {
    this.id = id ?? (typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2, 9));
    this.name = name;
    this.createdAt = new Date();
    this.modifiedAt = new Date();
    this.diagramJSON = diagramJSON ?? {};
  }

  touch() {
    this.modifiedAt = new Date();
  }

  toJSON(): StoredDiagramSession {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt.toISOString(),
      modifiedAt: this.modifiedAt.toISOString(),
      diagramJSON: this.diagramJSON,
    };
  }

  static fromJSON(json: StoredDiagramSession) {
    const s = new DiagramSession(json.diagramJSON, json.name, json.id);
    s.createdAt = new Date(json.createdAt);
    s.modifiedAt = new Date(json.modifiedAt);
    return s;
  }

  saveToLocalStorage() {
    const all = DiagramSession.loadAllRaw();
    const idx = all.findIndex((x) => x.id === this.id);
    const payload = this.toJSON();
    if (idx >= 0) all[idx] = payload; else all.push(payload);
    try {
      localStorage.setItem(DiagramSession.STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("DiagramSession.saveToLocalStorage failed:", err);
    }
    // also return the saved payload for convenience
    return payload;
  }

  static loadAllRaw(): StoredDiagramSession[] {
    try {
      const raw = localStorage.getItem(DiagramSession.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StoredDiagramSession[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("DiagramSession.loadAllRaw failed:", err);
      return [];
    }
  }

  static loadAll(): DiagramSession[] {
    return DiagramSession.loadAllRaw().map((r) => DiagramSession.fromJSON(r));
  }

  static loadById(id: string): DiagramSession | null {
    const all = DiagramSession.loadAllRaw();
    const found = all.find((x) => x.id === id);
    return found ? DiagramSession.fromJSON(found) : null;
  }

  static removeById(id: string) {
    const all = DiagramSession.loadAllRaw().filter((x) => x.id !== id);
    try {
      localStorage.setItem(DiagramSession.STORAGE_KEY, JSON.stringify(all));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("DiagramSession.removeById failed:", err);
    }
  }
}

export default DiagramSession;
