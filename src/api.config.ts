/**
 * Minimal API shim for persisting projects. In this demo we persist to
 * localStorage under key `umlstudio.project` to simulate a backend.
 */
import type { ProjectJSON } from "./models/Project";

const STORAGE_KEY = "umlstudio.project";

export async function saveProject(project: ProjectJSON): Promise<ProjectJSON> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    // emulate async API
    // eslint-disable-next-line no-console
    console.log("api.saveProject -> saved project", project.id);
    return Promise.resolve(project);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("api.saveProject failed", err);
    return Promise.reject(err);
  }
}

export async function getProject(): Promise<ProjectJSON | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return Promise.resolve(null);
    const p = JSON.parse(raw) as ProjectJSON;
    // eslint-disable-next-line no-console
    console.log("api.getProject -> loaded project", p.id);
    return Promise.resolve(p);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("api.getProject failed", err);
    return Promise.reject(err);
  }
}

export default { saveProject, getProject };
