/* eslint-disable no-lonely-if */
/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable default-case */
/* qeslint-disable */
/* eslint-disable max-classes-per-file */
import {
    Cartesian2,
    Cartesian3,
    Ellipsoid,
    HeadingPitchRoll,
    Matrix4,
    Math as CesiumMath,
    Plane,
    SceneTransforms,
    Transforms
} from "cesium";

import {
    Vr,
    MouseButton,
    DragStates,
    TrackingModes,
    DraggingStates,
    utils,
    k_,
    DimensionLabelTypes,
    drillPick,
    getPlane,
    ctrlPressed,
    hz
} from "./common";
import { AxisManipulatorsImpl } from "./AxisManipulatorsImpl";
import { PickUtil } from "./PickUtil";
import { DimensionLabel } from "./DimesionLabel";
import { RotationCircleManipulator } from "./RotationCircleManipulator";
import { SnapPrimitive } from "./SnapPrimitive";
import { AxisSnappingCalculator } from "./AxisSnappingCalculator";
import { getWorldPosition } from "./getWorldPosition";

const pickedPositionScratch = new Cartesian3();
const Ukt = new Cartesian3();
const Ste = new Cartesian3();
const Bo = Object.freeze({ CENTER: 0, LEFT: 1, RIGHT: -1 });

function Zee() {}

const dd = {
    LEFT_TOP: 0,
    LEFT_BOTTOM: 1,
    RIGHT_TOP: 2,
    RIGHT_BOTTOM: 3
};

function LIe(e, t) {
    let n;

    if (t.x < e.x) {
        if (t.y < e.y) {
            n = dd.LEFT_BOTTOM;
        } else {
            n = dd.LEFT_TOP;
        }
    } else {
        if (t.y < e.y) {
            n = dd.RIGHT_BOTTOM;
        } else {
            n = dd.RIGHT_TOP;
        }
    }

    return n;
}

function TMe(e) {
    switch (e) {
        case "x":
            return Vr.x;
        case "y":
            return Vr.y;
        case "z":
            return Vr.z;
        case "angle0":
        case "angle1":
            return Vr.angle;
        case "point":
            return Vr.point;
        default:
    }
}

class AxisSnappingManager {
    constructor(t) {
        this._calculator = new AxisSnappingCalculator(t);
    }

    setup(t, n, i) {
        this._viewer = t;
        this.idPrefix = n.idPrefix;
        this._calculator.setup(n, i);

        if (this._snapPrimitive) {
            this._viewer.scene.primitives.remove(this._snapPrimitive);
        }
        const r = new SnapPrimitive();
        this._snapPrimitive = this._viewer.scene.primitives.add(r);
    }

    tryToSnap(t) {
        if (!this._viewer) return t.centerPoint;
        const n = this._calculator.trySnapping(t);

        if (this._snapPrimitive) {
            this._snapPrimitive.modelMatrix = this._calculator.modelMatrix;
            this._snapPrimitive.idPrefix = this.idPrefix;

            if (this._calculator.snapInfo) {
                this._snapPrimitive.snapInfo = this._calculator.snapInfo;
            }
        }

        return n ?? t.centerPoint;
    }

    endDrag() {
        if (this._snapPrimitive) {
            this._snapPrimitive.snapInfo = null;
        }
    }
}

export class AxisManipulators {
    constructor(options) {
        this._dragState = DragStates.NONE;
        this._trackingMode = TrackingModes.TERRAIN;
        this._destroyed = false;
        this._labelsService = options.labelsService;
        this._snappingManager = new AxisSnappingManager(options.snapSettings);
        this._alwaysSnap = options.snapSettings().alwaysSnap;
        this._eventHandler = options.eventHandler;
        this._viewer = options.viewer;
        this._updatePositionHandler = options.updatePositionHandler;
        this._trackingMode = options.trackingMode;
        const n = this.calculateDistanceFromCamera(options.modelMatrix, Cartesian3.ZERO);
        this._manipulators = new AxisManipulatorsImpl({
            id: options.id,
            angle: options.angle,
            radius: options.radius,
            xyConfig: options.xyConfig,
            zConfig: options.zConfig,
            angleConfig: options.angleConfig,
            pointConfig: options.pointConfig,
            distanceFromCamera: n,
            modelMatrix: options.modelMatrix
        });
        this._viewer.scene.primitives.add(this._manipulators);
        this._cameraListenerRemoveCallback = this._viewer.scene.camera.changed.addEventListener(() => {
            if (this._manipulators) {
                this._manipulators.distanceFromCamera = this.calculateDistanceFromCamera(
                    this._manipulators.modelMatrix,
                    this._manipulators.centerPointLocal
                );
            }
        });
    }

