/* eslint-disable no-sequences */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-cond-assign */
import { Cartesian2, Cartesian3, defined, Math as CesiumMath } from "cesium";

import { EntityTypes } from "./common";
import { createGroundPointsOfBox } from "./Lines";
import { Polygon3D } from "./Polygon3D";

// same Lc class from original
export class EntityChangeUtil {
    static setEntityParameters(entity, parameters) {
        switch (entity.type) {
            case EntityTypes.POLYGON_3D:
                EntityChangeUtil.setCommonParameters(entity, parameters);
                EntityChangeUtil.setPolyBoxParameters(entity, parameters);
                break;
            default:
                break;
        }
    }

    static setCommonParameters(entity, parameters) {
        if (parameters.locked !== null) {
            entity.locked = parameters.locked;
        }

        if (parameters.visible !== null) {
            entity.visible = parameters.visible;
        }

        if (parameters.name !== null) {
            entity.name = parameters.name;
        }

        const visibleFrom = EntityChangeUtil.extractDateFromParameter(parameters.visibleFrom);

        if (visibleFrom || visibleFrom === null) {
            entity.visibleFrom = visibleFrom ?? undefined;
        }

        const visibleTo = EntityChangeUtil.extractDateFromParameter(parameters.visibleTo);

        if (visibleTo || visibleTo === null) {
            entity.visibleTo = visibleTo ?? undefined;
        }
    }

    // eslint-disable-next-line complexity
    static setPolyBoxParameters(entity, parameters) {
        if (Number.isFinite(parameters.x) || Number.isFinite(parameters.y)) {
            let dimensions = entity.dimensions;
            // eslint-disable-next-line no-unused-expressions
            dimensions || (dimensions = new Cartesian2()),
                Number.isFinite(parameters.x) && (dimensions.x = parameters.x),
                Number.isFinite(parameters.y) && (dimensions.y = parameters.y),
                (entity.dimensions = dimensions);
            const height = Number.isFinite(parameters.height) ? parameters.height : entity.height;
            const a = new Cartesian3(dimensions.x, dimensions.y, height);
            // eslint-disable-next-line no-undef
            entity.groundPoints = entity.isBox ? createGroundPointsOfBox(a) : VIe(entity.groundPoints, a);
        }
        if (
            // eslint-disable-next-line no-cond-assign
            (Number.isFinite(parameters.height) && (entity.height = parameters.height),
            Number.isFinite(parameters.usage) && (entity.usage = parameters.usage?.id),
            defined(parameters.showFloors) && (entity.showFloors = parameters.showFloors),
            Number.isFinite(parameters.floorHeight) && (entity.floorHeight = parameters.floorHeight),
            Number.isFinite(parameters.groundFloorsHeight) && (entity.groundFloorsHeight = parameters.groundFloorsHeight),
            Number.isFinite(parameters.groundFloorsCount) && (entity.groundFloorsCount = parameters.groundFloorsCount),
            Number.isFinite(parameters.basementFloorsHeight))
        ) {
            const i = (parameters.basementFloorsHeight - entity.basementFloorsHeight) * entity.basementFloorsCount;
            (entity.basementFloorsHeight = parameters.basementFloorsHeight), (entity.height += i), (entity.adjustZ -= i);
        }
        if (Number.isFinite(parameters.basementFloorsCount)) {
            const r = entity.basementFloorsHeight * (parameters.basementFloorsCount - entity.basementFloorsCount);
            (entity.basementFloorsCount = parameters.basementFloorsCount), (entity.height += r), (entity.adjustZ -= r);
        }

        // (0, WD.Z)(n.snapToTerrain) &&
        parameters.snapToTerrain &&
            (entity.parent
                ? entity.parent.children.forEach((i) => {
                      // (i instanceof Jc || i instanceof Building_Ul || i instanceof PolygonBuilding_so) &&
                      i instanceof Polygon3D && (i.snapToTerrain = parameters.snapToTerrain);
                  })
                : (entity.snapToTerrain = parameters.snapToTerrain)),
            Number.isFinite(parameters.adjustZ) &&
                (entity.adjustZ = parameters.adjustZ - entity.basementFloorsCount * entity.basementFloorsHeight),
            parameters.color && (entity.color = parameters.color),
            parameters.roofColor && (entity.roofColor = parameters.roofColor),
            Number.isFinite(parameters.opacity) && (entity.opacity = parameters.opacity),
            // (0, ir.Z)(n.roofType) || (t.roofType = n.roofType),
            parameters.roofType || (entity.roofType = parameters.roofType),
            Number.isFinite(parameters.roofAngle) && (entity.roofAngle = parameters.roofAngle),
            Number.isFinite(parameters.roofRotationIndex) && (entity.roofRotationIndex = parameters.roofRotationIndex),
            Number.isFinite(parameters.angle) && (entity.angle = CesiumMath.toRadians(parameters.angle)),
            Number.isFinite(parameters.areaReduction) && (entity.customData.areaReduction = parameters.areaReduction),
            Number.isFinite(parameters.volumeReduction) && (entity.customData.volumeReduction = parameters.volumeReduction);
    }

    static extractDateFromParameter(t) {
        // eslint-disable-next-line no-nested-ternary
        return typeof t === "string" ? (t === "" ? null : new Date(t)) : t instanceof Date ? t : t === null ? null : undefined;
    }
}
