import {
    Cartesian3,
    defaultValue,
    DeveloperError,
    GeometryInstance,
    Matrix4,
    Material,
    MaterialAppearance,
    PolylineColorAppearance,
    PolylineGeometry,
    PolylineMaterialAppearance,
    Primitive,
    ShadowMode
} from "cesium";

import { PickGroups } from "./common";

export function createPolylinePrimitive(options) {
    const hasArrow = defaultValue(options.hasArrow, false);
    const width = defaultValue(options.width, 8);
    const alwaysOnTop = defaultValue(options.alwaysOnTop, false);
    const selectable = defaultValue(options.selectable, true);
    const { modelMatrix: a } = options;

    let s;
    if (options.positions) s = options.positions;
    else {
        if (!options.startPoint) throw new DeveloperError("When drawing line, you must provide either positions or startPoint/vector.");
        const A = Cartesian3.add(options.startPoint, options.vector, new Cartesian3());
        s = [options.startPoint, A];
    }
    const positions = a
        ? s.map((A) => {
              const x = new Cartesian3();
              Matrix4.multiplyByPoint(a, A, x);
              return x;
          })
        : s;

    const colors = [];

    for (let A = 0; A < positions.length; A += 1) colors[A] = options.color;

    const h = { depthTest: { enabled: !alwaysOnTop }, depthMask: !alwaysOnTop };

    let vertexFormat;
    let appearance;

    if (hasArrow) {
        vertexFormat = PolylineMaterialAppearance.VERTEX_FORMAT;
        appearance = new PolylineMaterialAppearance({
            material: Material.fromType(Material.PolylineArrowType, { color: options.color }),
            translucent: true,
            renderState: h
        });
    } else {
        vertexFormat = MaterialAppearance.VERTEX_FORMAT;
        appearance = new PolylineColorAppearance({ translucent: true, renderState: h });
    }

    const geometry = new PolylineGeometry({
        positions: positions,
        width: width,
        vertexFormat: vertexFormat,
        colors: colors,
        colorsPerVertex: true
    });

    const primitive = new Primitive({
        geometryInstances: new GeometryInstance({ id: options.id, geometry: geometry }),
        allowPicking: selectable,
        appearance: appearance,
        shadows: ShadowMode.DISABLED,
        asynchronous: false
    });

    primitive.pickGroup = PickGroups.EDGES_DISABLED;

    return primitive;
}
