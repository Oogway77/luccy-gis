/* eslint-disable consistent-return */
/* eslint-disable no-lonely-if */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-classes-per-file */
import { BoundingSphere, Cartesian3, Color, defaultValue, DeveloperError, Matrix4 } from "cesium";

import {
    checkInfinitePosition,
    checkDuplicatedPositions,
    EntityTypes,
    Polygon3DIdPrefix,
    defaultValues,
    checkCondition,
    getLeftOrRightPointInfo,
    ScreenDirections,
    entityProps
} from "./common";
import { ToolEntity } from "./ToolEntity";
import { MaterialCreator } from "./MaterialCreator";
import { Lines } from "./Lines";
import { PolygonPrimitive } from "./PolygonPrimitive";

class SnappedEntity extends ToolEntity {
    constructor(options) {
        super({
            type: options.type,
            name: options.name,
            viewer: options.viewer,
            customData: options.customData,
            usage: options.usage,
            orderIndex: options.orderIndex,
            locked: options.locked,
            visible: options.visible,
            visibleFrom: options.visibleFrom,
            visibleTo: options.visibleTo
        });

        this.snapToTerrain = true;
        this.snapToTerrain = options.snapToTerrain;
    }
}

class Polygon3DBase extends SnappedEntity {
    getAllPropertiesAsMap() {
        const t = super.getAllPropertiesAsMap();
        return (
            t.set(entityProps.floorHeight, this.floorHeight),
            t.set(entityProps.groundFloorsHeight, this.groundFloorsHeight),
            t.set(entityProps.groundFloorsCount, this.groundFloorsCount),
            t.set(entityProps.basementFloorsHeight, this.basementFloorsHeight),
            t.set(entityProps.basementFloorsCount, this.basementFloorsCount),
            t
        );
    }

    updatePrimitive(t) {
        if (this._primitive) {
            this._primitive.materialCreator = new MaterialCreator({
                floorHeight: t.floorHeight,
                groundFloorsHeight: t.groundFloorsHeight,
                groundFloorsCount: t.groundFloorsCount,
                basementFloorsHeight: t.basementFloorsHeight,
                basementFloorsCount: t.basementFloorsCount
            });
        }
    }

    get primitive() {
        return this._primitive;
    }

    get floorHeight() {
        return this._primitive?.materialCreator.floorHeight ?? defaultValues.floorHeight;
    }

    set floorHeight(t) {
        if (this._primitive) {
            this._primitive.materialCreator.floorHeight = t;
            this._primitive.setNeedsUpdate();
        }
    }

    get groundFloorsHeight() {
        return this._primitive?.materialCreator.groundFloorsHeight ?? defaultValues.groundFloorsHeight;
    }

    set groundFloorsHeight(t) {
        if (this._primitive) {
            this._primitive.materialCreator.groundFloorsHeight = t;
            this._primitive.setNeedsUpdate();
        }
    }

    get groundFloorsCount() {
        return this._primitive?.materialCreator.groundFloorsCount ?? defaultValues.groundFloorsCount;
    }

    set groundFloorsCount(t) {
        if (this._primitive) {
            this._primitive.materialCreator.groundFloorsCount = t;
            this._primitive.setNeedsUpdate();
        }
    }

    get basementFloorsHeight() {
        return this._primitive?.materialCreator.basementFloorsHeight ?? defaultValues.basementFloorsHeight;
    }

    set basementFloorsHeight(t) {
        if (this._primitive) {
            this._primitive.materialCreator.basementFloorsHeight = t;
            this._primitive.setNeedsUpdate();
        }
    }

    get basementFloorsCount() {
        return this._primitive?.materialCreator.basementFloorsCount ?? defaultValues.basementFloorsCount;
    }

    set basementFloorsCount(t) {
        if (this._primitive) {
            this._primitive.materialCreator.basementFloorsCount = t;
            this._primitive.setNeedsUpdate();
        }
    }
}

