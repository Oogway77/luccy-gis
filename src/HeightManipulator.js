import { Cartesian3, HeadingPitchRoll, Matrix4, Transforms } from "cesium";

import { MouseButton, DraggingStates as DragStates, getPlane, utils } from "./common";

export class HeightManipulator {
    constructor(options) {
        this.heightSnapper = options.heightSnapper;
        this.referencePoint = options.referencePoint;
        this.minimalZ = options.minimalZ ?? 0;
        this.dragPlane = getPlane(this.referencePoint, options.screenPosition, options.viewer);
        this.updateHeightFn = options.updateHeight;
        this.scene = options.viewer.scene;
        const i = Transforms.headingPitchRollToFixedFrame(this.referencePoint, new HeadingPitchRoll(0, 0, 0));
        this.invMx = Matrix4.inverse(i, new Matrix4());
        this.dragState = DragStates.BEGIN;
    }

    // eslint-disable-next-line class-methods-use-this
    mouseDown(event) {
        return !(event.ctrlKey || event.button !== MouseButton.LEFT);
    }

    mouseMove(t) {
        return (
            this.dragState === DragStates.BEGIN && this.processPosition(t.startPosition, t, DragStates.BEGIN),
            this.processPosition(t.endPosition, t, DragStates.DRAGGING),
            true
        );
    }

    mouseUp(t) {
        // eslint-disable-next-line no-sequences
        return this.dragState === DragStates.BEGIN || this.processPosition(t.position, t, DragStates.FINISHED), true;
    }

    processPosition(screenPosition, event, dragState) {
        const ray = this.scene.camera.getPickRay(screenPosition);
        const s = ray ? utils.rayPlane(ray, this.dragPlane) : undefined;
        if (!s) return false;
        this.dragState = dragState;
        const l = Matrix4.multiplyByPoint(this.invMx, s, new Cartesian3());
        // eslint-disable-next-line no-return-assign
        return l
            ? (this.heightSnapper && (l.z = this.heightSnapper.adjustHeight(event, l.z, dragState)),
              l.z <= this.minimalZ && (l.z = 0.1),
              this.updateHeightFn(l.z, dragState),
              true)
            : (console.error("Inverted box point undefined"), false);
    }

    get isDragging() {
        return this.dragState === DragStates.DRAGGING;
    }
}
