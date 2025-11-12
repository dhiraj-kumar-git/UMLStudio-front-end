import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Project } from "../models/Project";
import { ProjectSession } from "../sessions/ProjectSession";

interface ProjectContextValue {
  projectSession?: ProjectSession;
  setProjectSession: (s?: ProjectSession) => void;
  openProject: (project: Project) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue>({
  setProjectSession: () => {},
  openProject: async () => {},
});

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projectSession, setProjectSession] = useState<ProjectSession | undefined>(undefined);

  useEffect(() => {
    // Could load a default project or restore last-opened project id from localStorage here.
  }, []);

  const openProject = async (project: Project) => {
    const ps = new ProjectSession(project);
    setProjectSession(ps);
    try {
      await ps.load();
    } catch {}
  };

  return (
    <ProjectContext.Provider value={{ projectSession, setProjectSession, openProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => useContext(ProjectContext);

export default ProjectContext;
