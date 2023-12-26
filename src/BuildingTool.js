import { Cartesian3, Cesium3DTileFeature, Color, Ellipsoid, HeadingPitchRoll, Matrix4, Plane, Transforms } from "cesium";

import { AbstractTool } from "./AbstractTool";

import {
    utils,
    PickGroups,
    EntityTypes,
    toolIds,
    defaultValues,
    calcCenterPoint,
    pickObject,
    ctrlPressed,
    Polygon3DIdPrefix,
    BuildingIdPrefix
} from "./common";

import { DimensionController } from "./DimensionController";
import { findToolEntity } from "./findToolEntity";
import { HeightManipulator } from "./HeightManipulator";
import { HeightSnapper } from "./HeightSnapper";
import { Lines, createGroundPointsOfBox } from "./Lines";
import { Polygon3D } from "./Polygon3D";
import { createCoplanarPolygonPrimitive } from "./createCoplanarPolygonPrimitive";
import { TransparencySwitcher } from "./TransparencySwitcher";
import { EntityContainer } from "./EntityContainer";
import { Building } from "./dummyClasses";
import { getWorldPosition } from "./getWorldPosition";

const pickedPositionScratch = new Cartesian3();
const whiteColor = Cesium.Color.WHITE;

const ToolPhases = {
    firstPoint: 0,
    secondPoint: 1,
    height: 2,
    finished: 3
};

function clonePolygon3D(options) {
    const t = options.parentEntity;
    const n = t.height;
    const floorCount = Math.ceil(t.height / t.floorHeight);
    const revisedHeight = floorCount * t.floorHeight;
    const i = [...t.groundPoints].map((v) => v.clone());
    const r = Number.isFinite(options.opacity) ? options.opacity : t.opacity;
    const a = t.roofColor;
    const s = t.isBox;
    const l = t.dimensions;
    const c = t.visibleFrom;
    const h = t.visibleTo;
    const f = t.usage;

    const m = new Polygon3D({
        name: t.name,
        position: t.centerPoint.clone(),
        groundPoints: i,
        angle: t.angle,
        roofType: t.roofType,
        roofAngle: t.roofAngle,
        color: t.color,
        roofColor: a,
        opacity: r,
        isBox: s,
        dimensions: l,
        pickGroup: options.pickGroup,
        showFloors: t.showFloors,
        floorHeight: t.floorHeight,
        groundFloorsHeight: t.groundFloorsHeight,
        groundFloorsCount: 0,
        basementFloorsHeight: t.basementFloorsHeight,
        basementFloorsCount: 0,
        adjustZ: t.adjustZ + n,
        snapToTerrain: options.snapToTerrain,
        shadow: true,
        roofRotationIndex: 0,
        height: revisedHeight,
        viewer: options.viewer,
        customData: { areaReduction: defaultValues.areaReduction, volumeReduction: defaultValues.volumeReduction },
        usage: f,
        orderIndex: 0,
        locked: t.locked,
        visible: t.visible,
        visibleTo: h,
        visibleFrom: c
    });
    let _;

    if (t instanceof Polygon3D) {
        t.roofAngle = 0;
    }

    if (t.parent) {
        _ = t.parent;
        _.addChildren([m]);
        options.cesiumTools.entitiesCreated([m]);
        if (options.event.shiftKey === false) {
            options.cesiumTools.selectEntity(m, false);
        }
        m.orderIndex = _.children.length;
    } else {
        _ = new EntityContainer({
            name: t.name,
            viewer: options.viewer,
            centerPoint: t.centerPoint.clone(),
            orderIndex: t.orderIndex,
            locked: t.locked,
            visible: t.visible,
            visibleFrom: t.visibleFrom,
            visibleTo: t.visibleTo
        });

        t.orderIndex = 0;
        m.orderIndex = 1;
        _.addChildren([t, m]);
        options.cesiumTools.entitiesCreated([_]);

        if (options.event.shiftKey === false) {
            options.cesiumTools.selectEntity(m, false);
        }
    }

    return m;
}

