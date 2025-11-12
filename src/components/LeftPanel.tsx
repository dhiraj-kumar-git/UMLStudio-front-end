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
  const [mode, setMode] = useState<"actor" | "usecase" | "assoc" | "system" | "class" | "interface">("actor");
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

  // When the current diagram changes, set sensible default mode based on diagram type
  useEffect(() => {
    if (diagType === "UseCaseDiagram") setMode("usecase");
    else if (diagType === "ClassDiagram") setMode("class");
    else setMode("actor");
  }, [diagType]);

  const onAddActor = () => {
    const spot = LayoutManager.findEmptySpot({
      canvasModel,
      existing: existing as DiagramComponent[],
      desiredWidth: 60,
      desiredHeight: 120,
    });

    const actor = new ActorComponent(name || "Actor", spot.x, spot.y);
    if (onAdd) onAdd(actor);
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
  };

  return (
    <div style={{ width: 360, padding: 12, borderRight: "1px solid #eee", background: "#fafafa", height: "100vh" }}>
      <h3 style={{ marginTop: 2 }}>Toolbox</h3>

      {/* If there is no current diagram, show a message */}
      {!diagType && (
        <div style={{ color: '#666', marginBottom: 12 }}>Open a diagram (from the right panel) to see editing tools.</div>
      )}

      {/* Use-case diagram tools */}
      {diagType === "UseCaseDiagram" && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 12, color: "#333" }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={onAddActor} style={{ flex: 1 }}>Add Actor</button>
            <button onClick={onAddUseCase} style={{ flex: 1 }}>Add Use Case</button>
          </div>
          <div style={{ marginBottom: 8 }}>
            <button onClick={onAddSystem} style={{ width: '100%' }}>Add System Boundary</button>
          </div>
          <div style={{ height: 12 }} />
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 12, color: "#333" }}>Associations</label>
            <select value={assocKind} onChange={(e) => setAssocKind(e.target.value as any)} style={{ width: "100%", padding: 8 }}>
              <option value="usecase">UseCase (includes/extends)</option>
              <option value="actor-usecase">Actor → UseCase</option>
            </select>
            {assocKind === 'usecase' && (
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", fontSize: 12, color: "#333" }}>Type</label>
                <select value={assocType} onChange={(e) => setAssocType(e.target.value as UseCaseAssocType)} style={{ width: "100%", padding: 8 }}>
                  <option value="includes">&lt;&lt;includes&gt;&gt;</option>
                  <option value="extends">&lt;&lt;extends&gt;&gt;</option>
                </select>
              </div>
            )}
          </div>
        </>
      )}

      {/* Class diagram tools */}
      {diagType === "ClassDiagram" && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 12, color: "#333" }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={onAddClass} style={{ flex: 1 }}>Add Class</button>
            <button onClick={onAddInterface} style={{ flex: 1 }}>Add Interface</button>
          </div>
          <div style={{ height: 12 }} />
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 12, color: "#333" }}>Class associations</label>
            <select value={classAssocKind} onChange={(e) => setClassAssocKind(e.target.value as any)} style={{ width: "100%", padding: 8 }}>
              <option value="association">association</option>
              <option value="aggregation">aggregation</option>
              <option value="composition">composition</option>
              <option value="generalization">generalization</option>
              <option value="realization">realization</option>
            </select>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: "block", fontSize: 12 }}>Name (optional)</label>
              <input value={assocNameField} onChange={(e) => setAssocNameField(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="number" min="0" placeholder="src card" value={cardinalitySource} onChange={(e) => setCardinalitySource(e.target.value)} style={{ flex: 1, padding: 8 }} />
              <input type="number" min="0" placeholder="tgt card" value={cardinalityTarget} onChange={(e) => setCardinalityTarget(e.target.value)} style={{ flex: 1, padding: 8 }} />
            </div>
          </div>
        </>
      )}

      {/* If diagram type is unknown, show general tools */}
      {!diagType && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 12, color: "#333" }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
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
                    <input defaultValue={comp?.name ?? ""} ref={nameRef} style={{ width: "100%", padding: 6 }} />
                    <div style={{ marginTop: 8 }}>
                      <h5 style={{ margin: "6px 0" }}>Attributes</h5>
                      <div style={{ display: "flex", gap: 8 }}>
                        <select ref={newAttrVisRef} defaultValue="+">
                          <option value="+">+</option>
                          <option value="-">-</option>
                          <option value="*">*</option>
                        </select>
                        <input ref={newAttrRef} placeholder="name" style={{ flex: 1 }} />
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <select ref={newMethodVisRef} defaultValue="+">
                          <option value="+">+</option>
                          <option value="-">-</option>
                          <option value="*">*</option>
                        </select>
                        <input ref={newMethodRef} placeholder="name" style={{ flex: 1 }} />
                        <input ref={newMethodReturnRef} placeholder="returnType" style={{ width: 100 }} />
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
                    <input defaultValue={comp?.name ?? ""} ref={nameRef} style={{ width: "100%", padding: 6 }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => { const newName = nameRef.current ? nameRef.current.value : comp?.name; onUpdateComponent && onUpdateComponent((comp as any).id, { name: newName }); }} style={{ flex: 1 }}>Save</button>
                    </div>
                  </div>
                );
              }

              // generic component editor fallback
              const nameRef = React.createRef<HTMLInputElement>();
              const xRef = React.createRef<HTMLInputElement>();
              const yRef = React.createRef<HTMLInputElement>();
              return (
                <div>
                  <label style={{ display: "block", fontSize: 12 }}>Name</label>
                  <input defaultValue={comp?.name ?? ""} ref={nameRef} style={{ width: "100%", padding: 6 }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 12 }}>X</label>
                      <input type="number" defaultValue={comp?.x ?? 0} ref={xRef} style={{ width: "100%", padding: 6 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 12 }}>Y</label>
                      <input type="number" defaultValue={comp?.y ?? 0} ref={yRef} style={{ width: "100%", padding: 6 }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => {
                      const newName = nameRef.current ? nameRef.current.value : comp?.name;
                      const nx = xRef.current ? Number(xRef.current.value) : comp?.x;
                      const ny = yRef.current ? Number(yRef.current.value) : comp?.y;
                      onUpdateComponent && onUpdateComponent((comp as any).id, { name: newName, x: nx, y: ny });
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
                  <input defaultValue={assoc?.name ?? ""} ref={labelRef} style={{ width: "100%", padding: 6 }} />
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
                            }} style={{ width: "100%", padding: 6 }}>
                              <option value="">-- select --</option>
                              {existing.map((c: any) => <option key={(c as any).id} value={(c as any).id}>{(c as any).name ?? (c as any).id}</option>)}
                            </select>
                            <label style={{ display: "block", fontSize: 12, marginTop: 8 }}>Target</label>
                            <select defaultValue={(assoc?.target as any)?.id ?? ""} onChange={(e) => {
                              const id = e.target.value;
                              const tgt = existing.find((c: any) => (c as any).id === id);
                              if (tgt) {
                                assoc.target = tgt;
                              }
                            }} style={{ width: "100%", padding: 6 }}>
                              <option value="">-- select --</option>
                              {existing.map((c: any) => <option key={(c as any).id} value={(c as any).id}>{(c as any).name ?? (c as any).id}</option>)}
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
    </div>
  );
};

export default LeftPanel;
