/* eslint-disable complexity */
/* eslint-disable no-lonely-if */
/* eslint-disable no-restricted-syntax */
/* eslint-disable consistent-return */
/* eslint-disable max-classes-per-file */

import {
    Cartographic,
    Cartesian2,
    Cartesian3,
    Color,
    DeveloperError,
    Ellipsoid,
    HeadingPitchRoll,
    Matrix4,
    Math as CesiumMath,
    Plane,
    Primitive,
    Transforms
} from "cesium";

import { AbstractTool } from "./AbstractTool";

import {
    toolIds,
    DragStates,
    TrackingModes,
    pickObject,
    MouseButton,
    getFinitePositions,
    k_,
    Axes,
    LineInfo,
    removeDuplicatedPositions,
    Rc,
    PointCategories,
    ctrlPressed,
    DraggingStates,
    utils,
    getPlane,
    drillPick,
    ga,
    EntityTypes,
    eMe
} from "./common";
import { AxisManipulators } from "./AxisManipulators";
import { DimensionController } from "./DimensionController";
import { HeightSnapper } from "./HeightSnapper";
import { Lines } from "./Lines";
import { PointsManipulators } from "./PointsManipulators";
import { Polygon3D } from "./Polygon3D";
import { RotationManipulator } from "./RotationManipulator";
import { SnappingCalculator } from "./SnappingCalculator";
import { SnappingManager } from "./SnappingManager";
import { VolumeLabel } from "./VolumeLabel";
import { Building, GroundLine, GroundPolygon } from "./dummyClasses";

function kMe(e) {
    const t = e.entity;
    const n = e.baseFloor ? e.baseFloor.index : e.baseFloorIndex;
    if (n == null) throw new DeveloperError("Canot convert floor to snappable object. Unknown floor index.");
    const i = e.baseFloor ?? t.floors[n];
    let r = n + 1;
    for (; r < t.floors.length && !t.floors[r].groundPoints; ) r += 1;
    let a = 0;
    for (let c = n; c < r; c += 1) a += t.floors[c].height;
    return {
        id: t.id,
        idPrefix: t.idPrefix,
        groundPoints: i.groundPoints,
        type: EntityTypes.BUILDING,
        modelMatrix: i.globalModelMatrix,
        adjustZ: t.adjustZ,
        floorIndex: n,
        isBox: i.isBox,
        floorsCount: r - n,
        height: a
    };
}

function cUt(e) {
    return {
        id: e.id,
        idPrefix: e.idPrefix,
        groundPoints: e.groundPoints,
        isBox: e.isBox,
        adjustZ: e.adjustZ,
        modelMatrix: e.modelMatrix,
        type: e.type,
        height: e.height
    };
}

function nI(e) {
    return {
        id: e.id,
        idPrefix: e.idPrefix,
        groundPoints: e.groundPoints,
        isBox: false,
        height: 0,
        adjustZ: 0,
        type: e.type,
        modelMatrix: e.modelMatrix
    };
}

function Ote(e) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const t = e.tools.entitiesList
        .filter((n) => e.exceptId == null || (e.exceptId != null && n.id !== e.exceptId))
        .map((n) => {
            let i = [];

            if (n instanceof Polygon3D) {
                i = [cUt(n)];
            } else {
                if (n instanceof GroundPolygon || n instanceof GroundLine) {
                    i = [nI(n)];
                } else {
                    if (n instanceof Building) {
                        i = (function (e1) {
                            const t1 = [];
                            let n1 = 0;
                            const i1 = new Set();
                            for (
                                e1.mShape.selectedFloorIndexes.forEach((r) => {
                                    const a = e1.findBaseFloor(r);
                                    i1.add(a.index);
                                });
                                n1 < e1.floors.length;

                            ) {
                                if (i1.has(n1) === false) {
                                    const a = kMe({ entity: e1, baseFloorIndex: n1 });
                                    t1.push(a);
                                }
                                n1 = e1.findBlockTopFloor(n1).index + 1;
                            }
                            return t1;
                        })(n);
                    }
                }
            }

            return i;
        });

    // ???
    // return lUt(t);

    return [];
}

function hu() {}

const kIe = 2 * Math.PI;
function UIe(e) {
    return e - kIe * Math.floor((e + Math.PI - 0) / kIe);
}

