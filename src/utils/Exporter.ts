// Lightweight Exporter: generates SVG representations of diagrams and
// provides PDF and SVG+ZIP exports using runtime-loaded helpers (jsPDF, JSZip).
// This avoids adding build-time deps while providing the export UX.

const CDN = {
  jsPDF: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  JSZip: "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js",
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src=\"${src}\"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
  s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

export default class Exporter {
  /**
   * Create a user-friendly JSON representation of a DiagramSession or raw diagramJSON.
   * The exported JSON omits persistent ids and instead references components by index
   * to make it easier for users to edit. It includes component geometry, type, name,
   * attributes, methods and association metadata (sourceIndex/targetIndex).
   */
  static createUserFriendlyJSON(sessionOrDiagramJSON: any) {
    const s = sessionOrDiagramJSON && sessionOrDiagramJSON.diagramJSON ? sessionOrDiagramJSON.diagramJSON : sessionOrDiagramJSON || {};
    const comps: any[] = Array.isArray(s.components) ? s.components : [];
    const assocs: any[] = Array.isArray(s.associations) ? s.associations : [];

    const outComps = comps.map((c: any) => ({
      type: c.type ?? c.componentType ?? 'component',
      name: c.name ?? '',
      x: c.x ?? 0,
      y: c.y ?? 0,
      width: c.width ?? undefined,
      height: c.height ?? undefined,
      attributes: c.attributes ?? undefined,
      methods: c.methods ?? undefined,
      // include any custom props that are useful to recreate the component
      props: c.props ?? undefined,
    }));

    const outAssocs = assocs.map((a: any) => {
      // try to resolve source/target to indices (if ids exist) otherwise copy whatever references are present
      let sourceIndex: number | null = null;
      let targetIndex: number | null = null;
      if (typeof a.sourceId === 'string' || typeof a.source === 'string') {
        const sid = a.sourceId ?? a.source;
        const idx = comps.findIndex((c: any) => (c.id ?? c) === sid);
        if (idx >= 0) sourceIndex = idx;
      }
      if (typeof a.targetId === 'string' || typeof a.target === 'string') {
        const tid = a.targetId ?? a.target;
        const idx = comps.findIndex((c: any) => (c.id ?? c) === tid);
        if (idx >= 0) targetIndex = idx;
      }
      // fallback: some associations may inline source/target objects; try to match by id
      if (sourceIndex === null && a.source && typeof a.source === 'object' && a.source.id) {
        const idx = comps.findIndex((c: any) => (c.id ?? c) === a.source.id);
        if (idx >= 0) sourceIndex = idx;
      }
      if (targetIndex === null && a.target && typeof a.target === 'object' && a.target.id) {
        const idx = comps.findIndex((c: any) => (c.id ?? c) === a.target.id);
        if (idx >= 0) targetIndex = idx;
      }

      return {
        type: a.type ?? a.assocType ?? a.kind ?? 'association',
        name: a.name ?? a.label ?? undefined,
        sourceIndex: sourceIndex,
        targetIndex: targetIndex,
        // include cardinalities and other metadata
        cardinalitySource: a.cardinalitySource ?? a.cs ?? undefined,
        cardinalityTarget: a.cardinalityTarget ?? a.ct ?? undefined,
        extra: (a.extra !== undefined) ? a.extra : undefined,
      };
    });

    const out = {
      exportedAt: new Date().toISOString(),
      diagramName: s.name ?? s.title ?? undefined,
      diagramType: s.type ?? undefined,
      components: outComps,
      associations: outAssocs,
      // keep description if present
      description: s.description ?? undefined,
    };
    return out;
  }

  // Generate a simple SVG string for a diagram JSON.
  // The renderer is intentionally simple: it draws rects/ellipses/lines and text
  // based on component bounding boxes and association endpoints.
  static renderDiagramToSVG(diagramJSON: any, outW = 1600, outH = 900) {
    const comps: any[] = Array.isArray(diagramJSON?.components) ? diagramJSON.components : [];
    const assocs: any[] = Array.isArray(diagramJSON?.associations) ? diagramJSON.associations : [];

    // compute world bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of comps) {
      const x = c.x ?? 0;
      const y = c.y ?? 0;
      const w = c.width ?? 100;
      const h = c.height ?? 60;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }
    if (!isFinite(minX)) { minX = 0; minY = 0; maxX = outW; maxY = outH; }

  const margin = 40; // world margin
  const worldW = Math.max(1, maxX - minX);
  const worldH = Math.max(1, maxY - minY);
  // compute scale to fit into target area but DO NOT upscale small diagrams
  const computedScale = Math.min((outW - margin * 2) / worldW, (outH - margin * 2) / worldH);
  const scale = Math.min(1, computedScale);

  // keep floats to preserve proportions; we'll format when embedding into strings
  const transformX = (x: number) => (x - minX) * scale + margin;
  const transformY = (y: number) => (y - minY) * scale + margin;
  const transformW = (w: number) => w * scale;
  const transformH = (h: number) => h * scale;

    const escape = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

  const parts: string[] = [];
  parts.push(`<?xml version="1.0" encoding="utf-8"?>`);
  // Use viewBox and preserveAspectRatio so consumers can scale the SVG naturally.
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${outW} ${outH}" preserveAspectRatio="xMidYMid meet">`);
    // background
    parts.push(`<rect width="100%" height="100%" fill="#ffffff"/>`);

    // draw associations (lines)
    for (const a of assocs) {
      try {
        const src = comps.find((c) => c.id === a.sourceId);
        const tgt = comps.find((c) => c.id === a.targetId);
        if (!src || !tgt) continue;
        const sx = transformX((src.x ?? 0) + (src.width ?? 100) / 2);
        const sy = transformY((src.y ?? 0) + (src.height ?? 60) / 2);
        const tx = transformX((tgt.x ?? 0) + (tgt.width ?? 100) / 2);
        const ty = transformY((tgt.y ?? 0) + (tgt.height ?? 60) / 2);
        parts.push(`<g stroke="#333" fill="none" stroke-width="${Math.max(1, 2 * scale)}">`);
        parts.push(`<line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" />`);
        // arrow
        const ang = Math.atan2(ty - sy, tx - sx);
        const ah = Math.max(6, 12 * (scale || 1));
        const ax1 = tx - ah * Math.cos(ang - Math.PI / 6);
        const ay1 = ty - ah * Math.sin(ang - Math.PI / 6);
        const ax2 = tx - ah * Math.cos(ang + Math.PI / 6);
        const ay2 = ty - ah * Math.sin(ang + Math.PI / 6);
        parts.push(`<polygon points="${tx},${ty} ${ax1},${ay1} ${ax2},${ay2}" fill="#333"/>`);
        if (a.name) {
          const mx = (sx + tx) / 2;
          const my = (sy + ty) / 2;
          const labW = Math.min(160, Math.max(60, 80 * (scale || 1)));
          parts.push(`<rect x="${mx - labW/2}" y="${my - 12}" width="${labW}" height="24" fill="#fff" stroke="none" rx="4"/>`);
          parts.push(`<text x="${mx}" y="${my}" text-anchor="middle" font-family="sans-serif" font-size="${Math.max(10, 12 * scale)}" fill="#111" dominant-baseline="middle">${escape(a.name)}</text>`);
        }
        parts.push(`</g>`);
      } catch (err) { /* continue */ }
    }

    // draw components
    for (const c of comps) {
      try {
        const x = transformX(c.x ?? 0);
        const y = transformY(c.y ?? 0);
        const w = transformW(c.width ?? 100);
        const h = transformH(c.height ?? 60);
        const type = (c.type ?? "component").toLowerCase();
        if (type === "actor") {
          // simple stick figure: circle head + lines
          const cx = x + Math.round(w / 2);
          const headR = Math.max(6, Math.round(Math.min(w * 0.2, 12)));
          const headCy = y + headR + 4;
          parts.push(`<g fill="none" stroke="#222" stroke-width="2">`);
          parts.push(`<circle cx="${cx}" cy="${headCy}" r="${headR}" fill="#fff"/>`);
          parts.push(`<line x1="${cx}" y1="${headCy + headR}" x2="${cx}" y2="${y + h * 0.6}"/>`);
          parts.push(`<line x1="${cx - w * 0.35}" y1="${y + h * 0.35}" x2="${cx + w * 0.35}" y2="${y + h * 0.35}"/>`);
          parts.push(`<line x1="${cx}" y1="${y + h * 0.6}" x2="${cx - w * 0.25}" y2="${y + h}"/>`);
          parts.push(`<line x1="${cx}" y1="${y + h * 0.6}" x2="${cx + w * 0.25}" y2="${y + h}"/>`);
          parts.push(`</g>`);
          parts.push(`<text x="${cx}" y="${y + h + 16}" text-anchor="middle" font-family="monospace" font-size="12" fill="#111" dominant-baseline="hanging">${escape(c.name ?? "Actor")}</text>`);
        } else if (type === "usecase") {
          const rx = w / 2;
          const ry = h / 2;
          parts.push(`<g stroke="#333" fill="#fff" stroke-width="2">`);
          parts.push(`<ellipse cx="${x + rx}" cy="${y + ry}" rx="${rx}" ry="${ry}" />`);
          parts.push(`</g>`);
          parts.push(`<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#111" dominant-baseline="middle">${escape(c.name ?? "UseCase")}</text>`);
        } else if (type === "class") {
          // draw class box with two separators (after name and before methods)
          const pad = 8 * (scale || 1);
          const nameH = 20 * (scale || 1);
          parts.push(`<g stroke="#222" fill="#fff" stroke-width="${Math.max(1, 2 * scale)}">`);
          parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`);
          parts.push(`</g>`);
          // name (left aligned but inside padding)
          parts.push(`<text x="${x + pad}" y="${y + pad + 2}" font-family="sans-serif" font-size="${14 * (scale || 1)}" fill="#000" dominant-baseline="hanging">${escape(c.name ?? "Class")}</text>`);
          // separator after name (proportional)
          const sep1Y = y + nameH;
          parts.push(`<line x1="${x}" y1="${sep1Y}" x2="${x + w}" y2="${sep1Y}" stroke="#222" stroke-width="${Math.max(1, 1 * (scale || 1))}" />`);
          // attributes
          let ay = y + nameH + pad;
          if (Array.isArray(c.attributes)) {
            for (const a of c.attributes) {
              parts.push(`<text x="${x + pad}" y="${ay}" font-family="sans-serif" font-size="${12 * (scale || 1)}" fill="#333" dominant-baseline="hanging">${escape((a.visibility || '') + ' ' + (a.name || ''))}</text>`);
              ay += 16 * (scale || 1);
            }
          }
          // separator before methods - compute from bottom similar to runtime component
          const sepY = y + h - Math.max(16 * (scale || 1), (Array.isArray(c.methods) ? c.methods.length : 0) * 16 * (scale || 1) + pad);
          parts.push(`<line x1="${x}" y1="${sepY}" x2="${x + w}" y2="${sepY}" stroke="#222" stroke-width="${Math.max(1, 1 * (scale || 1))}" />`);
          // methods
          let my = sepY + pad;
          if (Array.isArray(c.methods)) {
            for (const m of c.methods) {
              const params = Array.isArray(m.params) ? m.params.map((p: any) => `${p.name}${p.type ? ':' + p.type : ''}`).join(', ') : '';
              const txt = `${m.visibility || ''} ${m.name || ''}(${params})${m.returnType ? ':' + m.returnType : ''}`;
              parts.push(`<text x="${x + pad}" y="${my}" font-family="sans-serif" font-size="${12 * (scale || 1)}" fill="#333" dominant-baseline="hanging">${escape(txt)}</text>`);
              my += 16 * (scale || 1);
            }
          }
        } else if (type === "system-boundary") {
          parts.push(`<g stroke="#999" fill="#fff" stroke-width="1">`);
          parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`);
          parts.push(`</g>`);
          parts.push(`<text x="${x + 12}" y="${y + 20}" font-family="sans-serif" font-size="14" fill="#444">${escape(c.name ?? "System")}</text>`);
        } else if (type === "interface") {
          // interface: draw like class but put «interface» label centered at top
          const pad = 8 * (scale || 1);
          const nameH = 20 * (scale || 1);
          parts.push(`<g stroke="#222" fill="#fff" stroke-width="${Math.max(1, 2 * scale)}">`);
          parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`);
          parts.push(`</g>`);
          // separator after name
          const sep1 = y + nameH;
          parts.push(`<line x1="${x}" y1="${sep1}" x2="${x + w}" y2="${sep1}" stroke="#222" stroke-width="${Math.max(1, 1 * (scale || 1))}" />`);
          // attributes/methods like class
          let ay2 = y + nameH + pad;
          // interface label centered (hanging baseline to match canvas)
          parts.push(`<text x="${x + w / 2}" y="${y + pad}" text-anchor="middle" font-family="sans-serif" font-size="${10 * (scale || 1)}" fill="#333" dominant-baseline="hanging">${escape('\u00ABinterface\u00BB')}</text>`);
          // name centered
          parts.push(`<text x="${x + w / 2}" y="${y + pad + 14}" text-anchor="middle" font-family="sans-serif" font-size="${14 * (scale || 1)}" fill="#000" dominant-baseline="hanging">${escape(c.name ?? 'IExample')}</text>`);
          if (Array.isArray(c.attributes)) {
            for (const a of c.attributes) {
              parts.push(`<text x="${x + pad}" y="${ay2}" font-family="sans-serif" font-size="${12 * (scale || 1)}" fill="#333" dominant-baseline="hanging">${escape((a.visibility || '') + ' ' + (a.name || ''))}</text>`);
              ay2 += 16 * (scale || 1);
            }
          }
          const sepY2 = y + h - Math.max(16 * (scale || 1), (Array.isArray(c.methods) ? c.methods.length : 0) * 16 * (scale || 1) + pad);
          parts.push(`<line x1="${x}" y1="${sepY2}" x2="${x + w}" y2="${sepY2}" stroke="#222" stroke-width="${Math.max(1, 1 * (scale || 1))}" />`);
          let my2 = sepY2 + pad;
          if (Array.isArray(c.methods)) {
            for (const m of c.methods) {
              const params = Array.isArray(m.params) ? m.params.map((p: any) => `${p.name}${p.type ? ':' + p.type : ''}`).join(', ') : '';
              const txt = `${m.visibility || ''} ${m.name || ''}(${params})${m.returnType ? ':' + m.returnType : ''}`;
              parts.push(`<text x="${x + pad}" y="${my2}" font-family="sans-serif" font-size="${12 * (scale || 1)}" fill="#333" dominant-baseline="hanging">${escape(txt)}</text>`);
              my2 += 16 * (scale || 1);
            }
          }
        } else {
          parts.push(`<g stroke="#666" fill="#fff" stroke-width="1">`);
          parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`);
          parts.push(`</g>`);
          parts.push(`<text x="${x + 8}" y="${y + 16}" font-family="sans-serif" font-size="12" fill="#222">${escape(c.name ?? c.type ?? 'Component')}</text>`);
        }
      } catch (err) { /* continue */ }
    }

    // footer: diagram name
    if (diagramJSON?.name) {
      parts.push(`<text x="${outW - 12}" y="${outH - 12}" text-anchor="end" font-family="sans-serif" font-size="11" fill="#666">${escape(diagramJSON.name)}</text>`);
    }

    parts.push(`</svg>`);
    return parts.join('\n');
  }

  static svgToImageData(svg: string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported'));
            // white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const data = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(data);
          } catch (err) { URL.revokeObjectURL(url); reject(err); }
        };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load SVG image')); };
        img.src = url;
      } catch (err) { reject(err); }
    });
  }

  static async exportAllToPDF(sessions: any[], pageW = 1600, pageH = 900) {
    if (!Array.isArray(sessions) || sessions.length === 0) return;
    // load jsPDF
    try {
      await loadScript(CDN.jsPDF);
    } catch (err) {
      alert('Failed to load PDF library.');
      return;
    }

    const jsPDF = (window as any).jspdf && (window as any).jspdf.jsPDF ? (window as any).jspdf.jsPDF : (window as any).jsPDF;
    if (!jsPDF) {
      alert('PDF library not available');
      return;
    }

  // force landscape orientation for horizontal pages (16:9)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [pageW * 0.75, pageH * 0.75] });
    // using 0.75 to approximate px->pt

    for (let i = 0; i < sessions.length; i++) {
      const raw = sessions[i];
      const s = raw && raw.diagramJSON ? raw.diagramJSON : (typeof raw.toJSON === 'function' ? raw.toJSON() : raw);
      const svg = Exporter.renderDiagramToSVG(s.diagramJSON ?? s, pageW, pageH);
      const imgData = await Exporter.svgToImageData(svg, pageW, pageH);
      // add image to pdf
      const wPt = pageW * 0.75;
      const hPt = pageH * 0.75;
      if (i > 0) pdf.addPage([wPt, hPt]);
      pdf.addImage(imgData, 'PNG', 0, 0, wPt, hPt);
    }

    const name = 'uml-diagrams.pdf';
    pdf.save(name);
  }

  static async exportAllToSVGZip(sessions: any[]) {
    if (!Array.isArray(sessions) || sessions.length === 0) return;
    try {
      await loadScript(CDN.JSZip);
    } catch (err) {
      alert('Failed to load zip library.');
      return;
    }

    const JSZip = (window as any).JSZip;
    if (!JSZip) { alert('Zip library not available'); return; }
    const zip = new JSZip();

    let idx = 0;
    for (const raw of sessions) {
      idx += 1;
      const s = raw && raw.diagramJSON ? raw.diagramJSON : (typeof raw.toJSON === 'function' ? raw.toJSON() : raw);
      const svg = Exporter.renderDiagramToSVG(s.diagramJSON ?? s, 1600, 900);
      // ensure unique file names by appending index when necessary
      const base = ((s.name ?? s.id ?? 'diagram') + '').replace(/[^a-z0-9-_]/gi, '_');
      const fileName = `${base}_${idx}.svg`;
      zip.file(fileName, svg);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uml-diagrams-svgs.zip';
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); }, 5000);
  }

  // Capture the first visible canvas on the page and export it as a PDF (pixel-perfect)
  static async exportCanvasToPDF(options?: { selector?: string; pageW?: number; pageH?: number }) {
    const sel = options?.selector ?? 'canvas';
    const canvas = document.querySelector(sel) as HTMLCanvasElement | null;
    if (!canvas) { alert('Canvas not found for capture'); return; }
    const pageW = options?.pageW ?? canvas.width;
    const pageH = options?.pageH ?? canvas.height;

    try { await loadScript(CDN.jsPDF); } catch (err) { alert('Failed to load PDF library.'); return; }
    const jsPDF = (window as any).jspdf && (window as any).jspdf.jsPDF ? (window as any).jspdf.jsPDF : (window as any).jsPDF;
    if (!jsPDF) { alert('PDF library not available'); return; }

    // ensure image is up-to-date (canvas already has current rendering)
    const dataUrl = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [pageW * 0.75, pageH * 0.75] });
    const wPt = pageW * 0.75;
    const hPt = pageH * 0.75;
    pdf.addImage(dataUrl, 'PNG', 0, 0, wPt, hPt);
    pdf.save('uml-canvas.pdf');
  }

  // Capture the canvas and wrap the raster image in an SVG (pixel-perfect but raster inside SVG)
  static exportCanvasToSVG(options?: { selector?: string; fileName?: string }) {
    const sel = options?.selector ?? 'canvas';
    const canvas = document.querySelector(sel) as HTMLCanvasElement | null;
    if (!canvas) { alert('Canvas not found for capture'); return; }
    const dataUrl = canvas.toDataURL('image/png');
    const w = canvas.width;
    const h = canvas.height;
    const svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n  <rect width="100%" height="100%" fill="#ffffff"/>\n  <image href="${dataUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" />\n</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options?.fileName ?? 'uml-canvas.svg';
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); }, 5000);
  }
}
