import type { DiagramComponent } from "../models/DiagramComponent";
import type DiagramAssociation from "../models/DiagramAssociation";

export type Selection =
  | { kind: "component"; id: string; component: DiagramComponent }
  | { kind: "association"; id: string; association: DiagramAssociation }
  | { kind: null };

export class CanvasController {
  selected: Selection = { kind: null };

  // Callbacks set by the host (EditorPage)
  onSelectionChange?: (sel: Selection) => void;
  onComponentMove?: (id: string, x: number, y: number) => void;
  onComponentResize?: (id: string, width: number, height: number) => void;
  onAssociationUpdated?: (assoc: DiagramAssociation) => void;

  setSelection(sel: Selection) {
    this.selected = sel;
    try {
      // eslint-disable-next-line no-console
      console.log("CanvasController: setSelection ->", sel && (sel as any).kind ? (sel as any).kind + ":" + (sel as any).id : sel);
    } catch {}
    if (this.onSelectionChange) this.onSelectionChange(sel);
  }

  clearSelection() {
    this.setSelection({ kind: null });
  }

  notifyComponentMove(id: string, x: number, y: number) {
    if (this.onComponentMove) this.onComponentMove(id, x, y);
  }

  notifyComponentResize(id: string, width: number, height: number) {
    try {
      // eslint-disable-next-line no-console
      console.log("CanvasController: notifyComponentResize ->", id, width, height);
    } catch {}
    if (this.onComponentResize) this.onComponentResize(id, width, height);
  }

  notifyAssociationUpdated(assoc: DiagramAssociation) {
    // debug: trace association updates that flow through the controller
    try {
      // eslint-disable-next-line no-console
      console.log("CanvasController: notifyAssociationUpdated ->", (assoc as any)?.id);
    } catch {}
    if (this.onAssociationUpdated) this.onAssociationUpdated(assoc);
    // If the currently selected association is the one updated, refresh the selected.association
    if (this.selected && this.selected.kind === "association" && (this.selected as any).id === (assoc as any).id) {
      (this.selected as any).association = assoc;
      // notify host about selection change so any selection editor can refresh
      if (this.onSelectionChange) this.onSelectionChange(this.selected);
    }
  }
}

export default CanvasController;