function checkClonePossible(e, cesiumTools) {
    let entity;
    let clonePossible = true;

    if (e) {
        clonePossible = false;
    }

    if (e instanceof Cesium3DTileFeature) {
        clonePossible = false;
    } else {
        const { id: r } = e;

        if (typeof r === "string" && (r.startsWith(Polygon3DIdPrefix) || r.startsWith(BuildingIdPrefix))) {
            const a = r.split(":");
            const s = parseInt(a[1], 10);

            if (Number.isFinite(s))
                if (a[2] === "side") {
                    const l = parseInt(a[3], 10);

                    if (Number.isFinite(l)) {
                        const c = cesiumTools.findToolEntity(s);

                        if (c instanceof Polygon3D) {
                            entity = c;
                            clonePossible = entity.snapToTerrain;
                        }
                    }
                } else if (a[2].startsWith("floor-")) {
                    const l = cesiumTools.findToolEntity(s);

                    if (l instanceof Building) {
                        entity = l;
                        clonePossible = entity?.snapToTerrain ?? true;
                    }
                }
        }
    }

    return [clonePossible, entity];
}

function setPropsOfClonedEntity(options) {
    const clonedEntity = options.entity;
    const srcEntity = options.otherEntity;

    const floorCount = Math.ceil(srcEntity.height / srcEntity.floorHeight);
    const revisedHeight = floorCount * srcEntity.floorHeight;

    clonedEntity.height = revisedHeight;
    clonedEntity.centerPoint = srcEntity.centerPoint.clone();
    clonedEntity.adjustZ = srcEntity.adjustZ + srcEntity.height;
    clonedEntity.roofAngle = srcEntity.roofAngle;
    clonedEntity.groundPoints = srcEntity.groundPoints;
    clonedEntity.angle = srcEntity.angle;
    clonedEntity.dimensions = srcEntity.dimensions;
}

function createPolygonBuilding(options) {
    const cesiumTools = options.tools;
    const viewer = cesiumTools.viewer;
    const dimensions = new Cartesian3(10, 10, 10);
    const groundPoints = createGroundPointsOfBox(dimensions);
    const toolDefault = cesiumTools.getToolDefaults(toolIds.basic.polygon);

    return new Polygon3D({
        name: "SHADOW POLYGON",
        position: options.pickPosition,
        angle: 0,
        groundPoints: groundPoints,
        height: 10,
        color: whiteColor.withAlpha(0.4),
        roofColor: whiteColor.withAlpha(0.4),
        opacity: 0.4,
        adjustZ: 0,
        viewer: viewer,
        snapToTerrain: true,
        shadow: true,
        roofType: defaultValues.roofType,
        roofAngle: defaultValues.gq,
        roofRotationIndex: 0,
        isBox: true,
        dimensions: dimensions,
        pickGroup: PickGroups.EDGES_DISABLED,
        allowPicking: false,
        showFloors: toolDefault.showFloors,
        floorHeight: toolDefault.floorHeight,
        groundFloorsHeight: toolDefault.groundFloorsHeight,
        groundFloorsCount: toolDefault.groundFloorsCount,
        basementFloorsHeight: toolDefault.basementFloorsHeight,
        basementFloorsCount: toolDefault.basementFloorsCount,
        customData: {
            areaReduction: toolDefault.areaReduction,
            volumeReduction: toolDefault.volumeReduction
        },
        usage: defaultValues.usage,
        orderIndex: 0,
        locked: false,
        visible: true,
        visibleFrom: undefined,
        visibleTo: undefined
    });
}

export class BuildingTool extends AbstractTool {
    constructor(cesiumTools) {
        super(toolIds.basic.building, cesiumTools);
        this.phase = ToolPhases.firstPoint;
        this.updateEntities = [];
        cesiumTools.viewer.container.style.cursor = "crosshair";
        this.dimensionsController = new DimensionController(cesiumTools);
        this.dimensionsController.setup();
        this.transparencySwitcher = new TransparencySwitcher({
            tools: cesiumTools
        });
    }

    setup(viewer) {
        super.setup(viewer);

        const scene = this.viewer.scene;
        this.transparencySwitcher.enableTransparency();
        scene.requestRender();
    }

    onDestroy() {
        super.onDestroy();
        this.removeShadowPolygonEntity();
        this.removeShadowRectangle();
        this.removeBuildingEntity();
        this.dimensionsController.clear();
        this.dimensionsController.destroy();
        this.cesiumTools.viewer.container.style.cursor = "default";
        const scene = this.viewer.scene;
        this.transparencySwitcher.disableTransparency();
        scene.requestRender();
        const i = this.updateEntities.map((r) => this.cesiumTools.findToolEntity(r)).filter((r) => !!r);

        if (i.length > 0) {
            this.cesiumTools.entitiesUpdated(i);
        }
    }

