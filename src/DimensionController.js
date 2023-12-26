/* eslint-disable no-restricted-syntax */
import { Cartesian2, Cartesian3, defaultValue, DeveloperError, Matrix4, Math as CesiumMath } from "cesium";

import {
    getLeftOrRightPointInfo,
    ScreenDirections,
    LabelAlignments,
    calcCenterPoint,
    getDefaultLanguage,
    DimensionLabelTypes,
    LineInfo,
    Axes
} from "./common";
import { DimensionLabel } from "./DimesionLabel";
import { DimensionsPrimitive } from "./DimensionsPrimitive";
import { Lines } from "./Lines";

export class DimensionController {
    constructor(options) {
        this.toolsService = options;
        this._dimensionLabels = [];
        this._angleLabels = [];
    }

    setup() {
        if (!this._dimensionsPrimitive) {
            this._dimensionsPrimitive = new DimensionsPrimitive();
            this.toolsService.viewer.scene.primitives.add(this._dimensionsPrimitive);
        }
    }

    destroy() {
        this.clear();

        if (this._dimensionsPrimitive) {
            this.toolsService.viewer.scene.primitives.remove(this._dimensionsPrimitive);
            this._dimensionsPrimitive = undefined;
        }
    }

    showDimensions(t) {
        if (this._dimensionsPrimitive && (this._dimensionsPrimitive.updateProperties(t), t.showHeight)) {
            const r = getLeftOrRightPointInfo(ScreenDirections.LEFT, t.groundPoints, t.modelMatrix, this.toolsService.viewer.scene);
            this._dimensionsPrimitive.heightLinePosition = r.pointLocal;
            this._dimensionsPrimitive.heightLineIndex = r.index;
        }

        const n = Lines.createFromPoints(t.groundPoints);
        n.optimize();

        for (let r = 0; r < t.sideDimensions.length; ++r) {
            const a = t.sideDimensions[r];
            if (a < n.linesCount) {
                this.updateDimensionLabel(a, n, t.modelMatrix);
            }
        }

        const i = Number.isFinite(t.height) ? t.height : this._dimensionsPrimitive?.height;

        for (const r of t.angle) {
            if (r < n.linesCount) {
                this.updateAngleLabel(r, n, t.modelMatrix, i);
            }
        }
    }

    set groundPoints(t) {
        if (this._dimensionsPrimitive) {
            this._dimensionsPrimitive.groundPoints = t;
        }
    }

    set modelMatrix(t) {
        if (this._dimensionsPrimitive) {
            this._dimensionsPrimitive.modelMatrix = t;
        }
    }

    show(options) {
        if (!this._dimensionsPrimitive) {
            return;
        }

        const showHeight = defaultValue(options.showHeight, false);
        const height = Number.isFinite(options.height);

        if (showHeight && height === false) {
            throw new DeveloperError("Showing height with invalid height value is not possible");
        }

        const r = defaultValue(options.adjustZ, 0);

        if (options.angleIndexes && options.angleIndexes?.length > 0 && height === false)
            throw new DeveloperError("Showing angle with invalid height is not possible");

        this._dimensionsPrimitive.showHeight = showHeight;
        this._dimensionsPrimitive.height = options.height ?? 0;
        this._dimensionsPrimitive.adjustZ = r;

        if (showHeight) {
            const c = getLeftOrRightPointInfo(ScreenDirections.LEFT, options.points, options.modelMatrix, this.toolsService.viewer.scene);
            this._dimensionsPrimitive.heightLinePosition = c.pointLocal;
            this._dimensionsPrimitive.heightLineIndex = c.index;
        }

        this._dimensionsPrimitive.angleIndexes = options.angleIndexes ? options.angleIndexes : [];
        this._dimensionsPrimitive.dimensionIndexes = options.sideIndexes ? options.sideIndexes : [];
        this._dimensionsPrimitive.modelMatrix = options.modelMatrix;
        this._dimensionsPrimitive.groundPoints = options.points.map((c) => c.clone());

        if (showHeight) {
            this.updateHeightLabel({
                modelMatrix: options.modelMatrix,
                adjustZ: r,
                height: options.height ?? 0,
                groundPoints: options.points
            });
        } else {
            this._heightLabel?.destroy();
            this._heightLabel = undefined;
        }

        const lines = options.sideIndexes || options.angleIndexes ? Lines.createFromPoints(options.points) : undefined;

        if ((lines?.optimize(), options.sideIndexes && lines)) {
            const c = new Set();
            this._dimensionLabels.forEach((h, f) => c.add(f));

            for (let h = 0; h < options.sideIndexes.length; ++h) {
                const index = options.sideIndexes[h];

                if (index < lines.linesCount) {
                    this.updateDimensionLabel(index, lines, options.modelMatrix);
                    c.delete(index);
                }
            }

            c.forEach((h) => {
                this._dimensionLabels[h]?.destroy();
                delete this._dimensionLabels[h];
            });
        } else {
            this._dimensionLabels.forEach((c) => c.destroy());
            this._dimensionLabels = [];
        }

        const l = Number.isFinite(options.height) ? options.height : this._dimensionsPrimitive?.height;

        if (options.angleIndexes && lines)
            for (const c of options.angleIndexes) {
                if (c < lines.linesCount) {
                    this.updateAngleLabel(c, lines, options.modelMatrix, l);
                }
            }
    }

