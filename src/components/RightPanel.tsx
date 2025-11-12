import React, { useEffect, useState } from "react";
import { useProjectContext } from "../context/ProjectContext";
import { useDiagramContext } from "../context/DiagramContext";
import { useNavigate } from "react-router-dom";
import ProjectDiagramModal from "./ProjectDiagramModal";
import Modal from "./Modal";
import "./RightPanel.css";
import BlogPanel from "./BlogPanel";

const IconFor = (kind: string) => {
  const cyan = "#00c8ff";
  if (kind === "UseCaseDiagram") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="14" rx="2" stroke={cyan} strokeWidth="1.6" fill="none"/><path d="M7 8h10" stroke={cyan} strokeWidth="1.6" strokeLinecap="round"/></svg>
    );
  }
  if (kind === "ClassDiagram") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="14" rx="2" stroke={cyan} strokeWidth="1.6" fill="none"/><path d="M3 10h18" stroke={cyan} strokeWidth="1.6" strokeLinecap="round"/></svg>
    );
  }
  if (kind === "component") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="6" fill={cyan} /></svg>
    );
  }
  if (kind === "association") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 12h12" stroke={cyan} strokeWidth="1.6" strokeLinecap="round"/><path d="M18 12l-3-3v6l3-3z" fill={cyan} /></svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="14" rx="2" stroke={cyan} strokeWidth="1.6" fill="none"/></svg>
  );
};

