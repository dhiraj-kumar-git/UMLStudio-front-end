import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import Project from "../models/Project";
import DiagramSession from "../models/DiagramSession";
import * as api from "../api.config";

type ProjectContextValue = {
  project: Project | null;
  loadProject: () => Promise<void>;
  saveProject: () => Promise<void>;
  createProject: (name: string, description?: string, accessPolicy?: "Developer" | "Viewer") => Promise<Project>;
  addDiagramToProject: (session: DiagramSession) => Promise<void>;
  deleteProject: () => Promise<void>;
  // clear only the in-memory project context without deleting persisted storage
  clearProjectContext: () => void;
  // set project state from a full ProjectJSON (used after server save)
  setProjectFromJSON: (json: any) => void;
};

const Ctx = createContext<ProjectContextValue | null>(null);

export const useProjectContext = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useProjectContext must be used within ProjectProvider");
  return c;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<Project | null>(() => Project.loadFromLocalStore());

  const loadProject = async () => {
    try {
      const p = await api.getProject();
      if (p) {
        const loaded = Project.fromJSON(p);
        setProject(loaded);
        // eslint-disable-next-line no-console
        console.log("ProjectProvider: loaded project from API ->", loaded.toJSON());
        return;
      }
      // fallback to local store when API doesn't return a project
      const recovered = Project.loadFromLocalStore();
      if (recovered) {
        setProject(recovered);
        // eslint-disable-next-line no-console
        console.log("ProjectProvider: loaded project from local store ->", recovered.toJSON());
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("ProjectProvider.loadProject failed", err);
    }
  };

  const saveProject = async () => {
    if (!project) return;
    try {
      const payload = project.toSavePayload();
      const resp = await api.saveProject(payload as any);
      // if server returned a canonical projectId, update local project
      try {
        const projectId = resp?.projectId ?? resp?.result?.projectId ?? null;
        if (projectId) {
          project.markSynced(projectId);
        }
      } catch {}
      // also mirror to local store for quick recovery
      Project.saveToLocalStore(project.toJSON());
      // eslint-disable-next-line no-console
      console.log("ProjectProvider: saved project ->", project.toJSON(), resp);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("ProjectProvider.saveProject failed", err);
    }
  };

  const createProject = async (name: string, description?: string, accessPolicy: "Developer" | "Viewer" = "Developer") => {
    const p = new Project(name, description, accessPolicy);
    setProject(p);
    try {
      const resp = await api.saveProject(p.toSavePayload() as any);
      // update id if server provided one
      try {
        const projectId = resp?.projectId ?? resp?.result?.projectId ?? null;
        if (projectId) p.markSynced(projectId);
      } catch {}
      Project.saveToLocalStore(p.toJSON());
      // eslint-disable-next-line no-console
      console.log("ProjectProvider: created project ->", p.toJSON(), resp);
    } catch (err) {
      // fallback: persist locally
      try { Project.saveToLocalStore(p.toJSON()); } catch {}
      // eslint-disable-next-line no-console
      console.warn("ProjectProvider.createProject: remote save failed, persisted locally", err);
    }
    return p;
  };

  const addDiagramToProject = async (session: DiagramSession) => {
    // Use a local reference so we don't rely on stale closure state
    let current = project;
    if (!current) {
      // Try to recover a project that may have just been created and persisted to storage
      try {
        const recovered = Project.loadFromLocalStore();
        if (recovered) {
          current = recovered;
          setProject(recovered);
        }
      } catch (err) {
        // ignore
      }
    }

    if (!current) {
      // eslint-disable-next-line no-console
      console.warn("ProjectProvider: no project open; creating a default project");
      current = await createProject("Project (auto)");
    }
    if (!current) return;
    current.addDiagram(session);
    // ensure state is updated with the mutated project instance
    setProject(current);
    // persist via API
  await api.saveProject(current.toSavePayload() as any);
  Project.saveToLocalStore(current.toJSON());
    // eslint-disable-next-line no-console
    console.log("ProjectProvider: added diagram to project ->", session.toJSON());
  };

  const deleteProject = async () => {
    if (!project) return;
    try {
      // remove diagram sessions referenced by this project
      try {
        // import DiagramSession statically to call removeById
        // use dynamic import to avoid top-level circular deps
        import("../models/DiagramSession").then((mod) => {
          const DS = (mod as any).default;
          if (DS && typeof DS.removeById === "function") {
            project.diagrams.forEach((d) => {
              try {
                DS.removeById((d as any).id);
              } catch (e) {
                // ignore per-diagram removal errors
              }
            });
          }
        }).catch(() => {
          // ignore
        });
      } catch (err) {
        // ignore
      }

      // remove project from localStorage and clear context
      try {
        localStorage.removeItem(Project.STORAGE_KEY);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("ProjectProvider.deleteProject: failed to remove localStorage key", err);
      }
      setProject(null);
      // eslint-disable-next-line no-console
      console.log("ProjectProvider: deleted project and cleared context");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("ProjectProvider.deleteProject failed", err);
    }
  };

  const clearProjectContext = () => {
    try {
      setProject(null);
      // eslint-disable-next-line no-console
      console.log("ProjectProvider: cleared project context (non-destructive)");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("ProjectProvider.clearProjectContext failed", err);
    }
  };

  const setProjectFromJSON = (json: any) => {
    try {
      const p = Project.fromJSON(json as any);
      setProject(p);
      try { Project.saveToLocalStore(p.toJSON()); } catch {}
      // eslint-disable-next-line no-console
      console.log("ProjectProvider: set project from JSON ->", p.toJSON());
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("ProjectProvider.setProjectFromJSON failed", err);
    }
  };

  // auto-save project on unload
  useEffect(() => {
    const onUnload = async () => {
      if (project) {
        try {
              await api.saveProject(project.toSavePayload() as any);
              Project.saveToLocalStore(project.toJSON());
          // eslint-disable-next-line no-console
          console.log("ProjectProvider: auto-saved project on unload ->", project.toJSON());
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("ProjectProvider: auto-save failed", err);
        }
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [project]);

  // Keep project diagram entries in sync when sessions update elsewhere
  useEffect(() => {
    const onSessionUpdated = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent)?.detail;
        let sid: string | null = null;
        if (detail && typeof detail === 'object') {
          // detail may contain the session JSON or a simple notification
          sid = (detail as any).id ?? (detail as any).requestId ?? (detail as any).diagramId ?? (detail as any).deletedDiagramId ?? null;
        }
        // if we can determine a session id, attempt to load the latest session and merge into project
        if (sid && project) {
          try {
            const latest = DiagramSession.loadById(sid);
            if (latest) {
              const idx = project.diagrams.findIndex((d) => (d as any).id === sid);
              if (idx >= 0) {
                project.diagrams[idx] = latest as any;
                // persist immediately to local store and API (use save payload so new projects send id=null)
                const payload = project.toSavePayload();
                Project.saveToLocalStore(project.toJSON());
                api.saveProject(payload).catch(() => {});
              }
            }
          } catch (err) {
            // ignore per-session sync errors
          }
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('uml:session-updated', onSessionUpdated as EventListener);
    return () => window.removeEventListener('uml:session-updated', onSessionUpdated as EventListener);
  }, [project]);

  const val: ProjectContextValue = useMemo(() => ({ project, loadProject, saveProject, createProject, addDiagramToProject, deleteProject, clearProjectContext, setProjectFromJSON }), [project]);

  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
};

export default Ctx;
