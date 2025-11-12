// models/components/UMLClass.ts
import { v4 as uuidv4 } from "uuid";
import { DiagramComponent, Position } from "./DiagramComponent";

export interface UMLAttribute {
  name: string;
  type: string;
  visibility?: "public" | "private" | "protected";
}

export interface UMLMethod {
  name: string;
  returnType: string;
  visibility?: "public" | "private" | "protected";
  parameters?: { name: string; type: string }[];
}



export class UMLClass extends DiagramComponent {
  id: string;
  name: string;
  attributes: UMLAttribute[];
  methods: UMLMethod[];
  position: Position;

  constructor(
    name: string,
    attributes: UMLAttribute[] = [],
    methods: UMLMethod[] = [],
    position: Position = { x: 0, y: 0 }
  ) {
    super(position);
    this.id = uuidv4();
    this.name = name;
    this.attributes = [...attributes];
    this.methods = [...methods];
    this.position = { ...position };
  }

  rename(newName: string) {
    this.name = newName;
  }

  addAttribute(attribute: UMLAttribute) {
    this.attributes.push(attribute);
  }

  updateAttribute(oldName: string, updated: Partial<UMLAttribute>) {
    const idx = this.attributes.findIndex((a) => a.name === oldName);
    if (idx >= 0) {
      this.attributes[idx] = { ...this.attributes[idx], ...updated };
    }
  }

  removeAttribute(attrName: string) {
    this.attributes = this.attributes.filter((attr) => attr.name !== attrName);
  }

  addMethod(method: UMLMethod) {
    this.methods.push(method);
  }

  updateMethod(oldName: string, updated: Partial<UMLMethod>) {
    const idx = this.methods.findIndex((m) => m.name === oldName);
    if (idx >= 0) {
      this.methods[idx] = { ...this.methods[idx], ...updated };
    }
  }

  removeMethod(methodName: string) {
    this.methods = this.methods.filter((m) => m.name !== methodName);
  }


  boundingBox(charWidth = 8, lineHeight = 18, padding = 8) {
    const nameLine = this.name || "";
    const attrLines = this.attributes.map((a) => `${a.visibility ?? ""} ${a.name}: ${a.type}`.trim());
    const methodLines = this.methods.map(
      (m) =>
        `${m.visibility ?? ""} ${m.name}(${(m.parameters ?? [])
          .map((p) => `${p.name}: ${p.type}`)
          .join(", ")}): ${m.returnType}`.trim()
    );

    const allLines = [nameLine, ...attrLines, ...methodLines];
    const longestChars = allLines.reduce((max, l) => Math.max(max, l.length), 0);
    const width = Math.max(120, longestChars * charWidth + padding * 2);
    const height = Math.max(60, (1 + attrLines.length + methodLines.length) * lineHeight + padding * 2);

    return {
      x: this.position.x,
      y: this.position.y,
      width,
      height,
    };
  }


  containsPoint(x: number, y: number) {
    const b = this.boundingBox();
    return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }

  getRenderData() {
    return {
      type: "UMLClass",
      id: this.id,
      name: this.name,
      attributes: this.attributes,
      methods: this.methods,
      position: this.position,
      bbox: this.boundingBox(),
    };
  }


  render(): HTMLElement | ReturnType<UMLClass["getRenderData"]> {
    if (typeof document === "undefined") {
      return this.getRenderData();
    }

    const container = document.createElement("div");
    container.className = "uml-class";
    container.style.position = "absolute";
    container.style.left = `${this.position.x}px`;
    container.style.top = `${this.position.y}px`;
    container.style.border = "1px solid #333";
    container.style.background = "#fff";
    container.style.padding = "6px";
    container.style.boxSizing = "border-box";
    container.style.minWidth = "120px";
    container.style.fontFamily = "monospace";

    const header = document.createElement("div");
    header.className = "uml-class-name";
    header.style.fontWeight = "bold";
    header.style.borderBottom = "1px solid #ddd";
    header.style.paddingBottom = "4px";
    header.textContent = this.name;
    container.appendChild(header);

    const attrs = document.createElement("div");
    attrs.className = "uml-class-attributes";
    attrs.style.borderBottom = "1px solid #eee";
    attrs.style.padding = "4px 0";
    this.attributes.forEach((a) => {
      const line = document.createElement("div");
      line.textContent = `${a.visibility ? a.visibility + " " : ""}${a.name}: ${a.type}`;
      attrs.appendChild(line);
    });
    container.appendChild(attrs);

    const meths = document.createElement("div");
    meths.className = "uml-class-methods";
    meths.style.padding = "4px 0";
    this.methods.forEach((m) => {
      const line = document.createElement("div");
      const params = (m.parameters ?? []).map((p) => `${p.name}: ${p.type}`).join(", ");
      line.textContent = `${m.visibility ? m.visibility + " " : ""}${m.name}(${params}): ${m.returnType}`;
      meths.appendChild(line);
    });
    container.appendChild(meths);

    return container;
  }


  toJSON() {
    return {
      id: this.id,
      name: this.name,
      attributes: this.attributes,
      methods: this.methods,
      position: this.position,
    };
  }


  static fromJSON(json: {
    id?: string;
    name: string;
    attributes?: UMLAttribute[];
    methods?: UMLMethod[];
    position?: Position;
  }) {
    const cls = new UMLClass(json.name, json.attributes ?? [], json.methods ?? [], json.position ?? { x: 0, y: 0 });
    if (json.id) cls.id = json.id;
    return cls;
  }
}
