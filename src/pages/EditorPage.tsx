import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { ActorComponent } from "../models/ActorComponent";
import UseCaseComponent from "../models/UseCaseComponent";
import SystemBoundary from "../models/SystemBoundary";
import ClassComponent from "../models/ClassComponent";
import InterfaceComponent from "../models/InterfaceComponent";
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
  const loadingRef = useRef(false);
  const syncTimerRef = useRef<number | null>(null);
  
  // When a diagram session is opened in DiagramContext, revive its stored JSON
  // into live component and association instances and load them into the canvas.
  useEffect(() => {
    const s = diagCtx.currentSession;
    if (!s) {
      setComponents([]);
      setAssociations([]);
      return;
    }
    // prevent the sync-effect from persisting back while we're loading
    loadingRef.current = true;
    try {
      const dj = s.diagramJSON ?? { components: [], associations: [] };
      const compMap = new Map<string, DiagramComponent>();
      const comps: DiagramComponent[] = [];
      const rawComps = Array.isArray(dj.components) ? dj.components : [];
      for (const cj of rawComps) {
        let inst: DiagramComponent | null | undefined = null;
        const t = cj?.type ?? cj?.componentType ?? "";
        if (t === "actor") inst = (ActorComponent as any).fromJSON ? (ActorComponent as any).fromJSON(cj) : null;
        else if (t === "usecase") inst = (UseCaseComponent as any).fromJSON ? (UseCaseComponent as any).fromJSON(cj) : null;
        else if (t === "system-boundary") inst = (SystemBoundary as any).reviveFromJSON ? (SystemBoundary as any).reviveFromJSON(cj) : null;
        else if (t === "class") inst = (ClassComponent as any).reviveFromJSON ? (ClassComponent as any).reviveFromJSON(cj) : null;
        else if (t === "interface") inst = (InterfaceComponent as any).reviveFromJSON ? (InterfaceComponent as any).reviveFromJSON(cj) : null;
        else {
          // fallback: try common static factories if present
          if ((ActorComponent as any).fromJSON && cj.type === "actor") inst = (ActorComponent as any).fromJSON(cj);
        }
        if (inst) {
          compMap.set((inst as any).id, inst);
          comps.push(inst);
        }
      }

      const assocRaw = Array.isArray(dj.associations) ? dj.associations : [];
      const assocs: any[] = [];
      const resolver = (id: string) => compMap.get(id);
      for (const aj of assocRaw) {
        let a: DiagramAssociation | null = null;
        const at = aj?.type ?? aj?.assocType ?? "";
        if (at === "usecase-association" || aj?.assocType) a = UseCaseAssociation.fromJSON ? UseCaseAssociation.fromJSON(aj, resolver) : null;
        else if (at === "class-association" || aj?.kind) a = ClassAssociation.fromJSON ? ClassAssociation.fromJSON(aj, resolver) : null;
        else if (at === "actor-usecase" || aj?.type === "actor-usecase") a = DiagramAssociation.reviveFromJSON ? DiagramAssociation.reviveFromJSON(aj, resolver) as any : null;
        else a = DiagramAssociation.reviveFromJSON ? DiagramAssociation.reviveFromJSON(aj, resolver) : null;
        if (a) assocs.push(a);
      }

      // compute offsets for parallel edges
      LayoutManager.assignOffsetsForAll(assocs);

      setComponents(comps);
      setAssociations(assocs as any[]);
      // eslint-disable-next-line no-console
      console.log("EditorPage: loaded session into canvas ->", s.id, { comps: comps.length, assocs: assocs.length });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("EditorPage: failed to revive session ->", err);
    }
    finally {
      // allow one tick for React state to settle before re-enabling sync
      setTimeout(() => {
        loadingRef.current = false;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagCtx.currentSession]);

  // Reply to save requests from DiagramContext when it wants the editor to
  // provide the current in-memory diagramJSON before switching sessions.
  useEffect(() => {
    const onRequest = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail ?? {};
        const requestId = detail.requestId;
        // include diagram type when replying so DiagramContext doesn't lose it
        const diagramType = diagCtx.currentSession?.diagramJSON?.type ?? diagCtx.currentSession?.diagramJSON?.type ?? undefined;
        const diagramJSON = {
          components: components.map((c) => (c as any).toJSON ? (c as any).toJSON() : (c as any)),
          associations: associations.map((a) => (a as any).toJSON ? (a as any).toJSON() : (a as any)),
          ...(diagramType ? { type: diagramType } : {}),
        };
        window.dispatchEvent(new CustomEvent("uml:reply-save", { detail: { requestId, diagramJSON } }));
      } catch (err) {
        try { window.dispatchEvent(new CustomEvent("uml:reply-save", { detail: { requestId: (ev as any)?.detail?.requestId, diagramJSON: null } })); } catch {}
      }
    };
    window.addEventListener("uml:request-save", onRequest as EventListener);
    return () => window.removeEventListener("uml:request-save", onRequest as EventListener);
  }, [components, associations]);

  // Listen for selection requests from other UI (RightPanel) and map them to
  // the canonical runtime instances in the canvas controller.
  useEffect(() => {
    let cancelled = false;
    const trySelect = (kind: string, id: string | undefined, attemptsLeft = 8) => {
      try { console.log('EditorPage: trySelect', { kind, id, attemptsLeft }); } catch {}
      if (cancelled) return;
      if (!id) return;
      // find component or association in current runtime arrays
      if (kind === 'component') {
        const comp = components.find((c) => (c as any).id === id);
        if (comp) {
          try { console.log('EditorPage: trySelect -> found component', id); } catch {}
          controller.setSelection({ kind: 'component', id, component: comp as any });
          return;
        }
      } else if (kind === 'association') {
        const assoc = associations.find((a) => (a as any).id === id);
        if (assoc) {
          try { console.log('EditorPage: trySelect -> found association', id); } catch {}
          controller.setSelection({ kind: 'association', id, association: assoc as any });
          return;
        }
      }
      // if not found but the editor is currently loading or we still have attempts,
      // retry after a short delay to allow revive to finish.
      if (attemptsLeft > 0) {
        setTimeout(() => trySelect(kind, id, attemptsLeft - 1), 150);
      } else {
        try { console.log('EditorPage: trySelect -> giving up', { kind, id }); } catch {}
      }
    };

    const onSelect = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail ?? {};
        const { kind, id, diagramId } = detail;
        try { console.log('EditorPage: received uml:select', { kind, id, diagramId, currentSession: diagCtx.currentSession?.id }); } catch {}
        // If a different diagram is requested, open it first and then select.
        if (diagramId && diagCtx.currentSession?.id !== diagramId) {
          try { console.log('EditorPage: selecting - opening diagram first', diagramId); } catch {}
          diagCtx.openSessionById(diagramId);
          // give editor a moment to revive the session, then attempt selection
          setTimeout(() => trySelect(kind, id), 220);
        } else {
          trySelect(kind, id);
        }
      } catch (err) { try { console.warn('EditorPage: onSelect error', err); } catch {} }
    };

    window.addEventListener('uml:select', onSelect as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener('uml:select', onSelect as EventListener);
    };
  }, [components, associations, controller, diagCtx]);

  // Keep the DiagramContext's current session JSON updated when components/associations change.
  useEffect(() => {
    // Debounce updates to avoid rapid round-trips that cause reload loops.
    try {
      if (loadingRef.current) return;
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current as any);
      }
      syncTimerRef.current = window.setTimeout(() => {
          try {
            const cs = diagCtx.currentSession;
            if (!cs) return;
            const diagramJSON = { components: components.map((c) => (c as any).toJSON ? (c as any).toJSON() : (c as any)), associations: associations.map((a) => (a as any).toJSON ? (a as any).toJSON() : (a as any)), type: cs.diagramJSON?.type };
            // avoid writing if nothing changed
            try {
              const oldStr = JSON.stringify(cs.diagramJSON ?? {});
              const newStr = JSON.stringify(diagramJSON ?? {});
              if (oldStr === newStr) return;
            } catch {}
            diagCtx.updateCurrent?.({ diagramJSON });
          } catch (err) {
          // eslint-disable-next-line no-console
          console.warn("EditorPage: failed to sync to diagram context", err);
        }
      }, 180);
    } catch (err) {}
    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current as any);
        syncTimerRef.current = null;
      }
    };
  }, [components, associations]);
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

      <RightPanel />

      <div style={{ position: 'fixed', left: 'var(--left-panel-width,360px)', right: 'var(--right-panel-width,320px)', top: 0, bottom: 0, background: '#f7f7fb' }}>
        <InfiniteCanvas model={model} background="#fff" showControls={true} components={components} associations={associations} controller={controller} />
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
