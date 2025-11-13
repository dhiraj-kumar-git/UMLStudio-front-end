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
      const payload = project.toJSON();
      await api.saveProject(payload);
      // also mirror to local store for quick recovery
      Project.saveToLocalStore(payload);
      // eslint-disable-next-line no-console
      console.log("ProjectProvider: saved project ->", payload);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("ProjectProvider.saveProject failed", err);
    }
  };

  const createProject = async (name: string, description?: string, accessPolicy: "Developer" | "Viewer" = "Developer") => {
    const p = new Project(name, description, accessPolicy);
    setProject(p);
    await api.saveProject(p.toJSON());
    Project.saveToLocalStore(p.toJSON());
    // eslint-disable-next-line no-console
    console.log("ProjectProvider: created project ->", p.toJSON());
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
    await api.saveProject(current.toJSON());
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

  // auto-save project on unload
  useEffect(() => {
    const onUnload = async () => {
      if (project) {
        try {
          await api.saveProject(project.toJSON());
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
                // persist immediately to local store and API
                const payload = project.toJSON();
                Project.saveToLocalStore(payload);
                api.saveProject(payload).catch(() => {});
                // update state to re-render with fresh object
                setProject(Project.fromJSON(payload));
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

  const val: ProjectContextValue = useMemo(() => ({ project, loadProject, saveProject, createProject, addDiagramToProject, deleteProject }), [project]);

  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
};

export default Ctx;