    beginPointDragging(t, n, i) {
        this.clear();
        const r = Lines.createFromPoints(n.groundPoints);
        r.optimize();
        const a = n.groundPoints;
        const s = a.length;
        const l = new Set();
        for (let m of t) {
            if (m >= r.linesCount) {
                m = r.linesCount - 1;
            }

            const v = m;

            l.add(m === 0 ? s - 1 : m - 1);
            l.add(v);
        }
        const c = Array.from(l);

        if (this._dimensionsPrimitive) {
            this._dimensionsPrimitive.showHeight = false;
            this._dimensionsPrimitive.dimensionIndexes = c;
            this._dimensionsPrimitive.angleIndexes = i ? t : [];
            this._dimensionsPrimitive.height = n.height;
            this._dimensionsPrimitive.groundPoints = a;
        }

        const h = n.modelMatrix;
        const f = n.height;
        if (i) for (const m of t) this.updateAngleLabel(m, r, h, f);
        else {
            this._angleLabels.forEach((m) => {
                m.destroy();
            });
            this._angleLabels = [];
        }

        for (const m of c) this.updateDimensionLabel(m, r, h);
    }

    showCorner(t, n, i, r, a) {
        const s = Lines.createFromPoints(n);
        s.optimize();
        const l = n.length;
        const c = new Set();
        for (let f of t) {
            if (f >= s.linesCount) {
                f = s.linesCount - 1;
            }

            const _ = f;

            c.add(f === 0 ? l - 1 : f - 1);
            c.add(_);
        }

        const h = Array.from(c);

        if (this._dimensionsPrimitive) {
            this._dimensionsPrimitive.groundPoints = n;
            this._dimensionsPrimitive.showHeight = false;
            this._dimensionsPrimitive.dimensionIndexes = h;
            this._dimensionsPrimitive.angleIndexes = a ? t : [];
            this._dimensionsPrimitive.height = r;
        }

        if (s.isPolygon) {
            if (a) for (const f of t) this.updateAngleLabel(f, s, i, r);
            else {
                this._angleLabels.forEach((f) => {
                    f.destroy();
                });
                this._angleLabels = [];
            }

            for (const f of h) this.updateDimensionLabel(f, s, i);
        }
    }

    updateAngleLabel(t, n, i, r) {
        if (!this._dimensionsPrimitive) return;
        const [a, s] = this._dimensionsPrimitive.getAngleCenterPointLocal(t, n, r ?? 0);
        const l = Matrix4.multiplyByPoint(i, a, new Cartesian3());
        const { viewer: c } = this.toolsService;
        const h = c.scene.cartesianToCanvasCoordinates(l, new Cartesian2());
        const f = this._angleLabels[t];
        const { labelService: m } = this.toolsService;
        const _ = n.getPoint(t).clone();
        _.z = r ?? 0;
        const v = Matrix4.multiplyByPoint(i, _, new Cartesian3());
        const A = c.scene.cartesianToCanvasCoordinates(v, new Cartesian2());
        const x = new Cartesian2(15, 15);
        let b = LabelAlignments.leading;

        if (h.y < A.y) {
            x.y = -35;
        }

        if (h.x < A.x) {
            x.x = -15;
            b = LabelAlignments.trailing;
        }

        const T = `${Math.round(CesiumMath.toDegrees(Math.abs(s)))}\xb0`;

        if (f) {
            f.cesiumPosition = l;
            f.text = T;
            f.offset = x;
            f.alignment = b;
        } else {
            this._angleLabels[t] = new DimensionLabel({
                position: l,
                text: T,
                offset: x,
                alignment: b,
                type: DimensionLabelTypes.TEXT,
                labelService: m
            });
        }
    }

