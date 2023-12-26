import { Cartesian3, Cesium3DTileset, Cesium3DTileFeature, defined, Model, Ray } from "cesium";

import VisibilityState from "./VisibilityState";

const rayScratch = new Ray();
const cartesianScratch = new Cartesian3();
const visibilityState = new VisibilityState();

export function getWorldPosition(scene, mousePosition, result) {
    let position;

    if (scene.pickPositionSupported) {
        // Hide every primitive that isn't a tileset
        visibilityState.hide(scene);

        // Don't pick default 3x3, or scene.pick may allow a mousePosition that isn't on the tileset to pickPosition.
        const pickedObject = scene.pick(mousePosition, 1, 1);

        visibilityState.restore(scene);

        if (
            defined(pickedObject) &&
            (pickedObject instanceof Cesium3DTileFeature ||
                pickedObject.primitive instanceof Cesium3DTileset ||
                pickedObject.primitive instanceof Model)
        ) {
            // check to let us know if we should pick against the globe instead
            position = scene.pickPosition(mousePosition, cartesianScratch);

            if (defined(position)) {
                return Cartesian3.clone(position, result);
            }
        }
    }

    if (!defined(scene.globe)) {
        return undefined;
    }

    const ray = scene.camera.getPickRay(mousePosition, rayScratch);

    if (!ray) {
        return undefined;
    }

    position = scene.globe.pick(ray, scene, cartesianScratch);

    if (position) {
        return Cartesian3.clone(position, result);
    }

    return undefined;
}
