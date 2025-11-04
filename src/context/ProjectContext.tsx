import React, { createContext, useContext, useState, useEffect } from "react";
import { ProjectSession } from "../sessions/ProjectSession";

interface ProjectContextValue {
  projectSession?: ProjectSession;
  setProjectSession: (p?: ProjectSession) => void;
}

const ProjectContext = createContext<ProjectContextValue>({
  setProjectSession: () => {}
});

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectSession, setProjectSession] = useState<ProjectSession>();

  useEffect(() => {
    if (projectSession) projectSession.persist();
  }, [projectSession]);

  return (
    <ProjectContext.Provider value={{ projectSession, setProjectSession }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => useContext(ProjectContext);
