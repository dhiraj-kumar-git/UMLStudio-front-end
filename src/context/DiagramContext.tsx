import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import DiagramSession from "../models/DiagramSession";
import type { StoredDiagramSession } from "../models/DiagramSession";

type DiagramContextValue = {
  sessions: DiagramSession[];
  currentSession: DiagramSession | null;
  openSessionById: (id: string) => void;
  createSession: (name?: string, diagramJSON?: any) => DiagramSession;
  updateCurrent: (patch: Partial<StoredDiagramSession>) => void;
  saveCurrent: () => void;
  closeCurrent: () => void;
};

const Ctx = createContext<DiagramContextValue | null>(null);

export const useDiagramContext = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDiagramContext must be used within DiagramProvider");
  return c;
};

export const DiagramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<DiagramSession[]>(() => DiagramSession.loadAll());
  const [currentId, setCurrentId] = useState<string | null>(() => {
    // prefer last session if any
    const s = sessions[0];
    return s ? s.id : null;
  });

  useEffect(() => {
    // keep in sync with localStorage if other tabs change
    const onStorage = (e: StorageEvent) => {
      if (e.key === DiagramSession.STORAGE_KEY) {
        setSessions(DiagramSession.loadAll());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    // ensure we persist sessions array when it changes
    try {
      // nothing to do: sessions are persisted per-session when saved; but reflect list
      // eslint-disable-next-line no-console
      console.log("DiagramProvider: sessions updated ->", sessions.map((s) => s.toJSON()));
    } catch {}
  }, [sessions]);

  // create a new session and make it current
  const createSession = (name?: string, diagramJSON?: any) => {
    const defaulted = Object.assign({}, diagramJSON ?? {});
    if (!defaulted.type) defaulted.type = "UseCaseDiagram";
    const s = new DiagramSession(defaulted, name);
    s.saveToLocalStorage();
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
    // eslint-disable-next-line no-console
    console.log("DiagramProvider: created session ->", s.toJSON());
    return s;
  };

  const openSessionById = (id: string) => {
    const s = DiagramSession.loadById(id);
    if (s) {
      setCurrentId(s.id);
      // eslint-disable-next-line no-console
      console.log("DiagramProvider: opened session ->", s.toJSON());
    }
  };

  const currentSession = useMemo(() => (currentId ? DiagramSession.loadById(currentId) : null), [currentId, sessions]);

  const updateCurrent = (patch: Partial<StoredDiagramSession>) => {
    const cs = currentSession;
    if (!cs) return;
    if (patch.name !== undefined) cs.name = patch.name;
    if (patch.diagramJSON !== undefined) cs.diagramJSON = patch.diagramJSON;
    cs.touch();
    cs.saveToLocalStorage();
    setSessions((prev) => {
      const next = prev.filter((x) => x.id !== cs.id);
      return [cs, ...next];
    });
    // eslint-disable-next-line no-console
    console.log("DiagramProvider: updated current session ->", cs.toJSON());
  };

  const saveCurrent = () => {
    const cs = currentSession;
    if (!cs) return;
    cs.touch();
    const payload = cs.saveToLocalStorage();
    setSessions((prev) => {
      const next = prev.filter((x) => x.id !== cs.id);
      return [cs, ...next];
    });
    // eslint-disable-next-line no-console
    console.log("DiagramProvider: saved current session ->", payload);
  };

  const closeCurrent = () => {
    setCurrentId(null);
    // eslint-disable-next-line no-console
    console.log("DiagramProvider: closed current session");
  };

  // auto-save on unload
  useEffect(() => {
    const onUnload = () => {
      try {
        const cs = currentSession;
        if (cs) {
          cs.touch();
          cs.saveToLocalStorage();
          // eslint-disable-next-line no-console
          console.log("DiagramProvider: auto-saved session on unload ->", cs.toJSON());
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("DiagramProvider: auto-save failed", err);
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [currentSession]);

  const val: DiagramContextValue = {
    sessions,
    currentSession,
    openSessionById,
    createSession,
    updateCurrent,
    saveCurrent,
    closeCurrent,
  };

  // Expose a small debug API on window for quick testing in the browser console.
  useEffect(() => {
    try {
      (window as any).__umlDiagramAPI = {
        createSession: (name?: string, diagramJSON?: any) => createSession(name, diagramJSON),
        openSessionById: (id: string) => openSessionById(id),
        listSessions: () => DiagramSession.loadAll().map((s) => s.toJSON()),
        saveCurrent: () => saveCurrent(),
        updateCurrent: (patch: Partial<StoredDiagramSession>) => updateCurrent(patch),
        closeCurrent: () => closeCurrent(),
      };
      // eslint-disable-next-line no-console
      console.log("DiagramProvider: __umlDiagramAPI exposed on window for testing");
    } catch {}
    return () => {
      try {
        delete (window as any).__umlDiagramAPI;
      } catch {}
    };
  }, [sessions, currentSession]);

  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
};

export default Ctx;
