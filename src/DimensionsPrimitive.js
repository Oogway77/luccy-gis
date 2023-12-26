/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
import { Cartesian3, destroyObject } from "cesium";

import { getPositions, getAngle } from "./common";
import { createPolylinePrimitive } from "./createPolylinePrimitive";
import { Line, Lines } from "./Lines";
import { createPolylinePrimitives } from "./createPolylinePrimitives";

const blackColor = Cesium.Color.BLACK;

export class DimensionsPrimitive {
    constructor() {
        this._shouldRedraw = false;
        this._showHeight = false;
        this._dimensionIndexes = [];
        this._angleIndexes = [];
        this._groundPoints = [];
        this._height = 0;
        this._adjustZ = 0;
        this._primitives = [];
        this._heightLineIndex = -1;
    }

    get modelMatrix() {
        return this._modelMatrix;
    }

    set modelMatrix(t) {
        if (t.equals(this._modelMatrix) === false) {
            this._modelMatrix = t;
            this._shouldRedraw = true;
        }
    }

    get groundPoints() {
        return this._groundPoints;
    }

    set groundPoints(t) {
        this._groundPoints = t;
        this._shouldRedraw = true;
    }

    get showHeight() {
        return this._showHeight;
    }

    set showHeight(t) {
        if (this._showHeight !== t) {
            this._showHeight = t;
            this._shouldRedraw = true;
        }
    }

    get height() {
        return this._height;
    }

    set height(t) {
        if (this._height !== t) {
            this._height = t;
            this._shouldRedraw = true;
        }
    }

    get adjustZ() {
        return this._adjustZ;
    }

    set adjustZ(t) {
        if (this._adjustZ !== t) {
            this._adjustZ = t;
            this._shouldRedraw = true;
        }
    }

    set dimensionIndexes(t) {
        if (!t) {
            // eslint-disable-next-line no-param-reassign
            t = [];
        }

        if (this._dimensionIndexes !== t) {
            this._dimensionIndexes = t;
            this._shouldRedraw = true;
        }
    }

    set angleIndexes(t) {
        if (!t) {
            // eslint-disable-next-line no-param-reassign
            t = [];
        }

        if (this._angleIndexes !== t) {
            this._angleIndexes = t;
            this._shouldRedraw = true;
        }
    }

    set heightLinePosition(t) {
        this._heightLinePosition = t;
        this._shouldRedraw = true;
    }

    set heightLineIndex(t) {
        if (this._heightLineIndex !== t) {
            this._heightLineIndex = t;
            this._shouldRedraw = true;
        }
    }

    updateProperties(t) {
        this._angleIndexes = t.angle ? t.angle : [];
        this._showHeight = !!t.showHeight;
        this._groundPoints = t.groundPoints.map((n) => n.clone());
        this._modelMatrix = t.modelMatrix;
        this._dimensionIndexes = t.sideDimensions ? t.sideDimensions : [];
        this._height = t.height;
        this.idPrefix = t.idPrefix;
        this._shouldRedraw = true;
    }

    destroy() {
        for (const t of this._primitives) {
            t.destroy();
        }

        this._primitives = [];

        return destroyObject(this);
    }

    isDestroyed() {
        return false;
    }

    update(t) {
        if (this._shouldRedraw) {
            this.removePrimitives();
            this.createPrimitives();
        }

        for (const n of this._primitives) {
            n.update(t);
        }

        this._shouldRedraw = false;
    }

    removePrimitives() {
        for (const t of this._primitives) {
            t.destroy();
        }

        this._primitives = [];
    }

    createPrimitives() {
        const t = Lines.createFromPoints(this._groundPoints);
        t.optimize();

        for (const n of this._dimensionIndexes) {
            if (n < t.pointsCount) {
                this.createDimension(n, t);
            }
        }

        if (this._showHeight) {
            this.createHeightLine(t);
        }

        for (const n of this._angleIndexes)
            if (n < this._groundPoints.length) {
                const i = createPolylinePrimitives({
                    index: n,
                    polygon: t,
                    color: blackColor,
                    width: 4,
                    modelMatrix: this._modelMatrix,
                    points: this._groundPoints,
                    idPrefix: `${this.idPrefix}:angle:${n}`,
                    height: this._height,
                    hasArrow: true,
                    alwaysOnTop: true
                });

                this._primitives.push(...i);
            }
    }

    createDimension(t, n) {
        const i = n.getLine(t);

        if (!i) {
            return;
        }

        const r = i.vectorNormalized;
        const a = new Cartesian3(r.y, -1 * r.x, 0);
        const s = Cartesian3.multiplyByScalar(a, 2, a);

        this.createLine(i, s, 0);
    }

    createHeightLine(t) {
        const n = new Cartesian3(this._heightLinePosition.x, this._heightLinePosition.y, this._adjustZ);
        const i = new Cartesian3(this._heightLinePosition.x, this._heightLinePosition.y, this._adjustZ + this._height);
        const r = new Line(n, i);
        const a = this._heightLineIndex;
        const { linesCount: s } = t;
        const l = a === s - 1 ? 0 : a;
        const h = t.getLine(a === 0 ? s - 1 : a - 1);
        const f = t.getLine(l);
        const m = h.vectorNormalized;
        const _ = new Cartesian3(m.y, -1 * m.x, 0);
        const v = f.vectorNormalized;
        const A = new Cartesian3(v.y, -1 * v.x, 0);
        const x = Cartesian3.add(_, A, new Cartesian3());

        this.createLine(r, x, "height");
    }

    getAngleCenterPointLocal(t, n, i) {
        const r = t === 0 ? n.linesCount - 1 : t - 1;
        const a = n.getPoint(t);
        const s = n.getLine(r).reversed.vectorNormalized;
        const l = n.getLine(t).vectorNormalized;
        let c = getAngle(l, s);

        if (c < 0) {
            c = 2 * Math.PI + c;
        }

        const h = c / 2;
        const _ = getPositions([new Cartesian3(Math.cos(h), Math.sin(h), 0)], a, getAngle(Cartesian3.UNIT_X, l), 4);
        _[0].z = i;

        return [_[0], c];
    }

    createLine(t, n, i) {
        const r = Cartesian3.add(t.p0, n, new Cartesian3());
        const a = Cartesian3.add(t.p1, n, new Cartesian3());

        const s = createPolylinePrimitive({
            id: `${this.idPrefix}:dimensions:${i}:main`,
            modelMatrix: this._modelMatrix,
            positions: [r, a],
            width: 4,
            color: blackColor,
            hasArrow: true,
            alwaysOnTop: true
        });

        this._primitives.push(s);

        const l = createPolylinePrimitive({
            id: `${this.idPrefix}:dimensions:${i}:additional-0`,
            modelMatrix: this._modelMatrix,
            positions: [t.p0, r],
            width: 2,
            color: blackColor,
            hasArrow: false,
            alwaysOnTop: true
        });

        this._primitives.push(l);

        const c = createPolylinePrimitive({
            id: `${this.idPrefix}:dimensions:${i}:additional-1`,
            modelMatrix: this._modelMatrix,
            positions: [t.p1, a],
            width: 2,
            color: blackColor,
            hasArrow: false,
            alwaysOnTop: true
        });

        this._primitives.push(c);
    }
}
