/* eslint-disable no-lonely-if */
/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
/* eslint-disable default-case */
import {
    Cartesian2,
    Cartesian3,
    Color,
    Ellipsoid,
    HeadingPitchRoll,
    Matrix4,
    Plane,
    PointPrimitive,
    PointPrimitiveCollection,
    Transforms
} from "cesium";

import {
    DragStates,
    PickGroups,
    H_,
    pickObject,
    PointCategories,
    utils,
    DraggingStates,
    calcCenterPoint,
    isSamePosition,
    ga,
    drillPick,
    getClickPixelTolerance,
    KC
} from "./common";

const O2 = "vertex-points";
const fz = "middle-points";
const Gkt = Color.BLACK.withAlpha(0.5);
const zkt = Color.BLACK;
const pz = Color.WHITE.withAlpha(0.5);

const qIe = KC.brighten(0.3, new Color());
const IMe = qIe;
const qkt = KC;
const Ite = Color.WHITE.withAlpha(0.9);
const MMe = qIe;
const Qkt = KC;

export class PointsManipulators {
    constructor(options) {
        this._dragState = DragStates.NONE;
        this._adjustZ = 0;
        this._updatedGroundPoints = false;
        this._mouseDownScreenPoint = new Cartesian2();
        this.id = options.id;
        this.subcomponentPrefix = options.subcomponentPrefix ? `${options.subcomponentPrefix}-` : "";
        this.vertexComponentId = `${this.subcomponentPrefix}${O2}`;
        this.middleComponentId = `${this.subcomponentPrefix}${fz}`;
        this.viewer = options.viewer;
        this._onUpdatePoint = options.onUpdatePoint;
        this._onDeletePoint = options.onDeletePoint;
        this._centerPoint = options.centerPoint;
        this._height = options.height;
        this._adjustZ = options.adjustZ;
        this._angle = options.angle;
        this._groundPoints = options.groundPoints;
        this.createPrimitives();
    }

    createPrimitives() {
        const { modelMatrix: t } = this;
        this.vertexPoints = new PointPrimitiveCollection({ modelMatrix: t });
        this.vertexPoints.pickGroup = PickGroups.EDGES_DISABLED;
        this.viewer.scene.primitives.add(this.vertexPoints);
        this.sidePoints = new PointPrimitiveCollection({ modelMatrix: t });
        this.sidePoints.pickGroup = PickGroups.EDGES_DISABLED;
        this.viewer.scene.primitives.add(this.sidePoints);

        for (let n = 0; n < this._groundPoints.length; ++n) {
            const i = this._groundPoints[n].clone();
            i.z += this._height + this._adjustZ;

            H_(this.vertexPoints, {
                id: `${this.id}:${this.vertexComponentId}:${n}`,
                position: i,
                color: Ite,
                outlineColor: Color.BLACK,
                pixelSize: 10
            });

            const a = this._groundPoints[n === this._groundPoints.length - 1 ? 0 : n + 1].clone();
            a.z += this._height + this._adjustZ;
            const s = new Cartesian3();

            s.x = i.x + (a.x - i.x) / 2;
            s.y = i.y + (a.y - i.y) / 2;
            s.z = i.z + (a.z - i.z) / 2;

            H_(this.sidePoints, {
                id: `${this.id}:${this.middleComponentId}:${n}`,
                position: s,
                color: pz,
                outlineColor: Color.BLACK.withAlpha(0.5),
                pixelSize: 10
            });
        }
    }

    removePrimitives() {
        if (this.vertexPoints) {
            this.viewer.scene.primitives.remove(this.vertexPoints);
        }
        if (this.sidePoints) {
            this.viewer.scene.primitives.remove(this.sidePoints);
        }
        this.vertexPoints = undefined;
        this.sidePoints = undefined;
    }

    setGroundPoints(t) {
        this.removePrimitives();
        this._groundPoints = [...t];
        this.createPrimitives();
    }

    destroy() {
        this.removePrimitives();
    }

    get angle() {
        return this._angle;
    }

