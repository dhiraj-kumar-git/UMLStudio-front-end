import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { DiagramSession } from "../sessions/DiagramSession";
import { UMLClass } from "../models/UMLClass";
import { useProjectContext } from "./ProjectContext";

interface DiagramContextValue {
  session?: DiagramSession;
  setSession: (s?: DiagramSession) => void;
  addClassBox: (opts?: { x?: number; y?: number; name?: string }) => void;
  updateComponentPosition: (id: string, x: number, y: number) => void;
  updateComponentData: (id: string, data: any) => void;
  removeComponent: (id: string) => void;
  openDiagram: (id: string) => void;
  closeDiagram: () => void;
  saveContext: () => Promise<void>;
}

const DiagramContext = createContext<DiagramContextValue>({
  setSession: () => {},
  addClassBox: () => {},
  updateComponentPosition: () => {},
  updateComponentData: () => {},
  removeComponent: () => {},
  openDiagram: () => {},
  closeDiagram: () => {},
  saveContext: async () => {},
});

export const DiagramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<DiagramSession | undefined>(undefined);
  const { projectSession } = useProjectContext();

  useEffect(() => {
    // DiagramSession instances are stored/managed by ProjectSession.
    // Keep DiagramContext lightweight: it only stores the current session reference.
  }, [session]);

  const persistIfNeeded = () => {
    try {
      projectSession?.persist();
    } catch {}
  };

  // save the current context (session) into projectSession and localStorage
  const saveContext = async () => {
    if (!session) return;
    try {
      // ensure projectSession contains this diagram
      if (projectSession) {
        projectSession.diagrams.set(session.id, session);
        await projectSession.persist();
      }
      // also keep a lightweight backup in localStorage to avoid losing context on reload
      try {
        const key = `ctx-${projectSession?.project.id ?? "global"}-${session.id}`;
        localStorage.setItem(key, JSON.stringify(session.toJSON()));
      } catch {}
    } catch (err) {
      // swallow for now
    }
  };

  const openDiagram = (id: string) => {
    if (!projectSession) return;
    // persist current session before switching
    try {
      if (session) projectSession.diagrams.set(session.id, session);
      projectSession.persist();
    } catch {}
    const next = projectSession.getDiagram(id);
    if (!next) return;
    // if there is a backup in localStorage load it into the session
    try {
      const key = `ctx-${projectSession.project.id}-${next.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const restored = DiagramSession.fromJSON(parsed);
        // replace components in next with restored components
        next.components = restored.components;
      }
    } catch {}
    setSession(next);
  };

  const closeDiagram = () => {
    // persist and clear the context
    saveContext();
    setSession(undefined);
  };

  const addClassBox = (opts?: { x?: number; y?: number; name?: string }) => {
    // ensure a diagram session exists; create one if missing
    let targetSession = session;
    if (!targetSession) {
      if (projectSession) {
        targetSession = projectSession.createDiagram(opts?.name ? `${opts.name}-diagram` : "Untitled Diagram", "CLASS");
        setSession(targetSession);
      } else {
        targetSession = new DiagramSession(opts?.name ? `${opts.name}-diagram` : "Untitled Diagram", "CLASS");
        setSession(targetSession);
      }
    }

    if (!targetSession) return;

    const x = opts?.x ?? 100;
    const y = opts?.y ?? 100;
    const name = opts?.name ?? "NewClass";
    const cls = new UMLClass(name, [], [], { x, y });
    const comp = {
      id: cls.id,
      kind: "UMLClass",
      model: cls,
      x,
      y,
      width: 160,
      height: 100,
    } as any;
    targetSession.addComponent(comp as any);
    // if we created a new session object different from state 'session', update state accordingly
    setSession(Object.assign(Object.create(Object.getPrototypeOf(targetSession)), targetSession));
    persistIfNeeded();
  };

  const updateComponentPosition = (id: string, x: number, y: number) => {
    if (!session) return;
    const c = session.components.find((p: any) => p.id === id) as any;
    if (!c) return;
    c.x = x;
    c.y = y;
    if (c.model && typeof c.model.moveTo === "function") c.model.moveTo(x, y);
    setSession(Object.assign(Object.create(Object.getPrototypeOf(session)), session));
    persistIfNeeded();
  };

  const updateComponentData = (id: string, data: any) => {
    if (!session) return;
    const c = session.components.find((p: any) => p.id === id) as any;
    if (!c) return;
    Object.assign(c.model, data);
    setSession(Object.assign(Object.create(Object.getPrototypeOf(session)), session));
    persistIfNeeded();
  };

  const removeComponent = (id: string) => {
    if (!session) return;
    session.removeComponent(id);
    setSession(Object.assign(Object.create(Object.getPrototypeOf(session)), session));
    persistIfNeeded();
  };

  // keep a localStorage backup whenever session changes
  useEffect(() => {
    if (!session) return;
    try {
      const key = `ctx-${projectSession?.project.id ?? "global"}-${session.id}`;
      localStorage.setItem(key, JSON.stringify(session.toJSON()));
    } catch {}
  }, [session]);

  return (
    <DiagramContext.Provider
      value={{
        session,
        setSession,
        addClassBox,
        updateComponentPosition,
        updateComponentData,
        removeComponent,
        openDiagram,
        closeDiagram,
        saveContext,
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
};

export const useDiagramContext = () => useContext(DiagramContext);

export default DiagramContext;
