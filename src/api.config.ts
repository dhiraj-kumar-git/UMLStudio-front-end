/**
 * Minimal API shim for persisting projects. In this demo we persist to
 * localStorage under key `umlstudio.project` to simulate a backend.
 */
import type { ProjectJSON } from "./models/Project";

/**
 * Central API configuration.
 * Set API_BASE to the server base URL (empty string uses same origin).
 * All endpoints should be referenced from ENDPOINTS to avoid scattered hardcoded URLs.
 */
// Base URL for backend API. By default empty (same-origin). You can override at runtime
// by setting (window as any).__API_BASE = 'https://api.example.com' before app boot, or
// change this value during build.
export const API_BASE: string = (globalThis as any).__API_BASE ?? "https://umlstudio-be.onrender.com";

export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  projects: {
    list: "/api/projects/getProjectList",
    details: "/api/projects/getProjectDetails",
    save: "/api/projects/saveProject",
  },
};

const STORAGE_KEY = "umlstudio.project";

// Save project to backend (UPSERT). If no backend is available, fall back to localStorage.
export async function saveProject(project: ProjectJSON): Promise<any> {
  const url = (API_BASE ?? "") + ENDPOINTS.projects.save;
  try {
    const token = localStorage.getItem("jwt");
    if (!token) {
      return Promise.reject({ status: 401, body: { status: "FAILED", message: "Invalid or missing authentication token." } });
    }

    const payload = {
      projectId: project.id ?? null,
      projectName: project.name,
      projectDescription: project.description ?? "",
      projectDetails: project,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      const body = await res.json().catch(() => ({ status: "FAILED", message: "Invalid or missing authentication token." }));
      return Promise.reject({ status: 401, body });
    }

    if (res.status === 403) {
      const body = await res.json().catch(() => ({ status: "FAILED", message: "You do not have permission to save this project." }));
      return Promise.reject({ status: 403, body });
    }

    if (res.status === 400) {
      const body = await res.json().catch(() => ({ status: "FAILED", message: "Invalid or incomplete project data provided." }));
      return Promise.reject({ status: 400, body });
    }

    if (res.status === 404) {
      const body = await res.json().catch(() => ({ status: "FAILED", message: "Project not found for the given ID." }));
      return Promise.reject({ status: 404, body });
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ status: "FAILED", message: "Something went wrong while saving the project." }));
      return Promise.reject({ status: res.status, body });
    }

    const body = await res.json().catch(() => null);
    // also mirror to local store for quick recovery
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); } catch {}
    // eslint-disable-next-line no-console
    console.log("api.saveProject -> saved project (remote)", project.id, body);
    // Do NOT return the client-generated id as canonical; only return server-provided id (if present in body)
    return Promise.resolve(body ?? { status: "SUCCESS", message: "Project Saved Successfully", projectId: null });
  } catch (err: any) {
    // fallback: try saving to localStorage and return success if network failed
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      // eslint-disable-next-line no-console
      console.warn("api.saveProject: network failed, persisted locally", err);
      return Promise.resolve({ status: "SUCCESS", message: "Project saved locally (offline)", projectId: null });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("api.saveProject failed", err);
      return Promise.reject(err);
    }
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

export async function getProjectList(): Promise<ProjectJSON[]> {
  const url = (API_BASE ?? "") + ENDPOINTS.projects.list;
  try {
    const token = localStorage.getItem("jwt");
    // If unauthenticated, do not return any local cached projects - per UX requirement
    if (!token) {
      return Promise.resolve([]);
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      // On any error from backend, do not use localStorage; return empty list
      return Promise.resolve([]);
    }

    const data = await res.json().catch(() => null);
    // Expecting data.result or data.projects array
    if (!data) return Promise.resolve([]);
    const list = data.result ?? data.projects ?? data.projectList ?? data;
    if (!Array.isArray(list)) return Promise.resolve([]);
    return Promise.resolve(list as ProjectJSON[]);
  } catch (err) {
    // Any exception (network etc.) should not read or return localStorage fallback
    // Return empty list so Home page shows no projects rather than falling back to cached data
    // eslint-disable-next-line no-console
    console.warn("getProjectList failed:", err);
    return Promise.resolve([]);
  }
}

export default { saveProject, getProject, API_BASE, ENDPOINTS };
