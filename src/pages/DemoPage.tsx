import React from "react";
import { useProjectContext } from "../context/ProjectContext";
import { useDiagramContext } from "../context/DiagramContext";
import { Project } from "../models/Project";
import { ProjectSession } from "../sessions/ProjectSession";
import { DiagramComponent } from "../models/DiagramComponent";

class DemoBox extends DiagramComponent {
  label: string;
  constructor(label: string, x = 0, y = 0) {
    super(x, y);
    this.label = label;
  }

  render() {
    return null; // rendering belongs to React components; demo keeps model-only
  }
}

export const DemoPage: React.FC = () => {
  const { projectSession, setProjectSession } = useProjectContext();
  const { session: diagramSession, setSession } = useDiagramContext();

  const createProject = () => {
    const p = new Project(crypto.randomUUID(), "Demo Project", "Demo description", new Date().toISOString(), new Date().toISOString());
    const ps = new ProjectSession(p);
    setProjectSession(ps);
  };

  const createDiagram = () => {
    if (!projectSession) return;
    const d = projectSession.createDiagram("Demo Diagram", "CLASS");
    setSession(d);
  };

  const addBox = () => {
    if (!diagramSession) return;
    const box = new DemoBox("Box " + (diagramSession.components.length + 1), 10, 10);
    diagramSession.addComponent(box as unknown as DiagramComponent);
    // persist project after change
    projectSession?.persist();
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Demo: create & persist a diagram</h2>
      <div style={{ marginBottom: 8 }}>
        <button onClick={createProject}>Create Project Session</button>
        <button onClick={createDiagram} disabled={!projectSession} style={{ marginLeft: 8 }}>
          Create Diagram
        </button>
        <button onClick={addBox} disabled={!diagramSession} style={{ marginLeft: 8 }}>
          Add Box to Diagram
        </button>
      </div>

      <div>
        <strong>Project:</strong> {projectSession ? projectSession.project.name : "(none)"}
      </div>
      <div>
        <strong>Diagrams:</strong> {projectSession ? projectSession.diagrams.size : 0}
      </div>
      <div>
        <strong>Active Diagram Components:</strong> {diagramSession ? diagramSession.components.length : 0}
      </div>
    </div>
  );
};

export default DemoPage;