const RightPanel: React.FC = () => {
  const projCtx = useProjectContext();
  const diagCtx = useDiagramContext();
  const navigate = useNavigate();
  const [width, setWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedDiagramId, setExpandedDiagramId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [projectCollapsed, setProjectCollapsed] = useState(false);
  const [editingDiagram, setEditingDiagram] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // subtract from right edge: clientX from window width
      const newW = Math.max(200, window.innerWidth - e.clientX);
      setWidth(newW);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  // publish CSS variable for right panel width
  useEffect(() => {
    try {
      document.documentElement.style.setProperty("--right-panel-width", `${width}px`);
    } catch {}
  }, [width]);

  if (!projCtx) return null;
  const project = projCtx.project;

  const handleAddDiagram = () => {
    // if no project exists, prompt to create a project first
    if (!projCtx.project) {
      setShowModal(true);
      return;
    }
    setShowModal(true);
  };

  const handleDeleteProject = async () => {
    if (!projCtx.project) return;
    try {
      await projCtx.deleteProject?.();
      // navigate back to home
      navigate("/home");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("RightPanel: delete project failed", err);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleModalCreate = async (payload: { projectName?: string; projectDescription?: string; diagramName?: string; diagramDescription?: string; diagramType?: string }) => {
    try {
      // if project doesn't exist, create it and return (user wanted to create a project only)
      let createdProject = projCtx.project;
      if (!createdProject) {
        createdProject = await projCtx.createProject?.(payload.projectName || "Untitled Project", payload.projectDescription);
        // ensure context reflects the newly created project (reload from API/local store)
        await projCtx.loadProject?.();
        // after creating project only, close modal and show project name in panel
        setShowModal(false);
        return;
      }

      // if diagramName is empty or not provided, do nothing (user intends to create only a project)
      if (!payload.diagramName) {
        setShowModal(false);
        return;
      }

      // create the diagram session
      const session = diagCtx.createSession?.(payload.diagramName || "Untitled Diagram", { components: [], associations: [], type: payload.diagramType });
      if (session) {
        await projCtx.addDiagramToProject?.(session as any);
        // refresh project context in case persistence changed
        await projCtx.loadProject?.();
        diagCtx.openSessionById(session.id);
        // eslint-disable-next-line no-console
        console.log("RightPanel: created diagram ->", session.id, "in project ->", createdProject?.id);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("RightPanel: create modal failed", err);
    } finally {
      setShowModal(false);
    }
  };

  const handleToggleDiagram = (id: string) => {
    setExpandedDiagramId((prev) => (prev === id ? null : id));
  };

  const handleEditDiagram = (d: any) => {
    setEditingDiagram(d);
    setShowModal(true);
  };

  const handleSaveDiagram = async (id: string, payload: { diagramName: string; diagramDescription?: string; diagramType?: string }) => {
    try {
      if (!projCtx.project) return;
      const pd = projCtx.project;
      const idx = pd.diagrams.findIndex((x) => (x as any).id === id);
      if (idx >= 0) {
        const dd = pd.diagrams[idx];
        dd.name = payload.diagramName;
        dd.diagramJSON = dd.diagramJSON || {};
        dd.diagramJSON.type = payload.diagramType;
        dd.diagramJSON.description = payload.diagramDescription;
        // persist project
        await projCtx.saveProject?.();
        // eslint-disable-next-line no-console
        console.log("RightPanel: saved diagram edits ->", id, payload);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("RightPanel: save diagram failed", err);
    } finally {
      setShowModal(false);
      setEditingDiagram(null);
    }
  };

  return (
    <div className="uml-rightpanel" style={{ position: "fixed", right: 0, top: 0, bottom: 0, width, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 8, borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong>Project</strong>
        <div style={{ display: "flex", gap: 8, alignItems: 'center' }}>
          <button className="btn-delete" title="Delete project" onClick={() => setShowDeleteConfirm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="#ff3b30" strokeWidth="1.4" strokeLinecap="round"/><path d="M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6" stroke="#ff3b30" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="#ff3b30" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="btn-add" onClick={handleAddDiagram}>+ Diagram</button>
        </div>
      </div>
  <div className="uml-rightpanel-scroll" style={{ overflow: "auto", flex: '1 1 auto', padding: 8, minHeight: 0 }}>
        {project ? (
          <div>
            <div className="uml-project-header" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ cursor: 'pointer' }} onClick={() => setProjectCollapsed((p) => !p)}>
                <svg width="14" height="14" viewBox="0 0 24 24" style={{ transform: projectCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 120ms' }}><path d="M6 9l6 6 6-6" stroke="#00c8ff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{project.name || "(untitled)"}</div>
              <div style={{ fontSize: 12, color: "#9fcbd6" }}>{project.description}</div>
            </div>
            {!projectCollapsed && (
              <div>
                {project.diagrams.map((d) => (
                  <div key={(d as any).id} className="uml-diagram-item">
                    <div className="uml-diagram-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ cursor: 'pointer' }} onClick={() => handleToggleDiagram((d as any).id)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" style={{ transform: expandedDiagramId === (d as any).id ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 120ms' }}><path d="M6 9l6 6 6-6" stroke="#00c8ff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <div className="uml-diagram-left">
                          <span className="uml-icon">{IconFor((d as any).diagramJSON?.type || "UseCaseDiagram")}</span>
                          <div className="uml-diagram-title" style={{ cursor: 'pointer' }} onClick={() => { diagCtx.openSessionById((d as any).id); console.log('RightPanel: opened diagram session ->', (d as any).id); setExpandedDiagramId((d as any).id); }}>{(d as any).name || `(id:${(d as any).id})`}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="uml-diagram-type">{(d as any).diagramJSON?.type || "Diagram"}</div>
                        <div style={{ cursor: 'pointer' }} title="Edit diagram" onClick={() => handleEditDiagram(d)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 21v-3.75L14.06 6.19a2 2 0 012.83 0l1.92 1.92a2 2 0 010 2.83L7.75 22H4a1 1 0 01-1-1z" stroke="#00c8ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      </div>
                    </div>
                    {expandedDiagramId === (d as any).id && (
                      <div className="uml-diagram-children">
                        {Array.isArray((d as any).diagramJSON?.components) && (d as any).diagramJSON.components.length > 0 && (
                          <>
                            <div className="uml-diagram-section">Components</div>
                            <div className="uml-diagram-list">
                              {(d as any).diagramJSON.components.map((c: any, i: number) => (
                                <div key={i} className="uml-diagram-child-row component">
                                  <span className="uml-icon small">{IconFor("component")}</span>
                                  <div className="uml-diagram-child-title">{c?.name || c?.type || `(id:${c?.id || i})`}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {Array.isArray((d as any).diagramJSON?.associations) && (d as any).diagramJSON.associations.length > 0 && (
                          <>
                            <div className="uml-diagram-section">Associations</div>
                            <div className="uml-diagram-list">
                              {(d as any).diagramJSON.associations.map((a: any, i: number) => (
                                <div key={i} className="uml-diagram-child-row association">
                                  <span className="uml-icon small">{IconFor("association")}</span>
                                  <div className="uml-diagram-child-title">{a?.name || a?.type || `(id:${a?.id || i})`}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "#888" }}>No project loaded</div>
        )}
      </div>
  {/* Blog: lower half with sticky search and inner scroll */}
  <BlogPanel />
      {showModal && (
        <ProjectDiagramModal
          open={showModal}
          projectExists={!!project}
          defaultProjectName={project?.name}
          defaultProjectDescription={project?.description}
          defaultDiagramName={editingDiagram?.name}
          defaultDiagramDescription={editingDiagram?.diagramJSON?.description}
          defaultDiagramType={editingDiagram?.diagramJSON?.type}
          editingDiagramId={editingDiagram?.id ?? null}
          onCancel={() => { setShowModal(false); setEditingDiagram(null); }}
          onCreate={handleModalCreate}
          onSave={handleSaveDiagram}
        />
      )}
      {showDeleteConfirm && (
        <Modal title="Delete project" onClose={() => setShowDeleteConfirm(false)}>
          <div style={{ padding: 8 }}>
            <div style={{ marginBottom: 12 }}>This will permanently delete the current project and its diagrams from local storage. This action cannot be undone.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn" style={{ background: '#b71c1c', color: '#fff' }} onClick={handleDeleteProject}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
      {/* draggable handle */}
      <div style={{ position: "absolute", left: -6, top: 0, bottom: 0, width: 12, cursor: "col-resize" }} onMouseDown={() => setIsResizing(true)} />
    </div>
  );
};

export default RightPanel;
