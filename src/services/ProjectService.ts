import { API_BASE, ENDPOINTS } from "../api.config";

export type ProjectSummary = {
  projectid: string | number;
  projectName: string;
  projectAccess?: string;
  projectAssignedAt?: string;
  projectDescription?: string;
};

export async function getProjectList(token: string | null, userid: string | number | null) {
  const url = API_BASE + (ENDPOINTS.projects.list || "/getProjectList");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ userid }),
    });
    const body = await res.json().catch(() => null);
    console.debug("ProjectService.getProjectList ->", res.status, body);
    return { status: res.status, body };
  } catch (err) {
    console.error("ProjectService.getProjectList failed", err);
    throw err;
  }
}

export async function getProjectDetails(token: string | null, projectId: string | number) {
  const url = API_BASE + (ENDPOINTS.projects.details || "/getProjectDetails");
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Project-Id": String(projectId),
      },
    });
    const body = await res.json().catch(() => null);
    console.debug("ProjectService.getProjectDetails ->", res.status, body);
    return { status: res.status, body };
  } catch (err) {
    console.error("ProjectService.getProjectDetails failed", err);
    throw err;
  }
}

export default { getProjectList, getProjectDetails };