    calculateDistanceFromCamera(t, n) {
        const i = Matrix4.multiplyByPoint(t, n, new Cartesian3());
        return Cartesian3.distance(i, this._viewer.camera.position);
    }

    get snappingManager() {
        return this._snappingManager;
    }

    get dragState() {
        return this._dragState;
    }

    get dragPart() {
        return this._dragPart;
    }

    redraw(t, n) {
        const { scene: i } = this._viewer;
        let r = "";
        if (n !== DragStates.NONE && t && this._manipulators) {
            let a;
            let s;
            let l;
            const c = this._manipulators.modelMatrix;
            switch (t) {
                case Vr.x:
                    {
                        const f = new Cartesian3(0.1, 0, 0);
                        const m = this._manipulators.adjustPoints([f, Cartesian3.UNIT_X], 0.6);
                        const _ = Matrix4.multiplyByPoint(c, m[0], new Cartesian3());
                        const v = Matrix4.multiplyByPoint(c, m[1], new Cartesian3());
                        a = m[1];
                        [s, l] = Zee(_, v, i);
                        r = this._manipulators.centerPointLocal.x.toFixed(2);
                    }
                    break;
                case Vr.y:
                    {
                        const f = new Cartesian3(0, 0.1, 0);
                        const m = this._manipulators.adjustPoints([f, Cartesian3.UNIT_Y], 0.6);
                        const _ = Matrix4.multiplyByPoint(c, m[0], new Cartesian3());
                        const v = Matrix4.multiplyByPoint(c, m[1], new Cartesian3());
                        a = m[1];
                        [s, l] = Zee(_, v, i);
                        r = this._manipulators.centerPointLocal.y.toFixed(2);
                    }
                    break;
                case Vr.z:
                    {
                        const f = new Cartesian3(0, 0, 0.1);
                        const m = this._manipulators.adjustPoints([f, Cartesian3.UNIT_Z], 0.6);
                        const _ = Matrix4.multiplyByPoint(c, m[0], new Cartesian3());
                        const v = Matrix4.multiplyByPoint(c, m[1], new Cartesian3());
                        a = m[1];
                        [s, l] = Zee(_, v, i);
                        r = this._manipulators.centerPointLocal.z.toFixed(2);
                    }
                    break;
                case Vr.point:
                    a = this._manipulators.centerPointLocal.clone();
                    s = new Cartesian2(-10, 30);
                    l = Bo.RIGHT;
                    r = `${this._manipulators.centerPointLocal.x.toFixed(2)}/${this._manipulators.centerPointLocal.y.toFixed(2)}`;
                    break;
                case Vr.angle: {
                    const f = new Cartesian3(Math.cos((45 * Math.PI) / 180), Math.sin((45 * Math.PI) / 180), 0);
                    const [m, _] = this._manipulators.adjustPoints([f, this._manipulators.centerPointLocal], 4);
                    const v = Matrix4.multiplyByPoint(c, m, new Cartesian3());
                    const A = Matrix4.multiplyByPoint(c, _, new Cartesian3());
                    a = m;
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    [s, l] = (function (e, t1, n1) {
                        const i1 = SceneTransforms.wgs84ToWindowCoordinates(n1, t1);
                        let c1;
                        let h;
                        switch (LIe(SceneTransforms.wgs84ToWindowCoordinates(n1, e), i1)) {
                            case dd.LEFT_BOTTOM:
                                h = Bo.RIGHT;
                                c1 = new Cartesian2(-15, -20);
                                break;
                            case dd.LEFT_TOP:
                                h = Bo.RIGHT;
                                c1 = new Cartesian2(-15, 20);
                                break;
                            case dd.RIGHT_BOTTOM:
                                h = Bo.LEFT;
                                c1 = new Cartesian2(15, -20);
                                break;
                            case dd.RIGHT_TOP:
                                h = Bo.LEFT;
                                c1 = new Cartesian2(15, 20);
                        }
                        return [c1, h];
                    })(A, v, i);
                    r = CesiumMath.toDegrees(this._manipulators.angle).toFixed(2);
                }
            }
            const h = Matrix4.multiplyByPoint(c, a, new Cartesian3());

            if (this._distanceLabel) {
                this._distanceLabel.cesiumPosition = h;
                this._distanceLabel.text = r;
            } else {
                if (s) {
                    this._distanceLabel = new DimensionLabel({
                        type: DimensionLabelTypes.TEXT,
                        position: h,
                        text: r,
                        offset: s,
                        labelService: this._labelsService
                    });
                }
            }
        } else {
            this._distanceLabel?.destroy();
            this._distanceLabel = undefined;
        }
        i.requestRender();
    }

