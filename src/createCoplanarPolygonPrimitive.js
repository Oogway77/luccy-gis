import {
    ColorGeometryInstanceAttribute,
    ComponentDatatype,
    CoplanarPolygonGeometry,
    defaultValue,
    GeometryAttribute,
    GeometryInstance,
    Material,
    MaterialAppearance,
    Primitive,
    ShadowMode
} from "cesium";

import { PickGroups } from "./common";

export function createCoplanarPolygonPrimitive(options) {
    const allowPicking = defaultValue(options.selectable, true);
    const pickGroup = defaultValue(options.showBorder, false);
    const shadows = defaultValue(options.shadows, true);

    const appearance = new MaterialAppearance({
        flat: false,
        closed: false,
        translucent: true,
        faceForward: true,
        renderState: { depthTest: { enabled: false }, depthMask: false },
        material: Material.fromType("Color", { color: options.color })
    });
    const polygonGeometry = CoplanarPolygonGeometry.fromPositions({
        positions: options.points,
        vertexFormat: MaterialAppearance.VERTEX_FORMAT
    });
    const geometry = CoplanarPolygonGeometry.createGeometry(polygonGeometry);
    const pointsCount = options.points.length;
    const normalBuffer = new Float32Array(3 * pointsCount);
    for (let f = 0; f < pointsCount; f += 1) {
        normalBuffer[3 * f] = 0;
        normalBuffer[3 * f + 1] = 0;
        normalBuffer[3 * f + 2] = 1;
    }

    if (!geometry) {
        // throw new Error("geometry is not valid");
        return undefined;
    }

    geometry.attributes.normal = new GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: normalBuffer
    });

    return new Primitive({
        geometryInstances: new GeometryInstance({
            id: options.id,
            geometry: geometry,
            modelMatrix: options.modelMatrix,
            attributes: {
                color: ColorGeometryInstanceAttribute.fromColor(options.color),
                depthFailColor: ColorGeometryInstanceAttribute.fromColor(options.color)
            }
        }),
        appearance: appearance,
        allowPicking: allowPicking,
        asynchronous: false,
        shadows: shadows ? ShadowMode.ENABLED : ShadowMode.DISABLED,
        pickGroup: pickGroup ? PickGroups.EDGES_REQUIRED : PickGroups.EDGES_ENABLED
    });
}