    set angle(t) {
        if (t !== this._angle) {
            this._angle = t;
            const n = this.modelMatrix;

            if (this.vertexPoints) {
                this.vertexPoints.modelMatrix = n;
            }

            if (this.sidePoints) {
                this.sidePoints.modelMatrix = n;
            }

            this.destroy();
            this.createPrimitives();
            this.viewer.scene.requestRender();
        }
    }

    get modelMatrix() {
        return Transforms.headingPitchRollToFixedFrame(this._centerPoint, new HeadingPitchRoll(this._angle, 0, 0));
    }

    set centerPoint(t) {
        if (t.equals(this._centerPoint) === false) {
            this._centerPoint = t;
            const n = this.modelMatrix;

            if (this.vertexPoints) {
                this.vertexPoints.modelMatrix = n;
            }

            if (this.sidePoints) {
                this.sidePoints.modelMatrix = n;
            }

            this.destroy();
            this.createPrimitives();
            this.viewer.scene.requestRender();
        }
    }

    get groundPoints() {
        return this._groundPoints;
    }

    set groundPoints(t) {
        const n = this._groundPoints;
        this._groundPoints = [...t];
        this._updatedGroundPoints = true;

        if (
            n.length !== this._groundPoints.length ||
            this._groundPoints.length !== this.vertexPoints?.length ||
            this._groundPoints.length !== this.sidePoints?.length
        ) {
            this.destroy();
            this.createPrimitives();
        } else
            for (let i = 0; i < this._groundPoints.length; ++i) {
                const r = this._groundPoints[i].clone();
                r.z += this._height + this._adjustZ;
                this.vertexPoints.get(i).position = r;
                const s = this._groundPoints[i === this._groundPoints.length - 1 ? 0 : i + 1].clone();
                s.z += this._height + this._adjustZ;
                const l = new Cartesian3(r.x + (s.x - r.x) / 2, r.y + (s.y - r.y) / 2, r.z + (s.z - r.z) / 2);
                this.sidePoints.get(i).position = l;
            }
    }

    setCenterPointAndAngle(t, n) {
        this._centerPoint = t;
        this._angle = n;
        const i = this.modelMatrix;

        if (this.sidePoints) {
            this.sidePoints.modelMatrix = i;
        }
        if (this.vertexPoints) {
            this.vertexPoints.modelMatrix = i;
        }

        this.destroy();
        this.createPrimitives();
    }

    set height(t) {
        this._height = t;
        this.destroy();
        this.createPrimitives();
    }

    set adjustZ(t) {
        this._adjustZ = t;
        this.destroy();
        this.createPrimitives();
    }

    mouseDown(event, pointIndex) {
        if (!event.position) {
            console.error("Cannot obtain event position", event.position);
            return false;
        }

        let i;
        this._mouseDownScreenPoint = event.position;

        if (Number.isFinite(pointIndex?.index)) i = pointIndex;
        else {
            const a = pickObject(event, this.viewer);
            i = this.pickedIndex(a);
        }

        let ret = false;

        if (i) {
            switch (
                ((this._highlightPointIndex = i.index),
                (this._highlightPointType = i.type),
                (this.draggingPointIndex = i.index),
                (this.draggingPointType = i.type),
                this._highlightPointType)
            ) {
                case PointCategories.VERTEX_POINT:
                    if (this.vertexPoints) {
                        this.vertexPoints.get(i.index).color = Qkt;
                    }
                    break;
                case PointCategories.SIDE_POINT:
                    if (this.sidePoints) {
                        this.sidePoints.get(i.index).color = qkt;
                    }
            }

            this.beginDrag(i, event.position);
            this.viewer.scene.requestRender();
            this._dragState = DragStates.DRAGGING;

            ret = true;
        } else {
            this._highlightPointIndex = undefined;
            this._highlightPointType = undefined;
        }

        return ret;
    }