    mouseDown(t) {
        if (!t.position) {
            console.error("Cannot obtain event position", t.position);
            return false;
        }

        if (t.button !== MouseButton.LEFT || t.shiftKey || t.altKey) return false;
        const n = drillPick(t, this._viewer);
        for (const i of n) {
            let r = false;
            const a = this.pickedPart(i);

            if (a) {
                r = this.beginDrag(i.id, i.primitive, a, t);
            }

            if (r) {
                const s = this._manipulators;

                if (s) {
                    s.isDragging = true;
                }

                return true;
            }
        }
        return false;
    }

    beginDrag(t, n, i, r) {
        const a = this._manipulators;
        a.centerPointLocal = new Cartesian3();
        const s = Ellipsoid.WGS84;
        switch (i) {
            case Vr.point:
                {
                    this._startDragPoint = Matrix4.multiplyByPoint(a.modelMatrix, a.centerPointLocal, new Cartesian3());
                    const c = s.geodeticSurfaceNormal(this._startDragPoint);
                    this._dragPlane = Plane.fromPointNormal(this._startDragPoint, c);
                    const h = this._viewer.camera.getPickRay(r.position);
                    const f = h ? utils.rayPlane(h, this._dragPlane) : undefined;
                    if (!f) return false;
                    this._dragDiff = Cartesian3.subtract(f, this._startDragPoint, new Cartesian3());
                }
                break;
            case Vr.angle:
                {
                    const c = Matrix4.multiplyByPoint(this._manipulators.modelMatrix, a.centerPointLocal, new Cartesian3());
                    this.rotateManipulator = new RotationCircleManipulator({
                        centerPoint: c,
                        angle: this._manipulators.angle,
                        scene: this._viewer.scene,
                        startMousePosition: r.position,
                        alwaysSnap: this._alwaysSnap,
                        onAngleChange: (h, f) => {
                            this.updateAngle(h, f);
                        }
                    });
                    this.rotateManipulator.mouseDown(r);
                    this._dragState = DragStates.NONE;
                }
                break;
            case Vr.x:
            case Vr.y:
                {
                    this._startDragPoint = this._viewer.scene.pickPosition(r.position);

                    if (!this._startDragPoint) {
                        console.error("Cannot find start dragging point.", r.position, t, i);
                        return true;
                    }

                    this._dragDiff = undefined;
                    const l = s.geodeticSurfaceNormal(this._startDragPoint);
                    this._dragPlane = Plane.fromPointNormal(this._startDragPoint, l);
                }
                break;
            case Vr.z: {
                const l = Matrix4.multiplyByPoint(a.modelMatrix, a.centerPointLocal, new Cartesian3());
                this._dragPlane = getPlane(l, r.position, this._viewer);

                if (!this._dragPlane) return false;
                const h = this._viewer.camera.getPickRay(r.position);
                this._startDragPoint = h ? utils.rayPlane(h, this._dragPlane) : undefined;
                if (!this._startDragPoint) return false;

                if (this._zSnapper) {
                    this._zSnapper.adjustHeight(r, a.centerPointLocal.z, DraggingStates.BEGIN);
                }
            }
        }

        this._dragPart = i;
        this._dragState = DragStates.DRAGGING;
        this._lastScreenPoint = r.position;

        if (this._updatePositionHandler && i !== Vr.angle) {
            const c = Matrix4.multiplyByPoint(a.modelMatrix, a.centerPointLocal, new Cartesian3());
            this._updatePositionHandler(c, a.angle, DraggingStates.BEGIN);
        }
        return true;
    }

    mouseUp(t) {
        if (this.rotateManipulator) {
            this.rotateManipulator.mouseUp(t);
            this.rotateManipulator = undefined;
            this._dragState = DragStates.NONE;
            return true;
        }

        if ((this._snappingManager.endDrag(), this._dragState === DragStates.DRAGGING && this._manipulators)) {
            const n = Matrix4.multiplyByPoint(this._manipulators.modelMatrix, this._manipulators.centerPointLocal, new Cartesian3());
            this.updatePosition(n, this._manipulators.angle);

            if (this._updatePositionHandler) {
                this._updatePositionHandler(n, this._manipulators.angle, DraggingStates.FINISHED);
            }

            if (this._destroyed === false) {
                this._manipulators.isDragging = false;
                this._manipulators.centerPointLocal = new Cartesian3();
                this.redraw(this._dragPart, this._dragState);
            }
        }

        this.removeLabels();
        this._dragState = DragStates.NONE;
        this._dragPart = undefined;
        this._startDragPoint = undefined;
        this._lastScreenPoint = undefined;

        return false;
    }

