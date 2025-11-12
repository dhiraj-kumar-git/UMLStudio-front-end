import React, { useState } from "react";
import LayoutManager from "../models/LayoutManager";
import { CanvasModel } from "../models/CanvasModel";
import { ActorComponent } from "../models/ActorComponent";
import type { DiagramComponent } from "../models/DiagramComponent";
import type DiagramAssociation from "../models/DiagramAssociation";
import { UseCaseComponent } from "../models/UseCaseComponent";
import type { UseCaseAssocType } from "../models/UseCaseAssociation";

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
  const [mode, setMode] = useState<"actor" | "usecase" | "assoc">("actor");
  const [assocType, setAssocType] = useState<UseCaseAssocType>("includes");
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

  const resetAssocSelection = () => {
    setAssocSource(null);
    setAssocTarget(null);
  };

  const onCreateAssoc = () => {
    if (!assocSource || !assocTarget) return;
    // emit a synthetic instruction via onAdd: we pass a special payload object
    if (onAdd) onAdd((() => {
      // placeholder: the EditorPage will intercept this special object and create the association
      return ({ __createAssoc: true, sourceId: assocSource, targetId: assocTarget, assocType } as any) as unknown as DiagramComponent;
    })());
    resetAssocSelection();
  };

  return (
    <div style={{ width: 260, padding: 12, borderRight: "1px solid #eee", background: "#fafafa", height: "100vh" }}>
      <h3 style={{ marginTop: 2 }}>Toolbox</h3>
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 12, color: "#333" }}>Mode</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("actor")} style={{ flex: 1 }} disabled={mode === "actor"}>Actor</button>
          <button onClick={() => setMode("usecase")} style={{ flex: 1 }} disabled={mode === "usecase"}>Use Case</button>
          <button onClick={() => setMode("assoc")} style={{ flex: 1 }} disabled={mode === "assoc"}>Association</button>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 12, color: "#333" }}>{mode === "assoc" ? "Association label/ type" : "Name"}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
      </div>

      {mode === "assoc" && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontSize: 12, color: "#333" }}>Type</label>
          <select value={assocType} onChange={(e) => setAssocType(e.target.value as UseCaseAssocType)} style={{ width: "100%", padding: 8 }}>
            <option value="includes">&lt;&lt;includes&gt;&gt;</option>
            <option value="extends">&lt;&lt;extends&gt;&gt;</option>
          </select>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: "block", fontSize: 12 }}>Source</label>
            <select value={assocSource ?? ""} onChange={(e) => setAssocSource(e.target.value || null)} style={{ width: "100%", padding: 8 }}>
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
              // uncontrolled inputs using refs for simplicity
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