    updateHeightLabel(t) {
        const r = calcCenterPoint(
            this.detectVisibleSideLines({
                modelMatrix: t.modelMatrix,
                adjustZ: t.adjustZ,
                height: t.height,
                groundPoints: t.groundPoints
            })[0].line
        );
        const a = Matrix4.multiplyByPoint(t.modelMatrix, r, new Cartesian3());
        const s = (function (e, t1, n = getDefaultLanguage()) {
            return `${Intl.NumberFormat(n, { maximumFractionDigits: t1 }).format(e)} m`;
        })(t.height, 2);

        if (this._heightLabel) {
            this._heightLabel.text = s;
            this._heightLabel.cesiumPosition = a;
        } else {
            this._heightLabel = new DimensionLabel({
                position: a,
                labelService: this.toolsService.labelService,
                type: DimensionLabelTypes.TEXT,
                text: s,
                alignment: LabelAlignments.trailing,
                offset: new Cartesian2(-10, -20)
            });
        }
    }

    detectVisibleSideLines(t) {
        const { scene: n } = this.toolsService.viewer;
        const i = t.groundPoints;
        const { modelMatrix: r } = t;
        const a = [];

        for (let s = 0; s < i.length; ++s) {
            const l = i[s].clone();
            l.z = t.adjustZ;

            const c = i[s].clone();
            c.z = t.adjustZ + t.height;

            a[s] = new LineInfo(Axes.Z, [l, c], r, n);
        }

        a.sort((s, l) => s.middlePoint2d.x - l.middlePoint2d.x);

        return [a[0], a[a.length - 1]];
    }

    updateDimensionLabel(index, lines, modelMatrix) {
        const r = lines.getLine(index);
        const a = r.middlePoint;
        const s = Matrix4.multiplyByPoint(modelMatrix, a, new Cartesian3());
        const l = `${r.length.toFixed(2)} m`;
        const c = this._dimensionLabels[index];
        const { labelService: h } = this.toolsService;
        const f = r.vectorNormalized;
        const m = new Cartesian3(f.y, -1 * f.x, 0);
        const _ = Cartesian3.multiplyByScalar(m, 2, m);
        const v = Cartesian3.add(a, _, new Cartesian3());
        const A = Matrix4.multiplyByPoint(modelMatrix, v, new Cartesian3());
        const { viewer: x } = this.toolsService;
        const b = x.scene.cartesianToCanvasCoordinates(s, new Cartesian2());
        const T = x.scene.cartesianToCanvasCoordinates(A, new Cartesian2());
        const P = Cartesian2.subtract(T, b, new Cartesian3());
        let S = LabelAlignments.leading;

        if (P.x < 0) {
            S = LabelAlignments.trailing;
        }

        if (c) {
            c.cesiumPosition = s;
            c.text = l;
            c.offset = P;
            c.alignment = S;
        } else {
            this._dimensionLabels[index] = new DimensionLabel({
                position: s,
                text: l,
                alignment: S,
                offset: P,
                type: DimensionLabelTypes.TEXT,
                labelService: h
            });
        }
    }

    clear() {
        if (this._dimensionsPrimitive) {
            this._dimensionsPrimitive.showHeight = false;
            this._dimensionsPrimitive.angleIndexes = [];
            this._dimensionsPrimitive.dimensionIndexes = [];
            this._dimensionsPrimitive.angleIndexes = [];
        }

        this._heightLabel?.destroy();
        this._heightLabel = undefined;
        this._dimensionLabels.forEach((t) => {
            t.destroy();
        });
        this._dimensionLabels = [];
        this._angleLabels.forEach((t) => {
            t.destroy();
        });
        this._angleLabels = [];
    }

    removeAngleLabels() {
        this._angleLabels.forEach((t) => {
            t.destroy();
        });
        this._angleLabels = [];
    }

    removeDimensionLabels() {
        this._dimensionLabels.forEach((t) => {
            t.destroy();
        });

        this._dimensionLabels = [];
    }
}