    mouseMove(t) {
        if (this._dragState !== DragStates.DRAGGING) {
            const m = pickObject(t, this.viewer);
            this.updateHighlightedPart(t.endPosition, m);
            return false;
        }

        const i = this.viewer.camera.getPickRay(t.endPosition);
        let r = i ? utils.rayPlane(i, this._dragPlane) : undefined;

        if (!r) return false;

        if (this._dragDiff) {
            r = Cartesian3.subtract(r, this._dragDiff, new Cartesian3());
        }

        const s = Matrix4.inverse(this.modelMatrix, new Matrix4());
        let l = Matrix4.multiplyByPoint(s, r, new Cartesian3());
        this._updatedGroundPoints = false;
        const c = l.z;
        const h = new Cartesian3(l.x, l.y, 0);
        const f = this._onUpdatePoint(this.draggingPointType, this.draggingPointIndex, h, DraggingStates.DRAGGING);

        if (f) {
            l = f;
            l.z = c;
        }

        if (this._updatedGroundPoints) {
            this._updatedGroundPoints = false;
        } else
            switch (this.draggingPointType) {
                case PointCategories.VERTEX_POINT:
                    if (this.vertexPoints && this.sidePoints) {
                        this.vertexPoints.get(this.draggingPointIndex).position = l;
                        const m = this.draggingPointIndex === 0 ? this._groundPoints.length - 1 : this.draggingPointIndex - 1;
                        const v = calcCenterPoint([l, this.vertexPoints.get(m).position]);
                        this.sidePoints.get(m).position = v;
                        const b = calcCenterPoint([
                            l,
                            this.vertexPoints.get(
                                this.draggingPointIndex === this._groundPoints.length - 1 ? 0 : this.draggingPointIndex + 1
                            ).position
                        ]);
                        this.sidePoints.get(this.draggingPointIndex).position = b;
                    }
                    break;
                case PointCategories.SIDE_POINT:
                    if (this.sidePoints) {
                        this.sidePoints.get(this.draggingPointIndex).position = l;
                    }
            }

        this.viewer.scene.requestRender();

        return true;
    }

    mouseUp(event) {
        if (event.altKey) {
            const n = getClickPixelTolerance(this.viewer);
            if (isSamePosition(this._mouseDownScreenPoint, event.position, n) && event.position.equals(this._mouseDownScreenPoint)) {
                const r = drillPick(event, this.viewer);
                const a = this.drillIndex(r);

                if (a) {
                    this.handleDeleteMouseDown(a);
                    this.endDnD();
                    return true;
                }
            }
        }

        if (this._dragState === DragStates.DRAGGING) {
            const n = this.viewer.camera.getPickRay(event.position);
            let i = n ? utils.rayPlane(n, this._dragPlane) : undefined;

            if (i) {
                if (this._dragDiff) {
                    i = Cartesian3.subtract(i, this._dragDiff, new Cartesian3());
                }

                const a = Matrix4.inverse(this.modelMatrix, new Matrix4());
                const l = Matrix4.multiplyByPoint(a, i, new Cartesian3()).clone();

                l.z = 0;
                this._onUpdatePoint(this.draggingPointType, this.draggingPointIndex, l, DraggingStates.FINISHED);
            }

            this.endDnD();

            return true;
        }
        return false;
    }

