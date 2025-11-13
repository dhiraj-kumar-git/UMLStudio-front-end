import React, { useEffect, useState } from 'react';
import { useDiagramContext } from '../context/DiagramContext';
import { useProjectContext } from '../context/ProjectContext';

const TestEditorPanel: React.FC = () => {
  const diagCtx = useDiagramContext();
  const projectCtx = useProjectContext();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [content, setContent] = useState('');
  const [editable, setEditable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      try {
        const d = (ev as CustomEvent).detail ?? {};
        setMode(d.mode === 'import' ? 'import' : 'export');
        setContent(d.content ?? '');
        setEditable(Boolean(d.editable));
        setError(null);
        setOpen(true);
        // trigger enter animation on next tick
        setEntered(false);
        setTimeout(() => setEntered(true), 20);
      } catch (err) {}
    };
    window.addEventListener('uml:open-editor-panel', onOpen as EventListener);
    return () => window.removeEventListener('uml:open-editor-panel', onOpen as EventListener);
  }, []);

  const close = () => { setOpen(false); setError(null); };

  if (!open) return null;

  const leftPos = 48; // left strip width
  const panelWidth = `calc(var(--left-panel-width,360px) - 16px)`;
  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${leftPos}px`,
    top: 12,
    width: panelWidth,
    bottom: 12,
    background: '#041018',
    color: '#dff8fb',
    borderRadius: 8,
    padding: 12,
    zIndex: 1200,
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
    transform: entered ? 'translateX(0)' : 'translateX(-12px)',
    opacity: entered ? 1 : 0,
    transition: 'transform 220ms ease, opacity 220ms ease',
  };

  return (
    <div style={baseStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700 }}>{mode === 'export' ? 'Export (read-only)' : 'Import (paste JSON)'}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {mode === 'export' && (
            <button onClick={async () => {
              try { await navigator.clipboard.writeText(content); alert('Copied to clipboard'); } catch { alert('Copy failed'); }
            }} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#00e5ff' }}>Copy</button>
          )}
          <button onClick={close} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#fff' }}>Close</button>
        </div>
      </div>

      <div style={{ marginTop: 8, height: 'calc(100% - 70px)', display: 'flex', flexDirection: 'column' }}>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} readOnly={!editable} spellCheck={false} style={{ flex: 1, width: '100%', resize: 'none', padding: 12, background: '#021018', color: '#cfeff3', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 6, fontFamily: 'monospace', fontSize: 13 }} />
        {error && (<div style={{ color: '#ffb3b3', marginTop: 8 }}>{error}</div>)}

        {editable && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={close}>Cancel</button>
            <button className="btn" style={{ background: '#00a6d6', color: '#fff' }} onClick={async () => {
              try {
                setError(null);
                const parsed = JSON.parse(content || '{}');
                if (!Array.isArray(parsed.components)) throw new Error('JSON must contain a components array');
                // build components with new ids
                const newComps: any[] = [];
                for (const pc of parsed.components) {
                  const id = 'c_' + Math.random().toString(36).slice(2, 9);
                  newComps.push(Object.assign({ id }, pc));
                }
                const newAssocs: any[] = [];
                if (Array.isArray(parsed.associations)) {
                  for (const pa of parsed.associations) {
                    const si = typeof pa.sourceIndex === 'number' ? pa.sourceIndex : null;
                    const ti = typeof pa.targetIndex === 'number' ? pa.targetIndex : null;
                    const srcId = (si !== null && newComps[si]) ? newComps[si].id : undefined;
                    const tgtId = (ti !== null && newComps[ti]) ? newComps[ti].id : undefined;
                    const assoc = {
                      id: 'a_' + Math.random().toString(36).slice(2, 9),
                      type: pa.type ?? 'association',
                      name: pa.name ?? undefined,
                      sourceId: srcId,
                      targetId: tgtId,
                      cardinalitySource: pa.cardinalitySource ?? undefined,
                      cardinalityTarget: pa.cardinalityTarget ?? undefined,
                    };
                    newAssocs.push(assoc);
                  }
                }
                const diagramJSON = { components: newComps, associations: newAssocs, type: parsed.diagramType ?? parsed.type ?? 'UseCaseDiagram', name: parsed.diagramName ?? parsed.name ?? undefined, description: parsed.description ?? undefined };

                const s = diagCtx.createSession?.(parsed.diagramName ?? 'Imported Diagram', diagramJSON);
                if (s) {
                  try { await projectCtx.addDiagramToProject?.(s as any); } catch {}
                  try { diagCtx.openSessionById?.(s.id); } catch {}
                }

                close();
                try { alert('Import successful'); } catch {}
              } catch (err: any) {
                setError(err?.message ?? 'Invalid JSON');
              }
            }}>Import</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestEditorPanel;
