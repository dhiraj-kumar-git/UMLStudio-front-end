// sessions/UserSession.ts
import { User } from "../models/User";
import { ProjectSession } from "./ProjectSession";
import { Project } from "../models/Project";

export class UserSession {
  user: User;
  activeProject?: ProjectSession;

  constructor(user: User) {
    this.user = user;
  }

  openProject(projectData: any) {
    // Normalize incoming project data into a Project model instance.
    const proj = new Project(
      projectData?.id ?? crypto.randomUUID(),
      projectData?.name ?? "Untitled Project",
      projectData?.description ?? "",
      projectData?.createdAt ?? new Date().toISOString(),
      projectData?.updatedAt ?? new Date().toISOString()
    );
    this.activeProject = new ProjectSession(proj);
  }

  closeProject() {
    this.activeProject?.persist();
    this.activeProject = undefined;
  }

  logout() {
    this.activeProject?.persist();
    this.activeProject = undefined;
    localStorage.clear();
  }
}
