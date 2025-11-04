import React, { useEffect, useRef, useState } from "react";
import { AiOutlineZoomIn, AiOutlineZoomOut, AiOutlineReload, AiOutlineDrag } from "react-icons/ai";

// Object-oriented controller for canvas state and operations
class CanvasController {
  scale: number;
  offsetX: number;
  offsetY: number;
  minScale: number;
  maxScale: number;

  constructor(scale = 1, offsetX = 0, offsetY = 0, minScale = 0.1, maxScale = 5) {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.minScale = minScale;
    this.maxScale = maxScale;
  }

  zoom(delta: number, centerX = 0, centerY = 0) {
    const prev = this.scale;
    const next = Math.max(this.minScale, Math.min(this.maxScale, this.scale * delta));
    this.offsetX = centerX - ((centerX - this.offsetX) * next) / prev;
    this.offsetY = centerY - ((centerY - this.offsetY) * next) / prev;
    this.scale = next;
  }

  pan(dx: number, dy: number) {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  reset(initialScale = 1) {
    this.scale = initialScale;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}

const styles: { [k: string]: React.CSSProperties } = {
  container: {
    position: "fixed",
    inset: 0,
    background: "#fff",
    zIndex: 10,
  },
  canvas: {
    width: "100%",
    height: "100%",
    display: "block",
    cursor: "grab",
  },
  controls: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 24,
    display: "flex",
    gap: 12,
    background: "rgba(255,255,255,0.85)",
    padding: 8,
    borderRadius: 999,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    alignItems: "center",
    zIndex: 20,
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 8,
    border: "none",
    background: "rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
};

export type InfiniteCanvasProps = {
  cellSize?: number; // base size for grid cell in px
  majorEvery?: number; // how many cells between major lines
  minorColor?: string;
  majorColor?: string;
  minorLineWidth?: number;
  majorLineWidth?: number;
  backgroundColor?: string;
  initialScale?: number;
  minScale?: number;
  maxScale?: number;
  showControls?: boolean;
  controlsOpacity?: number;
};

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  cellSize = 64,
  majorEvery = 10,
  minorColor = "#999999",
  majorColor = "#000000",
  minorLineWidth = 0.5,
  majorLineWidth = 1.2,
  backgroundColor = "#ffffff",
  initialScale = 1,
  minScale = 0.1,
  maxScale = 5,
  showControls = true,
  controlsOpacity = 0.85,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctrlRef = useRef(new CanvasController(initialScale, 0, 0, minScale, maxScale));
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [_, setTick] = useState(0); // force render for UI changes like zoom

  useEffect(() => {
  const canvas = canvasRef.current!;
  if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
      draw();
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(dpr, dpr);

      const scale = ctrlRef.current.scale;
      const ox = ctrlRef.current.offsetX;
      const oy = ctrlRef.current.offsetY;

      // background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // calculate visible bounds in world coordinates
      const left = -ox / scale;
      const top = -oy / scale;
      const right = (canvas.clientWidth - ox) / scale;
      const bottom = (canvas.clientHeight - oy) / scale;

      // draw vertical lines
      const startX = Math.floor(left / cellSize) * cellSize;
      const endX = Math.ceil(right / cellSize) * cellSize;
      for (let x = startX; x <= endX; x += cellSize) {
        const screenX = x * scale + ox;
        const idx = Math.round(x / cellSize);
        const isMajor = idx % majorEvery === 0;
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? majorColor : minorColor;
        ctx.lineWidth = isMajor ? majorLineWidth : minorLineWidth;
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.clientHeight);
        ctx.stroke();
      }

      // draw horizontal lines
      const startY = Math.floor(top / cellSize) * cellSize;
      const endY = Math.ceil(bottom / cellSize) * cellSize;
      for (let y = startY; y <= endY; y += cellSize) {
        const screenY = y * scale + oy;
        const idx = Math.round(y / cellSize);
        const isMajor = idx % majorEvery === 0;
        ctx.beginPath();
        ctx.strokeStyle = isMajor ? majorColor : minorColor;
        ctx.lineWidth = isMajor ? majorLineWidth : minorLineWidth;
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.clientWidth, screenY);
        ctx.stroke();
      }

      ctx.restore();
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

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
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        // zoom
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        ctrlRef.current.zoom(delta, e.offsetX, e.offsetY);
        setTick(t => t + 1);
      } else if (e.shiftKey) {
        // horizontal scroll as pan
        ctrlRef.current.pan(-e.deltaY, 0);
        setTick(t => t + 1);
      } else {
        ctrlRef.current.pan(-e.deltaX, -e.deltaY);
        setTick(t => t + 1);
      }
    }

    function onPointerDown(e: PointerEvent) {
      dragging.current = true;
      (e.target as Element).setPointerCapture(e.pointerId);
      lastPos.current = { x: e.clientX, y: e.clientY };
      (canvas as HTMLCanvasElement).style.cursor = "grabbing";
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      ctrlRef.current.pan(dx, dy);
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTick(t => t + 1);
    }

    function onPointerUp(e: PointerEvent) {
      dragging.current = false;
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {}
      (canvas as HTMLCanvasElement).style.cursor = "grab";
    }

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("wheel", onWheel as any);
      canvas.removeEventListener("pointerdown", onPointerDown as any);
      window.removeEventListener("pointermove", onPointerMove as any);
      window.removeEventListener("pointerup", onPointerUp as any);
    };
  }, []);

  const zoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctrlRef.current.zoom(1.2, canvas.clientWidth / 2, canvas.clientHeight / 2);
    setTick(t => t + 1);
  };
  const zoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    ctrlRef.current.zoom(0.8, canvas.clientWidth / 2, canvas.clientHeight / 2);
    setTick(t => t + 1);
  };
  const reset = () => {
    ctrlRef.current.reset(initialScale);
    setTick(t => t + 1);
  };

  // simple pan mode toggle is handled via cursor and pointer events (drag to pan)
  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.canvas} />

      {showControls && (
        <div style={{ ...styles.controls, background: `rgba(255,255,255,${controlsOpacity})` }}>
        <button style={styles.button} onClick={zoomOut} title="Zoom out">
          <AiOutlineZoomOut size={20} />
        </button>
        <button style={styles.button} onClick={zoomIn} title="Zoom in">
          <AiOutlineZoomIn size={20} />
        </button>
        <button style={styles.button} onClick={reset} title="Reset">
          <AiOutlineReload size={20} />
        </button>
        <div style={{ ...styles.button }} title="Drag to pan">
          <AiOutlineDrag size={18} />
        </div>
        </div>
      )}
    </div>
  );
};

export default InfiniteCanvas;
