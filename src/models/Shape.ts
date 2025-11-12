// src/models/Shape.ts

export type ShapeBounds = {width: number; height: number };

export interface ShapeProps {
    scaleX?: number;
    scaleY?: number;
    fillStyle?: string | CanvasGradient | CanvasPattern | null;
}

/**
 * Abstract base class for canvas-renderable shapes.
 * Concrete shapes should implement renderShape (actual drawing) and getBounds.
 */
export abstract class Shape {
    scaleX: number = 1;
    scaleY: number = 1;
    fillStyle: string | CanvasGradient | CanvasPattern | null = null;

    constructor(props: ShapeProps = {}) {
        this.scaleX = props.scaleX ?? this.scaleX;
        this.scaleY = props.scaleY ?? this.scaleY;
        this.fillStyle = props.fillStyle ?? this.fillStyle;
    }

    setScale(sx: number, sy = sx): void {
        this.scaleX = sx;
        this.scaleY = sy;
    }
    abstract getBounds(): ShapeBounds;
}

/* Rectangle implementation example */

export interface RectangleProps extends ShapeProps {
    width: number;
    height: number;
}

export class Rectangle extends Shape {
    width: number;
    height: number;

    constructor(props: RectangleProps) {
        super(props);
        this.width = props.width;
        this.height = props.height;
    }

    getBounds(): ShapeBounds {
        return { width: this.width, height: this.height };
    }

}