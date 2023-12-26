/* eslint-disable no-bitwise */
/* eslint-disable class-methods-use-this */
/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
import { Cartesian2, Cartesian3, Math as CesiumMath, Matrix2, Matrix3, Matrix4 } from "cesium";

import { Rc, getAngle, ote, w2, eMe } from "./common";

import { Line, Lines } from "./Lines";

const XIe = (Math.PI / 180) * 10;
const tkt = [Math.PI / 2];
const rz = CesiumMath.toRadians(5);

const Aw = {
    BACKWARDS: 2,
    BOTH: 3,
    FORWARD: 1
};

export class SnappingCalculator {
    constructor(options) {
        this._otherEntitiesPoints = [];
        this.snapSettings = options.snapSettings;
    }

    get snapInfo() {
        return this._snapInfo;
    }

    setup(t, n) {
        this._otherEntitiesPoints = (function (e) {
            const n1 = Matrix4.inverse(e.modelMatrix, new Matrix4());
            const i = [];
            for (const r of e.allEntities) {
                const a = r.groundPoints
                    .map((l) => Matrix4.multiplyByPoint(r.modelMatrix, l, new Cartesian3()))
                    .map((l) => Matrix4.multiplyByPoint(n1, l, new Cartesian3()))
                    .map((l) => {
                        l.z = 0;
                        return l;
                    });
                const s = a.map((l, c) => ({
                    point: l,
                    entity: r,
                    index: c,
                    line: new Line(l, a[c === a.length - 1 ? 0 : c + 1])
                }));

                i.push(...s);
            }
            return i;
        })({ modelMatrix: t.modelMatrix, allEntities: n });
    }

    trySnapping(t) {
        this._snapInfo = undefined;

        if (!this._snapInfo && this.snapSettings().cornerOtherShapeCorner) {
            const i = this.tryOtherBuildingCornerSnapping(t);

            if (i) {
                this._snapInfo = {
                    type: Rc.OTHER_SHAPE_CORNER,
                    point: i.point,
                    pointIndex: t.index,
                    currentEntity: t.snappable,
                    otherEntity: i.entity,
                    otherEntityPointIndex: i.index
                };
            }
        }
        if (!this._snapInfo && this.snapSettings().cornerOtherShapeBorder) {
            const i = this.tryOtherBuildingBorderSnapping(t);

            if (i) {
                this._snapInfo = {
                    type: Rc.OTHER_SHAPE_BORDER,
                    point: i.point,
                    pointIndex: t.index,
                    otherEntity: i.entity,
                    line: i.line
                };
            }
        }
        if (t.snappable.isBox) {
            if (!this._snapInfo && this.snapSettings().cornerGrid) {
                const i = this.snapBoxPoints(t);
                this._snapInfo = { type: Rc.GRID, point: i, pointIndex: t.index };
            }
        } else {
            if (!this._snapInfo && this.snapSettings().cornerParalel) {
                const i = this.tryParallelSnapping(t);

                if (i) {
                    this._snapInfo = {
                        type: Rc.PARALLEL_2,
                        entityType: t.snappable.type,
                        point: i.point,
                        pointIndex: t.index,
                        movingLineIndexes: i.movingLineIndexes,
                        movingLines: i.movingLines,
                        otherLineIndexes: i.otherLineIndexes,
                        otherLines: i.otherLines
                    };
                }
            }

            if (!this._snapInfo && this.snapSettings().cornerAngle) {
                const [i, r] = this.tryAngleSnapping(t);

                if (i) {
                    this._snapInfo = {
                        type: Rc.ANGLE,
                        height: t.snappable.adjustZ + t.snappable.height,
                        entityType: t.snappable.type,
                        point: i,
                        pointIndex: t.index,
                        angle: r,
                        groundPoints: t.snappable.groundPoints
                    };
                }
            }
        }
        return this._snapInfo ? this._snapInfo.point : t.point;
    }

