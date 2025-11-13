import React, { useEffect, useState } from "react";
import { useProjectContext } from "../context/ProjectContext";
import { useDiagramContext } from "../context/DiagramContext";
import { useNavigate } from "react-router-dom";
import ProjectDiagramModal from "./ProjectDiagramModal";
import Modal from "./Modal";
import "./RightPanel.css";
import BlogPanel from "./BlogPanel";
import DiagramSession from "../models/DiagramSession";

const IconFor = (kind: string) => {
  const cyan = "#00c8ff";
  const baseStyle: React.CSSProperties = { color: cyan, fontSize: 16 };
  if (kind === "UseCaseDiagram") return <i className="fas fa-file" style={baseStyle} aria-hidden />;
  if (kind === "ClassDiagram") return <i className="fas fa-th-large" style={baseStyle} aria-hidden />;
  if (kind === "component") return <i className="fas fa-cube" style={baseStyle} aria-hidden />;
  if (kind === "association") return <i className="fas fa-link" style={baseStyle} aria-hidden />;
  return <i className="fas fa-file" style={baseStyle} aria-hidden />;
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
  const [itemDeleteTarget, setItemDeleteTarget] = useState<null | { diagramId: string; kind: "component" | "association"; id: string; name?: string }>(null);
  const [itemDeleting, setItemDeleting] = useState(false);
  const [diagramDeleteTarget, setDiagramDeleteTarget] = useState<null | string>(null);
  const [diagramDeleting, setDiagramDeleting] = useState(false);
  const [projectVersion, setProjectVersion] = useState(0);

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

  // Refresh project view when a session is updated elsewhere (editor saves)
  useEffect(() => {
    const onSessionUpdated = () => {
      try {
        // quick reload project from local store / API
        projCtx.loadProject?.();
        setProjectVersion((v) => v + 1);
      } catch {}
    };
    window.addEventListener("uml:session-updated", onSessionUpdated as EventListener);
    return () => window.removeEventListener("uml:session-updated", onSessionUpdated as EventListener);
  }, [projCtx]);

  if (!projCtx) return null;
  const project = projCtx.project;
  // force re-render key
  const containerKey = project ? project.id + "-" + projectVersion : "no-project-" + projectVersion;

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
    <div key={containerKey} className="uml-rightpanel" style={{ position: "fixed", right: 0, top: 0, bottom: 0, width, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 8, borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="uml-project-header" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ cursor: 'pointer' }} onClick={() => setProjectCollapsed((p) => !p)}>
                <i className="fas fa-chevron-down" style={{ color: '#00c8ff', transform: projectCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 120ms' }} aria-hidden />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{project.name || "(untitled)"}</div>
              <div style={{ fontSize: 12, color: "#9fcbd6" }}>{project.description|| ''}</div>
            </div>
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

            {!projectCollapsed && (
              <div>
                {project.diagrams.map((d) => (
                  <div key={(d as any).id} className="uml-diagram-item">
                    <div className="uml-diagram-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ cursor: 'pointer' }} onClick={() => handleToggleDiagram((d as any).id)}>
                          <i className="fas fa-chevron-down" style={{ color: '#00c8ff', transform: expandedDiagramId === (d as any).id ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 120ms' }} aria-hidden />
                        </div>
                        <div className="uml-diagram-left">
                          <span className="uml-icon">{IconFor((d as any).diagramJSON?.type || "UseCaseDiagram")}</span>
                          <div className="uml-diagram-title" style={{ cursor: 'pointer' }} onClick={() => { diagCtx.openSessionById((d as any).id); console.log('RightPanel: opened diagram session ->', (d as any).id); setExpandedDiagramId((d as any).id); }}>{(d as any).name || `(id:${(d as any).id})`}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="uml-diagram-type">{(d as any).diagramJSON?.type || "Diagram"}</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ cursor: 'pointer' }} title="Edit diagram" onClick={() => handleEditDiagram(d)}>
                            <i className="fas fa-pen" style={{ color: '#00c8ff' }} aria-hidden />
                          </div>
                          <div style={{ cursor: 'pointer' }} title="Delete diagram" onClick={() => setDiagramDeleteTarget((d as any).id)}>
                            <i className="fas fa-trash" style={{ color: '#ff3b30' }} aria-hidden />
                          </div>
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
                                <div key={i} className="uml-diagram-child-row component" style={{ cursor: 'pointer' }} onClick={() => {
                                  try {
                                    const detail = { kind: 'component', id: c?.id, diagramId: (d as any).id };
                                    try { console.log('RightPanel: dispatch select ->', detail); } catch {}
                                    // if this diagram isn't open, open it first then select
                                    if (diagCtx.currentSession?.id !== (d as any).id) {
                                      diagCtx.openSessionById((d as any).id);
                                      // dispatch selection after a short delay to allow editor to revive
                                      setTimeout(() => window.dispatchEvent(new CustomEvent('uml:select', { detail })), 220);
                                    } else {
                                      window.dispatchEvent(new CustomEvent('uml:select', { detail }));
                                    }
                                  } catch (err) {}
                                }}>
                                  <span className="uml-icon small">{IconFor("component")}</span>
                                  <div className="uml-diagram-child-title">
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                      <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c?.name || `(id:${c?.id || i})`}</div>
                                      <div className="uml-diagram-child-type">{c?.type}</div>
                                    </div>
                                  </div>
                                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                    <button title="Delete component" onClick={(ev) => { ev.stopPropagation(); setItemDeleteTarget({ diagramId: (d as any).id, kind: 'component', id: c?.id, name: c?.name }); }} style={{ background: 'transparent', border: 'none', color: '#ff7b7b', cursor: 'pointer' }}><i className="fas fa-trash" aria-hidden /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {Array.isArray((d as any).diagramJSON?.associations) && (d as any).diagramJSON.associations.length > 0 && (
                          <>
                            <div className="uml-diagram-section">Associations</div>
                            <div className="uml-diagram-list">
                              {(d as any).diagramJSON.associations.map((a: any, i: number) => {
                                // resolve source/target names from the components list
                                const comps = Array.isArray((d as any).diagramJSON?.components) ? (d as any).diagramJSON.components : [];
                                const resolveName = (idOrRef: any) => {
                                  if (!idOrRef) return '';
                                  const id = typeof idOrRef === 'string' ? idOrRef : (idOrRef?.id ?? idOrRef?.sourceId ?? idOrRef?.targetId);
                                  const found = comps.find((c: any) => (c?.id ?? c) === id);
                                  return found ? (found.name ?? found.type ?? String(id)) : String(id ?? '');
                                };
                                const srcName = resolveName(a?.sourceId ?? a?.source ?? a?.source?.id);
                                const tgtName = resolveName(a?.targetId ?? a?.target ?? a?.target?.id);
                                const assocTypeLabel = a?.assocType ?? a?.kind ?? a?.type ?? a?.name ?? '';
                                return (
                                  <div key={i} className="uml-diagram-child-row association" style={{ cursor: 'pointer' }} onClick={() => {
                                    try {
                                      const detail = { kind: 'association', id: a?.id, diagramId: (d as any).id };
                                      try { console.log('RightPanel: dispatch select ->', detail); } catch {}
                                      if (diagCtx.currentSession?.id !== (d as any).id) {
                                        diagCtx.openSessionById((d as any).id);
                                        setTimeout(() => window.dispatchEvent(new CustomEvent('uml:select', { detail })), 220);
                                      } else {
                                        window.dispatchEvent(new CustomEvent('uml:select', { detail }));
                                      }
                                    } catch (err) {}
                                  }}>
                                    <span className="uml-icon small">{IconFor("association")}</span>
                                    <div className="uml-diagram-child-title" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        {/* <div style={{ marginLeft: 'auto', fontSize: 11, color: '#9fdfe8' }}>{assocTypeLabel}</div> */}
                                      </div>
                                      <div style={{ fontSize: 12, color: '#cfeff3' }}>{srcName} → {tgtName}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                      <button title="Delete association" onClick={(ev) => { ev.stopPropagation(); setItemDeleteTarget({ diagramId: (d as any).id, kind: 'association', id: a?.id, name: a?.name }); }} style={{ background: 'transparent', border: 'none', color: '#ff7b7b', cursor: 'pointer' }}><i className="fas fa-trash" aria-hidden /></button>
                                    </div>
                                  </div>
                                );
                              })}
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
      {diagramDeleteTarget && (
        <Modal title={`Delete diagram`} onClose={() => setDiagramDeleteTarget(null)}>
          <div style={{ padding: 8 }}>
            <div style={{ marginBottom: 12 }}>This will permanently delete the selected diagram and all its components and associations. This action cannot be undone. Continue?</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setDiagramDeleteTarget(null)}>Cancel</button>
              <button className="btn" style={{ background: '#b71c1c', color: '#fff' }} onClick={async () => {
                setDiagramDeleting(true);
                try {
                  const id = diagramDeleteTarget as string;
                  if (!id) return;
                  // remove session from storage
                  DiagramSession.removeById(id);
                  // remove from project
                  if (projCtx.project) {
                    projCtx.project.removeDiagramById(id);
                    try { await projCtx.saveProject?.(); } catch (e) { /* ignore */ }
                  }
                  // if this was the open session, close it
                  if (diagCtx.currentSession?.id === id) {
                    diagCtx.closeCurrent?.();
                  }
                  // notify listeners
                  try { window.dispatchEvent(new CustomEvent('uml:session-updated', { detail: { deletedDiagramId: id } })); } catch {}
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn('RightPanel: delete diagram failed', err);
                } finally {
                  setDiagramDeleting(false);
                  setDiagramDeleteTarget(null);
                  setProjectVersion((v) => v + 1);
                }
              }}>{diagramDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </Modal>
      )}
      {itemDeleteTarget && (
        <Modal title={`Delete ${itemDeleteTarget.kind}`} onClose={() => setItemDeleteTarget(null)}>
          <div style={{ padding: 8 }}>
            <div style={{ marginBottom: 12 }}>This will permanently delete the selected {itemDeleteTarget.kind}. Do you want to continue?</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setItemDeleteTarget(null)}>Cancel</button>
              <button className="btn" style={{ background: '#b71c1c', color: '#fff' }} onClick={async () => {
                setItemDeleting(true);
                try {
                  const targ = itemDeleteTarget;
                  if (!targ) return;
                  const s = DiagramSession.loadById(targ.diagramId);
                  if (!s) return;
                  // remove component and any associations referencing it
                  if (targ.kind === 'component') {
                    s.diagramJSON.components = (s.diagramJSON.components || []).filter((c: any) => (c?.id ?? c) !== targ.id);
                    s.diagramJSON.associations = (s.diagramJSON.associations || []).filter((a: any) => ((a?.sourceId) ?? a?.source) !== targ.id && ((a?.targetId) ?? a?.target) !== targ.id);
                  } else {
                    s.diagramJSON.associations = (s.diagramJSON.associations || []).filter((a: any) => (a?.id ?? a) !== targ.id);
                  }
                  s.touch();
                  s.saveToLocalStorage();
                  // if this session is currently open in editor, update context
                  if (diagCtx.currentSession?.id === s.id) {
                    diagCtx.updateCurrent?.({ diagramJSON: s.diagramJSON });
                  }
                  // update project entry and persist
                  if (projCtx.project) {
                    const idx = projCtx.project.diagrams.findIndex((d: any) => (d as any).id === s.id);
                    if (idx >= 0) {
                      projCtx.project.diagrams[idx] = s as any;
                      try { await projCtx.saveProject?.(); } catch {}
                    }
                  }
                  try { window.dispatchEvent(new CustomEvent('uml:session-updated', { detail: s.toJSON() })); } catch {}
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn('RightPanel: delete item failed', err);
                } finally {
                  setItemDeleting(false);
                  setItemDeleteTarget(null);
                  setProjectVersion((v) => v + 1);
                }
              }}>{itemDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </Modal>
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
