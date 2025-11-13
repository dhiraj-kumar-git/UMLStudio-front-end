import React, { useEffect, useState } from "react";
import LayoutManager from "../models/LayoutManager";
import { CanvasModel } from "../models/CanvasModel";
import { ActorComponent } from "../models/ActorComponent";
import type { DiagramComponent } from "../models/DiagramComponent";
import type DiagramAssociation from "../models/DiagramAssociation";
import { UseCaseComponent } from "../models/UseCaseComponent";
import InterfaceComponent from "../models/InterfaceComponent";
import type { UseCaseAssocType } from "../models/UseCaseAssociation";
import SystemBoundary from "../models/SystemBoundary";
import ClassComponent from "../models/ClassComponent";
import { useDiagramContext } from "../context/DiagramContext";
import { useProjectContext } from "../context/ProjectContext";
import { useNavigate } from "react-router-dom";
import "./LeftPanel.css";
import Modal from "./Modal";

type Props = {
  canvasModel: CanvasModel;
  existing?: DiagramComponent[];
  onAdd?: (c: DiagramComponent) => void;
  selected?: any;
  onUpdateComponent?: (id: string, patch: Partial<any>) => void;
  onUpdateAssociation?: (assoc: DiagramAssociation) => void;
};

export const LeftPanel: React.FC<Props> = ({ canvasModel, existing = [], onAdd, selected, onUpdateComponent, onUpdateAssociation }) => {
  const [name, setName] = useState("Actor");
  const [width, setWidth] = useState<number>(360);
  const [isResizing, setIsResizing] = useState(false);
  // mode is derived from the current diagram type now; keep local selection of operation via buttons if needed
  const [assocType, setAssocType] = useState<UseCaseAssocType>("includes");
  const [assocKind, setAssocKind] = useState<"usecase" | "actor-usecase" | "class-assoc">("usecase");
  const [classAssocKind, setClassAssocKind] = useState<"association" | "aggregation" | "composition" | "generalization" | "realization">("association");
    const [assocNameField, setAssocNameField] = useState("");
    const [cardinalitySource, setCardinalitySource] = useState<string>("");
    const [cardinalityTarget, setCardinalityTarget] = useState<string>("");
  const [assocSource, setAssocSource] = useState<string | null>(null);
  const [assocTarget, setAssocTarget] = useState<string | null>(null);

  const diagCtx = useDiagramContext();
  const diagType = diagCtx.currentSession?.diagramJSON?.type ?? null;
  const projectCtx = useProjectContext();
  const navigate = useNavigate();
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // no in-panel editor here; TestEditorPanel handles export/import UI

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newW = Math.max(200, Math.min(800, e.clientX));
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

  // publish CSS variable so the center canvas can react to left/right widths
  useEffect(() => {
    try {
      document.documentElement.style.setProperty("--left-panel-width", `${width}px`);
    } catch {}
  }, [width]);

  // No local mode state is needed — toolbox UI is derived from the current diagram type.

  const onAddActor = () => {
    const spot = LayoutManager.findEmptySpot({
      canvasModel,
      existing: existing as DiagramComponent[],
      desiredWidth: 60,
      desiredHeight: 120,
    });

    const actor = new ActorComponent(name || "Actor", spot.x, spot.y);
    if (onAdd) onAdd(actor);
    // clear name and show placeholder
    setName("");
  };

  const onAddUseCase = () => {
    const spot = LayoutManager.findEmptySpot({
      canvasModel,
      existing: existing as DiagramComponent[],
      desiredWidth: 180,
      desiredHeight: 80,
    });
    const u = new UseCaseComponent(name || "UseCase", spot.x, spot.y);
    if (onAdd) onAdd(u);
    setName("");
  };

  const onAddSystem = () => {
    const spot = LayoutManager.findEmptySpot({
      canvasModel,
      existing: existing as DiagramComponent[],
      desiredWidth: 600,
      desiredHeight: 400,
    });
    const s = new SystemBoundary(name || "System", spot.x, spot.y);
    if (onAdd) onAdd(s);
    setName("");
  };

  const onAddClass = () => {
    const spot = LayoutManager.findEmptySpot({
      canvasModel,
      existing: existing as DiagramComponent[],
      desiredWidth: 160,
      desiredHeight: 120,
    });
    const c = new ClassComponent(name || "Class", spot.x, spot.y);
    if (onAdd) onAdd(c);
    setName("");
  };

  const onAddInterface = () => {
    const spot = LayoutManager.findEmptySpot({
      canvasModel,
      existing: existing as DiagramComponent[],
      desiredWidth: 160,
      desiredHeight: 120,
    });
    const i = new InterfaceComponent(name || "IInterface", spot.x, spot.y);
    if (onAdd) onAdd(i);
    setName("");
  };

  const resetAssocSelection = () => {
    setAssocSource(null);
    setAssocTarget(null);
  };

  const onCreateAssoc = () => {
    if (!assocSource || !assocTarget) return;
    // emit a synthetic instruction via onAdd: we pass a special payload object
    if (onAdd) onAdd((() => {
      // placeholder: the EditorPage will intercept this special object and create the association
        return ({ __createAssoc: true, sourceId: assocSource, targetId: assocTarget, assocType, assocKind, classAssocKind, assocName: assocNameField, cardinalitySource, cardinalityTarget } as any) as unknown as DiagramComponent;
    })());
    resetAssocSelection();
    // clear main name input too
    setName("");
  };

  const renderOptions = (allowedTypes?: string[]) => {
    const list = Array.isArray(existing) ? existing as any[] : [];
    const filtered = typeof allowedTypes === 'undefined' ? list : list.filter((c: any) => allowedTypes.includes((c as any).type));
    return filtered.map((c: any) => <option key={(c as any).id} value={(c as any).id}>{(c as any).name ?? (c as any).type ?? ''}</option>);
  };

  return (
    <div className="uml-leftpanel" style={{ width }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button onClick={() => setShowBackConfirm(true)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,200,255,0.06)', background: 'transparent', color: '#00e5ff' }}>← Back</button>
        {/* <div style={{ color: '#ffffff', fontWeight: 700 }}>Editor</div> */}
        <div style={{ width: 48 }} />
      </div>

      {/* If there is no current diagram, show a message */}
      {!diagType && (
        <div style={{ color: 'rgba(0,0,0,0.25)', marginBottom: 12 }}>Open a diagram (from the right panel) to see editing tools.</div>
      )}

      {/* Use-case diagram tools */}
      {diagType === "UseCaseDiagram" && (
        <>
          <div style={{ marginBottom: 8 , display:'flex',flexDirection:'row', alignItems:'center', gap:10}}>
            <label style={{ display: "block", fontSize: 16, color: '#0fa3b4ff' }}>Name</label>
            <input value={name} placeholder="Name of component...." onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)', color: '#6365f1f0' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={onAddActor} style={{ flex: 1 , border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)', color: '#00e5ff' }}>Add Actor</button>
            <button onClick={onAddUseCase} style={{ flex: 1 , border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)', color: '#00e5ff' }}>Add Use Case</button>
            <button onClick={onAddSystem} style={{flex:1 , border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)', color: '#00e5ff' }}>Add System Boundary</button>
          </div>
          <div style={{ height: 40 }} />
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 16, color: "#0fa3b4ff", marginBottom: 8 }}>Associations</label>
            <select value={assocKind} onChange={(e) => setAssocKind(e.target.value as any)} style={{ width: "100%", padding: 8, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
              <option value="usecase">UseCase (includes/extends)</option>
              <option value="actor-usecase">Actor → UseCase</option>
            </select>
            {assocKind === 'usecase' && (
              <div style={{ marginTop: 8, display:'flex',flexDirection:'row' }}>
                <label style={{ display: "block", fontSize: 16, color: "#0fa3b4ff", marginTop: 16, marginBottom: 6 , paddingRight: 8 }}>Type</label>
                <select value={assocType} onChange={(e) => setAssocType(e.target.value as UseCaseAssocType)} style={{ width: "100%", padding: 8 , border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                  <option value="includes">&lt;&lt;includes&gt;&gt;</option>
                  <option value="extends">&lt;&lt;extends&gt;&gt;</option>
                </select>
                </div>
            )}
            {assocKind && (
              <div>
                <div style={{ marginTop: 20, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 14, color: "#0fa3b4ff", marginBottom: 6 }}>Source</label>
                      <select value={assocSource ?? ''} onChange={(e) => setAssocSource(e.target.value || null)} style={{ width: '100%', padding: 8 , border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                        <option value=''>-- select source --</option>
                        {assocKind === 'actor-usecase' ? renderOptions(['actor']) : renderOptions(['usecase'])}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: 14, color: "#0fa3b4ff", marginBottom: 6 }}>Target</label>
                      <select value={assocTarget ?? ''} onChange={(e) => setAssocTarget(e.target.value || null)} style={{ width: '100%', padding: 8 , border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                        <option value=''>-- select target --</option>
                        {renderOptions(['usecase'])}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onCreateAssoc} style={{ flex: 1, border: '1px solid rgba(0, 200, 255, 0.28)', color: '#fff', borderRadius: 6, background: 'linear-gradient(90deg, #6365f1ad, #8a5cf691)' }} disabled={!assocSource || !assocTarget || assocSource === assocTarget}>Create Association</button>
                    <button onClick={resetAssocSelection} style={{ flex: 1 , border: '1px solid rgba(0, 200, 255, 0.28)', color: '#fff', borderRadius: 6, background: 'linear-gradient(90deg, #8a5cf691, #6365f1ad)' }}>Reset</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Class diagram tools */}
      {diagType === "ClassDiagram" && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 16,marginBottom: 6, color: "#00e5ff8c" }}>Name</label>
            <input value={name} placeholder="Name of component...." onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)', color: '#6365f1f0' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={onAddClass} style={{ flex: 1 }}>Add Class</button>
            <button onClick={onAddInterface} style={{ flex: 1 }}>Add Interface</button>
          </div>
          <div style={{ height: 12 }} />
          <div style={{ marginBottom: 8, display:'flex',flexDirection:'column' }}>
            <label style={{ display: "block", fontSize: 12, color: "#00e5ff", marginBottom: 2 }}>Class associations</label>
            <select value={classAssocKind} onChange={(e) => setClassAssocKind(e.target.value as any)} style={{ width: "100%", padding: 8 , border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
              <option value="association">association</option>
              <option value="aggregation">aggregation</option>
              <option value="composition">composition</option>
              <option value="generalization">generalization</option>
              <option value="realization">realization</option>
            </select>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: "block", fontSize: 12 }}>Name (optional)</label>
              <input value={assocNameField} onChange={(e) => setAssocNameField(e.target.value)} style={{ width: "100%", padding: 8, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)', color: '#6365f1f0' }} />
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12 }}>Source</label>
                <select value={assocSource ?? ''} onChange={(e) => setAssocSource(e.target.value || null)} style={{ width: '100%', padding: 8, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                  <option value=''>-- select source --</option>
                  {existing.map((c: any) => <option key={(c as any).id} value={(c as any).id}>{(c as any).name ?? (c as any).id} ({(c as any).type ?? 'component'})</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12 }}>Target</label>
                <select value={assocTarget ?? ''} onChange={(e) => setAssocTarget(e.target.value || null)} style={{ width: '100%', padding: 8, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                  <option value=''>-- select target --</option>
                  {existing.map((c: any) => <option key={(c as any).id} value={(c as any).id}>{(c as any).name ?? (c as any).id} ({(c as any).type ?? 'component'})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <select value={cardinalitySource} onChange={(e) => setCardinalitySource(e.target.value)} style={{ flex: 1, padding: 8, minWidth: 0, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                <option value="">-- source cardinality --</option>
                <option value="1">1</option>
                <option value="0">0</option>
                <option value="*">*</option>
                <option value="1...*">1...*</option>
              </select>
              <select value={cardinalityTarget} onChange={(e) => setCardinalityTarget(e.target.value)} style={{ flex: 1, padding: 8, minWidth: 0, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                <option value="">-- target cardinality --</option>
                <option value="1">1</option>
                <option value="0">0</option>
                <option value="*">*</option>
                <option value="1...*">1...*</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={onCreateAssoc} style={{ flex: 1 }} disabled={!assocSource || !assocTarget || assocSource === assocTarget}>Create Association</button>
              <button onClick={resetAssocSelection} style={{ flex: 1 }}>Reset</button>
            </div>
          </div>
        </>
      )}
      {/* Class diagram instructions (help text) */}
      {diagType === "ClassDiagram" && (
        <div style={{ marginTop: 12, padding: 8, background: 'linear-gradient(180deg, rgba(2,10,12,0.3), rgba(2,6,8,0.1))', borderRadius: 6 }}>
          <h4 style={{ margin: '6px 0', color: '#9fefff' }}>Class Diagram Tips</h4>
          <ul style={{ margin: 0, paddingLeft: 16, color: '#cfeff3', fontSize: 13 }}>
            <li>Use the Add Class / Add Interface buttons to place components on the canvas.</li>
            <li>Select Source and Target to create associations (aggregation, composition, inheritance, etc.).</li>
            <li>Use cardinality fields to specify multiplicities (optional).</li>
            <li>Click a class to edit attributes and methods in the Selection panel below.</li>
          </ul>
        </div>
      )}

      {/* If diagram type is unknown, show general tools */}
      {!diagType && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 16, color: "#00e5ff8c" }}>Name</label>
            <input value={name} placeholder="Name of component...." onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={onAddActor} style={{ flex: 1 }}>Add Actor</button>
            <button onClick={onAddUseCase} style={{ flex: 1 }}>Add Use Case</button>
          </div>
        </>
      )}

  {/* Selection editor */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed #eee" }}>
        <h4 style={{ margin: "6px 0" }}>Selection</h4>
        {!selected || selected.kind === null ? (
          <div style={{ fontSize: 12, color: "#444" }}>
            <em>Click a component or association on the canvas to edit.</em>
          </div>
          ) : selected.kind === "component" ? (
            (() => {
              const comp = selected.component as any;
              if (!comp) return null;
              // class editor
              if ((comp as any).type === "class") {
                const nameRef = React.createRef<HTMLInputElement>();
                const newAttrRef = React.createRef<HTMLInputElement>();
                const newAttrVisRef = React.createRef<HTMLSelectElement>();
                const newMethodRef = React.createRef<HTMLInputElement>();
                const newMethodVisRef = React.createRef<HTMLSelectElement>();
                const newMethodReturnRef = React.createRef<HTMLInputElement>();
                return (
                  <div>
                    <label style={{ display: "block", fontSize: 12 }}>Class Name</label>
                    <input defaultValue={comp?.name ?? ""} ref={nameRef} style={{ width: "100%", padding: 6 , background: 'rgba(0,0,0,0.18)', color: '#00e5ff', border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6 }} />
                    <div style={{ marginTop: 8 }}>
                      <h5 style={{ margin: "6px 0" }}>Attributes</h5>
                      <div style={{ display: "flex", gap: 8 }}>
                                <select ref={newAttrVisRef} defaultValue="+">
                          <option value="+">+</option>
                          <option value="-">-</option>
                          <option value="*">*</option>
                        </select>
                                <input ref={newAttrRef} placeholder="name" style={{ flex: 1, padding: 6, border: '1px solid rgba(0, 200, 255, 0.18)', borderRadius: 6, background: 'rgba(0,0,0,0.18)', color: '#00e5ff' }} />
                        <button onClick={() => {
                          const v = (newAttrVisRef.current?.value as any) ?? "+";
                          const n = newAttrRef.current?.value ?? "";
                          if (!n) return;
                          const attrs = Array.isArray(comp.attributes) ? [...comp.attributes] : [];
                          attrs.push({ visibility: v, name: n });
                          onUpdateComponent && onUpdateComponent((comp as any).id, { attributes: attrs });
                          if (newAttrRef.current) newAttrRef.current.value = "";
                        }}>Add</button>
                      </div>
                      <ul style={{ marginTop: 8 }}>
                        {(comp.attributes || []).map((a: any, idx: number) => (
                          <li key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ minWidth: 36 }}>{a.visibility}</span>
                            <span style={{ flex: 1 }}>{a.name}</span>
                            <button onClick={() => {
                              const attrs = (comp.attributes || []).slice();
                              attrs.splice(idx, 1);
                              onUpdateComponent && onUpdateComponent((comp as any).id, { attributes: attrs });
                            }}>Remove</button>
                          </li>
                        ))}
                      </ul>

                      <h5 style={{ marginTop: 12 }}>Methods</h5>
                      <div style={{ display: "flex", gap: 8 , minWidth:100}}>
                        <select ref={newMethodVisRef} defaultValue="+">
                          <option value="+">+</option>
                          <option value="-">-</option>
                          <option value="*">*</option>
                        </select>
                        <input ref={newMethodRef} placeholder="name" style={{ flex: 1, padding: 6, border: '1px solid rgba(0, 200, 255, 0.18)', borderRadius: 6, background: 'rgba(0,0,0,0.18)', color: '#00e5ff' , minWidth:10}} />
                        <input ref={newMethodReturnRef} placeholder="returnType" style={{ width: 100, padding: 6, border: '1px solid rgba(0, 200, 255, 0.18)', borderRadius: 6, background: 'rgba(0,0,0,0.18)', color: '#00e5ff', minWidth:10 }} />
                        <button onClick={() => {
                          const v = (newMethodVisRef.current?.value as any) ?? "+";
                          const n = newMethodRef.current?.value ?? "";
                          const r = newMethodReturnRef.current?.value ?? undefined;
                          if (!n) return;
                          const methods = Array.isArray(comp.methods) ? [...comp.methods] : [];
                          methods.push({ visibility: v, name: n, params: [], returnType: r });
                          onUpdateComponent && onUpdateComponent((comp as any).id, { methods });
                          if (newMethodRef.current) newMethodRef.current.value = "";
                          if (newMethodReturnRef.current) newMethodReturnRef.current.value = "";
                        }}>Add</button>
                      </div>
                      <ul style={{ marginTop: 8 }}>
                        {(comp.methods || []).map((m: any, idx: number) => (
                          <li key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ minWidth: 36 }}>{m.visibility}</span>
                            <span style={{ flex: 1 }}>{m.name}()</span>
                            <button onClick={() => {
                              const methods = (comp.methods || []).slice();
                              methods.splice(idx, 1);
                              onUpdateComponent && onUpdateComponent((comp as any).id, { methods });
                            }}>Remove</button>
                          </li>
                        ))}
                      </ul>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button onClick={() => {
                          const newName = nameRef.current ? nameRef.current.value : comp?.name;
                          onUpdateComponent && onUpdateComponent((comp as any).id, { name: newName });
                        }} style={{ flex: 1 }}>Save</button>
                      </div>
                    </div>
                  </div>
                );
              }

              // system-boundary editor
              if ((comp as any).type === "system-boundary") {
                const nameRef = React.createRef<HTMLInputElement>();
                return (
                  <div>
                    <label style={{ display: "block", fontSize: 12 }}>Name</label>
                    <input defaultValue={comp?.name ?? ""} ref={nameRef} style={{ width: "100%", padding: 6, border: '1px solid rgba(0, 200, 255, 0.18)', borderRadius: 6, background: 'rgba(0,0,0,0.18)', color: '#00e5ff' }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => { const newName = nameRef.current ? nameRef.current.value : comp?.name; onUpdateComponent && onUpdateComponent((comp as any).id, { name: newName }); }} style={{ flex: 1 }}>Save</button>
                    </div>
                  </div>
                );
              }

              // generic component editor fallback
              const nameRef = React.createRef<HTMLInputElement>();
              // Note: we intentionally do NOT present editable X/Y inputs for selected
              // components. The runtime position on the component instance is the
              // authoritative source. When saving, we pick up the current location
              // from the runtime instance (comp.x / comp.y).
              return (
                <div>
                  <label style={{ display: "block", fontSize: 12 }}>Name</label>
                  <input defaultValue={comp?.name ?? ""} ref={nameRef} style={{ width: "100%", padding: 6, border: '1px solid rgba(0, 200, 255, 0.18)', borderRadius: 6, background: 'rgba(0,0,0,0.18)', color: '#00e5ff' }} />
                  <div style={{ marginTop: 8 }}>
                    {/* <small style={{ color: '#666' }}>Position is read-only here — move the component on the canvas and click Save to persist its current location.</small> */}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => {
                      const newName = nameRef.current ? nameRef.current.value : comp?.name;
                      const nx = (comp as any)?.x ?? undefined;
                      const ny = (comp as any)?.y ?? undefined;
                      const patch: any = { name: newName };
                      if (nx !== undefined) patch.x = nx;
                      if (ny !== undefined) patch.y = ny;
                      onUpdateComponent && onUpdateComponent((comp as any).id, patch);
                    }} style={{ flex: 1 }}>Save</button>
                  </div>
                </div>
              );
            })()
          ) : selected.kind === "association" ? (
            (() => {
              const assoc = selected.association as any;
              const labelRef = React.createRef<HTMLInputElement>();
              // control points are added by clicking the association on the canvas; no UI button needed
              return (
                <div>
                  <label style={{ display: "block", fontSize: 12 }}>Label</label>
                  <input defaultValue={assoc?.name ?? ""} ref={labelRef} style={{ width: "100%", padding: 6, border: '1px solid rgba(0, 200, 255, 0.18)', borderRadius: 6, background: 'rgba(0,0,0,0.18)', color: '#00e5ff' }} />
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button onClick={() => { assoc.name = labelRef.current ? labelRef.current.value : assoc.name; if (onUpdateAssociation) onUpdateAssociation(assoc as DiagramAssociation); }} style={{ flex: 1 }}>Save</button>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <label style={{ display: "block", fontSize: 12 }}>Source</label>
                            <select defaultValue={(assoc?.source as any)?.id ?? ""} onChange={(e) => {
                              const id = e.target.value;
                              const src = existing.find((c: any) => (c as any).id === id);
                              if (src) {
                                assoc.source = src;
                              }
                            }} style={{ width: "100%", padding: 8, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                              <option value="">-- select --</option>
                              {renderOptions()}
                            </select>
                            <label style={{ display: "block", fontSize: 12, marginTop: 8 }}>Target</label>
                              <select defaultValue={(assoc?.target as any)?.id ?? ""} onChange={(e) => {
                                const id = e.target.value;
                                const tgt = existing.find((c: any) => (c as any).id === id);
                                if (tgt) {
                                  assoc.target = tgt;
                                }
                              }} style={{ width: "100%", padding: 8, border: '1px solid rgba(0, 200, 255, 0.28)', borderRadius: 6, background: 'rgba(0,0,0,0.25)' }}>
                                <option value="">-- select --</option>
                                {renderOptions()}
                              </select>
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button onClick={() => { if (onUpdateAssociation) onUpdateAssociation(assoc as DiagramAssociation); }} style={{ flex: 1 }}>Apply</button>
                            </div>
                          </div>
                </div>
              );
            })()
          ) : null}
      </div>
      <div className="uml-leftpanel-resizer" onMouseDown={() => setIsResizing(true)} />

      {showBackConfirm && (
        <Modal title="Save changes?" onClose={() => setShowBackConfirm(false)}>
          <div style={{ padding: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#bffaff' }}></div>
            <div style={{ marginBottom: 12 }}>Do you want to save the current diagram session before returning to Home? Choosing Save will persist the session to your project.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn ghost" onClick={() => setShowBackConfirm(false)}>Cancel</button>
              <button className="btn" onClick={async () => {
                // Don't save: close current and navigate home
                try {
                  diagCtx.closeCurrent?.();
                } catch {}
                setShowBackConfirm(false);
                navigate('/home');
              }}>Don't Save</button>
              <button className="btn" style={{ background: '#00a6d6', color: '#fff' }} onClick={async () => {
                setSaving(true);
                try {
                  // ensure current session is stored
                  const cs = diagCtx.currentSession;
                  if (cs) {
                    // save session to local storage
                    diagCtx.saveCurrent?.();
                    // ensure project contains session
                    if (projectCtx.project) {
                      const exists = (projectCtx.project.diagrams || []).find((d: any) => d.id === cs.id);
                      if (!exists) {
                        await projectCtx.addDiagramToProject?.(cs as any);
                      } else {
                        // update existing diagram entry in project and persist
                        const pd = projectCtx.project;
                        const idx = pd.diagrams.findIndex((d) => (d as any).id === cs.id);
                        if (idx >= 0) {
                          pd.diagrams[idx] = cs as any;
                          // update project state and persist
                          try {
                            // call saveProject which uses api.saveProject
                            await projectCtx.saveProject?.();
                          } catch {}
                        }
                      }
                    } else {
                      // no project: create a default project and add diagram
                      const p = await projectCtx.createProject?.('Project (auto)');
                      if (p && cs) await projectCtx.addDiagramToProject?.(cs as any);
                    }
                  }
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn('LeftPanel: save before back failed', err);
                } finally {
                  setSaving(false);
                  setShowBackConfirm(false);
                  try { diagCtx.closeCurrent?.(); } catch {}
                  navigate('/home');
                }
              }}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </Modal>
      )}
      {/* Test editor panel is handled by a separate component */}
    </div>
  );
};

export default LeftPanel;
