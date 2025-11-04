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
}

const DiagramContext = createContext<DiagramContextValue>({
  setSession: () => {},
  addClassBox: () => {},
  updateComponentPosition: () => {},
  updateComponentData: () => {},
  removeComponent: () => {},
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

  return (
    <DiagramContext.Provider value={{ session, setSession, addClassBox, updateComponentPosition, updateComponentData, removeComponent }}>
      {children}
    </DiagramContext.Provider>
  );
};

export const useDiagramContext = () => useContext(DiagramContext);

export default DiagramContext;