    trySnappingToBox(t) {
        const n = !!t.initialized;
        t.initialized = true;
        const i = (t.pointIndex + 1) % t.groundPoints.length;
        const r = t.pointIndex === 0 ? t.groundPoints.length - 1 : t.pointIndex - 1;
        const a = t.pointIndex;
        const s = t.groundPoints[r];
        const l = t.groundPoints[i];
        const c = t.groundPoints[a];

        if (t.processedIndexes[a]) return false;

        t.processedIndexes[a] = true;

        if (t.direction & Aw.FORWARD && !t.processedIndexes[i]) {
            const h = w2(s, c, l);
            const f = Math.PI / 2 + h;
            if (Math.abs(f) > ote) return false;
            const m = this.rotatePoint(c, l, -f);
            t.groundPoints[i] = m;
            t.rightAngleIndexes.add(a);
            t.affectedIndexes.delete(a);
            t.affectedIndexes.add(i);
        }

        if (t.direction & Aw.BACKWARDS && !t.processedIndexes[r] && t.rightAngleIndexes.has(a) === false) {
            const h = w2(l, c, s);
            const f = Math.PI / 2 - h;
            if (Math.abs(f) > ote) return false;
            const m = this.rotatePoint(c, s, f);
            t.groundPoints[r] = m;
            t.rightAngleIndexes.add(a);
            t.affectedIndexes.delete(a);
            t.affectedIndexes.add(r);
        }

        if (!t.processedIndexes[i] && t.direction & Aw.FORWARD) {
            this.trySnappingToBox({
                ...t,
                pointIndex: i,
                direction: Aw.FORWARD
            });
        }

        if (!t.processedIndexes[r] && t.direction & Aw.BACKWARDS) {
            this.trySnappingToBox({
                ...t,
                pointIndex: r,
                direction: Aw.BACKWARDS
            });
        }

        if (n && eMe(t.groundPoints) === false) {
            console.error("Invalid box setting for input: ", t.groundPoints);
        }

        return true;
    }

    tryAngleSnapping(t) {
        const n = [...t.snappable.groundPoints];
        const a = n[t.index === 0 ? n.length - 1 : t.index - 1];
        const s = n[t.index === n.length - 1 ? 0 : t.index + 1];
        const l = t.point;

        const c = (function (e, t1, n1) {
            const i = Cartesian3.subtract(e, t1, new Cartesian3());
            const r = Cartesian3.subtract(n1, t1, new Cartesian3());
            return Cartesian3.angleBetween(i, r);
        })(a, l, s);

        const h = this.guessSnapAngle(c);
        return Number.isFinite(h) ? [this.snapToAngle(a, l, s), h] : [undefined, 0];
    }

    guessSnapAngle(t) {
        for (const n of tkt) if (n - XIe < t && t < n + XIe) return n;
    }

    snapToAngle(t, n, i) {
        const r = new Cartesian2(t.x, t.y);
        const a = new Cartesian2(i.x, i.y);
        const s = new Cartesian2(n.x, n.y);
        const l = Cartesian2.subtract(a, r, new Cartesian2());
        const c = Cartesian2.distance(r, s);
        const h = Cartesian2.distance(r, a);
        const f = (function (e, t1, n1) {
            const i1 = Cartesian2.subtract(e, t1, new Cartesian2());
            const r1 = Cartesian2.subtract(n1, t1, new Cartesian2());

            return Cartesian2.angleBetween(i1, r1);
        })(s, r, a);

        const m = c * Math.cos(f);
        const _ = h / 2;
        const v = _ - m;
        const A = Math.sqrt(Math.abs(_ * _ - v * v));
        const x = Math.sqrt(A * A + m * m);
        const b = Math.asin(A / x);
        const T = (function (e, t2, n2) {
            const i2 = Cartesian3.subtract(e, t2, new Cartesian3());
            const r2 = Cartesian3.subtract(n2, t2, new Cartesian3());
            return Cartesian3.cross(i2, r2, new Cartesian3());
        })(t, n, i);

        const P = Math.sign(T.z);
        const S = Matrix2.fromRotation(b * P, new Matrix2());
        const D = Matrix2.multiplyByVector(S, l, new Cartesian2());
        const F = Cartesian2.normalize(D, new Cartesian2());
        const L = Cartesian2.multiplyByScalar(F, x, new Cartesian2());
        const U = new Cartesian3(L.x, L.y, 0);
        return Cartesian3.add(t, U, new Cartesian3());
    }

    snapBoxPoints(t) {
        const n = t.point.clone();
        const { index: i } = t;
        const r = [...t.snappable.groundPoints];
        const a = r[i];
        const c = r[i === 0 ? r.length - 1 : i - 1];
        const h = r[i === r.length - 1 ? 0 : i + 1];
        const f = new Cartesian3();

        if (c.x === a.x) {
            f.x = Math.abs(n.x - h.x);
            f.y = Math.abs(n.y - c.y);
        } else {
            f.x = Math.abs(n.x - c.x);
            f.y = Math.abs(n.y - h.y);
        }

        const m = new Cartesian3();

        m.x = Math.round(f.x);
        m.y = Math.round(f.y);
        const _ = n.clone();

        if (c.x === a.x) {
            _.x = _.x > h.x ? h.x + m.x : h.x - m.x;
            _.y = _.y > c.y ? c.y + m.y : c.y - m.y;
        } else {
            _.x = _.x > c.x ? c.x + m.x : c.x - m.x;
            _.y = _.y > h.y ? h.y + m.y : h.y - m.y;
        }

        n.x = _.x;
        n.y = _.y;

        return n;
    }

