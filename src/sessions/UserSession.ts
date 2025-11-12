// sessions/UserSession.ts
import { User } from "../models/User";
import { ProjectSession } from "./ProjectSession";
import { Project } from "../models/Project";

export class UserSession {
  user: User;
  activeProject?: ProjectSession;
  activeProjectAccessPolicy?: "READ_ONLY" | "READ_WRITE";
  constructor(user: User) {
    this.user = user;
  }

  openProject(projectData: any, accessPolicy: "READ_ONLY" | "READ_WRITE" = "READ_WRITE") {
    const proj = new Project(
      projectData?.id ?? crypto.randomUUID(),
      projectData?.name ?? "Untitled Project",
      projectData?.description ?? "",
      projectData?.createdAt ?? new Date().toISOString()
    );
    this.activeProject = new ProjectSession(proj);
    this.activeProjectAccessPolicy = accessPolicy;
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
