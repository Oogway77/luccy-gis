import { Cartesian3, Matrix4 } from "cesium";

const Ak = {
    MOVE_TO_CORNER: 100,
    NONE: 0
};

export class AxisSnappingCalculator {
    constructor(options) {
        this._otherEntities = [];
        this.snapSettings = options;
    }

    get modelMatrix() {
        return this._modelMatrix;
    }

    setup(t, n) {
        this._origin = t.centerPoint.clone();
        this._centerPointLocal = new Cartesian3();
        this._modelMatrix = t.modelMatrix.clone();
        this._entity = t;
        const i = Matrix4.inverse(this._modelMatrix, new Matrix4());
        this._otherEntities = n.map((r) => {
            const a = r.modelMatrix;
            const s = r.groundPoints.map((l) => {
                const c = Matrix4.multiplyByPoint(a, l, new Cartesian3());
                const h = Matrix4.multiplyByPoint(i, c, new Cartesian3());
                h.z = 0;
                return h;
            });
            return { entity: r, groundPoints: s };
        });
    }

    trySnapping(t) {
        this.snapInfo = undefined;
        const n = this.trySnappingToCorner(t);

        if (n && this.snapSettings().moveOtherShapeCorner) {
            this.snapInfo = {
                type: Ak.MOVE_TO_CORNER,
                currentEntity: undefined,
                point: n.newCenterPoint,
                entity: n.entity,
                pointIndex: n.index,
                otherEntityPointIndex: n.otherEntityPointIndex
            };
        }

        return this.snapInfo?.point;
    }

    // eslint-disable-next-line consistent-return
    trySnappingToCorner(t) {
        const n = this._entity.groundPoints.map((r) => r);
        const i = n.map((r) => {
            const a = Cartesian3.add(r, t.centerPoint, new Cartesian3());
            a.z = 0;
            return a;
        });
        for (let r = 0; r < n.length; ++r) {
            const a = n[r];
            const s = i[r];
            // eslint-disable-next-line no-restricted-syntax
            for (const l of this._otherEntities)
                for (let c = 0; c < l.groundPoints.length; ++c) {
                    const h = l.groundPoints[c];
                    if (Cartesian3.distance(s, h) < 1)
                        return {
                            newCenterPoint: Cartesian3.subtract(h, a, new Cartesian3()),
                            entity: l.entity,
                            index: r,
                            otherEntityPointIndex: c
                        };
                }
        }
    }
}
