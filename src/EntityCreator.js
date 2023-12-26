import { EntityTypes } from "./common";
import { WallEntity, Model } from "./dummyClasses";

export class EntityCreator {
    constructor(t) {
        this.cesiumTools = t;
    }

    createEntity(options) {
        // eslint-disable-next-line no-nested-ternary
        return options.type === EntityTypes.WALLS
            ? this.createWallEntity(options)
            : options.type === EntityTypes.PICKER
            ? this.createPickerEntity(options)
            : (console.error("Unknown entity type: ", options.type), null);
    }

    createWallEntity(t) {
        return new WallEntity({
            center: t.center,
            dimensions: t.dimensions,
            viewer: this.cesiumTools.viewer,
            cesiumTools: this.cesiumTools,
            areaLimit: t.areaLimit,
            onFinishCreate: (n) => {
                this.cesiumTools.entitiesCreated([n]);
                this.cesiumTools.selectEntity(n, false);
                if (t.onCreate) {
                    t.onCreate(n);
                }
            }
        });
    }

    createPickerEntity(t) {
        const n = new Model({
            name: "PICKER",
            position: t.center,
            angle: t.angle,
            url: { path: t.modelUrl },
            scale: t.scale,
            viewer: this.cesiumTools.viewer,
            minimumPixelSize: 64,
            maximumScale: 2e4,
            isPicker: true,
            snapToTerrain: true,
            adjustZ: 0,
            allowPicking: false,
            orderIndex: 0,
            locked: false,
            visible: true,
            visibleFrom: undefined,
            visibleTo: undefined,
            onFinishCreate: (i) => {
                this.cesiumTools.entitiesCreated([i]);
                this.cesiumTools.selectEntity(i, false);
                if (t.onCreate) {
                    t.onCreate(i);
                }
            },
            loadErrorHandler: (i) => {
                console.error("Cannot load picker model", i);
            }
        });

        n.alwaysAllowEditing = true;

        return n;
    }
}
