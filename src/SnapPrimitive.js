/* eslint-disable default-case */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */

import { Cartesian3, Color, DeveloperError, destroyObject, Matrix4, PointPrimitiveCollection } from "cesium";

import { EntityTypes, Rc, H_ } from "./common";
import { Lines } from "./Lines";
import { createPolylinePrimitive } from "./createPolylinePrimitive";
import { createPolylinePrimitives } from "./createPolylinePrimitives";

export class SnapPrimitive {
    constructor() {
        this._primitives = [];
        this._shouldRedraw = false;
        this._height = 0;
        this._adjustZ = 0;
    }

    destroy() {
        for (const t of this._primitives) t.destroy();
        this._primitives = [];
        return destroyObject(this);
    }

    isDestroyed() {
        return false;
    }

    get id() {
        return `${this.idPrefix}:snapping`;
    }

    get allowPicking() {
        return false;
    }

    get idPrefix() {
        return this._idPrefix;
    }

    set idPrefix(t) {
        if (this._idPrefix !== t) {
            this._idPrefix = t;
            this._shouldRedraw = true;
        }
    }

    set adjustZ(t) {
        if (Number.isFinite(t) === false) throw new DeveloperError("Trying to set invalid adjustZ to snapping primitive");
        if (this._adjustZ !== t) {
            this._adjustZ = t;
            this._shouldRedraw = true;
        }
    }

    set height(t) {
        if (Number.isFinite(t) === false) throw new DeveloperError("Trying to set invalid height to snapping primitive");
        if (this._height !== t) {
            this._height = t;
            this._shouldRedraw = true;
        }
    }

    get modelMatrix() {
        return this._modelMatrix;
    }

    set modelMatrix(t) {
        if (Matrix4.equals(this._modelMatrix, t) === false) {
            this._modelMatrix = t;
            this._shouldRedraw = true;
        }
    }

    set snapInfo(t) {
        if (this._snapInfo !== t) {
            this._snapInfo = t;
            this._shouldRedraw = true;
        }
    }

    update(t) {
        if (this._shouldRedraw) {
            this.removePrimitives();
            this.createPrimitives();
            this._shouldRedraw = false;
        }
        for (const n of this._primitives) n.update(t);
    }

    removePrimitives() {
        for (const t of this._primitives) t.destroy();
        this._primitives = [];
    }

    createPrimitives() {
        switch (this._snapInfo?.type) {
            case Rc.ANGLE:
                this.createAngleSnapPrimitive(this._snapInfo);
                break;
            case Rc.OTHER_SHAPE_CORNER:
                this.createOtherEntityCornerPrimitive(this._snapInfo);
                break;
            case Rc.PARALLEL_2:
                this.createPrallelPrimitives2(this._snapInfo);
                break;
            case Rc.OTHER_SHAPE_BORDER:
                this.createOtherEntityBorderPrimitives(this._snapInfo);
        }
    }

    createAngleSnapPrimitive(t) {
        if (t.height === 0) return;
        const n = [...t.groundPoints];
        n[t.pointIndex] = t.point;
        const i = Lines.createFromPoints(n);
        const r = createPolylinePrimitives({
            index: t.pointIndex,
            polygon: i,
            color: Color.BLUE,
            width: 7,
            modelMatrix: this._modelMatrix,
            points: n,
            idPrefix: `${this._idPrefix}:snapping:parallel-other`,
            height: this._height,
            hasArrow: false,
            alwaysOnTop: true
        });
        this._primitives.push(...r);
    }

    createOtherEntityCornerPrimitive(t) {
        const [n, i] = this.getHighAndLowPointsWC(t.pointIndex, t.currentEntity);
        const [r, a] = this.getHighAndLowPointsWC(t.otherEntityPointIndex, t.otherEntity);
        const s = Matrix4.inverse(this._modelMatrix, new Matrix4());
        const l = [n, i, r, a].map((_) => Matrix4.multiplyByPoint(s, _, new Cartesian3()));
        let c = l[0];
        let h = l[0];
        l.forEach((_) => {
            if (_.z < c.z) {
                c = _;
            }

            if (h.z < _.z) {
                h = _;
            }
        });
        const m = createPolylinePrimitive({
            id: `${this._idPrefix}:snapping:other-entity-corner`,
            positions: [c, h],
            color: Color.BLUE.withAlpha(0.6),
            modelMatrix: this._modelMatrix,
            hasArrow: false,
            width: 7,
            alwaysOnTop: true
        });
        this._primitives.push(m);
    }