    tryOtherBuildingCornerSnapping(t) {
        for (const n of this._otherEntitiesPoints) {
            const i = n.point;
            if (Cartesian2.equalsEpsilon(t.point, i, 0, 1))
                return {
                    entity: n.entity,
                    point: new Cartesian3(i.x, i.y, 0),
                    line: n.line,
                    index: n.index
                };
        }
    }

    tryOtherBuildingBorderSnapping(t) {
        const n = t.point;
        n.z = 0;
        for (let i = 0; i < this._otherEntitiesPoints.length; ++i) {
            const r = this._otherEntitiesPoints[i];
            const a = r.line.closestPointOnLine(n);
            if (a && Cartesian3.distance(a, t.point) < 1) return { entity: r.entity, point: a, line: r.line };
        }
    }

    tryParallelSnapping(t) {
        const n = [...t.snappable.groundPoints];
        n[t.index] = t.point;
        const i = t.index === n.length - 1 ? 0 : t.index + 1;
        const r = t.index === 0 ? n.length - 1 : t.index - 1;
        const { index: a } = t;
        const s = Lines.createFromPoints(n);
        if (s.linesCount < 2) return;
        const { linesCount: l } = s;
        const c = a;
        const h = a === 0 ? l - 1 : a - 1;
        const f = s.getLine(h);
        const m = f.vector;
        const _ = c === l - 1 ? 0 : c + 1;
        const v = s.getLine(_).reversed;
        const A = h === 0 ? l - 1 : h - 1;
        const x = s.getLine(A).reversed;
        const P = getAngle(f.vector, v.vector);
        const S = Math.abs(P) < rz;
        const D = P > Math.PI - rz;
        const F = s.getLine(c);
        const G = getAngle(x.vector, F.vector);
        const Y = Math.abs(G) < rz;
        const te = G > Math.PI - rz;
        if ((S || D) && (Y || te) && n.length > 3) {
            const k = n[r];
            const V = n[i];
            const y = new Line(k, V);
            const R = Cartesian3.distance(k, V);
            const z = getAngle(y.vector, x.vector);
            const X = getAngle(x.vector, v.vector);
            const J = (R * Math.sin(z)) / Math.sin(X);
            const ae = S ? P : Math.PI - P;
            const ne = Matrix3.fromRotationZ(ae, new Matrix3());
            const fe = Matrix3.multiplyByVector(ne, S ? f.reversed.vectorNormalized : f.vectorNormalized, new Cartesian3());
            const pe = Cartesian3.multiplyByScalar(fe, J, new Cartesian3());
            const ge = Cartesian3.add(k, pe, new Cartesian3());
            return {
                point: ge,
                movingLineIndexes: [h, c],
                movingLines: [new Line(f.p0, ge), new Line(ge, F.p1)],
                otherLineIndexes: [_, A],
                otherLines: [x, v]
            };
        }
        if (S || D) {
            const k = Matrix3.fromRotationZ(P, new Matrix3());
            if (D) {
                const y = Matrix3.multiplyByVector(k, m, new Cartesian3());
                const R = Cartesian3.multiplyByScalar(y, -1, new Cartesian3());
                f.p1 = Cartesian3.add(f.p0, R, new Cartesian3());
            } else {
                const y = Matrix3.multiplyByVector(k, m, new Cartesian3());
                f.p1 = Cartesian3.add(f.p0, y, new Cartesian3());
            }
            return {
                point: f.p1,
                movingLineIndexes: [h],
                movingLines: [f],
                otherLineIndexes: [_],
                otherLines: [v]
            };
        }
        if (Y || te) {
            const k = Matrix3.fromRotationZ(-G, new Matrix3());
            if (te) {
                const y = Matrix3.multiplyByVector(k, F.vector, new Cartesian3());
                const R = Cartesian3.multiplyByScalar(y, -1, new Cartesian3());
                F.p0 = Cartesian3.subtract(F.p1, R, new Cartesian3());
            } else {
                const y = Matrix3.multiplyByVector(k, F.vector, new Cartesian3());
                F.p0 = Cartesian3.subtract(F.p1, y, new Cartesian3());
            }

            return {
                point: F.p0,
                movingLineIndexes: [A],
                movingLines: [x],
                otherLineIndexes: [c],
                otherLines: [F]
            };
        }
    }

    rotatePoint(t, n, i) {
        const r = Cartesian3.subtract(n, t, new Cartesian3());
        const a = Matrix3.fromRotationZ(i, new Matrix3());
        const s = Matrix3.multiplyByVector(a, r, new Cartesian3());
        return Cartesian3.add(t, s, new Cartesian3());
    }
}
