import React, { useEffect, useRef, useState } from "react";
import { AiOutlineZoomIn, AiOutlineZoomOut, AiOutlineReload, AiOutlineDrag } from "react-icons/ai";
import { CanvasModel } from "../models/CanvasModel";

type Props = {
  model?: CanvasModel;
  cellSize?: number;
  majorEvery?: number;
  background?: string;
  showControls?: boolean;
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

export const InfiniteCanvas: React.FC<Props> = ({ model, cellSize, majorEvery, background = "#ffffff", showControls = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<CanvasModel>(model ?? new CanvasModel({ cellSize, majorEvery }));
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [, setTick] = useState(0);

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
      const w = cvs.width;
      const h = cvs.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(dpr, dpr);
      drawGrid(ctx);
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

    function onPointerDown(e: PointerEvent) {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {}
      (cvs as HTMLCanvasElement).style.cursor = "grabbing";
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      modelRef.current.pan(dx, dy);
      last.current = { x: e.clientX, y: e.clientY };
      setTick((t) => t + 1);
    }

    function onPointerUp(e: PointerEvent) {
      dragging.current = false;
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
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