    handleClick(event) {
        if (this.phase === ToolPhases.firstPoint) {
            if (this.cloneUnderlyingPolygonBuilding(event)) {
                return true;
            }

            if (this.setFirstPoint(event)) {
                this.removeShadowPolygonEntity();

                if (
                    this.cesiumTools.canCreateEntityOfType({
                        type: EntityTypes.POLYGON_3D,
                        toolType: this.type,
                        parentOrSiblingEntity: undefined
                    }) === false
                ) {
                    console.error("Cannot create polygon - disabled by system.");
                    return true;
                }

                this.phase = ToolPhases.secondPoint;
            }
        } else if (this.phase === ToolPhases.secondPoint) {
            this.dimensionsController.clear();

            const matrix = Transforms.headingPitchRollToFixedFrame(this.point0, new HeadingPitchRoll(0, 0, 0));
            const inverseMatrix = Matrix4.inverse(matrix, new Matrix4());
            const isSnapping = this.isSnapping(event);

            if (this.setSecondPoint(event.position, isSnapping, matrix, inverseMatrix)) {
                this.phase = ToolPhases.height;
                this.cesiumTools.viewer.container.style.cursor = "ns-resize";
                this.removeShadowRectangle();
                this.createPolyboxEntity(inverseMatrix);
                this.createVirtualHeightManipulator(event.position);
            }
        } else if (this.phase === ToolPhases.height) {
            this.cesiumTools.entitiesCreated([this.buildingEntity]);
            this.phase = ToolPhases.finished;
            const entity = this.buildingEntity;
            this.buildingEntity = undefined;
            this.cesiumTools.selectEntity(entity, false);
        }

        this.cesiumTools.viewer.scene.requestRender();

        return true;
    }

    mouseMove(event) {
        if (this.phase === ToolPhases.firstPoint) {
            this.moveShadowPolygonEntity(event);
        } else if (this.phase === ToolPhases.secondPoint) {
            const matrix = Transforms.headingPitchRollToFixedFrame(this.point0, new HeadingPitchRoll(0, 0, 0));
            const inverse = Matrix4.inverse(matrix, new Matrix4());
            const isSnapping = this.isSnapping(event);
            this.setSecondPoint(event.endPosition, isSnapping, matrix, inverse);
            this.removeShadowRectangle();
            this.updateXYLabels(matrix, inverse);
            this.createShadowRectangle(matrix, inverse);
        } else if (this.phase === ToolPhases.height) {
            this.moveUpDownRoof(event);
            this.updateZLabel();
        }

        return true;
    }

    setFirstPoint(event) {
        const scene = this.cesiumTools.viewer.scene;
        const ray = this.viewer.camera.getPickRay(event.position);
        let pickedPosition = ray ? getWorldPosition(scene, event.position, pickedPositionScratch) : undefined;

        if (!pickedPosition) {
            pickedPosition = scene.pickPosition(event.position);
        }

        if (pickedPosition) {
            this.point0 = pickedPosition;
            this.basePlane = Plane.fromPointNormal(pickedPosition, Ellipsoid.WGS84.geodeticSurfaceNormal(pickedPosition));
        }

        return pickedPosition;
    }

    createShadowRectangle(modelMatrix, inverse) {
        const firstLocalPosition = Matrix4.multiplyByPoint(inverse, this.point0, new Cartesian3());
        const secondLocalPosition = Matrix4.multiplyByPoint(inverse, this.point1, new Cartesian3());

        firstLocalPosition.z = 0;
        secondLocalPosition.z = 0;

        const points = (function (e, t) {
            return [e, new Cartesian3(t.x, e.y, e.z), t, new Cartesian3(e.x, t.y, e.z)];
        })(firstLocalPosition, secondLocalPosition);

        const primitive = createCoplanarPolygonPrimitive({
            points: points,
            modelMatrix: modelMatrix,
            color: Color.WHITE.withAlpha(0.7),
            showBorder: true
        });

        if (!primitive) {
            this.shadowRectanglePrimitive = undefined;
            return;
        }

        const scene = this.cesiumTools.viewer.scene;

        scene.primitives.add(primitive);
        scene.requestRender();

        this.shadowRectanglePrimitive = primitive;
    }