export class Polygon3D extends Polygon3DBase {
    constructor(options) {
        checkCondition(options.groundPoints.length > 0, "options.groundPoints.length > 0");
        checkInfinitePosition(options.position);

        if (options.groundPoints.length < 3) {
            throw new DeveloperError("Cannot create polygon building with less than 3 points.");
        }

        checkDuplicatedPositions(options.groundPoints);

        let groundPoints = options.groundPoints;

        if (Lines.createFromPoints(groundPoints).isClockwise) {
            groundPoints = groundPoints.reverse();
        }

        super({
            type: EntityTypes.POLYGON_3D,
            name: options.name,
            viewer: options.viewer,
            snapToTerrain: options.snapToTerrain,
            customData: options.customData,
            orderIndex: options.orderIndex,
            locked: options.locked,
            visible: options.visible,
            visibleFrom: options.visibleFrom,
            visibleTo: options.visibleTo
        });

        this.isBox = options.isBox;
        this.dimensions = options.dimensions;
        this.usage = options.usage;
        this._showFloors = defaultValue(options.showFloors, defaultValues.showFloors);

        const primitive = new PolygonPrimitive({
            id: `${Polygon3DIdPrefix}:${this.id}`,
            showFloors: this._showFloors,
            height: options.height,
            groundPoints: groundPoints,
            angle: options.angle,
            centerPoint: options.position,
            shadow: options.shadow,
            adjustZ: options.adjustZ,
            color: options.color,
            roofColor: options.roofColor,
            opacity: options.opacity,
            roofType: options.roofType,
            roofAngle: options.roofAngle,
            roofRotationIndex: options.roofRotationIndex,
            pickGroup: options.pickGroup,
            allowPicking: defaultValue(options.allowPicking, true)
        });

        this._primitive = primitive;

        const floorHeight = defaultValue(options.floorHeight, defaultValues.floorHeight);
        const groundFloorsHeight = defaultValue(options.groundFloorsHeight, defaultValues.groundFloorsHeight);
        const groundFloorsCount = defaultValue(options.groundFloorsCount, defaultValues.groundFloorsCount);
        const basementFloorsHeight = defaultValue(options.basementFloorsHeight, defaultValues.basementFloorsHeight);
        const basementFloorsCount = defaultValue(options.basementFloorsCount, defaultValues.basementFloorsCount);

        this.updatePrimitive({
            floorHeight: floorHeight,
            groundFloorsHeight: groundFloorsHeight,
            groundFloorsCount: groundFloorsCount,
            basementFloorsHeight: basementFloorsHeight,
            basementFloorsCount: basementFloorsCount
        });

        this.viewer?.scene.primitives.add(primitive);
        this.initialized = true;
    }

    get customData() {
        return super.customData;
    }

    get idPrefix() {
        return `${Polygon3DIdPrefix}:${this.id}`;
    }

    removeFromCesium(t) {
        super.removeFromCesium(t);
        t.scene.primitives.remove(this._primitive);
        this._primitive = undefined;
    }

    set pickGroup(t) {
        if (this._primitive) {
            this._primitive.pickGroup = t;
        }
    }

    get angle() {
        return this._primitive?.angle ?? 0;
    }

    set angle(t) {
        if (this._primitive) {
            this._primitive.angle = t;
        }
    }

    get roofType() {
        return this._primitive?.roofType ?? 0;
    }

    set roofType(t) {
        if (this._primitive) {
            this._primitive.roofType = t;
        }
    }

    get roofAngle() {
        return this._primitive?.roofAngle ?? 0;
    }

    set roofAngle(t) {
        if (this._primitive) {
            this._primitive.roofAngle = t;
        }
    }

    get roofRotationIndex() {
        return this._primitive?.roofRotationIndex ?? 0;
    }

    set roofRotationIndex(t) {
        if (this._primitive) {
            this._primitive.roofRotationIndex = t;
        }
    }

    get color() {
        return this._primitive?.color ?? Color.WHITE;
    }

    set color(t) {
        if (this._primitive) {
            this._primitive.color = t;
        }
    }

    get roofColor() {
        return this._primitive?.roofColor ?? Color.WHITE;
    }

    set roofColor(t) {
        if (this._primitive) {
            this._primitive.roofColor = t;
        }
    }

    get opacity() {
        return this._primitive?.opacity ?? 1;
    }

    set opacity(t) {
        if (this._primitive) {
            this._primitive.opacity = t;
        }
    }

    get adjustZ() {
        return this._primitive?.adjustZ ?? 0;
    }

    set adjustZ(t) {
        if (this._primitive) {
            this._primitive.adjustZ = t;
        }
    }

    get boundingSphere() {
        let t = 0;
        for (const n of this.groundPoints) {
            const i = Math.sqrt(n.x * n.x + n.y * n.y);
            t = Math.max(t, i);
        }

        return new BoundingSphere(Cartesian3.ZERO, t);
    }

