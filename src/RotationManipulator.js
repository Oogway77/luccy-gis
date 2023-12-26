/* eslint-disable no-lonely-if */
import { Cartesian2, Cartesian3, defaultValue, HeadingPitchRoll, Matrix4, Math as CesiumMath, SceneTransforms, Transforms } from "cesium";

import { pickObject, MouseButton, DraggingStates, xw, EMe, dz, LabelAlignments, hz, DimensionLabelTypes } from "./common";
import { RotationPrimitive } from "./RotationPrimitive";
import { RotationCircleManipulator } from "./RotationCircleManipulator";
import { PickUtil } from "./PickUtil";
import { DimensionLabel } from "./DimesionLabel";
import { PMe } from "./dummyClasses";

function Sk(e, t, n, i, r, a, s) {
    const {
        position: l,
        align: c,
        offset: h
    } = (function (e1, t1, n1, i1) {
        const r1 = e1.scene;
        const a1 = t1;
        const s1 = SceneTransforms.wgs84ToWindowCoordinates(r1, n1);
        const l1 = Matrix4.multiplyByPoint(a1, i1, new Cartesian3());
        const c1 = SceneTransforms.wgs84ToWindowCoordinates(r1, l1);
        let h1;
        let f;
        let m;

        if (c1.x > s1.x) {
            h1 = LabelAlignments.leading;
            f = 20;
            m = c1.y > s1.y ? 30 : -50;
        } else {
            h1 = LabelAlignments.trailing;
            f = -20;
            m = c1.y > s1.y ? 30 : -50;
        }

        return { align: h1, offset: new Cartesian2(f, m), position: l1 };
    })(r, n, e, i);

    let f = (function (e2) {
        let t2 = CesiumMath.toDegrees(e2);

        if (Math.abs(t2) % 180 === 0) {
            t2 = Math.abs(t2);
        }

        const n2 = navigator.languages?.length ? navigator.languages[0] : navigator.language;

        return Intl.NumberFormat(n2, {
            minimumIntegerDigits: 1,
            maximumFractionDigits: 0
        }).format(t2);
    })(t);

    f = `${f}\xb0`;

    if (s) {
        s.cesiumPosition = l;
        s.alignment = c;
        s.offset = h;
        s.text = f;
    } else {
        // eslint-disable-next-line no-param-reassign
        s = new DimensionLabel({
            type: DimensionLabelTypes.TEXT,
            position: l,
            alignment: c,
            offset: h,
            text: f,
            labelService: a
        });
    }

    return s;
}

export class RotationManipulator {
    constructor(options) {
        this.viewer = options.viewer;
        this.alwaysSnap = options.alwaysSnap;
        this.onAngleChange = options.onAngleChange;
        this.onUpdatePosition = options.onUpdatePosition;
        this._labelService = options.labelService;
        this._baseAngle = defaultValue(options.baseAngle, 0);
        const n = this.viewer.scene;
        const i = this._baseAngle + options.angle;
        const r = Transforms.headingPitchRollToFixedFrame(options.centerPoint, new HeadingPitchRoll(i));
        this.rotationPrimitive = new RotationPrimitive({
            entityId: options.id,
            centerPoint: options.centerPoint,
            angle: i,
            height: options.height ?? 0,
            modelMatrix: r,
            radius: options.radius,
            color: options.color,
            showAngle: false,
            showDegrees: false
        });
        n.primitives.add(this.rotationPrimitive);
        n.requestRender();
    }

    destroy() {
        this.viewer.scene.primitives.remove(this.rotationPrimitive);
        this._label?.destroy();
        this._label = undefined;
    }

    get angle() {
        return this.rotationPrimitive.angle - this._baseAngle;
    }

    get baseAngle() {
        return this._baseAngle;
    }

    get centerPoint() {
        return this.rotationPrimitive.centerPoint;
    }

    setCenterPointAndAngle(t, n) {
        this.rotationPrimitive.centerPoint = t;
        const i = this._baseAngle + n;
        this.rotationPrimitive.angle = i;
        this.rotationPrimitive.modelMatrix = Transforms.headingPitchRollToFixedFrame(t, new HeadingPitchRoll(i));
    }

