/* eslint-disable consistent-return */
import { Cartesian2, Cartesian3, Ellipsoid, HeadingPitchRoll, Math as CesiumMath, Matrix4, Plane, Transforms } from "cesium";

import { utils, ctrlPressed, DraggingStates, getAngle } from "./common";

const kkt = CesiumMath.toRadians(5);

export class RotationCircleManipulator {
    constructor(options) {
        this.lastMousePosition = new Cartesian2();
        this.angle = options.angle;
        this.scene = options.scene;
        this.startAngle = options.angle;
        this.alwaysSnap = options.alwaysSnap;
        this.onAngleChange = options.onAngleChange;
        const n = Ellipsoid.WGS84.geodeticSurfaceNormal(options.centerPoint);
        this.dragPlane = Plane.fromPointNormal(options.centerPoint, n);
        const i = Transforms.headingPitchRollToFixedFrame(options.centerPoint, new HeadingPitchRoll(0, 0, 0));
        this.dragStartInvModelMatrix = Matrix4.inverse(i, new Matrix4());
        const r = this.scene.camera.getPickRay(options.startMousePosition);
        const a = r ? utils.rayPlane(r, this.dragPlane) : undefined;
        this.dragStartPoint = a ? Matrix4.multiplyByPoint(this.dragStartInvModelMatrix, a, new Cartesian3()) : undefined;
    }

    mouseDown(t) {
        this.lastMousePosition = t.position;
        this.onAngleChange(this.angle, DraggingStates.BEGIN);
        return true;
    }

    mouseMove(t) {
        const n = ctrlPressed(t, this.alwaysSnap);
        this.processDragUpdate(t.endPosition, n, DraggingStates.DRAGGING);
        return true;
    }

    mouseUp(t) {
        const n = ctrlPressed(t, this.alwaysSnap);
        this.processDragUpdate(t.position, n, DraggingStates.FINISHED);
        return true;
    }

    processDragUpdate(t, n, i) {
        if (this.lastMousePosition.equals(t)) {
            if (i === DraggingStates.FINISHED) {
                this.onAngleChange(this.angle, i);
            }
            return;
        }

        this.lastMousePosition = t;
        const r = this.scene.camera.getPickRay(t);
        const a = r ? utils.rayPlane(r, this.dragPlane) : undefined;
        if (!a) return;
        const l = getAngle(Matrix4.multiplyByPoint(this.dragStartInvModelMatrix, a, new Cartesian3()), this.dragStartPoint);
        let c = this.startAngle + l;

        if (n) {
            c = (function (e) {
                const t1 = e.roundTo;
                const n1 = t1 / 2;
                const i1 = e.value;
                const r1 = i1 % e.roundTo;
                return Math.abs(r1) >= n1 ? i1 - r1 + t1 * Math.sign(r1) : i1 - r1;
            })({ value: c, roundTo: kkt });
        }

        this.angle = c;
        this.onAngleChange(this.angle, i);
    }
}