    get centerPoint() {
        return this._primitive?.centerPoint ?? Cartesian3.ZERO;
    }

    set centerPoint(t) {
        if (this._primitive) {
            this._primitive.centerPoint = t;
        }
    }

    get height() {
        return this._primitive?.height ?? 10;
    }

    set height(height) {
        if (this._primitive) {
            this._primitive.height = height;
        }
    }

    get showFloors() {
        return this._showFloors;
    }

    set showFloors(t) {
        this._showFloors = t;
        if (this._primitive) {
            this._primitive.showFloors = t;
        }
    }

    get groundPoints() {
        return this._primitive?.groundPoints ?? [];
    }

    set groundPoints(t) {
        if (t.length < 3) throw new DeveloperError("Cannot set polygon building with less than 3 points.");
        if (this._primitive) {
            this._primitive.groundPoints = t;
        }
    }

    get modelMatrix() {
        return this._primitive?.modelMatrix ?? Matrix4.IDENTITY;
    }

    set show(t) {
        if (!this.viewer) return;

        const n = this.viewer.scene.primitives;

        if (t) {
            if (n.contains(this._primitive) === false) {
                n.add(this._primitive);
            }
        } else {
            if (n.contains(this._primitive)) {
                n.remove(this._primitive);
            }
        }
    }

    setHighlightedSideIndex(t) {
        if (this._primitive && this._primitive?.highlightedSideIndex !== t && Number.isFinite(t)) {
            this._primitive.highlightedSideIndex = t;
        }
    }

    supportsHighlightId(t) {
        const n = t?.componentIndex;
        return !(t?.componentType !== "side" || !Number.isFinite(n));
    }

    setHighlighted(t) {
        const n = t?.componentIndex;

        if (this._primitive && t?.componentType !== "side" && this._primitive?.highlightedSideIndex === n && Number.isFinite(n)) {
            this._primitive.highlightedSideIndex = n;
            return true;
        }
    }

    clearHighlighted() {
        super.clearHighlighted();

        if (this._primitive) {
            this._primitive.highlightedSideIndex = undefined;
        }
    }

    selectionChanged(t) {
        super.selectionChanged(t);

        if (t === false) {
            this.clearHighlighted();
        }
    }

    setCenterPointAndAngleRad(t, n) {
        if (this._primitive) {
            if (Number.isFinite(n)) {
                this._primitive.angle = n;
            }

            this._primitive.centerPoint = t;
        }
    }

    getWall(sideIndex) {
        return this._primitive?.sides[sideIndex];
    }

    get rightMostTopPlanePoint() {
        if (!this.viewer) {
            return;
        }

        const { scene: t } = this.viewer;
        const { modelMatrix: n } = this;
        const i = this.groundPoints.map((a) => new Cartesian3(a.x, a.y, this.height));

        return getLeftOrRightPointInfo(ScreenDirections.RIGHT, i, n, t)?.pointWC;
    }

    tick(t) {
        super.tick(t);

        if (this._primitive) {
            this._primitive.visibleAtCurrentTime = this.visibleAtCurrentTime;
        }

        this.viewer?.scene.requestRender();
    }

    clone() {
        return new Polygon3D({
            name: this.name,
            position: this._primitive.centerPoint.clone(),
            angle: this._primitive.angle,
            groundPoints: this._primitive.groundPoints.map((n) => n.clone()),
            color: this._primitive.color,
            roofColor: this._primitive.roofColor,
            opacity: this._primitive.opacity,
            height: this._primitive.height,
            adjustZ: this._primitive.adjustZ,
            roofType: this._primitive.roofType,
            roofAngle: this.roofAngle,
            roofRotationIndex: this.roofRotationIndex,
            customData: { ...this.customData },
            showFloors: this._primitive.showFloors,
            floorHeight: this.floorHeight,
            groundFloorsHeight: this.groundFloorsHeight,
            groundFloorsCount: this.groundFloorsCount,
            basementFloorsHeight: this.basementFloorsHeight,
            basementFloorsCount: this.basementFloorsCount,
            shadow: this._primitive.shadow,
            isBox: this.isBox,
            dimensions: this.dimensions,
            snapToTerrain: this.snapToTerrain,
            orderIndex: 0,
            usage: this.usage,
            locked: this._locked,
            visible: this._visible,
            visibleFrom: this.visibleFrom,
            visibleTo: this.visibleTo,
            viewer: this.viewer
        });
    }
}