    getHighAndLowPointsWC(t, n) {
        const r = n.groundPoints[t];
        const a = Matrix4.multiplyByPoint(n.modelMatrix, r, new Cartesian3());
        const s = r.clone();
        s.z += n.height;
        return [a, Matrix4.multiplyByPoint(n.modelMatrix, s, new Cartesian3())];
    }

    createOtherEntityBorderPrimitives(t) {
        if (t.otherEntity.height === 0) return;
        const n = [t.line.p0.clone(), t.line.p1.clone()];
        n[0].z = this._height;
        n[1].z = this._height;
        const i = createPolylinePrimitive({
            id: `${this._idPrefix}:snapping:other-entity-border`,
            positions: n,
            color: Color.BLUE.withAlpha(0.6),
            modelMatrix: this._modelMatrix,
            hasArrow: false,
            width: 7,
            alwaysOnTop: true
        });
        this._primitives.push(i);
    }

    createPrallelPrimitives2(t) {
        if (t.entityType !== EntityTypes.POLYGON_3D && t.entityType !== EntityTypes.BUILDING) return;
        const n = this._adjustZ + this._height;
        t.otherLines.forEach((i, r) => {
            const a = i.points.map((l) => new Cartesian3(l.x, l.y, n));
            const s = createPolylinePrimitive({
                id: `${this._idPrefix}:snapping:parallel-other:${r}`,
                positions: a,
                color: Color.GREEN.withAlpha(0.6),
                modelMatrix: this._modelMatrix,
                hasArrow: false,
                width: 7,
                alwaysOnTop: true
            });
            this._primitives.push(s);
        });
        t.movingLines.forEach((i, r) => {
            const a = i.points.map((l) => new Cartesian3(l.x, l.y, n));
            const s = createPolylinePrimitive({
                id: `${this._idPrefix}:snapping:parallel-main:${r}`,
                positions: a,
                color: Color.BLUE.withAlpha(0.6),
                modelMatrix: this._modelMatrix,
                hasArrow: false,
                width: 7,
                alwaysOnTop: true
            });
            this._primitives.push(s);
        });
    }

    createCornerToBoxPrimitive(t) {
        const n = t.entity.groundPoints;
        const i = new PointPrimitiveCollection({ modelMatrix: t.entity.modelMatrix });
        for (const c of t.affectedIndexes) {
            const h = n[c].clone();
            h.z = this._height;
            H_(i, {
                color: Color.BLUE,
                position: h,
                id: `${this.idPrefix}:affected-points:${c}`,
                outlineColor: Color.BLACK,
                pixelSize: 10
            });
        }
        for (const c of t.rightAngleIndexes) {
            const h = n[c].clone();
            h.z = this._height;
            H_(i, {
                color: Color.GREEN,
                position: h,
                id: `${this.idPrefix}:right-angle-points:${c}`,
                outlineColor: Color.BLACK,
                pixelSize: 10
            });
        }
        this._primitives.push(i);
        let a = [];
        for (const c of t.rightAngleIndexes) a.push(c);
        a.sort();
        if (a[0] === 0) {
            if (a[a.length - 1] !== t.groundPoints.length - 1) {
                a.push(t.groundPoints.length - 1);
            }
        } else {
            a = [a[0] - 1, ...a];
        }

        if (a[a.length - 1] === t.groundPoints.length - 1) {
            if (a[0] !== 0) {
                a = [0, ...a];
            }
        } else {
            a.push(a[a.length - 1] + 1);
        }

        const s = [];
        for (let c = 0; c < a.length; ++c) {
            const f = t.groundPoints[a[c]].clone();
            f.z = this._height;
            s.push(f);
        }
        const l = createPolylinePrimitive({
            id: `${this._idPrefix}:snapping:parallel-main`,
            positions: s,
            color: Color.BLUE.withAlpha(0.6),
            modelMatrix: this._modelMatrix,
            hasArrow: false,
            width: 7,
            alwaysOnTop: true
        });
        this._primitives.push(l);
    }
}