    setSecondPoint(screenPosition, isSnapping, matrix, inverseMatrix) {
        if (!this.basePlane) {
            return false;
        }

        const ray = this.cesiumTools.viewer.camera.getPickRay(screenPosition);
        const position = ray ? utils.rayPlane(ray, this.basePlane) : undefined;

        if (!position || Cartesian3.equalsEpsilon(this.point0, position)) {
            return false;
        }

        if (isSnapping) {
            const local = Matrix4.multiplyByPoint(inverseMatrix, position, new Cartesian3());

            local.x = Math.round(local.x);
            local.y = Math.round(local.y);

            this.point1 = Matrix4.multiplyByPoint(matrix, local, new Cartesian3());
        } else {
            this.point1 = position;
        }

        return true;
    }

    removeShadowRectangle() {
        if (this.shadowRectanglePrimitive) {
            this.cesiumTools.viewer.scene.primitives.remove(this.shadowRectanglePrimitive);
            this.shadowRectanglePrimitive = undefined;
        }
    }

    removeBuildingEntity() {
        if (this.buildingEntity) {
            this.buildingEntity.removeFromCesium(this.cesiumTools.viewer);
            this.buildingEntity = undefined;
        }
    }

    createPolyboxEntity(toLocal) {
        const defaultPolygonOptions = this.cesiumTools.getToolDefaults(toolIds.basic.polygon);
        const pickGroupHander = this.cesiumTools.defaultPickGroupHandler;
        const pickGroup = pickGroupHander ? pickGroupHander() : PickGroups.EDGES_ENABLED;
        const position = this.calculateCenterPoint();
        const domensions = this.calculateDimensions(toLocal);
        domensions.z = 0;

        const groundPoints = createGroundPointsOfBox(domensions);

        const name = this.cesiumTools.findDefaultEntityName(EntityTypes.POLYGON_3D);

        this.buildingEntity = new Polygon3D({
            name: name,
            position: position,
            angle: 0,
            groundPoints: groundPoints,
            height: 0,
            color: whiteColor,
            roofColor: whiteColor,
            opacity: 1,
            adjustZ: 0,
            viewer: this.viewer,
            snapToTerrain: true,
            shadow: true,
            roofType: defaultValues.roofType,
            roofAngle: defaultValues.roofAngle,
            roofRotationIndex: 0,
            isBox: true,
            dimensions: domensions,
            pickGroup: pickGroup,
            showFloors: defaultPolygonOptions.showFloors,
            floorHeight: defaultPolygonOptions.floorHeight,
            groundFloorsHeight: defaultPolygonOptions.groundFloorsHeight,
            groundFloorsCount: defaultPolygonOptions.groundFloorsCount,
            basementFloorsHeight: defaultPolygonOptions.basementFloorsHeight,
            basementFloorsCount: defaultPolygonOptions.basementFloorsCount,
            customData: {
                areaReduction: defaultPolygonOptions.areaReduction,
                volumeReduction: defaultPolygonOptions.volumeReduction
            },
            usage: defaultValues.usage,
            orderIndex: -1,
            locked: false,
            visible: true,
            visibleFrom: undefined,
            visibleTo: undefined
        });
    }

    createVirtualHeightManipulator(screenPosition) {
        const referencePoint = this.point1;
        const plane = Plane.fromPointNormal(referencePoint, Ellipsoid.WGS84.geodeticSurfaceNormal(referencePoint));

        this.heightManipulator = new HeightManipulator({
            referencePoint: referencePoint,
            screenPosition: screenPosition,
            plane: plane,
            viewer: this.cesiumTools.viewer,
            heightSnapper: new HeightSnapper({
                entity: this.buildingEntity,
                snapSettings: () => this.snapSettings
            }),
            updateHeight: (height) => {
                this.updateEntityHeight(height);
            }
        });
    }

    updateEntityHeight(height) {
        if (this.buildingEntity) {
            this.buildingEntity.height = height;
            this.viewer.scene.requestRender();
        }
    }

    moveUpDownRoof(event) {
        this.heightManipulator?.mouseMove(event);
    }

    calculateCenterPoint() {
        return calcCenterPoint([this.point0, this.point1]);
    }

    calculateDimensions(toLocal) {
        const worldPoint0 = Matrix4.multiplyByPoint(toLocal, this.point0, new Cartesian3());
        const worldPoint1 = Matrix4.multiplyByPoint(toLocal, this.point1, new Cartesian3());

        return new Cartesian3(worldPoint1.x - worldPoint0.x, worldPoint1.y - worldPoint0.y, worldPoint1.z - worldPoint0.z);
    }

