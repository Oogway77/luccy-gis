/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
import { Cartesian3, Color, defaultValue, destroyObject, Matrix4, Math as CesiumMath } from "cesium";

import { checkCondition, KC, xw, PickGroups, dz, EMe } from "./common";
import { createPolylinePrimitive } from "./createPolylinePrimitive";
import { PickUtil } from "./PickUtil";
import { createCoplanarPolygonPrimitive } from "./createCoplanarPolygonPrimitive";

const R3t = 2 * Math.PI;

export class RotationPrimitive {
    constructor(options) {
        this._showDegrees = false;
        this._shownAngle = false;
        this._showMove = false;
        this._shouldRedraw = true;
        this._smallLines = [];
        this._largeLines = [];
        this._highlightRotate = false;
        this._createMoveCircle = false;
        checkCondition(options.radius > 0, "options.radius > 0");
        this.entityId = options.entityId;
        this._centerPoint = options.centerPoint;
        this._angle = options.angle;
        this._height = options.height;
        this._radius = options.radius;
        this._showDegrees = options.showDegrees;
        this._shownAngle = options.showAngle;
        this._color = defaultValue(options.color, KC);
        this._modelMatrix = options.modelMatrix;
        this._invModelMatrix = Matrix4.inverse(this._modelMatrix, new Matrix4());
    }

    destroy() {
        this.circlePrimitive?.destroy();
        this.circlePrimitive = undefined;
        this.circleOutline?.destroy();
        this.circleOutline = undefined;
        this.degreesArcPrimitive?.destroy();
        this.degreesArcPrimitive = undefined;
        for (const t of this._largeLines) t.destroy();
        this._largeLines = [];
        for (const t of this._smallLines) t.destroy();
        this._smallLines = [];

        return destroyObject(this);
    }

    isDestroyed() {
        return false;
    }

    get centerPoint() {
        return this._centerPoint;
    }

    set centerPoint(t) {
        this._centerPoint = t;
        this._shouldRedraw = true;
    }

    get modelMatrix() {
        return this._modelMatrix;
    }

    set modelMatrix(t) {
        this._modelMatrix = t;
        this._invModelMatrix = Matrix4.inverse(this._modelMatrix, new Matrix4());
        this._shouldRedraw = true;
    }

    get invModelMatrix() {
        return this._invModelMatrix;
    }

    get angle() {
        return this._angle;
    }

    set angle(t) {
        if (this._angle !== t) {
            this._angle = t;
            this._shouldRedraw = true;
        }
    }

    get height() {
        return this._height;
    }

    get radius() {
        return this._radius;
    }

    set radius(t) {
        if (this._radius !== t) {
            this._radius = t;
            this._shouldRedraw = true;
        }
    }

    get showAngle() {
        return this._shownAngle;
    }

    set showAngle(t) {
        if (this._shownAngle !== t) {
            this._shownAngle = t;
            this._shouldRedraw = true;
        }
    }

    get showDegrees() {
        return this._showDegrees;
    }

    set showDegrees(t) {
        if (t !== this._showDegrees) {
            this._showDegrees = t;
            this._shouldRedraw = true;
        }
    }

    get highlightRotate() {
        return this._highlightRotate;
    }

    set highlightRotate(t) {
        if (this._highlightRotate !== t) {
            this._highlightRotate = t;
            this._shouldRedraw = true;
        }
    }

    update(t1) {
        if (this._shouldRedraw) {
            this.destroy();
            const n1 = (function (e) {
                const t = [];
                const n = R3t / e.pointsCount;

                for (let i = 0; i < e.pointsCount; i += 1) {
                    const r = i * n;
                    const a = Math.cos(r) * e.radius;
                    const s = Math.sin(r) * e.radius;
                    t.push(new Cartesian3(a, s, 0));
                }
                return t;
            })({ pointsCount: 72, radius: 1 });

            this.createCircle(n1);

            if (this._createMoveCircle) {
                this.createMoveCircle(n1);
            }

            if (this._shownAngle && Math.abs(this._angle) > 0) {
                const i = this.createArcPoints();
                this.createArc(i);
            }

            if (this._showDegrees && this._smallLines.length === 0) {
                this.createSmallLines(n1);
                this.createLargeLines(n1);
            }

            this._shouldRedraw = false;
        }

        this.circlePrimitive?.update(t1);
        this.circleOutline?.update(t1);
        this.moveCirclePrimitive?.update(t1);
        this.moveCircleOutline?.update(t1);
        this.degreesArcPrimitive?.update(t1);
        for (const n of this._smallLines) n.update(t1);
        for (const n of this._largeLines) n.update(t1);
    }