function b2(e) {
    let t = Number.MAX_VALUE;
    let n = Number.MAX_VALUE;
    let i = Number.MAX_VALUE;
    let r = Number.MIN_VALUE;
    let a = Number.MIN_VALUE;
    let s = Number.MIN_VALUE;

    e.forEach((l) => {
        t = Math.min(t, l.x);
        r = Math.max(r, l.x);
        n = Math.min(n, l.y);
        a = Math.max(a, l.y);
        i = Math.min(i, l.z);
        s = Math.max(s, l.z);
    });

    return new Cartesian3(r - t, a - n, s - i);
}

function KD(e, t = 1e-9) {
    if (e.length !== 4) {
        return false;
    }

    const n = e.map((i, r) => Cartesian3.subtract(e[(r + 1) % e.length], i, new Cartesian3()));

    return n.every((i, r) => CesiumMath.equalsEpsilon(Cartesian3.angleBetween(i, n[(r + 1) % n.length]), CesiumMath.PI_OVER_TWO, 0, t));
}

class Polygon3DEditBaseTool extends AbstractTool {
    constructor(type, entityType, cesiumTools) {
        super(type, cesiumTools);
        this._sampleTerrainCounter = 0;
        this._entityType = entityType;
    }

    onDestroy() {
        super.onDestroy();
        this.destroyManipulators();
    }

    mouseDown(t) {
        return !(!this._axisManipulators?.mouseDown(t) && !this._rotateManip?.mouseDown(t));
    }

    mouseMove(t) {
        return !(!this._axisManipulators?.mouseMove(t) && !this._rotateManip?.mouseMove(t));
    }

    mouseUp(t) {
        return !(!this._axisManipulators?.mouseUp(t) && !this._rotateManip?.mouseUp(t));
    }

    get selectedEntity() {
        return this._selectedEntity;
    }