    set radius(t) {
        this.rotationPrimitive.radius = t;
    }

    handleClick(t) {
        const n = pickObject(t, this.viewer);
        return PickUtil.isPickedPartOfEntity({
            picked: n,
            prefix: this.rotationPrimitive.entityId,
            componentType: xw
        });
    }

    mouseDown(t) {
        if (t.button !== MouseButton.LEFT || t.shiftKey || t.altKey) return false;
        const n = pickObject(t, this.viewer);
        const i = PickUtil.getComponentIndex({
            picked: n,
            idPrefix: this.rotationPrimitive.entityId,
            componentType: [xw, hz]
        });
        if (i === dz) {
            const r = this.rotationPrimitive.modelMatrix;
            const a = new Cartesian3(0, 0, this.rotationPrimitive.height);
            const s = Matrix4.multiplyByPoint(r, a, new Cartesian3());

            this.manipulator = new RotationCircleManipulator({
                centerPoint: s,
                scene: this.viewer.scene,
                startMousePosition: t.position,
                angle: this.rotationPrimitive.angle,
                alwaysSnap: this.alwaysSnap,
                onAngleChange: (l, c) => {
                    this.updateAngle(l, c);
                }
            });
            this.manipulator.mouseDown(t);
            return true;
        }
        if (i === EMe || i === "point") {
            const r = this.viewer.scene.pickPosition(t.position);
            this.manipulator = new PMe({
                centerPoint: this.centerPoint,
                scene: this.viewer.scene,
                startDragPoint: r,
                snapToTerrain: false,
                moveHandler: (a, s) => {
                    this.updatePosition(a, s);
                }
            });
            this.manipulator.mouseDown(t);

            return true;
        }
        return false;
    }

    mouseMove(t) {
        return !!this.manipulator && this.manipulator.mouseMove(t);
    }

    // eslint-disable-next-line consistent-return
    mouseUp(t) {
        if (this.manipulator) {
            this.manipulator.mouseUp(t);
            this.manipulator = undefined;
            return true;
        }
    }

    removeHighlight() {
        if (this.rotationPrimitive.highlightRotate) {
            this.rotationPrimitive.highlightRotate = false;
            this.viewer.scene.requestRender();
        }
    }

    setHighlighted(t) {
        if (t.length === 1) {
            const n = t[0];
            if (n.componentType === xw && n.componentIndex === dz) {
                this.rotationPrimitive.highlightRotate = true;
                this.viewer.scene.requestRender();
                return true;
            }
        }
        return false;
    }

    updateAngle(t, n) {
        let i = t;
        const r = i < 0 ? -1 : 1;

        if (Math.abs(i) > CesiumMath.PI) {
            i = r * (Math.abs(i) - CesiumMath.TWO_PI);
        }

        this.rotationPrimitive.angle = i;
        const a = Transforms.headingPitchRollToFixedFrame(this.rotationPrimitive.centerPoint, new HeadingPitchRoll(i));
        this.rotationPrimitive.modelMatrix = a;

        if (n !== DraggingStates.FINISHED && this.manipulator instanceof RotationCircleManipulator) {
            this._label = Sk(
                this.centerPoint,
                i,
                this.rotationPrimitive.modelMatrix,
                new Cartesian3(this.rotationPrimitive.radius, 0, 0),
                this.viewer,
                this._labelService,
                this._label
            );
        } else {
            this._label?.destroy();
            this._label = undefined;
        }

        this.onAngleChange(this.rotationPrimitive.angle - this._baseAngle, n);

        if (n === DraggingStates.BEGIN) {
            this.rotationPrimitive.showAngle = true;
            this.rotationPrimitive.showDegrees = true;
        } else {
            if (n === DraggingStates.FINISHED) {
                this.rotationPrimitive.showAngle = false;
                this.rotationPrimitive.showDegrees = false;
            }
        }

        this.viewer.scene.requestRender();
    }

    updatePosition(t, n) {
        this.rotationPrimitive.centerPoint = t;
        const r = Transforms.headingPitchRollToFixedFrame(t, new HeadingPitchRoll(this.rotationPrimitive.angle));
        this.rotationPrimitive.modelMatrix = r;
        this.onUpdatePosition(t, n);
    }
}
