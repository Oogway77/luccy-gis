/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */

import {
    ColorGeometryInstanceAttribute,
    GeometryInstance,
    GroundPolylineGeometry,
    GroundPolylinePrimitive,
    Material,
    PolylineColorAppearance,
    PolylineGeometry,
    PolylineMaterialAppearance,
    Primitive,
    ShadowMode
} from "cesium";

import { PickGroups } from "./common";

export class AbstractTool {
    constructor(type, cesiumTools) {
        this.type = type;
        this.cesiumTools = cesiumTools;
        this.snapSettings = cesiumTools.snapping;
    }

    setup(t) {
        this.viewer = t;
    }

    onDestroy() {}
    commitTool() {
        this.viewer.scene.requestRender();
        return false;
    }

    cancelTool() {
        this.viewer.scene.requestRender();
    }

    handleDeleteKey() {
        return false;
    }

    handleCtrlAltShiftKeyChange(t) {
        return false;
    }

    handleClick(t) {
        return false;
    }

    handleRightClick(t) {
        return false;
    }

    mouseDoubleClick(t) {
        return false;
    }

    mouseDown(t) {
        return false;
    }

    mouseUp(t) {
        return false;
    }

    mouseMove(t) {
        return false;
    }

    setSnapSettings(t) {
        this.snapSettings = t;
    }

    createLine(t, n, i = 2) {
        const r = new PolylineGeometry({ positions: t, width: i });
        return new Primitive({
            geometryInstances: new GeometryInstance({
                geometry: r,
                attributes: { color: ColorGeometryInstanceAttribute.fromColor(n) }
            }),
            appearance: new PolylineColorAppearance({
                translucent: false,
                renderState: { depthTest: { enabled: false }, depthMask: false }
            }),
            allowPicking: false,
            shadows: ShadowMode.DISABLED,
            asynchronous: false,
            pickGroup: PickGroups.EDGES_DISABLED
        });
    }

    createGroundLine(t, n) {
        const i = new GroundPolylineGeometry({ positions: t, width: 4 });
        const r = new GeometryInstance({ geometry: i, id: "" });
        return new GroundPolylinePrimitive({
            geometryInstances: r,
            appearance: new PolylineMaterialAppearance({ material: Material.fromType("Color") }),
            asynchronous: false
        });
    }

    onEntityUpdated(t, n) {}
    setHighlighted(t) {
        return false;
    }
}