    createCircle(t) {
        const n = this.adjustPoints(t, this._height, this._radius);
        const i = this.adjustPoints(t, this._height, 0.95 * this._radius);
        const r = [...n, n[0], ...i.reverse(), i[0]];
        const a = PickUtil.toStringFromPrefix({
            prefix: this.entityId,
            componentType: xw,
            componentIndex: dz
        });
        const s = KC.withAlpha(this._highlightRotate ? 0.6 : 0.4);
        this.circlePrimitive = createCoplanarPolygonPrimitive({
            id: a,
            modelMatrix: this._modelMatrix,
            color: s,
            points: r,
            showBorder: false,
            selectable: true,
            shadows: false
        });
        this.circleOutline = createPolylinePrimitive({
            id: `${a}-outline`,
            modelMatrix: this._modelMatrix,
            width: 1,
            color: this._color.withAlpha(0),
            alwaysOnTop: true,
            positions: n
        });
        this.circlePrimitive.pickGroup = PickGroups.EDGES_DISABLED;
        this.circleOutline.pickGroup = PickGroups.EDGES_DISABLED;
    }

    createMoveCircle(t) {
        const n = this.adjustPoints(t, this._height, 0.95 * this._radius);
        const i = PickUtil.toStringFromPrefix({
            prefix: this.entityId,
            componentType: xw,
            componentIndex: EMe
        });
        this.moveCirclePrimitive = createCoplanarPolygonPrimitive({
            id: i,
            modelMatrix: this._modelMatrix,
            color: this._color,
            points: n,
            showBorder: false,
            selectable: true,
            shadows: false
        });
        this.moveCircleOutline = createPolylinePrimitive({
            id: `${i}-outline`,
            modelMatrix: this._modelMatrix,
            width: 1,
            color: this._color,
            alwaysOnTop: true,
            positions: n
        });
        this.moveCirclePrimitive.pickGroup = PickGroups.EDGES_DISABLED;
        this.moveCircleOutline.pickGroup = PickGroups.EDGES_DISABLED;
    }

    adjustPoints(t, n, i) {
        i = defaultValue(i, 1);
        const r = [];
        for (let a = 0; a < t.length; a += 1) {
            r[a] = Cartesian3.multiplyByScalar(t[a], i, new Cartesian3());
            r[a].z = n;
        }
        return r;
    }

    createArcPoints() {
        const t = CesiumMath.toDegrees(Math.abs(this._angle));
        const n = Math.ceil(t / 5) + 1;
        const a = (function (e) {
            const t1 = [];
            const i = (e.endAngle - e.startAngle) / (e.pointsCount - 1);
            const r = e.height ?? 0;
            for (let a1 = 0; a1 < e.pointsCount; a1 += 1) {
                const s = e.startAngle + a1 * i;
                const l = Math.cos(s) * e.radius;
                const c = Math.sin(s) * e.radius;
                t1.push(new Cartesian3(l, c, r));
            }
            return t1;
        })({
            startAngle: this._angle >= 0 ? 0 : this._angle,
            endAngle: this._angle >= 0 ? this._angle : 0,
            pointsCount: n,
            radius: this._radius,
            height: this._height
        });
        a.push(new Cartesian3(0, 0, this._height));

        return a;
    }

    createArc(t) {
        const n = PickUtil.toStringFromPrefix({
            prefix: this.entityId,
            componentType: xw,
            componentIndex: "angle"
        });
        this.degreesArcPrimitive = createCoplanarPolygonPrimitive({
            id: n,
            modelMatrix: this._modelMatrix,
            color: Color.ORANGE.withAlpha(0.3),
            points: t,
            showBorder: false,
            shadows: false
        });
        this.degreesArcPrimitive.pickGroup = PickGroups.EDGES_DISABLED;
    }

    createSmallLines(t) {
        let n = new Cartesian3();
        let i = new Cartesian3();
        for (let r = 0; r < t.length; r += 1)
            if (r % 9 !== 0) {
                const a = t[r];
                n = a.clone(n);
                n = Cartesian3.multiplyByScalar(n, this._radius, n);
                n.z = this._height;
                i = a.clone(i);
                i = Cartesian3.multiplyByScalar(i, 1.05 * this._radius, i);
                i.z = this._height;
                const l = createPolylinePrimitive({
                    id: PickUtil.toStringFromPrefix({
                        prefix: this.entityId,
                        componentType: `${xw}-small-line`,
                        componentIndex: r
                    }),
                    positions: [n, i],
                    width: 1,
                    color: Color.BLACK,
                    modelMatrix: this._modelMatrix,
                    alwaysOnTop: true
                });
                l.pickGroup = PickGroups.EDGES_DISABLED;
                this._smallLines.push(l);
            }
    }

    createLargeLines(t) {
        let n = new Cartesian3();
        let i = new Cartesian3();
        for (let r = 0; r < t.length; r += 9) {
            const a = t[r];
            n = a.clone(n);
            n = Cartesian3.multiplyByScalar(n, 0.95 * this._radius, n);
            n.z = this._height;
            i = a.clone(i);
            i = Cartesian3.multiplyByScalar(i, 1.1 * this._radius, i);
            i.z = this._height;
            const l = createPolylinePrimitive({
                id: PickUtil.toStringFromPrefix({
                    prefix: this.entityId,
                    componentType: `${xw}-large-line`,
                    componentIndex: r
                }),
                positions: [n, i],
                width: 3,
                color: Color.BLACK,
                modelMatrix: this._modelMatrix,
                alwaysOnTop: true
            });
            l.pickGroup = PickGroups.EDGES_DISABLED;
            this._largeLines.push(l);
        }
    }
}
