// models/components/UMLClass.ts
import { v4 as uuidv4 } from "uuid";

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

export interface Position {
  x: number;
  y: number;
}

export class UMLClass {
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
    this.id = uuidv4();
    this.name = name;
    this.attributes = attributes;
    this.methods = methods;
    this.position = position;
  }

  rename(newName: string) {
    this.name = newName;
  }

  addAttribute(attribute: UMLAttribute) {
    this.attributes.push(attribute);
  }

  removeAttribute(attrName: string) {
    this.attributes = this.attributes.filter(attr => attr.name !== attrName);
  }

  addMethod(method: UMLMethod) {
    this.methods.push(method);
  }

  removeMethod(methodName: string) {
    this.methods = this.methods.filter(m => m.name !== methodName);
  }

  moveTo(x: number, y: number) {
    this.position = { x, y };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      attributes: this.attributes,
      methods: this.methods,
      position: this.position
    };
  }
}