    updateXYLabels(matrix, inverse) {
        const initialGroundPoints = this.createGroundPoints(inverse);

        let groundPoints = initialGroundPoints;
        let sideIndexes = [1, 2];

        if (Lines.createFromPoints(initialGroundPoints).isClockwise) {
            groundPoints = initialGroundPoints.reverse();
            sideIndexes = [0, 1];
        }

        this.dimensionsController.show({
            height: 0,
            modelMatrix: matrix,
            points: groundPoints,
            sideIndexes: sideIndexes
        });
    }

    createGroundPoints(toLocalMatrix) {
        const n = [this.point0, this.point1].map((i) => Matrix4.multiplyByPoint(toLocalMatrix, i, new Cartesian3()));

        return [n[0], new Cartesian3(n[1].x, n[0].y, n[0].z), n[1], new Cartesian3(n[0].x, n[1].y, n[0].z)];
    }

    updateZLabel() {
        if (this.buildingEntity) {
            this.dimensionsController.show({
                points: this.buildingEntity.groundPoints,
                modelMatrix: this.buildingEntity.modelMatrix,
                showHeight: true,
                height: this.buildingEntity.height,
                angleIndexes: [],
                sideIndexes: []
            });
        }
    }

    cloneUnderlyingPolygonBuilding(t) {
        const pickedObject = this.viewer.scene.pick(t.position);

        const [r, a] = checkClonePossible(pickedObject, this.cesiumTools);

        if (!(a instanceof Polygon3D)) {
            return false;
        }

        const s = a;
        if (
            this.cesiumTools.canCreateEntityOfType({
                type: EntityTypes.POLYGON_3D,
                toolType: this.type,
                parentOrSiblingEntity: s
            }) === false
        ) {
            console.error("Cannot create polygon - disabled by system.");
            return false;
        }

        const l = this.cesiumTools.defaultPickGroupHandler;
        const c = l ? l() : PickGroups.EDGES_ENABLED;
        const h = this.transparencySwitcher.originalOpacityForEntityId(s.id);
        let f = h;

        if (t.shiftKey) {
            f = 1;
        }

        const m = clonePolygon3D({
            parentEntity: s,
            pickGroup: c,
            event: t,
            snapToTerrain: r,
            opacity: f,
            cesiumTools: this.cesiumTools,
            viewer: this.viewer
        });

        return (
            t.shiftKey &&
                (this.transparencySwitcher.addEntity(m, h),
                this.viewer?.scene.requestRender(),
                this.updateEntities.push(m.id),
                this.showShadowPolygonEntity(false),
                setTimeout(() => {
                    this.viewer?.scene.requestRender();
                }, 400)),
            true
        );
    }

    removeShadowPolygonEntity() {
        this.shadowPolygonEntity?.removeFromCesium(this.viewer);
        this.shadowPolygonEntity = undefined;
    }

    // ?? not sure that this is necessary

    moveShadowPolygonEntity(event) {
        if (!this.shadowPolygonEntity) {
            const pickedPosition = getWorldPosition(this.viewer.scene, event.endPosition, pickedPositionScratch);

            if (pickedPosition) {
                this.shadowPolygonEntity = createPolygonBuilding({
                    pickPosition: pickedPosition,
                    tools: this.cesiumTools
                });
            }
        }

        if (this.shadowPolygonEntity) {
            const pickedObject = pickObject(event, this.viewer);

            if (pickedObject) {
                const entity = findToolEntity(pickedObject, this.cesiumTools);

                if (entity instanceof Polygon3D) {
                    this.showShadowPolygonEntity(true);
                    setPropsOfClonedEntity({ entity: this.shadowPolygonEntity, otherEntity: entity });
                } else {
                    this.showShadowPolygonEntity(false);
                }
            } else {
                this.showShadowPolygonEntity(false);
            }
        }

        this.viewer.scene.requestRender();

        return false;
    }

    showShadowPolygonEntity(show) {
        if (this.shadowPolygonEntity) {
            this.shadowPolygonEntity.show = show;
        }
    }

    isSnapping(event) {
        return this.snapSettings.cornerGrid && ctrlPressed(event, this.snapSettings.alwaysSnap);
    }
}