    mouseMove(t) {
        if (this.rotateManipulator) {
            this.rotateManipulator.mouseMove(t);
            return true;
        }

        if (this._lastScreenPoint && Cartesian2.distance(t.endPosition, this._lastScreenPoint) < 0.4) return true;
        if (!this._manipulators || this._dragState === DragStates.NONE) return false;
        const i = this._manipulators.centerPointLocal.z;
        switch (this._dragPart) {
            case Vr.x:
            case Vr.y:
            case Vr.z:
            case Vr.point:
                this.dragAlongAxe(t.endPosition, t);
                break;
            case Vr.angle:
                break;
            default:
                console.error("Unknown manipulator part during drag");
                return false;
        }
        switch (this._dragPart) {
            case Vr.x:
            case Vr.y:
                {
                    const r = this._manipulators.centerPointLocal;
                    r.z = i;
                    this._manipulators.centerPointLocal = r;
                }
                break;
            case Vr.z: {
                const r = this._manipulators.centerPointLocal;
                if (this._zSnapper) {
                    r.z = this._zSnapper.adjustHeight(t, r.z, DraggingStates.DRAGGING);
                    this._manipulators.centerPointLocal = r;
                }
            }
        }
        if ((this.redraw(this._dragPart, this._dragState), this._updatePositionHandler)) {
            const s = Matrix4.multiplyByPoint(this._manipulators.modelMatrix, this._manipulators.centerPointLocal, new Cartesian3());
            switch (this._dragPart) {
                case Vr.point:
                case Vr.x:
                case Vr.y:
                    this._updatePositionHandler(s, this._manipulators.angle, DraggingStates.DRAGGING);
                    this.redraw(this._dragPart, this._dragState);
                    break;
                case Vr.z:
                    this._updatePositionHandler(s, this._manipulators.angle, DraggingStates.DRAGGING);
            }
        }

        this._viewer.scene.requestRender();

        return true;
    }

    updateAngle(t, n) {
        if (this._manipulators) {
            const i = Matrix4.multiplyByPoint(this._manipulators.modelMatrix, this._manipulators.centerPointLocal, new Cartesian3());
            this.updatePosition(i, t);
            if (this._updatePositionHandler) {
                this._updatePositionHandler(i, t, n);
            }
        }
        this.redraw(Vr.angle, n !== DraggingStates.FINISHED ? DragStates.DRAGGING : DragStates.NONE);
    }

    get modelMatrix() {
        return this._manipulators.modelMatrix;
    }

    set modelMatrix(t) {
        this._manipulators.modelMatrix = t;
    }

    get invModelMatrix() {
        return this._manipulators.invModelMatrix;
    }

    get centerPoint() {
        return this._manipulators.centerPointLocal;
    }

    get zSnapper() {
        return this._zSnapper;
    }

    set zSnapper(t) {
        this._zSnapper = t;
    }

