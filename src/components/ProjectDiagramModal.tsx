import React, { useState } from "react";
import Modal from "./Modal";

type Props = {
  open: boolean;
  projectExists: boolean;
  defaultProjectName?: string;
  defaultProjectDescription?: string;
  defaultDiagramName?: string;
  defaultDiagramDescription?: string;
  defaultDiagramType?: string;
  editingDiagramId?: string | null;
  onCancel: () => void;
  onCreate: (payload: { projectName?: string; projectDescription?: string; diagramName: string; diagramDescription?: string; diagramType?: string }) => void;
  onSave?: (id: string, payload: { diagramName: string; diagramDescription?: string; diagramType?: string }) => void;
};

const ProjectDiagramModal: React.FC<Props> = ({ open, projectExists, defaultProjectName, defaultProjectDescription, defaultDiagramName, defaultDiagramDescription, defaultDiagramType, editingDiagramId, onCancel, onCreate, onSave }) => {
  const [projectName, setProjectName] = useState(defaultProjectName ?? "");
  const [projectDesc, setProjectDesc] = useState(defaultProjectDescription ?? "");
  const [diagramName, setDiagramName] = useState(defaultDiagramName ?? "");
  const [diagramDesc, setDiagramDesc] = useState(defaultDiagramDescription ?? "");
  const [diagramType, setDiagramType] = useState(defaultDiagramType ?? "UseCaseDiagram");

  if (!open) return null;

  return (
    <Modal title={projectExists ? "Create Diagram" : "Create Project"} onClose={onCancel}>
      <div>
        {!projectExists && (
          <>
            <div className="row">
              <label>Project name</label>
              <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" />
            </div>
            <div className="row">
              <label>Project description</label>
              <textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="Short description" />
            </div>
          </>
        )}

        {projectExists && (
          <>
            <div className="row">
              <label>Diagram name</label>
              <input value={diagramName} onChange={(e) => setDiagramName(e.target.value)} placeholder="Diagram name" />
            </div>
            <div className="row">
              <label>Diagram description</label>
              <textarea value={diagramDesc} onChange={(e) => setDiagramDesc(e.target.value)} placeholder="Short description" />
            </div>
            <div className="row">
              <label>Diagram type</label>
              <select value={diagramType} onChange={(e) => setDiagramType(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, background: '#0f1416', color: '#e6f7fb', border: '1px solid #233238' }}>
                <option value="UseCaseDiagram">Use Case Diagram</option>
                <option value="ClassDiagram">Class Diagram</option>
              </select>
            </div>
          </>
        )}

        <div className="actions">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          {editingDiagramId ? (
            <button className="btn primary" onClick={() => onSave && editingDiagramId && onSave(editingDiagramId, { diagramName, diagramDescription: diagramDesc || undefined, diagramType })}>Save</button>
          ) : projectExists ? (
            <button className="btn primary" onClick={() => onCreate({ projectName: projectName || undefined, projectDescription: projectDesc || undefined, diagramName, diagramDescription: diagramDesc || undefined, diagramType })}>Create</button>
          ) : (
            // creating project only
            <button className="btn primary" onClick={() => onCreate({ projectName: projectName || undefined, projectDescription: projectDesc || undefined, diagramName: "" })}>Create Project</button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ProjectDiagramModal;
