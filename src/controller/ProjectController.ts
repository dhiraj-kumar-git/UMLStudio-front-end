// // controllers/ProjectController.ts
// import { ProjectService } from "../services/ProjectService";
// import { ProjectSession } from "../sessions/ProjectSession";

// export class ProjectController {
//   private service = new ProjectService();

//   async loadProject(projectId: string) {
//     const projectData = await this.service.getProjects();
//     return new ProjectSession(projectData);
//   }

//   async saveProject(session: ProjectSession) {
//     const json = session.toJSON();
//     await this.service.saveProject(json);
//   }
// }