    dragAlongAxe(t, n) {
        const i = this._viewer.camera.getPickRay(t);
        const r = this._viewer.scene;
        let a;

        if (this._dragPart === Vr.point && this._trackingMode === TrackingModes.TERRAIN) {
            const shownPrimitives = this._manipulators.getVisiblePrimitives();

            shownPrimitives.forEach((primitive) => {
                primitive.show = false;
            });

            const c = getWorldPosition(r, n.endPosition, pickedPositionScratch);

            shownPrimitives.forEach((primitive) => {
                primitive.show = true;
            });

            if (!c) {
                console.error("Cannot find intersection with terrain");
                return;
            }

            a = Matrix4.multiplyByPoint(this._manipulators.invModelMatrix, c, Ste);
        } else if (this._dragPart === Vr.point && this._trackingMode === TrackingModes.TERRAIN_WITH_OBJECTS) {
            let c = getWorldPosition(r, n.endPosition, pickedPositionScratch);

            if (!c && i) {
                c = r.globe.pick(i, r);
            }

            if (!c) {
                console.error("Cannot find intersection with terrain or other object");
                return;
            }

            a = Matrix4.multiplyByPoint(this._manipulators.invModelMatrix, c, Ste);
        } else {
            let c = i ? utils.rayPlane(i, this._dragPlane) : undefined;

            if (!c) {
                console.error("Cannot get end plane point", this);
                return;
            }

            if (this._dragDiff) {
                c = Cartesian3.subtract(c, this._dragDiff, new Cartesian3());
            }

            const h = this._manipulators.invModelMatrix;
            const f = Matrix4.multiplyByPoint(h, this._startDragPoint, Ukt);
            const m = Matrix4.multiplyByPoint(h, c, Ste);
            const _ = Cartesian3.subtract(m, f, new Cartesian3());
            if (this._dragPart === Vr.x) a = new Cartesian3(_.x, 0, 0);
            else if (this._dragPart === Vr.y) a = new Cartesian3(0, _.y, 0);
            else if (this._dragPart === Vr.z) a = new Cartesian3(0, 0, _.z);
            else {
                if (this._dragPart !== Vr.point) {
                    console.error("Invalid drag part", this._dragPart);
                    return;
                }

                a = new Cartesian3(_.x, _.y, 0);
            }
        }
        if (!a) return;

        if (ctrlPressed(n, this._alwaysSnap)) {
            a = this._snappingManager.tryToSnap({
                centerPoint: a,
                modelMatrix: this._manipulators.modelMatrix
            });
        } else {
            this._snappingManager.endDrag();
        }

        this._manipulators.centerPointLocal = a;
        const l = Matrix4.multiplyByPoint(this._manipulators.modelMatrix, a, new Cartesian3());
        this._manipulators.distanceFromCamera = Cartesian3.distance(l, this._viewer.camera.position);
    }

    destroy() {
        this.removeLabels();
        if (this._cameraListenerRemoveCallback) this._cameraListenerRemoveCallback();
        this._viewer?.scene.primitives.remove(this._manipulators);
        this._manipulators = undefined;
        this.removeLabels();
        this._dragState = DragStates.NONE;
        this._dragPart = undefined;
        this._startDragPoint = undefined;
        this._lastScreenPoint = undefined;
        this._destroyed = true;
    }

    removeLabels() {
        this._distanceLabel?.destroy();
        this._distanceLabel = undefined;
    }

    updatePosition(t, n) {
        this._manipulators.angle = n;
        this._manipulators.distanceFromCamera = Cartesian3.distance(t, this._viewer.camera.position);
        this._manipulators.modelMatrix = Transforms.headingPitchRollToFixedFrame(t, new HeadingPitchRoll(n, 0, 0));
    }

    set trackingMode(t) {
        this._trackingMode = t;
    }

    get trackingMode() {
        return this._trackingMode;
    }

    set radius(t) {
        this._manipulators.radius = t;
    }

    set allowZEdit(t) {
        this._manipulators.showZAxe = t;
    }

    removeHighlight() {
        if (this._manipulators) {
            this._originalHighlight = this._manipulators.highlightedPart;
            this._manipulators.highlightedPart = undefined;
        } else {
            this._originalHighlight = undefined;
        }
    }

    setHighlighted(t) {
        for (const n of t)
            if (n.componentType === hz) {
                const i = TMe(n.componentIndex);
                if (i && this._manipulators) {
                    if (i !== this._originalHighlight) {
                        this._manipulators.highlightedPart = i;
                        this._viewer.scene.requestRender();
                    }
                    return true;
                }
            }
        return false;
    }

    pickedPart(t) {
        if (!t || !this._manipulators) return;

        const n = PickUtil.getPickedId(t, {
            idPrefix: this._manipulators.idPrefix,
            componentType: [hz]
        });

        return n ? TMe(n.componentIndex) : undefined;
    }

    handleCtrlAltShiftKeyChange(t) {
        if ((t.upOrDown === k_.DOWN || t.upOrDown === k_.UP) && this._dragState === DragStates.DRAGGING) {
            const prevMousePosition = this._eventHandler.previousMousePosition;

            if (prevMousePosition) {
                const i = (function (e) {
                    return {
                        altKey: false,
                        ctrlKey: false,
                        shiftKey: false,
                        drillPicked: undefined,
                        picked: undefined,
                        preventToolsDefault: false,
                        startPosition: e,
                        endPosition: e,
                        buttons: 0
                    };
                })(prevMousePosition);

                i.altKey = t.altKey;
                i.shiftKey = t.shiftKey;
                i.ctrlKey = t.ctrlKey;
                this.mouseMove(i);

                return true;
            }
        }
        return false;
    }
}
