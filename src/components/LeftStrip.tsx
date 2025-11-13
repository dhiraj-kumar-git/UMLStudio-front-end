import React from "react";
import { useDiagramContext } from "../context/DiagramContext";
import Exporter from "../utils/Exporter";
import "./LeftStrip.css";

const LeftStrip: React.FC = () => {
  const diagCtx = useDiagramContext();
  const [gridOn, setGridOn] = React.useState<boolean>(true);

  React.useEffect(() => {
    const onGridChanged = (ev: Event) => {
      try {
        const d = (ev as CustomEvent).detail ?? {};
        if (typeof d.show === 'boolean') setGridOn(d.show);
      } catch {}
    };
    window.addEventListener('uml:grid-changed', onGridChanged as EventListener);
    return () => window.removeEventListener('uml:grid-changed', onGridChanged as EventListener);
  }, []);
  return (
    <div className="uml-leftstrip" aria-hidden={false}>
      <div className="uml-leftstrip-inner">
        <button className="ls-btn ls-pdf" data-tooltip="Export to PDF" onClick={async () => {
          try {
            await Exporter.exportAllToPDF(diagCtx.sessions || []);
          } catch (err) { console.warn(err); alert('PDF export failed'); }
        }}><i className="fas fa-file-pdf" aria-hidden /></button>
        <button className="ls-btn ls-svg" data-tooltip="Export to SVG" onClick={async () => {
          try {
            await Exporter.exportAllToSVGZip(diagCtx.sessions || []);
          } catch (err) { console.warn(err); alert('SVG export failed'); }
        }}><i className="fas fa-file-code" aria-hidden /></button>
        <button className="ls-btn ls-canvas-pdf" data-tooltip="Capture canvas → PDF" onClick={async () => {
          try {
            await Exporter.exportCanvasToPDF({ selector: 'canvas' });
          } catch (err) { console.warn(err); alert('Canvas PDF export failed'); }
        }}><i className="fas fa-camera" aria-hidden /></button>
        <button className="ls-btn ls-canvas-svg" data-tooltip="Capture canvas → SVG" onClick={() => {
          try {
            Exporter.exportCanvasToSVG({ selector: 'canvas' });
          } catch (err) { console.warn(err); alert('Canvas SVG export failed'); }
        }}><i className="fas fa-image" aria-hidden /></button>
        <button className="ls-btn ls-import" data-tooltip="Import" onClick={() => {
          try {
            // open left-panel editor in import mode
            window.dispatchEvent(new CustomEvent('uml:open-editor-panel', { detail: { mode: 'import', content: '', editable: true } }));
          } catch {}
        }}><i className="fas fa-upload" aria-hidden /></button>
        <button className="ls-btn ls-export" data-tooltip="Export" onClick={async () => {
          try {
            // ensure current session is saved before exporting
            try { diagCtx.saveCurrent?.(); } catch {}
            const cs = diagCtx.currentSession;
            if (!cs) { alert('No open diagram to export'); return; }
            const friendly = Exporter.createUserFriendlyJSON(cs);
            const text = JSON.stringify(friendly, null, 2);
            window.dispatchEvent(new CustomEvent('uml:open-editor-panel', { detail: { mode: 'export', content: text, editable: false } }));
          } catch (err) { console.warn(err); alert('Export failed'); }
        }}><i className="fas fa-download" aria-hidden /></button>
  <div className="ls-sep" />
  <button className={`ls-btn ls-grid ${gridOn ? 'on' : 'off'}`} data-tooltip="Toggle grid" onClick={() => { try { window.dispatchEvent(new CustomEvent('uml:toggle-grid')); } catch {} }}><i className="fas fa-border-all" aria-hidden /></button>
        <button className="ls-btn ls-undo" data-tooltip="Undo" onClick={() => diagCtx.undo()}><i className="fas fa-undo" aria-hidden /></button>
        <button className="ls-btn ls-redo" data-tooltip="Redo" onClick={() => diagCtx.redo()}><i className="fas fa-redo" aria-hidden /></button>
        <div className="ls-spacer" />
        <button className="ls-btn ls-save" data-tooltip="Save" onClick={() => diagCtx.saveCurrent && diagCtx.saveCurrent()}><i className="fas fa-save" aria-hidden /></button>
      </div>
    </div>
  );
};

export default LeftStrip;
