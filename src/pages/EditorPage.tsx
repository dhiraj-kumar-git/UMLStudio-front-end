import React, { useEffect, useMemo, useState } from "react";
import InfiniteCanvas from "../components/InfiniteCanvas";
import LeftPanel from "../components/LeftPanel";
import RightPanel from "../components/RightPanel";
import { CanvasModel } from "../models/CanvasModel";
import type { DiagramComponent } from "../models/DiagramComponent";
import DiagramAssociation from "../models/DiagramAssociation";
import UseCaseAssociation from "../models/UseCaseAssociation";
import ClassAssociation from "../models/ClassAssociation";
import ActorUseCaseAssociation from "../models/ActorUseCaseAssociation";
import { LayoutManager } from "../models/LayoutManager";
import CanvasController from "../controller/CanvasController";
import { useProjectContext } from "../context/ProjectContext";
import { useDiagramContext } from "../context/DiagramContext";
import ProjectDiagramModal from "../components/ProjectDiagramModal";

export const EditorPage: React.FC = () => {
  const model = useMemo(() => new CanvasModel({ cellSize: 48, majorEvery: 8, initialScale: 1 }), []);
  const [components, setComponents] = useState<DiagramComponent[]>([]);
  const [associations, setAssociations] = useState<DiagramAssociation[]>([]);
  const [selection, setSelection] = useState<any>({ kind: null });

  const controller = useMemo(() => new CanvasController(), []);
  // wire controller callbacks to update React state
  controller.onSelectionChange = (sel) => setSelection(sel);
  controller.onComponentMove = (id: string, x: number, y: number) => {
    setComponents((prev) => {
      const next = prev.map((c) => {
        if ((c as any).id === id) {
          try {
            (c as any).moveTo?.(x, y);
          } catch {
            (c as any).x = x;
            (c as any).y = y;
          }
        }
        return c;
      });
      return [...next];
    });
    // recompute association offsets using latest associations state
    setAssociations((prev) => {
      LayoutManager.assignOffsetsForAll(prev);
      return [...prev];
    });
  };
  controller.onComponentResize = (id: string, width: number, height: number) => {
    setComponents((prev) => {
      const next = prev.map((c) => {
        if ((c as any).id === id) {
          (c as any).width = width;
          (c as any).height = height;
        }
        return c;
      });
      return [...next];
    });
  };
  controller.onAssociationUpdated = (assoc) => {
    // debug: log the incoming association update
    try {
      // eslint-disable-next-line no-console
      console.log("EditorPage: onAssociationUpdated ->", (assoc as any)?.id);
    } catch {}
    setAssociations((prev) => {
      // remove any existing entries with the same id (dedupe) and append the incoming assoc
      const filtered = prev.filter((a) => (a as any).id !== (assoc as any).id);
      return [...filtered, assoc];
    });
    // Ensure controller.selected.association points to the canonical instance in state
    try {
      const sel = (controller as any).selected;
      if (sel && sel.kind === "association" && (sel as any).id === (assoc as any).id) {
        // update selection to reference the new instance
        controller.setSelection({ kind: "association", id: (assoc as any).id, association: assoc as any });
      }
    } catch {}
  };

  const handleAdd = (c: DiagramComponent) => {
    // special payload to create an association
    const anyc = c as any;
    if (anyc && anyc.__createAssoc) {
      const src = components.find((p) => (p as any).id === anyc.sourceId);
      const tgt = components.find((p) => (p as any).id === anyc.targetId);
      if (src && tgt) {
          let assoc: DiagramAssociation | null = null;
          const kind = anyc.assocKind ?? "usecase";
          if (kind === "usecase") {
            assoc = new UseCaseAssociation(src, tgt, anyc.assocType ?? "includes");
          } else if (kind === "actor-usecase") {
            assoc = new ActorUseCaseAssociation(src, tgt);
        } else if (kind === "class-assoc") {
            const csRaw = anyc.cardinalitySource;
            const ctRaw = anyc.cardinalityTarget;
            const cs = csRaw !== undefined && csRaw !== null && csRaw !== "" ? Number(csRaw) : undefined;
            const ct = ctRaw !== undefined && ctRaw !== null && ctRaw !== "" ? Number(ctRaw) : undefined;
            // If realization, ensure source is interface
            if ((anyc.classAssocKind === "realization") && ((src as any).type !== "interface")) {
              try {
                // eslint-disable-next-line no-alert
                alert("Realization associations require an Interface as the source. Please select an Interface component as the source.");
              } catch {}
            } else {
              assoc = new ClassAssociation(src, tgt, anyc.classAssocKind ?? "association", anyc.assocName, cs, ct);
            }
          } else {
            assoc = new UseCaseAssociation(src, tgt, anyc.assocType ?? "includes");
          }
        // Use functional update so we can compute offsets on the new array before setting state
          if (assoc) {
            setAssociations((s) => {
              const next = [...s, assoc as DiagramAssociation];
              // assign symmetric offsets for all pairs so parallel edges are spaced
              LayoutManager.assignOffsetsForAll(next);
              return next;
            });
          }
      }
      return;
    }

    setComponents((s) => [...s, c]);
  };

  // ensure a project exists in context — if none, show a modal
  const projectCtx = useProjectContext();
  const diagCtx = useDiagramContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  useEffect(() => {
    if (!projectCtx.project) setShowCreateModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateFromModal = async (payload: { projectName?: string; projectDescription?: string; diagramName: string; diagramDescription?: string; diagramType?: string }) => {
    try {
      let proj = projectCtx.project;
      if (!proj) {
        proj = await projectCtx.createProject?.(payload.projectName || "Project", payload.projectDescription);
      }
      const session = diagCtx.createSession?.(payload.diagramName || "Diagram", { components: [], associations: [], type: payload.diagramType });
      if (session) {
        await projectCtx.addDiagramToProject?.(session as any);
        diagCtx.openSessionById(session.id);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("EditorPage: create from modal failed", err);
    } finally {
      setShowCreateModal(false);
    }
  };

  // render the modal when requested (Editor-level modal)

  return (
    <>
    <div style={{ display: "flex", width: "100vw", height: "100vh", background: "#f7f7fb" }}>
      <LeftPanel canvasModel={model} existing={components} onAdd={handleAdd} selected={selection} onUpdateComponent={(id, patch) => {
        setComponents((prev) => {
          const next = prev.map((c) => {
            if ((c as any).id === id) {
              Object.assign(c as any, patch);
            }
            return c;
          });
          return [...next];
        });
      }} onUpdateAssociation={(assoc) => {
        setAssociations((prev) => prev.map((a) => ((a as any).id === (assoc as any).id ? assoc : a)));
      }} />
      <div style={{ flex: 1, position: "relative" }}>
        <InfiniteCanvas model={model} background="#fff" showControls={true} components={components} associations={associations} controller={controller} />
      </div>
      <RightPanel />
    </div>
    {showCreateModal && (
      <ProjectDiagramModal
        open={showCreateModal}
        projectExists={!!projectCtx.project}
        defaultProjectName={projectCtx.project?.name}
        defaultProjectDescription={projectCtx.project?.description}
        onCancel={() => setShowCreateModal(false)}
        onCreate={handleCreateFromModal}
      />
    )}
    </>
  );
};

export default EditorPage;