    set selectedEntity(entity) {
        if (entity instanceof this._entityType) {
            this.deselectEntity();
            this.cancelTool();
            this._selectedEntity = entity;

            if (entity) {
                entity.selected = true;
            }

            if (this.cesiumTools.editShapeAllowed) {
                this.createManipulators();
            }
            this.createOrUpdateVolumeLabel();
            this.afterSettingEntity();
        } else {
            console.error(`Passing invalid ToolEntity type to ManipulatorsTool: ${entity}`);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    afterSettingEntity() {}
    deselectEntity() {
        if (this._selectedEntity) {
            this._selectedEntity.selected = false;
            this._selectedEntity = undefined;
        }

        this.destroyManipulators();
    }

    handleClick(t) {
        return !!this._rotateManip?.handleClick(t) || super.handleClick(t);
    }

    createManipulators() {
        if ((this.destroyManipulators(), !this._selectedEntity)) return;
        const t = Transforms.headingPitchRollToFixedFrame(
            this._selectedEntity.centerPoint,
            new HeadingPitchRoll(this._selectedEntity.angle, 0, 0)
        );
        const i = this._selectedEntity.idPrefix;
        const r = new AxisManipulators({
            id: i,
            angle: this._selectedEntity.angle,
            radius: 1.4 * this._selectedEntity.boundingSphere.radius,
            modelMatrix: t,
            viewer: this.viewer,
            trackingMode: this._selectedEntity.snapToTerrain ? TrackingModes.TERRAIN : TrackingModes.PLANE,
            angleConfig: undefined,
            xyConfig: {
                // visible: !(this._selectedEntity instanceof Building),
                visible: true,
                showArrow: false,
                editable: false
            },
            zConfig: {
                editable: true,
                showArrow: true,
                width: 20,
                visible: !this._selectedEntity.snapToTerrain
            },
            pointConfig: {
                visible: true,
                editable: true,
                // size: this._selectedEntity instanceof Building ? 5 : 10
                size: 10
            },
            updatePositionHandler: (s, l, c) => {
                this.onUpdatePosition(s, l, c);
            },
            labelsService: this.cesiumTools.labelService,
            eventHandler: this.cesiumTools.eventHandler,
            snapSettings: () => this.snapSettings
        });

        this._axisManipulators = r;
        const a = this.doCalculateRadius();

        this._rotateManip = new RotationManipulator({
            id: i,
            viewer: this.viewer,
            centerPoint: this._selectedEntity.centerPoint,
            angle: this._selectedEntity.angle,
            radius: a,
            color: new Color(55 / 255, 137 / 255, 242 / 255, 0.25),
            labelService: this.cesiumTools.labelService,
            alwaysSnap: this.snapSettings.alwaysSnap,
            onAngleChange: (s, l) => {
                this.onUpdateAngle(s, l);
            },
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            onUpdatePosition: (s, l) => {}
        });

        this.viewer.scene.requestRender();
    }

    destroyManipulators() {
        this._axisManipulators?.destroy();
        this._axisManipulators = undefined;
        this._rotateManip?.destroy();
        this._rotateManip = undefined;
    }

    updateManipulators() {
        this.updateAxisManipulator();
    }

    updateAxisManipulator() {
        if (this._axisManipulators && this._selectedEntity) {
            this._axisManipulators.radius = 1.4 * this._selectedEntity.boundingSphere.radius;
            this._axisManipulators.trackingMode = this._selectedEntity.snapToTerrain ? TrackingModes.TERRAIN : TrackingModes.PLANE;
            this._axisManipulators.allowZEdit = !this._selectedEntity.snapToTerrain;
            const n = this._selectedEntity.angle;
            const { centerPoint: i } = this._selectedEntity;
            this._axisManipulators.updatePosition(i, n);
            this._axisManipulators.redraw(this._axisManipulators.dragPart, this._axisManipulators.dragState);
            this.viewer.scene.requestRender();
        }
    }

    updateRotationManipulator() {
        const t = this._selectedEntity;

        if (this._rotateManip && t) {
            this._rotateManip.radius = this.doCalculateRadius();
            this._rotateManip.setCenterPointAndAngle(t.centerPoint, t.angle);
        }
    }

    onUpdatePosition(t, n, i) {
        if (!this._selectedEntity) return;
        let r;

        if (this._selectedEntity.parent) {
            r = this._selectedEntity.parent.flatEntitiesTree;
            this._selectedEntity.parent.setCenterPointAndAngleRad(t, n);
        } else {
            r = this._selectedEntity.flatEntitiesTree;
            this._selectedEntity.setCenterPointAndAngleRad(t, n);
        }

        this.createOrUpdateVolumeLabel();
        this.updateRotationManipulator();

        if (i === DraggingStates.FINISHED) {
            this.cesiumTools.entitiesUpdated(r);
        }
    }

    onUpdateAngle(t, n) {
        this.onUpdatePosition(this._selectedEntity.centerPoint, t, n);
    }

    onEntityUpdated(t, n) {
        if (t === this._selectedEntity) {
            this.updateManipulators();
            this.viewer.scene.requestRender();
            if (n.snapToTerrain) {
                this.doSnapToTerrain();
            }

            this.createOrUpdateVolumeLabel();
        }
    }

    doSnapToTerrain() {
        const t = this._selectedEntity;
        if (!t) return;
        this._sampleTerrainCounter += 1;
        const n = this._sampleTerrainCounter;
        const i = Ellipsoid.WGS84;
        const r = t.centerPoint;
        const { terrainProvider: a } = this.cesiumTools.viewer;
        const s = Cartographic.fromCartesian(r);
        hu(a, [s]).then(() => {
            if (this._sampleTerrainCounter === n) {
                const l = i.cartographicToCartesian(s);
                this._axisManipulators?.updatePosition(l, t.angle);
                this.onUpdatePosition(l, t.angle, DraggingStates.FINISHED);
            }
        });
    }

    pickSideIndexFromDrill(t) {
        for (const n of t) {
            const i = this.pickedSideIndex(n);
            if (Number.isFinite(i)) return i;
        }
    }

    pickedSideIndex(t) {
        if (t) {
            let n;

            if (t.id) {
                n = t.id;
            } else {
                n = t.primitive ? t.primitive.id : null;
            }

            if (t.primitive instanceof Primitive && (0, ga.Z)(n) && this._selectedEntity && n.startsWith(this._selectedEntity.idPrefix)) {
                const i = n.split(":");
                const r = parseInt(i[i.length - 1], 10);
                return Number.isFinite(r) ? r : undefined;
            }
        }
    }

    setHighlighted(t) {
        return !!this._rotateManip?.setHighlighted(t);
    }
}
export class Polygon3DEditTool extends Polygon3DEditBaseTool {
    constructor(cesiumTools) {
        super(toolIds.basic.polygonEdit, Polygon3D, cesiumTools);
        this._dragState = DragStates.NONE;
        this._wasBox = false;
        this._snappingManager = new SnappingManager({
            snapSettings: () => cesiumTools.snapping,
            viewer: cesiumTools.viewer
        });
        this._dimensionsController = new DimensionController(this.cesiumTools);
        cesiumTools.viewer.scene.screenSpaceCameraController.inertiaTranslate = 0;
    }

    afterSettingEntity() {
        if ((this._dimensionsController.setup(), !this._selectedEntity)) return;
        const t = [];
        this._dimensionsController.showDimensions({
            idPrefix: this._selectedEntity.idPrefix,
            groundPoints: this._selectedEntity.groundPoints,
            modelMatrix: this._selectedEntity.modelMatrix,
            height: this._selectedEntity.height,
            sideDimensions: t,
            showHeight: false,
            angle: t
        });
    }

    prepareSnappingManager() {
        this._savedGroundPoints = undefined;
        const t = this._selectedEntity;

        if (t) {
            const n = Ote({ exceptId: t.id, tools: this.cesiumTools });
            this._snappingManager.setup(t, n);
        } else this._snappingManager.setup(null, []);
    }

    onDestroy() {
        super.onDestroy();
        this.destroyManipulators();
        this._volumeLabel?.destroy();
        this._volumeLabel = undefined;
        this._dimensionsController.destroy();
        this.viewer.scene.screenSpaceCameraController.inertiaTranslate = 0.9;
    }

    cancelTool() {
        super.cancelTool();
        this.destroyManipulators();
        this._volumeLabel?.destroy();
        this._volumeLabel = undefined;
        this._dimensionsController.destroy();
    }

    createOrUpdateVolumeLabel() {
        const t = this._selectedEntity;

        if (this._selectedEntity?.rightMostTopPlanePoint && t) {
            if (!this._volumeLabel) {
                this._volumeLabel = new VolumeLabel({
                    labelService: this.cesiumTools.labelService,
                    viewer: this.viewer
                });
            }

            // (this._volumeLabel.text = this.cesiumTools.externalInterface.generateLabel(t)),
            this._volumeLabel.text = this.cesiumTools.labelGenerator.generateLabel(t);
            this._volumeLabel.modelMatrix = t.modelMatrix;
            this._volumeLabel.groundPoints = t.groundPoints;
            this._volumeLabel.height = t.adjustZ + t.height;
            this._volumeLabel.update();
        }
    }

    handleClick(t) {
        if (super.handleClick(t)) {
            return true;
        }

        const pickedObject = pickObject(t, this.viewer);

        if (pickedObject && this._selectedEntity) {
            const i = pickedObject.id ? pickedObject.id : pickedObject.primitive.id;
            if (typeof i === "string" && i.startsWith(this._selectedEntity.idPrefix)) return true;
        }

        return false;
    }

    handleDeleteKey() {
        if (this._selectedEntity) {
            this.cesiumTools.entitiesDeleted([this._selectedEntity]);
        }

        return true;
    }

    mouseDown(event) {
        if (!this._selectedEntity || this.cesiumTools.editShapeAllowed === false) {
            return false;
        }

        const pickedObjects = drillPick(event, this.viewer);

        if (super.mouseDown(event)) {
            return true;
        }

        if (this._pointsManipulators) {
            const pointIndex = this._pointsManipulators.pickPointIndexFromDrill(pickedObjects);

            if (this._pointsManipulators.mouseDown(event, pointIndex)) {
                return true;
            }
        }

        if (event.button !== MouseButton.LEFT || event.shiftKey || event.altKey) return false;

        const pickedSideIndex = this.pickSideIndexFromDrill(pickedObjects);

        if (Number.isFinite(pickedSideIndex)) {
            if (this._dragState === DragStates.DRAGGING) {
                this.cesiumTools.entitiesUpdated([this._selectedEntity]);
                this.endDnD();

                return true;
            }

            if (Number.isFinite(pickedSideIndex) && this.beginDrag(pickedSideIndex, event.position)) return true;
        }

        return false;
    }

    beginDrag(sideIndex, screenPosition) {
        if (!this._selectedEntity) return false;

        this._selectedEntity.setHighlightedSideIndex(sideIndex);
        const wall = this._selectedEntity.getWall(sideIndex);
        if (wall?.isGround) return false;

        if (wall) {
            this._dragSide = wall;
            this._dragState = DragStates.DRAGGING;
            this._startDragScreenPoint = screenPosition.clone();
            this._startEntityHeight = this._selectedEntity.height;

            const ellipsoid = Ellipsoid.WGS84;
            this._startDragPoint = this.viewer.scene.pickPosition(screenPosition);

            if (wall.isHorizontal) {
                this._dragPlane = getPlane(this._startDragPoint, screenPosition, this.viewer);
                const a = Cartographic.fromCartesian(this._startDragPoint, Ellipsoid.WGS84);
                const s = this._selectedEntity.groundPoints[0].clone();
                const l = Matrix4.multiplyByPoint(this._selectedEntity.modelMatrix, s, new Cartesian3());
                const c = Cartographic.fromCartesian(l, Ellipsoid.WGS84);
                a.height = c.height + this._selectedEntity.height;
                const h = Ellipsoid.WGS84.cartographicToCartesian(a);
                this._dragDiff = Cartesian3.subtract(this._startDragPoint, h, new Cartesian3());
            } else {
                this._dragPlane = Plane.fromPointNormal(this._startDragPoint, ellipsoid.geodeticSurfaceNormal(this._startDragPoint));
                this._dragDiff = undefined;
            }

            if (wall.isHorizontal) {
                this._dimensionsController.show({
                    modelMatrix: this._selectedEntity.modelMatrix,
                    points: this._selectedEntity.groundPoints,
                    showHeight: true,
                    height: this._selectedEntity.height
                });
            }

            this._savedGroundPoints = undefined;
            this.viewer.scene.requestRender();

            return true;
        }

        return false;
    }

    mouseMove(event) {
        if (this.cesiumTools.editShapeAllowed === false || !this._selectedEntity) return false;

        if (super.mouseMove(event)) return true;

        if (this._pointsManipulators?.mouseMove(event)) {
            this._snappingManager.redraw(this._selectedEntity);
            return true;
        }

        if (this._dragState !== DragStates.DRAGGING) return false;

        const ray = this.viewer.camera.getPickRay(event.endPosition);
        const r = ray ? utils.rayPlane(ray, this._dragPlane) : undefined;

        if (!r) return false;

        let a = true;

        if (this._dragSide?.isHorizontal) {
            const ctrl = ctrlPressed(event, this.snapSettings.alwaysSnap);

            if (this._startDragScreenPoint?.equals(event.endPosition)) {
                this._selectedEntity.height = this._startEntityHeight ?? 0;
            } else {
                a = this.moveUpWall(event, r, ctrl);
            }

            this._dimensionsController.show({
                height: this._selectedEntity.height,
                showHeight: true,
                modelMatrix: this._selectedEntity.modelMatrix,
                points: this._selectedEntity.groundPoints
            });
        }

        if (a !== false) {
            this.updateManipulators();
            this.createOrUpdateVolumeLabel();
            this.viewer.scene.requestRender();
        }

        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    moveUpWall(event, n, i) {
        if (this._dragDiff) {
            // eslint-disable-next-line no-param-reassign
            n = Cartesian3.subtract(n, this._dragDiff, new Cartesian3());
        }

        const a = Matrix4.inverse(this._selectedEntity.modelMatrix, new Matrix4());
        const s = Matrix4.multiplyByPoint(a, n, new Cartesian3());

        if (!s) {
            console.error("Inverted box point undefined");
            return false;
        }

        const heightSnapper = new HeightSnapper({
            entity: this._selectedEntity,
            snapSettings: () => this.snapSettings
        });

        s.z = heightSnapper.adjustHeight(event, s.z, DraggingStates.DRAGGING);

        if (s.z <= 0) {
            s.z = 0.1;
        }

        if (this._selectedEntity) {
            this._selectedEntity.height = s.z;
        }

        return true;
    }

    mouseUp(t) {
        if (!this._pointsManipulators?.mouseUp(t) && !super.mouseUp(t)) {
            if (this._dragState === DragStates.DRAGGING) {
                if (this._selectedEntity) {
                    if (this._startDragScreenPoint?.equals(t.position)) {
                        this._selectedEntity.height = this._startEntityHeight ?? 0;
                    }

                    this.cesiumTools.entitiesUpdated([this._selectedEntity]);
                }

                this.endDnD();
                return true;
            }
        }
    }

    endDnD() {
        this._dimensionsController.clear();
        this.updateManipulators();
        this._dragState = DragStates.NONE;
        this._dragPlane = undefined;
        this._startDragPoint = undefined;
        this._startDragScreenPoint = undefined;
        this._startEntityHeight = undefined;
        this.viewer?.scene.requestRender();
    }

    createManipulators() {
        if (this._selectedEntity) {
            super.createManipulators();

            this._pointsManipulators = new PointsManipulators({
                id: this._selectedEntity.idPrefix,
                groundPoints: this._selectedEntity.groundPoints,
                viewer: this.viewer,
                height: this._selectedEntity.height,
                adjustZ: this._selectedEntity.adjustZ,
                angle: this._selectedEntity.angle,
                centerPoint: this._selectedEntity.centerPoint,
                onUpdatePoint: (n, i, r, a) =>
                    a === DraggingStates.BEGIN ? this.onBeginDragPoint(n, i, r) : this.onDragPoint(n, i, r, a === DraggingStates.FINISHED),
                onDeletePoint: (n) => {
                    this.onDeletePoint(n);
                }
            });
        }
    }

    destroyManipulators() {
        super.destroyManipulators();
        this._pointsManipulators?.destroy();
        this._pointsManipulators = undefined;
    }

    updateManipulators() {
        if ((super.updateManipulators(), this._pointsManipulators && this._selectedEntity)) {
            this._pointsManipulators.height = this._selectedEntity.height;
            this._pointsManipulators.adjustZ = this._selectedEntity.adjustZ;
            const { centerPoint: t } = this._selectedEntity;
            const { angle: n } = this._selectedEntity;
            this._pointsManipulators.setCenterPointAndAngle(t, n);
            this._pointsManipulators.groundPoints = this._selectedEntity.groundPoints;
        }
        this.updateRotationManipulator();
    }

    onUpdatePosition(t, n, i) {
        const r = UIe(n);
        if ((super.onUpdatePosition(t, r, i), i === DraggingStates.BEGIN)) {
            const a = this._selectedEntity;

            if (a) {
                const s = this.cesiumTools.entitiesList.filter((l) => l.id !== a.id).filter((l) => l instanceof Polygon3D);
                this._axisManipulators?.snappingManager.setup(this.viewer, a, s);
            }
        } else {
            this._pointsManipulators?.setCenterPointAndAngle(t, r);
            this._dimensionsController.modelMatrix = this._selectedEntity.modelMatrix;
        }
    }

    onUpdateAngle(t, n) {
        super.onUpdateAngle(t, n);
        this._axisManipulators?.updatePosition(this._selectedEntity.centerPoint, t);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onEntityUpdated(entity, parameters) {
        if (entity === this._selectedEntity) {
            this.createOrUpdateVolumeLabel();
            this.updateManipulators();
            this.viewer.scene.requestRender();
        }
    }

    onBeginDragPoint(t, n, i) {
        if ((this.prepareSnappingManager(), this._selectedEntity)) {
            let r;
            if (t === PointCategories.SIDE_POINT) {
                const { groundPoints: a } = this._selectedEntity;
                const s = i.clone();
                s.z = 0;
                a.splice(n + 1, 0, s);
                this._selectedEntity.groundPoints = a;
                r = n + 1;
                this._selectedEntity.isBox = false;
                this._selectedEntity.dimensions = undefined;
            } else {
                r = n;
                this._startDragPoint = i;
            }

            this._dimensionsController.beginPointDragging([r], this._selectedEntity, true);
            this._wasBox = this._selectedEntity.isBox;
            this._savedGroundPoints = this._selectedEntity.groundPoints.map((a) => a.clone());
        }
    }

    onDragPoint(t, n, i, r) {
        let a;
        let s = i;
        let l = this._pointsManipulators.draggingPointIndex;
        if (!this._selectedEntity) return i;

        const c = [];
        this._selectedEntity.groundPoints.forEach((_) => {
            c.push(_.clone());
        });

        const h = ctrlPressed(this.cesiumTools.currentEvent, this.snapSettings.alwaysSnap);

        if (h === false) {
            this._snappingManager.endDrag();
        }

        if (t === PointCategories.VERTEX_POINT) {
            let _ = false;

            if (h) {
                s = this._snappingManager.trySnapping({
                    snappable: this._selectedEntity,
                    point: i,
                    index: n
                });

                if (this._snappingManager.snapInfo?.type === Rc.MULTIPLE_ANGLE) {
                    _ = true;
                    this._selectedEntity.groundPoints = this._snappingManager.snapInfo.groundPoints.map((A) => A.clone());
                } else if (this._snappingManager.snapInfo?.type === Rc.PARALLEL_2) {
                    _ = true;
                    const v = this._snappingManager.snapInfo;
                    s = v.point;
                    const A = [...this._selectedEntity.groundPoints];
                    A[n] = v.point;
                    this._selectedEntity.groundPoints = A;

                    if (KD(this._selectedEntity.groundPoints)) {
                        this.doSetBox(this._selectedEntity, i, n);
                    }
                } else {
                    if (this._savedGroundPoints && this._selectedEntity.isBox === false) {
                        this._selectedEntity.groundPoints = this._savedGroundPoints;
                    }
                }
            } else {
                if (this._savedGroundPoints) {
                    this._selectedEntity.groundPoints = this._savedGroundPoints;
                }

                if (this._wasBox === false) {
                    this._selectedEntity.isBox = this._wasBox;
                }
            }

            a = this._selectedEntity.groundPoints;

            if (this._selectedEntity.isBox && _ === false) {
                const v = n === 0 ? a.length - 1 : n - 1;
                const A = n === a.length - 1 ? 0 : n + 1;

                if (Math.abs(a[n].x - a[A].x) < 0.01) {
                    a[A].x = s.x;
                    a[v].y = s.y;
                } else {
                    a[A].y = s.y;
                    a[v].x = s.x;
                }

                a[n].x = s.x;
                a[n].y = s.y;

                if (this._pointsManipulators) {
                    this._pointsManipulators.groundPoints = a;
                }
            } else {
                if (_ === false) {
                    a[n] = s;

                    if (this._pointsManipulators) {
                        this._pointsManipulators.groundPoints = a;
                    }

                    if (r) {
                        this._selectedEntity.dimensions = b2(a);
                    }
                }
            }
        } else {
            l += 1;
            a = [...this._selectedEntity.groundPoints];

            if (h) {
                s = this._snappingManager.trySnapping({
                    snappable: this._selectedEntity,
                    point: i,
                    index: n + 1
                });
            }

            a[n + 1] = s;
        }

        const f = getFinitePositions(a);
        const m = removeDuplicatedPositions(f);

        if (m.length > 2) {
            this._selectedEntity.groundPoints = m;
            this._pointsManipulators.groundPoints = m;

            if (r) {
                this._selectedEntity.dimensions = b2(f);
            }

            this.createOrUpdateVolumeLabel();

            if (r) {
                this.tryToCorrectGroundPoints();
                this.cesiumTools.entitiesUpdated([this._selectedEntity]);
                this.cleanupAfterPointDnd();
                this._snappingManager.removeSnapInfo();
            } else {
                this._dimensionsController.showCorner([l], a, this._selectedEntity.modelMatrix, this._selectedEntity.height, true);
                this._snappingManager.redraw(this._selectedEntity);

                if (this._pointsManipulators) {
                    this._pointsManipulators.groundPoints = this._selectedEntity.groundPoints;
                }

                this.updateRotationManipulator();
            }

            return s.clone();
            // eslint-disable-next-line no-else-return
        } else {
            this._selectedEntity.groundPoints = c;
            this._pointsManipulators.groundPoints = c;

            return i;
        }
    }

    cleanupAfterPointDnd() {
        this._startDragPoint = undefined;
        this._savedGroundPoints = undefined;
        this._snappingManager.endDrag();
        this._dimensionsController.clear();
    }

    onDeletePoint(t) {
        if (!this._selectedEntity) return;
        let n = this._selectedEntity.groundPoints;
        n.splice(t, 1);
        this._selectedEntity.groundPoints = n;
        const i = eMe(n);

        if (this._selectedEntity.isBox === false && n.length === 4 && i) {
            this.setBox(this._selectedEntity, t);
            n = this._selectedEntity.groundPoints;
        } else {
            if (this._selectedEntity.isBox) {
                this._selectedEntity.isBox = false;
            }
        }

        const r = getFinitePositions(this._selectedEntity.groundPoints);

        this._selectedEntity.groundPoints = removeDuplicatedPositions(r);
        this._selectedEntity.setHighlightedSideIndex(undefined);
        this.cesiumTools.entitiesUpdated([this._selectedEntity]);
        this._dimensionsController.groundPoints = n;

        if (this._pointsManipulators) {
            this._pointsManipulators.groundPoints = n;
        }

        this._dragSide = undefined;
        this._dragDiff = undefined;
        this._startDragPoint = undefined;
        this._dragState = DragStates.NONE;
        this._dragPlane = undefined;
    }

    detectVisibleSideLines() {
        const { scene: t } = this.viewer;
        const n = this._selectedEntity.groundPoints;
        const { modelMatrix: i } = this._selectedEntity;
        const r = [];

        for (let a = 0; a < n.length; ++a) {
            const s = n[a].clone();
            s.z = 0;
            const l = n[a].clone();
            l.z = this._selectedEntity.height;
            r[a] = new LineInfo(Axes.Z, [s, l], i, t);
        }

        r.sort((a, s) => a.middlePoint2d.x - s.middlePoint2d.x);

        return [r[0], r[r.length - 1]];
    }

    handleCtrlAltShiftKeyChange(t) {
        if (this._axisManipulators?.handleCtrlAltShiftKeyChange(t)) return true;
        if (t.upOrDown === k_.DOWN) {
            const n = this._pointsManipulators?.draggingPointIndex;
            const i = this.cesiumTools.previousMousePosition;
            if (Number.isFinite(n)) {
                const r = {
                    startPosition: new Cartesian2(),
                    endPosition: i,
                    altKey: t.altKey,
                    shiftKey: t.shiftKey,
                    ctrlKey: t.ctrlKey,
                    preventToolsDefault: false,
                    buttons: 1,
                    ctrlDown: true
                };

                this._pointsManipulators?.mouseMove(r);

                return true;
            }
        } else if (t.upOrDown === k_.UP) {
            const n = this._pointsManipulators?.draggingPointIndex;
            if (Number.isFinite(n)) {
                const i = this.cesiumTools.previousMousePosition;
                const r = {
                    startPosition: new Cartesian2(),
                    endPosition: i,
                    altKey: t.altKey,
                    shiftKey: t.shiftKey,
                    ctrlKey: t.ctrlKey,
                    preventToolsDefault: false,
                    buttons: 1
                };

                this._pointsManipulators?.mouseMove(r);

                return true;
            }
        }

        this._snappingManager.redraw(this._selectedEntity);

        return false;
    }

    setBox(t, n) {
        const i = new SnappingCalculator({ snapSettings: () => this.snapSettings });

        i.setup(t, []);

        const r = t.groundPoints.map((h) => h.clone());
        const a = n >= r.length ? 0 : n;
        const s = n >= r.length ? r.length - 1 : n - 1;
        const l = i.tryParallelSnapping({ index: s, point: r[s], snappable: t });

        if (l) {
            r[s] = l.point;

            if (KD(r)) {
                t.groundPoints = r;
                this.doSetBox(t, r[s], s);
            }

            return;
        }

        const c = i.tryParallelSnapping({
            index: a,
            point: r[a],
            snappable: t
        });

        if (c) {
            r[a] = c.point;

            if (KD(r)) {
                t.groundPoints = r;
                this.doSetBox(t, r[a], a);
            }
        }
    }

    doSetBox(t, n, i) {
        const [r, a, s] = t.groundPoints;
        const l = Cartesian3.distance(r, a);
        const c = Cartesian3.distance(a, s);

        t.dimensions = new Cartesian2(l, c);
        t.isBox = true;

        const {
            minX: h,
            maxX: f,
            minY: m,
            maxY: _
        } = (function (e) {
            let t1 = Number.POSITIVE_INFINITY;
            let n1 = Number.NEGATIVE_INFINITY;
            let i1 = Number.POSITIVE_INFINITY;
            let r1 = Number.NEGATIVE_INFINITY;
            let a1 = Number.POSITIVE_INFINITY;
            let s1 = Number.NEGATIVE_INFINITY;

            for (const l1 of e) {
                t1 = Math.min(t1, l1.x);
                n1 = Math.max(n1, l1.x);
                i1 = Math.min(i1, l1.y);
                r1 = Math.max(r1, l1.y);
                a1 = Math.min(a1, l1.z);
                s1 = Math.max(s1, l1.z);
            }

            return { minX: t1, maxX: n1, minY: i1, maxY: r1 };
        })(t.groundPoints);

        let v = [new Cartesian3(h, m, 0), new Cartesian3(f, m, 0), new Cartesian3(f, _, 0), new Cartesian3(h, _, 0)];
        const A = [Cartesian3.distance(n, v[0]), Cartesian3.distance(n, v[1]), Cartesian3.distance(n, v[2]), Cartesian3.distance(n, v[3])];
        let b = A.map((T, P) => P).reduce((T, P) => (A[T] < A[P] ? T : P), 0) - i;

        if (b !== 0) {
            if (b < 0) {
                b = (4 + b) % 4;
            }

            v = (function (e, t1) {
                return e.slice(t1, e.length).concat(e.slice(0, t1));
            })(v, b);
        }

        t.groundPoints = v;

        if (this._pointsManipulators) {
            this._pointsManipulators.groundPoints = v;
        }
    }

    setHighlighted(t) {
        return !(
            !this._selectedEntity ||
            (this._pointsManipulators?.removeHighlight(),
            this._rotateManip?.removeHighlight(),
            !this._pointsManipulators?.setHighlighted(t) && !super.setHighlighted(t))
        );
    }

    tryToCorrectGroundPoints() {
        if (!this._selectedEntity) return;

        const t = this._selectedEntity.groundPoints;

        if (Lines.createFromPoints(t).isClockwise) {
            const r = t.reverse();

            this._selectedEntity.groundPoints = r;
            this.viewer.scene.requestRender();

            if (this._pointsManipulators) {
                this._pointsManipulators.groundPoints = r;
            }
        }
    }

    doCalculateRadius() {
        return (
            1.1 *
            (function (e) {
                return e.reduce((t, n) => Math.max(t, Cartesian3.distance(Cartesian3.ZERO, n)), 0);
            })(this._selectedEntity.groundPoints)
        );
    }
}
