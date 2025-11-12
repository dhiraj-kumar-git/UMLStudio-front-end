import React from "react";
import InfiniteCanvas from "../components/InfiniteCanvas";
import { CanvasModel } from "../models/CanvasModel";

export const EditorPage: React.FC = () => {
  const model = new CanvasModel({ cellSize: 48, majorEvery: 8, initialScale: 1 });

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f7f7fb" }}>
      <InfiniteCanvas model={model} background="#fff" showControls={true} />
    </div>
  );
};

export default EditorPage;
