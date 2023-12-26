/* eslint-disable default-case */
import {
    Cartesian3,
    ClassificationType,
    Color,
    ColorGeometryInstanceAttribute,
    defaultValue,
    GeometryInstance,
    GroundPolylineGeometry,
    GroundPolylinePrimitive,
    Matrix4,
    PolylineColorAppearance
} from "cesium";

import { Rc, getPositionsArr } from "./common";
import { SnappingCalculator } from "./SnappingCalculator";
import { SnapPrimitive } from "./SnapPrimitive";
import { Lines } from "./Lines";

function Ek(e) {
    const t = defaultValue(e.opacity, 1);
    const n = new GroundPolylineGeometry({ positions: e.points, width: e.width });
    const i = new GeometryInstance({
        geometry: n,
        id: e.id,
        attributes: { color: ColorGeometryInstanceAttribute.fromColor(e.color.withAlpha(t)) }
    });
    return new GroundPolylinePrimitive({
        geometryInstances: i,
        appearance: new PolylineColorAppearance(),
        allowPicking: true,
        asynchronous: false,
        classificationType: ClassificationType.TERRAIN
    });
}

export class SnappingManager {
    constructor(options) {
        this._groundLines = [];
        this.calculator = new SnappingCalculator({ snapSettings: options.snapSettings });
        this._viewer = options.viewer;
    }

    setup(t, n) {
        this.calculator.setup(t, n);

        if (this._snapPrimitive) {
            this._viewer.scene.primitives.remove(this._snapPrimitive);
        }

        const i = new SnapPrimitive();
        this._snapPrimitive = this._viewer.scene.primitives.add(i);
    }

    trySnapping(t) {
        const n = this.calculator.trySnapping(t);

        if (this._snapPrimitive) {
            this._snapPrimitive.modelMatrix = t.snappable.modelMatrix;
            this._snapPrimitive.idPrefix = t.snappable.idPrefix;
            this._snapPrimitive.height = t.snappable.height;
            this._snapPrimitive.adjustZ = t.snappable.adjustZ;
            this._snapPrimitive.snapInfo = this.calculator.snapInfo;
        } else {
            console.error("No snapping primitive.");
        }

        return n ?? t.point;
    }

    redraw(t) {
        this.removeSnapInfo();

        if (this.calculator.snapInfo && t) {
            this.redrawOnGround(this.calculator.snapInfo, t);
        }
        this._viewer.scene.requestRender();
    }

    removeSnapInfo() {
        const t = this._viewer.scene.groundPrimitives;
        this._groundLines.forEach((n) => {
            t.remove(n);
        });

        this._groundLines = [];
    }

    onDestroy() {
        if (this._snapPrimitive) {
            this._viewer.scene.primitives.remove(this._snapPrimitive);
            this._snapPrimitive = undefined;
        }

        this.removeSnapInfo();
    }

    endDrag() {
        if (this._snapPrimitive) {
            this._snapPrimitive.snapInfo = undefined;
            this.removeSnapInfo();
        }
    }

    get snapInfo() {
        return this.calculator.snapInfo;
    }

    redrawOnGround(t, n) {
        switch (t?.type) {
            case Rc.ANGLE:
                this.createAngleSnap(t, n);
                break;
            case Rc.PARALLEL_2:
                this.createPrallelSnapPrimitives(t, n);
                break;
            case Rc.OTHER_SHAPE_BORDER:
                this.createOtherEntityBorder(t, n);
        }
    }

    createPrallelSnapPrimitives(t, n) {
        if (n.height > 0) {
            return;
        }

        const i = n.modelMatrix;

        t.otherLines.forEach((r) => {
            const s = r.points.map((c) => new Cartesian3(c.x, c.y, 0)).map((c) => Matrix4.multiplyByPoint(i, c, new Cartesian3()));
            const l = Ek({
                id: `${n.idPrefix}:snap-line-current`,
                points: s,
                color: Color.GREEN,
                opacity: 1,
                width: 7
            });

            this._groundLines.push(l);
            this._viewer.scene.groundPrimitives.add(l);
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        t.movingLines.forEach((r, a) => {
            const s = r.points.map((c) => new Cartesian3(c.x, c.y, 0)).map((c) => Matrix4.multiplyByPoint(i, c, new Cartesian3()));
            const l = Ek({
                id: `${n.idPrefix}:snap-line-other`,
                points: s,
                color: Color.BLUE,
                opacity: 1,
                width: 7
            });

            this._groundLines.push(l);
            this._viewer.scene.groundPrimitives.add(l);
        });
    }

    createAngleSnap(tt, n1) {
        if (n1.height > 0) {
            return;
        }

        const i1 = n1.modelMatrix;

        const r1 = [...tt.groundPoints];

        r1[tt.pointIndex] = tt.point;
        const a1 = Lines.createFromPoints(r1);

        const l = (function (e) {
            const { idPrefix: t } = e;
            const n = defaultValue(e.opacity, 1);
            const i = getPositionsArr({
                index: e.index,
                points: e.points,
                polygon: e.polygon,
                height: 0,
                modelMatrix: e.modelMatrix
            });
            if (!i) return [];
            const [r, a] = i;
            return [
                Ek({
                    id: `${t}:0`,
                    points: r,
                    color: e.color,
                    width: e.width,
                    opacity: n
                }),
                Ek({
                    id: `${t}:1`,
                    points: a,
                    color: e.color,
                    width: e.width,
                    opacity: n
                })
            ];
        })({
            index: tt.pointIndex,
            polygon: a1,
            color: Color.BLUE,
            width: 7,
            modelMatrix: i1,
            points: r1,
            idPrefix: `${n1.idPrefix}:snapping:ground-angle-snap`
        });
        const c = this._viewer.scene.groundPrimitives;

        l.forEach((h) => {
            c.add(h);
        });

        this._groundLines.push(...l);
    }

    createOtherEntityBorder(t, n) {
        if (t.otherEntity.height > 0) {
            return;
        }

        const i = n.modelMatrix;
        const r = [t.line.p0.clone(), t.line.p1.clone()]
            .map((l) => {
                l.z = 0;
                return l;
            })
            .map((l) => Matrix4.multiplyByPoint(i, l, new Cartesian3()));

        const a = Ek({
            id: `${n.idPrefix}:snapping:other-entity-border`,
            points: r,
            color: Color.BLUE,
            opacity: 0.6,
            width: 7
        });

        this._viewer.scene.groundPrimitives.add(a);
        this._groundLines.push(a);
    }
}