    endDnD() {
        this._dragPlane = undefined;
        this._dragState = DragStates.NONE;
        this._startDragPoint = undefined;
        this.draggingPointIndex = undefined;
        this._highlightPointIndex = undefined;
        this._highlightPointType = PointCategories.VERTEX_POINT;

        if (this.vertexPoints) {
            this.viewer.scene.primitives.remove(this.vertexPoints);
        }

        if (this.sidePoints) {
            this.viewer.scene.primitives.remove(this.sidePoints);
        }

        this.createPrimitives();
        this._highlightPointIndex = undefined;
        this._highlightPointType = undefined;
        this.viewer?.scene.requestRender();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateHighlightedPart(t, n) {}
    pickedIndex(t) {
        if (t) {
            let n;

            if (t.id) {
                n = t.id;
            } else {
                if (t.primitive) {
                    n = t.primitive.id;
                } else {
                    n = undefined;
                }
            }

            if (t.primitive instanceof PointPrimitive && (0, ga.Z)(n) && n.startsWith(this.id)) {
                const i = n.split(":");
                const r = i[i.length - 2];
                const a = parseInt(i[i.length - 1], 10);
                if (r === this.middleComponentId) return Number.isFinite(a) ? { index: a, type: PointCategories.SIDE_POINT } : undefined;
                if (r === this.vertexComponentId) return Number.isFinite(a) ? { index: a, type: PointCategories.VERTEX_POINT } : undefined;
            }
        }
    }

    drillIndex(t) {
        for (const n of t) {
            const i = this.pickedIndex(n);
            if (i) return i;
        }
    }

    beginDrag(pointInfo, screenPosition) {
        let i;
        if (pointInfo.type === PointCategories.SIDE_POINT && this.sidePoints) i = this.sidePoints.get(pointInfo.index).position.clone();
        else {
            if (pointInfo.type !== PointCategories.VERTEX_POINT || !this.vertexPoints)
                throw new Error(`Unknown point type: ${pointInfo.type}`);
            i = this.vertexPoints.get(pointInfo.index).position.clone();
        }

        this._onUpdatePoint(pointInfo.type, pointInfo.index, i, DraggingStates.BEGIN);
        this._startDragPoint = Matrix4.multiplyByPoint(this.modelMatrix, i, new Cartesian3());
        this._dragPlane = Plane.fromPointNormal(this._startDragPoint, Ellipsoid.WGS84.geodeticSurfaceNormal(this._startDragPoint));
        const s = this.viewer.camera.getPickRay(screenPosition);
        const l = utils.rayPlane(s, this._dragPlane);
        this._dragDiff = Cartesian3.subtract(l, this._startDragPoint, new Cartesian3());
    }

    handleDeleteMouseDown(t) {
        let n = false;

        if (t.type === PointCategories.VERTEX_POINT) {
            if (this._groundPoints.length > 3) {
                this._onDeletePoint(t.index);
                this._highlightPointIndex = undefined;
                this._highlightPointType = undefined;
                this.destroy();
                this.createPrimitives();
                this.viewer.scene.requestRender();
            }

            n = true;
        }

        return n;
    }

    pickPointIndexFromDrill(t) {
        for (const n of t) {
            const i = this.pickedIndex(n);
            if (i) return i;
        }
    }

    removeHighlight() {
        if (this._highlightPointType) {
            switch (this._highlightPointType) {
                case PointCategories.VERTEX_POINT:
                    if (this.vertexPoints) {
                        this.vertexPoints.get(this._highlightPointIndex).color = Ite;
                    }
                    break;
                case PointCategories.SIDE_POINT:
                    if (this.vertexPoints && this.sidePoints) {
                        this.sidePoints.get(this._highlightPointIndex).color = pz;
                        this.sidePoints.get(this._highlightPointIndex).outlineColor = Gkt;
                    }
            }

            this.viewer.scene.requestRender();
        }

        this._highlightPointIndex = undefined;
        this._highlightPointType = undefined;
    }

    setHighlighted(t) {
        const n = t.filter((i) => i.componentType === this.vertexComponentId || i.componentType === this.middleComponentId);
        if (n.length > 0) {
            const i = n[0];
            const r = i.componentIndex;
            const a = i.componentType === this.vertexComponentId ? PointCategories.VERTEX_POINT : PointCategories.SIDE_POINT;
            switch (((this._highlightPointIndex = r), (this._highlightPointType = a), this._highlightPointType)) {
                case PointCategories.VERTEX_POINT:
                    if (this.vertexPoints) {
                        this.vertexPoints.get(r).color = MMe;
                    }
                    break;
                case PointCategories.SIDE_POINT:
                    if (this.vertexPoints && this.sidePoints) {
                        this.sidePoints.get(r).color = IMe;
                        this.sidePoints.get(r).outlineColor = zkt;
                    }
            }

            this.viewer.scene.requestRender();

            return true;
        }
        return false;
    }
}
