import React, { useState } from "react";
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
    <div style={{ width: 400, padding: 12, borderRight: "1px solid #eee", background: "#fafafa", height: "100vh" }}>
      <h3 style={{ marginTop: 2 }}>Toolbox</h3>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 12, color: "#333" }}>Mode</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("actor")} style={{ flex: 1 }} disabled={mode === "actor"}>Actor</button>
          <button onClick={() => setMode("usecase")} style={{ flex: 1 }} disabled={mode === "usecase"}>Use Case</button>
          <button onClick={() => setMode("class")} style={{ flex: 1 }} disabled={mode === "class"}>Class</button>
          <button onClick={() => setMode("interface")} style={{ flex: 1 }} disabled={mode === "interface"}>Interface</button>
          <button onClick={() => setMode("system")} style={{ flex: 1 }} disabled={mode === "system"}>System Boundary</button>
          <button onClick={() => setMode("assoc")} style={{ flex: 1 }} disabled={mode === "assoc"}>Association</button>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 12, color: "#333" }}>{mode === "assoc" ? "Association label/ type" : "Name"}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
      </div>

      {mode === "assoc" && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontSize: 12, color: "#333" }}>Association kind</label>
          <select value={assocKind} onChange={(e) => setAssocKind(e.target.value as any)} style={{ width: "100%", padding: 8 }}>
            <option value="usecase">UseCase (includes/extends)</option>
            <option value="actor-usecase">Actor → UseCase</option>
            <option value="class-assoc">Class Association (aggregation/composition/...)</option>
          </select>

          {assocKind === "usecase" && (
            <>
              <label style={{ display: "block", fontSize: 12, color: "#333", marginTop: 8 }}>Type</label>
              <select value={assocType} onChange={(e) => setAssocType(e.target.value as UseCaseAssocType)} style={{ width: "100%", padding: 8 }}>
                <option value="includes">&lt;&lt;includes&gt;&gt;</option>
                <option value="extends">&lt;&lt;extends&gt;&gt;</option>
              </select>
            </>
          )}

          {assocKind === "class-assoc" && (
            <>
              <label style={{ display: "block", fontSize: 12, color: "#333", marginTop: 8 }}>Association type</label>
              <select value={classAssocKind} onChange={(e) => setClassAssocKind(e.target.value as any)} style={{ width: "100%", padding: 8 }}>
                <option value="association">association</option>
                <option value="aggregation">aggregation (hollow diamond)</option>
                <option value="composition">composition (filled diamond)</option>
                <option value="generalization">generalization (hollow triangle)</option>
                <option value="realization">realization (dashed)</option>
              </select>
              <label style={{ display: "block", fontSize: 12, marginTop: 8 }}>Name (optional)</label>
              <input value={assocNameField} onChange={(e) => setAssocNameField(e.target.value)} style={{ width: "100%", padding: 8 }} />
              <label style={{ display: "block", fontSize: 12, marginTop: 8 }}>Cardinality (source - numeric, optional)</label>
              <input type="number" min="0" step="1" value={cardinalitySource} onChange={(e) => setCardinalitySource(e.target.value)} style={{ width: "100%", padding: 8 }} />
              <label style={{ display: "block", fontSize: 12, marginTop: 8 }}>Cardinality (target - numeric, optional)</label>
              <input type="number" min="0" step="1" value={cardinalityTarget} onChange={(e) => setCardinalityTarget(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </>
          )}

          <div style={{ marginTop: 8 }}>
            <label style={{ display: "block", fontSize: 12 }}>Source</label>
            <select value={assocSource ?? ""} onChange={(e) => setAssocSource(e.target.value || null)} style={{ width: "100%", padding: 8 }}>
              <option value="">-- select --</option>
              {existing
                .filter((c: any) => {
                  // If creating a realization, source must be an interface
                  if (assocKind === "class-assoc" && classAssocKind === "realization") {
                    return (c as any).type === "interface";
                  }
                  return true;
                })
                .map((c: any) => {
                const id = (c as any).id ?? (c as any).model?.id ?? "";
                const name = (c as any).name ?? (c as any).model?.name ?? null;
                const typeLabel = (c as any).type ?? (c as any).model?.type ?? "component";
                const label = name ? `${typeLabel}: ${name}` : id ? `${typeLabel}: ${id.slice ? id.slice(0, 6) : id}` : "component";
                return (
                  <option key={id} value={id}>{label}</option>
                );
              })}
            </select>
            <label style={{ display: "block", fontSize: 12, marginTop: 6 }}>Target</label>
            <select value={assocTarget ?? ""} onChange={(e) => setAssocTarget(e.target.value || null)} style={{ width: "100%", padding: 8 }}>
              <option value="">-- select --</option>
              {existing.map((c: any) => {
                const id = (c as any).id ?? (c as any).model?.id ?? "";
                const name = (c as any).name ?? (c as any).model?.name ?? null;
                const typeLabel = (c as any).type ?? (c as any).model?.type ?? "component";
                const label = name ? `${typeLabel}: ${name}` : id ? `${typeLabel}: ${id.slice ? id.slice(0, 6) : id}` : "component";
                return (
                  <option key={id} value={id}>{label}</option>
                );
              })}
            </select>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={onCreateAssoc} style={{ flex: 1 }} disabled={!assocSource || !assocTarget}>Create</button>
              <button onClick={resetAssocSelection} style={{ flex: 1 }}>Reset</button>
            </div>
          </div>
        </div>
      )}

    {mode === "actor" && <button onClick={onAddActor} style={{ padding: "8px 12px", width: "100%" }}>Add Actor</button>}
  {mode === "usecase" && <button onClick={onAddUseCase} style={{ padding: "8px 12px", width: "100%" }}>Add Use Case</button>}
  {mode === "interface" && <button onClick={onAddInterface} style={{ padding: "8px 12px", width: "100%" }}>Add Interface</button>}
  {mode === "system" && <button onClick={onAddSystem} style={{ padding: "8px 12px", width: "100%" }}>Add System Boundary</button>}
  {mode === "class" && <button onClick={onAddClass} style={{ padding: "8px 12px", width: "100%" }}>Add Class</button>}

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
