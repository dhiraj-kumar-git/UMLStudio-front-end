## UMLStudio — Layers overview (Sessions, Contexts, Models)

This document explains the responsibilities and usage patterns for the three main layers in the front-end architecture: models, sessions, and React contexts. It also includes short examples showing how to create and use diagrams.

### 1) Models

- Purpose: represent domain objects and business logic. They are plain TypeScript classes or interfaces. Examples: `UMLClass`, `UseCase`, `UMLClassAssociation`, `Project`, `Actor`.
- Characteristics: no UI concerns, minimal/no external dependencies (except `uuid` for stable ids). Models implement serialization helpers (`toJSON`) so sessions can persist them.

When to add a new model:
- If it represents a domain concept (e.g., SequenceDiagram, StateMachine), create a class in `src/models/` and implement `toJSON()`.

Example: create a class and move it

```ts
import { UMLClass } from "./models/UMLClass";
const c = new UMLClass("User");
c.addAttribute({ name: "id", type: "string" });
```

### 2) Sessions

- Purpose: short-lived in-memory containers that represent what the user is actively editing. They manage collections of models and provide persistence hooks.
- Examples: `DiagramSession`, `ProjectSession`, `UserSession` (in `src/sessions/`).
- Persistence: `ProjectSession.persist()` saves a project's state (including diagrams) to IndexedDB via `localforage`. `DiagramSession` provides `toJSON()` and `fromJSON()` to help persistence.

Usage pattern:

- Create a `ProjectSession` with a `Project` model.
- Use `projectSession.createDiagram(name, type)` to make diagrams. The session will keep them in a map and call `persist()` to save.

Example:

```ts
import { Project } from "./models/Project";
import { ProjectSession } from "./sessions/ProjectSession";

const p = new Project(crypto.randomUUID(), "My Project", "desc", new Date().toISOString(), new Date().toISOString());
const ps = new ProjectSession(p);
const diag = ps.createDiagram("Login Flow", "USE_CASE");
diag.addComponent(/* a UseCase or Actor instance */);
```

Notes:
- Sessions should own persistence responsibilities. Keep model classes free of persistence code.

### 3) React Contexts

- Purpose: expose sessions and editor state to React components.
- Examples in the project:
  - `ProjectContext` — holds the `ProjectSession` and setter. The provider persists when the session changes.
  - `DiagramContext` — holds the currently-open `DiagramSession` reference.
  - `EditorContext` — lightweight editor UI state (selection, zoom).

How to use:

Wrap your app (or a subtree) with the providers in `src/main.tsx` or a layout component:

```tsx
<AuthProvider>
  <ProjectProvider>
    <EditorProvider>
      <DiagramProvider>
        <App />
      </DiagramProvider>
    </EditorProvider>
  </ProjectProvider>
</AuthProvider>
```

Then access with hooks:

```tsx
const { projectSession, setProjectSession } = useProjectContext();
const { session: diagramSession, setSession } = useDiagramContext();
const { selectedId, setSelectedId } = useEditorContext();
```

### Wiring notes & examples

- Open a project (server or local): convert received JSON into a `Project` model, then `new ProjectSession(project)` and call `setProjectSession(ps)`.
- Open a diagram: call `setSession(diagramSession)` with a `DiagramSession` instance from `projectSession.diagrams`.
- Persisting changes: mutate models inside the current `DiagramSession`, then call `projectSession.persist()` (the `ProjectProvider` will also persist when `projectSession` changes).

### Extensibility

- Add a new diagram type by extending `Diagram` and implementing `validate()` and `toJSON()`.
- Add UI components that render specific model types; models must not import React. Keep rendering in components.

### Quick troubleshooting

- If TypeScript complains about JSX in model files, decouple render typings from models (models should not import React types).
- If something is not persisted, check `ProjectSession.persist()` and ensure the `projectSession` is set in `ProjectContext`.

---

If you'd like, I can also:
- run a typecheck and fix any remaining TypeScript errors, or
- wire the providers in `src/main.tsx` and show a small example page to create/save a diagram.
