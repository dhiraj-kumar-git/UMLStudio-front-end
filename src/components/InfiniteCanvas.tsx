import React, { useEffect, useRef, useState } from "react";
import { AiOutlineZoomIn, AiOutlineZoomOut, AiOutlineReload, AiOutlineDrag } from "react-icons/ai";
import { CanvasModel } from "../models/CanvasModel";
import { DiagramComponent } from "../models/DiagramComponent";
import { ComponentRenderer } from "./ComponentRenderer";
import DiagramAssociation from "../models/DiagramAssociation";
import type CanvasController from "../controller/CanvasController";

type Props = {
  model?: CanvasModel;
  cellSize?: number;
  majorEvery?: number;
  background?: string;
  showControls?: boolean;
  components?: DiagramComponent[];
  associations?: DiagramAssociation[];
  controller?: CanvasController | null;
};

const styles: { [k: string]: React.CSSProperties } = {
  container: { position: "relative", width: "100%", height: "100%", overflow: "hidden" },
  canvas: { width: "100%", height: "100%", display: "block", cursor: "grab" },
  controls: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 20,
    display: "flex",
    gap: 8,
    padding: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    zIndex: 10,
  },
  button: {
    width: 40,
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: "none",
    background: "rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
};

export const InfiniteCanvas: React.FC<Props> = ({ model, cellSize, majorEvery, background = "#ffffff", showControls = true, components, associations, controller = null }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<CanvasModel>(model ?? new CanvasModel({ cellSize, majorEvery }));
  const propsRef = useRef<{ components?: DiagramComponent[] }>({ components: undefined });
  const last = useRef({ x: 0, y: 0 });
  const [, setTick] = useState(0);
  const draggingComponentRef = useRef<{ id?: string; offsetX?: number; offsetY?: number }>({});
  const draggingControlRef = useRef<{ assocId?: string; cpIndex?: number }>({});
  const pendingInsertRef = useRef<{ assocId?: string; clickWorld?: { x: number; y: number }; activated?: boolean }>({});
  const isPanningRef = useRef(false);
  // (removed noisy log ref)

  // keep components prop in a ref for the render loop
  useEffect(() => {
    propsRef.current.components = components;
  }, [components]);

  // keep associations prop in a ref for the render loop
  useEffect(() => {
    (propsRef.current as any).associations = associations;
  }, [associations]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!cvs) return;
      cvs.width = Math.floor(cvs.clientWidth * dpr);
      cvs.height = Math.floor(cvs.clientHeight * dpr);
      draw();
    }

    function drawGrid(ctx: CanvasRenderingContext2D) {
      if (!cvs) return;
      const m = modelRef.current;
      const cs = m.cellSize;
      const scale = m.scale;
      const ox = m.offsetX;
      const oy = m.offsetY;
      const w = cvs.clientWidth;
      const h = cvs.clientHeight;

      // background
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);

      // compute visible bounds in world coordinates
      const left = -ox / scale;
      const top = -oy / scale;
      const right = (w - ox) / scale;
      const bottom = (h - oy) / scale;

      // vertical lines
      const startX = Math.floor(left / cs) * cs;
      const endX = Math.ceil(right / cs) * cs;
      for (let x = startX; x <= endX; x += cs) {
        const screenX = x * scale + ox;
        const idx = Math.round(x / cs);
        const isMajor = idx % (m.majorEvery || 10) === 0;
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? "#222" : "#bbb";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, h);
        ctx.stroke();
      }

      // horizontal lines
      const startY = Math.floor(top / cs) * cs;
      const endY = Math.ceil(bottom / cs) * cs;
      for (let y = startY; y <= endY; y += cs) {
        const screenY = y * scale + oy;
        const idx = Math.round(y / cs);
        const isMajor = idx % (m.majorEvery || 10) === 0;
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? "#222" : "#bbb";
        ctx.lineWidth = isMajor ? 1 : 0.5;
        ctx.moveTo(0, screenY);
        ctx.lineTo(w, screenY);
        ctx.stroke();
      }
    }

    function draw() {
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      if (!ctx) return;
      // update cursor style based on selection/drag state
      try {
        if (controller) {
          const sel = (controller as any).selected;
          const draggingComponent = draggingComponentRef.current;
          const draggingControl = draggingControlRef.current;
          if ((draggingComponent && draggingComponent.id) || (draggingControl && draggingControl.assocId)) {
            cvs.style.cursor = "grabbing";
          } else if (sel && sel.kind) {
            cvs.style.cursor = "pointer";
          } else {
            cvs.style.cursor = "grab";
          }
        }
      } catch {}
      const w = cvs.width;
      const h = cvs.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(dpr, dpr);
      drawGrid(ctx);
      // Translate the context by the canvas offsets so component.draw can work in world coordinates
      ctx.save();
      const m = modelRef.current;
      ctx.translate(m.offsetX, m.offsetY);

      // render components if provided via propsRef
      const comps = propsRef.current.components as DiagramComponent[] | undefined;
      if (Array.isArray(comps) && comps.length > 0) {
        const renderer = new ComponentRenderer(ctx, m.scale);
        for (const c of comps) {
          try {
            renderer.render(c as any);
          } catch (err) {
            // swallow render errors per-component
          }
        }
        // highlight selected component
        try {
          if (controller && (controller as any).selected && (controller as any).selected.kind === "component") {
            const selId = (controller as any).selected.id;
            const sel = comps.find((x) => (x as any).id === selId) as any;
            if (sel) {
              const bb = sel.boundingBox();
              ctx.save();
              ctx.strokeStyle = "#00c8ff";
              ctx.lineWidth = Math.max(2, 2 * m.scale);
              ctx.strokeRect(bb.x * m.scale, bb.y * m.scale, bb.width * m.scale, bb.height * m.scale);
              ctx.restore();
            }
          }
        } catch {}
      }

  // render associations if any (they draw in world coords too)
  const assocs = (propsRef.current as any).associations as DiagramAssociation[] | undefined;
  // selected association instance (if any) carried by controller
      if (Array.isArray(assocs) && assocs.length > 0) {
        // Draw each association. If one is currently selected (controller.selected), prefer the
        // selected.association instance when drawing that particular association so the main line
        // always reflects the authoritative, possibly-updated object.
        try {
          const sel = controller && (controller as any).selected && (controller as any).selected.kind === "association" ? (controller as any).selected : null;
          const selId = sel ? (sel as any).id : null;
          // draw all non-selected associations first
          for (const a of assocs) {
            try {
              if (selId && (a as any).id === selId) continue;
              a.draw(ctx, m.scale);
            } catch (err) {
              // swallow per-association draw errors
            }
          }

          // prefer the authoritative instance from assocs array for drawing the selected association
          let selAssoc: DiagramAssociation | undefined = undefined;
          if (selId) selAssoc = assocs.find((x) => (x as any).id === selId) as DiagramAssociation | undefined;
          if (!selAssoc && sel && (sel as any).association) selAssoc = (sel as any).association as DiagramAssociation;

          // draw selected association (if any) last so it reflects freshest data; request highlight
          if (selAssoc) {
            selAssoc.draw(ctx, m.scale, { highlight: true, highlightStyle: "stroke" });

            // draw control points for selected association
            try {
              if (Array.isArray((selAssoc as any).controlPoints) && (selAssoc as any).controlPoints.length) {
                ctx.save();
                ctx.fillStyle = "#ff5722";
                ctx.strokeStyle = "#000";
                const r = 6 * (m.scale || 1);
                for (let i = 0; i < (selAssoc as any).controlPoints.length; i++) {
                  const cp = (selAssoc as any).controlPoints[i];
                  const sx = cp.x * m.scale;
                  const sy = cp.y * m.scale;
                  ctx.beginPath();
                  ctx.arc(sx, sy, r, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.lineWidth = 2;
                  ctx.stroke();
                }
                ctx.restore();
              }
            } catch {}
          }
        } catch (err) {
          // swallow
        }
      }

      ctx.restore();
      ctx.restore();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cvs);
    let raf = 0;
    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [background]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    // pointer and wheel handling: supports selection, component dragging, control-point dragging, and panning
      function screenToLocal(e: { clientX: number; clientY: number }) {
      if (!cvs) return { x: e.clientX, y: e.clientY };
      const rect = cvs.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function toWorld(screenX: number, screenY: number) {
      const m = modelRef.current;
      return { x: (screenX - m.offsetX) / m.scale, y: (screenY - m.offsetY) / m.scale };
    }

    function onWheel(e: WheelEvent) {
      const m = modelRef.current;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        m.zoom(delta, e.offsetX, e.offsetY);
        setTick((t) => t + 1);
      } else if (e.shiftKey) {
        m.pan(-e.deltaY, 0);
        setTick((t) => t + 1);
      } else {
        m.pan(-e.deltaX, -e.deltaY);
        setTick((t) => t + 1);
      }
    }
  // Note: use the top-level refs (defined above) for shared pointer state so draw()/handlers
  // operate on the same objects. The refs are: draggingComponentRef, draggingControlRef,
  // pendingInsertRef, isPanningRef.

    function findComponentAt(worldPt: { x: number; y: number }) {
      const comps = propsRef.current.components as DiagramComponent[] | undefined;
      if (!comps) return undefined;
      for (let i = comps.length - 1; i >= 0; i--) {
        const c = comps[i];
        try {
          if ((c as any).containsPoint && (c as any).containsPoint(worldPt.x, worldPt.y)) return c;
        } catch {
          // ignore
        }
      }
      return undefined;
    }

    function findAssociationAt(worldPt: { x: number; y: number }, tolWorld = 6 / (modelRef.current.scale || 1)) {
      const ass = (propsRef.current as any).associations as DiagramAssociation[] | undefined;
      if (!ass) return undefined;
      // If there's a selected association coming from the controller, test it first
      try {
        if (controller && (controller as any).selected && (controller as any).selected.kind === "association") {
          const selAssoc = (controller as any).selected.association as DiagramAssociation | undefined;
          if (selAssoc && (selAssoc as any).containsPoint && (selAssoc as any).containsPoint(worldPt, tolWorld)) return selAssoc;
        }
      } catch {}
      for (let i = ass.length - 1; i >= 0; i--) {
        const a = ass[i];
        try {
          if ((a as any).containsPoint && (a as any).containsPoint(worldPt, tolWorld)) {
            try { console.log("InfiniteCanvas: findAssociationAt -> found assoc", (a as any).id); } catch {}
            return a;
          }
        } catch {
          // ignore
        }
      }
      return undefined;
    }

    function onPointerDown(e: PointerEvent) {
      const local = screenToLocal(e);
      const world = toWorld(local.x, local.y);
      last.current = { x: e.clientX, y: e.clientY };

      // first check control points of currently selected association
      const selAssocId = (controller && (controller as any).selected && (controller as any).selected.kind === "association") ? (controller as any).selected.id : null;
      if (selAssocId) {
        const ass = ((propsRef.current as any).associations as DiagramAssociation[] || []).find((x) => (x as any).id === selAssocId);
        if (ass && Array.isArray((ass as any).controlPoints)) {
          const cps = (ass as any).controlPoints as { x: number; y: number }[];
          for (let i = 0; i < cps.length; i++) {
            const cp = cps[i];
            const d = Math.hypot(cp.x - world.x, cp.y - world.y);
            if (d <= 12 / (modelRef.current.scale || 1)) {
              // begin dragging this control point (store in ref)
              draggingControlRef.current.assocId = (ass as any).id;
              draggingControlRef.current.cpIndex = i;
              try { console.log("InfiniteCanvas: begin drag control point", { assocId: (ass as any).id, index: i }); } catch {}
              try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
              (cvs as HTMLCanvasElement).style.cursor = "grabbing";
              return;
            }
          }
        }
      }

      // then check component hit
      const hitComp = findComponentAt(world);
      if (hitComp) {
        // select and prepare drag
        if (controller) controller.setSelection({ kind: "component", id: (hitComp as any).id, component: hitComp });
  try { console.log("InfiniteCanvas: selected component", (hitComp as any).id); } catch {}
        draggingComponentRef.current.id = (hitComp as any).id;
        draggingComponentRef.current.offsetX = world.x - (hitComp as any).x;
        draggingComponentRef.current.offsetY = world.y - (hitComp as any).y;
        try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
        (cvs as HTMLCanvasElement).style.cursor = "grabbing";
        return;
      }

      // check association hit
      const hitAssoc = findAssociationAt(world);
      if (hitAssoc) {
        // select the association
        if (controller) controller.setSelection({ kind: "association", id: (hitAssoc as any).id, association: hitAssoc });
  try { console.log("InfiniteCanvas: selected association", (hitAssoc as any).id); } catch {}
        // instead of inserting a control point immediately, mark a pending insert in ref
        pendingInsertRef.current.assocId = (hitAssoc as any).id;
        pendingInsertRef.current.clickWorld = { x: world.x, y: world.y };
        pendingInsertRef.current.activated = false;
        try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
        (cvs as HTMLCanvasElement).style.cursor = "grab";
        return;
      }

      // otherwise begin panning
      // clear selection when clicking empty canvas so pointer returns to normal
      try {
        // debug
  try { console.log("InfiniteCanvas: clearSelection (background click)"); } catch {}
        if (controller) controller.clearSelection();
      } catch {}
      isPanningRef.current = true;
      try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
      (cvs as HTMLCanvasElement).style.cursor = "grabbing";
    }

    function onPointerMove(e: PointerEvent) {
      const local = screenToLocal(e);
      const world = toWorld(local.x, local.y);

      // if we have a pending insert and user has moved the pointer enough, create the control point and start dragging it
      if (pendingInsertRef.current.assocId && !pendingInsertRef.current.activated) {
        const click = pendingInsertRef.current.clickWorld!;
        const dx = world.x - click.x;
        const dy = world.y - click.y;
        const movedSq = dx * dx + dy * dy;
        const startThreshold = (6 / (modelRef.current.scale || 1));
        if (movedSq >= startThreshold * startThreshold) {
          const ass = ((propsRef.current as any).associations as DiagramAssociation[] || []).find((x) => (x as any).id === pendingInsertRef.current.assocId);
          if (ass) {
            // mutate the real association in-place (no cloning) and notify host
            if (!Array.isArray(ass.controlPoints)) ass.controlPoints = [];
            const idx = ass.insertControlPointAtPoint({ x: click.x, y: click.y });
            pendingInsertRef.current.activated = true;
            draggingControlRef.current.assocId = pendingInsertRef.current.assocId;
            draggingControlRef.current.cpIndex = idx;
            // propsRef already references the same array; ensure host is notified
            try { console.log("InfiniteCanvas: inserted control point", { assocId: (ass as any).id, index: idx }); } catch {}
            if (controller) controller.notifyAssociationUpdated(ass as any);
            setTick((t) => t + 1);
           // continue and handle dragging below
          } else {
            // clear pending
            pendingInsertRef.current.assocId = undefined;
            pendingInsertRef.current.clickWorld = undefined;
            pendingInsertRef.current.activated = false;
          }
        }
      }

      // dragging a control point
      if (draggingControlRef.current.assocId) {
        const assocId = draggingControlRef.current.assocId;
        const cpIndex = draggingControlRef.current.cpIndex;
        const ass = ((propsRef.current as any).associations as DiagramAssociation[] || []).find((x) => (x as any).id === assocId);
        if (ass && typeof cpIndex === "number") {
          // mutate the actual association's control point
          ass.moveControlPoint(cpIndex, { x: world.x, y: world.y } as any);
          try { console.log("InfiniteCanvas: moveControlPoint", { assocId: (ass as any).id, index: cpIndex, x: world.x, y: world.y }); } catch {}
          // notify host so React state can update if needed
          if (controller) controller.notifyAssociationUpdated(ass as any);
          setTick((t) => t + 1);
        }
        return;
      }

      // dragging a component
      if (draggingComponentRef.current.id) {
        const id = draggingComponentRef.current.id!;
        const newX = world.x - (draggingComponentRef.current.offsetX || 0);
        const newY = world.y - (draggingComponentRef.current.offsetY || 0);
        // notify controller/host to update model state
        if (controller) controller.notifyComponentMove(id, newX, newY);
        setTick((t) => t + 1);
        return;
      }

      // panning
      if (isPanningRef.current) {
        if (!last.current) return;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        modelRef.current.pan(dx, dy);
        last.current = { x: e.clientX, y: e.clientY };
        setTick((t) => t + 1);
      }
    }

    function onPointerUp(e: PointerEvent) {
      // clear all drag state
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      draggingComponentRef.current.id = undefined;
      draggingComponentRef.current.offsetX = undefined;
      draggingComponentRef.current.offsetY = undefined;
      draggingControlRef.current.assocId = undefined;
      draggingControlRef.current.cpIndex = undefined;
      pendingInsertRef.current.assocId = undefined;
      pendingInsertRef.current.clickWorld = undefined;
      pendingInsertRef.current.activated = false;
      isPanningRef.current = false;
      (cvs as HTMLCanvasElement).style.cursor = "grab";
    }

    cvs.addEventListener("wheel", onWheel, { passive: false } as any);
    cvs.addEventListener("pointerdown", onPointerDown as any);
    window.addEventListener("pointermove", onPointerMove as any);
    window.addEventListener("pointerup", onPointerUp as any);

    return () => {
      cvs.removeEventListener("wheel", onWheel as any);
      cvs.removeEventListener("pointerdown", onPointerDown as any);
      window.removeEventListener("pointermove", onPointerMove as any);
      window.removeEventListener("pointerup", onPointerUp as any);
    };
  }, []);

  const zoomIn = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    modelRef.current.zoom(1.2, cvs.clientWidth / 2, cvs.clientHeight / 2);
    setTick((t) => t + 1);
  };

  const zoomOut = () => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    modelRef.current.zoom(0.8, cvs.clientWidth / 2, cvs.clientHeight / 2);
    setTick((t) => t + 1);
  };

  const reset = () => {
    modelRef.current.reset();
    setTick((t) => t + 1);
  };

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />
      {showControls && (
        <div style={styles.controls}>
          <button style={styles.button} onClick={zoomOut} title="Zoom out">
            <AiOutlineZoomOut size={18} />
          </button>
          <button style={styles.button} onClick={zoomIn} title="Zoom in">
            <AiOutlineZoomIn size={18} />
          </button>
          <button style={styles.button} onClick={reset} title="Reset">
            <AiOutlineReload size={18} />
          </button>
          <div style={{ ...styles.button }} title="Pan (drag)">
            <AiOutlineDrag size={16} />
          </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteCanvas;
