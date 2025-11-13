import React, { useMemo, useState } from "react";
import "./BlogPanel.css";

const MANUAL_SECTIONS: { id: string; title: string; html: string }[] = [
  {
    id: "intro",
    title: "Introduction",
    html: `
      <h2>Welcome to UMLStudio</h2>
      <p>UMLStudio is a lightweight browser-based UML editor. Use the left toolbox to add components and the canvas to arrange them. Projects and diagrams are saved locally in your browser.</p>
    `,
  },
  {
    id: "creating",
    title: "Creating Projects and Diagrams",
    html: `
      <h3>Creating Projects and Diagrams</h3>
      <p>Use the Project panel to create a new project. You can add diagrams to a project using the <strong>+ Diagram</strong> button. Diagrams are stored in the project and can be re-opened later.</p>
    `,
  },
  {
    id: "components",
    title: "Components and Associations",
    html: `
      <h3>Components and Associations</h3>
      <p>Depending on the diagram type (Use Case or Class), the left panel exposes different components (Actors, Use Cases, Classes, Interfaces) and association types (includes, extends, generalization, aggregation, composition).</p>
    `,
  },
  {
    id: "saving",
    title: "Persistence",
    html: `
      <h3>Persistence</h3>
      <p>Diagrams are saved to your browser's local storage. Use the project delete action to remove a project and its diagrams.</p>
    `,
  },
  {
    id: "tips",
    title: "Tips & Shortcuts",
    html: `
      <h3>Tips & Shortcuts</h3>
      <ul>
        <li>Click a diagram in the project list to open it in the canvas.</li>
        <li>Drag the right panel edge to resize the panel.</li>
        <li>Use the search box here to quickly find topics in this manual.</li>
      </ul>
    `,
  },
];

const BlogPanel: React.FC = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return MANUAL_SECTIONS;
    return MANUAL_SECTIONS.filter((s) => (s.title + " " + s.html).toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="uml-blog-panel">
      <div className="uml-blog-search">
        <input
          aria-label="Search blog"
          placeholder="Search manual..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="uml-blog-content">
        {filtered.length === 0 ? (
          <div className="uml-blog-empty">No matches</div>
        ) : (
          filtered.map((s) => (
            <section key={s.id} className="uml-blog-section">
              <div className="uml-blog-title">{s.title}</div>
              <div className="uml-blog-html" dangerouslySetInnerHTML={{ __html: s.html }} />
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default BlogPanel;
