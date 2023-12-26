/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
import {
    Cartesian2,
    Cartesian3,
    Color,
    defaultValue,
    defined,
    DeveloperError,
    Ellipsoid,
    Matrix3,
    Matrix4,
    Math as CesiumMath,
    Plane,
    SceneTransforms
} from "cesium";

/* eslint-disable func-names */
export const MouseButton = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2
};

export const PickGroups = {
    TERRAIN: 0,
    EDGES_DISABLED: 1,
    EDGES_ENABLED: 2,
    EDGES_REQUIRED: 3,
    SKETCH_REQUIRED: 4,
    EDGES_OUTLINE_ENABLED: 5
};

export const Rc = {
    NONE: 0,
    GRID: 1,
    ANGLE: 2,
    MULTIPLE_ANGLE: 3,
    PARALLEL_2: 4,
    OTHER_SHAPE_CORNER: 5,
    OTHER_SHAPE_BORDER: 6
};

export const entityProps = {
    adjustZ: "adjustZ",
    angle: "angle",
    areaAsParcel: "areaAsParcel",
    areaReduction: "areaReduction",
    backgroundColor: "backgroundColor",
    basementFloorsCount: "basementFloorsCount",
    basementFloorsHeight: "basementFloorsHeight",
    color: "color",
    dateInterval: "dateInterval",
    entityId: "entityId",
    entityType: "entityType",
    fillColor: "fillColor",
    floorHeight: "floorHeight",
    floorsCount: "floorsCount",
    fontSize: "fontSize",
    groundFloorsCount: "groundFloorsCount",
    groundFloorsHeight: "groundFloorsHeight",
    groundPoints: "groundPoints",
    height: "height",
    index: "index",
    innerRotation: "innerRotation",
    isImported: "isImported",
    labelBackgroundColor: "labelBackgroundColor",
    markerSize: "markerSize",
    opacity: "opacity",
    outlineColor: "outlineColor",
    outlineWidth: "outlineWidth",
    roofAngle: "roofAngle",
    roofColor: "roofColor",
    roofControlsEnabled: "roofControlsEnabled",
    roofFloorHeight: "roofFloorHeight",
    roofFloorsCount: "roofFloorsCount",
    roofOverhang: "roofOverhang",
    roofRotationIndex: "roofRotationIndex",
    roofType: "roofType",
    scaleX: "scaleX",
    shortcutText: "shortcutText",
    showBackground: "showBackground",
    showFill: "showFill",
    showFloors: "showFloors",
    showOutline: "showOutline",
    snapToTerrain: "snapToTerrain",
    text: "text",
    textColor: "textColor",
    textNotRequired: "textNotRequired",
    totalFloorArea: "totalFloorArea",
    totalFloorVolume: "totalFloorVolume",
    usage: "usage",
    visibleFrom: "visibleFrom",
    visibleTo: "visibleTo",
    volume: "volume",
    volumeReduction: "volumeReduction",
    x: "x",
    y: "y"
};

export const Polygon3DIdPrefix = "polygon-3d";

export const defaultValues = {
    Ao: true,
    volumeReduction: 0,
    usage: 0,
    showFloors: true,
    basementFloorsHeight: 3.2,
    basementFloorsCount: 0,
    areaReduction: 0,
    QO: 0,
    roofType: 0,
    roofAngle: 15,
    groundFloorsHeight: 4.5,
    groundFloorsCount: 1,
    gq: 0.2617993877991494,
    floorHeight: 3.2,
    _3: 0.075
};

export const ScreenDirections = {
    LEFT: 0,
    RIGHT: 1
};

export const DraggingStates = {
    BEGIN: 0,
    DRAGGING: 1,
    FINISHED: 2
};

export const LabelAlignments = {
    leading: "leading",
    trailing: "trailing"
};

export const DragStates = {
    NONE: 0,
    DRAGGING: 1
};

export const PointCategories = {
    SIDE_POINT: "SIDE_POINT",
    VERTEX_POINT: "VERTEX_POINT"
};

export const KC = new Color(55 / 255, 137 / 255, 242 / 255);

export const xw = "rotation";
export const EMe = "move-circle";
export const dz = "rotation-circle";
export const hz = "axis";

export const DimensionLabelTypes = {
    HTML: 1,
    EDITOR: 2,
    TEXT: 0
};

export const TrackingModes = {
    PLANE: 0,
    TERRAIN: 1,
    TERRAIN_WITH_OBJECTS: 2
};

export const k_ = {
    DOWN: 0,
    UP: 1
};

export function getClickPixelTolerance(viewer) {
    return viewer.scene.screenSpaceCameraController._aggregator._eventHandler._clickPixelTolerance;
}

export function isSamePosition(screenPosition1, screenPosition2, pixelTolerance) {
    const i = screenPosition1.x - screenPosition2.x;
    const r = screenPosition1.y - screenPosition2.y;

    return Math.sqrt(i * i + r * r) < pixelTolerance;
}

export const EntityTypes = {
    POLYGON_2D: 1,
    POLYGON_3D: 2,
    POLYLINE: 3,
    WALLS: 4,
    PICKER: 5,
    MODEL: 6,
    CONTAINER: 7,
    TEXT: 8,
    BUILDING: 9,
    TILESET: 10,
    GLTF: 11,
    BUILDING_FLOOR: 12,
    TERRAIN: 13,
    MARKER: 14,
    MEASURE_DISTANCE: 15,
    MEASURE_HEIGHT: 16,
    MEASURE_POSITION: 17
};

export const toolIds = {
    basic: {
        building: "building",
        polygonEdit: "polygonEdit"
    }
};

export const Vr = {
    angle: 4,
    point: 5,
    x: 1,
    y: 2,
    z: 3
};

export const RoofTypes = {
    basic: {
        FLAT: 0,
        DOUBLEPITCH: 1,
        MONOPITCH: 2
    }
};

export const Axes = { X: 0, Y: 1, Z: 2 };

export const iy = 0.001;

export function checkInfinitePosition(position) {
    if (Number.isFinite(position.x) === false) throw new Error("X coordinate is invalid");
    if (Number.isFinite(position.y) === false) throw new Error("Y coordinate is invalid");
    if (Number.isFinite(position.z) === false) throw new Error("Z coordinate is invalid");
}

function z3t(e) {
    return `x: ${e.x}, y: ${e.y}, z: ${e.z}`;
}

export function checkDuplicatedPositions(e) {
    for (let t = 0; t < e.length; ++t) checkInfinitePosition(e[t]);
    for (let t = 0; t < e.length; ++t) {
        const n = e[t];
        if (Cartesian3.equalsEpsilon(n, e[t + (1 % e.length)], 0, iy))
            throw Error(`Points at indexes ${t}, ${t + (1 % e.length)} are the same: (${z3t(n)})`);
    }
}

export const jIe = (roofType, roofAngle, roofRotationIndex, positions) => {
    let r = 0;

    if (positions.length === 4 && roofAngle > 0 && (roofType === RoofTypes.basic.DOUBLEPITCH || roofType === RoofTypes.basic.MONOPITCH)) {
        const a = positions[0];
        const s = positions[1];
        const l = positions[positions.length - 1];
        const c = roofRotationIndex % 2 === 0 ? s.x - a.x : l.x - a.x;
        const h = roofRotationIndex % 2 === 0 ? s.y - a.y : l.y - a.y;
        let f = Math.sqrt(c * c + h * h);

        if (roofType === RoofTypes.basic.DOUBLEPITCH) {
            f /= 2;
        }

        r = f * Math.tan(CesiumMath.toRadians(roofAngle));
    }

    return r;
};

export function removeDuplicatedPositions(positions) {
    if (positions.length === 0) return [];
    if (positions.length === 1) return [positions[0]];
    const t = [positions[0]];
    let n = 1;

    for (; n < positions.length; ) {
        const r = positions[n];

        if (Cartesian3.equalsEpsilon(t[t.length - 1], r, 0, iy) === false) {
            t.push(r);
        }

        ++n;
    }

    if (Cartesian3.equalsEpsilon(t[0], t[t.length - 1], 0, iy)) {
        t.splice(t.length - 1, 1);
    }

    return t;
}

export function getFinitePositions(positions) {
    return positions.filter((t, n) => {
        const i = Number.isFinite(t.x) && Number.isFinite(t.y) && Number.isFinite(t.z);

        if (!i) {
            console.error(`Filtering out invalid point at index ${n}: `, t);
        }

        return i;
    });
}

export function calcCenterPoint(positions) {
    let t = Number.POSITIVE_INFINITY;
    let n = Number.NEGATIVE_INFINITY;
    let i = Number.POSITIVE_INFINITY;
    let r = Number.NEGATIVE_INFINITY;
    let a = Number.POSITIVE_INFINITY;
    let s = Number.NEGATIVE_INFINITY;

    for (const l of positions) {
        t = Math.min(t, l.x);
        n = Math.max(n, l.x);
        i = Math.min(i, l.y);
        r = Math.max(r, l.y);
        a = Math.min(a, l.z);
        s = Math.max(s, l.z);
    }

    return new Cartesian3(t + (n - t) / 2, i + (r - i) / 2, a + (s - a) / 2);
}

export function checkCondition(condition, errorMsg) {
    if (!condition) throw new DeveloperError(`${errorMsg} must be true`);
}

export function getLeftOrRightPointInfo(direction, points, modelMatrix, scene) {
    const r = points
        .map((s, l) => ({
            index: l,
            pointLocal: s,
            pointWC: Matrix4.multiplyByPoint(modelMatrix, s, new Cartesian3())
        }))
        .map((s) => {
            s.screenPoint = SceneTransforms.wgs84ToWindowCoordinates(scene, s.pointWC);

            return s;
        })
        .filter((s) => s.screenPoint)
        .sort((s, l) => l.screenPoint.x - s.screenPoint.x);

    return direction === ScreenDirections.RIGHT ? r[0] : r[r.length - 1];
}

export const getDefaultLanguage = () => (navigator.languages?.length ? navigator.languages[0] : navigator.language);

export function pickObject(event, viewer) {
    if (event.picked) {
        return event.picked;
    }

    try {
        if ("endPosition" in event) {
            const n = viewer.scene.pick(event.endPosition);
            event.picked = n;
            return n;
        }
        if ("position" in event) {
            const n = viewer.scene.pick(event.position);
            event.picked = n;

            return n;
        }
    } catch {
        console.error("Cannot obtain event position for getPicked()");
    }
}

export const BuildingIdPrefix = "building";
const ModelIdPrefix = "model";
const GroundPolygonIdPrefix = "ground-polygon";
const GroundLineIdPrefix = "ground-line";
const TextIdPrefix = "text";
const WallEntityPrefix = "wall-entity";
const TerrainIdPrefix = "terrain";

export function isToolEntityIdString(e) {
    return !(
        typeof e !== "string" ||
        !(
            e.startsWith(BuildingIdPrefix) ||
            e.startsWith(ModelIdPrefix) ||
            e.startsWith(GroundPolygonIdPrefix) ||
            e.startsWith(Polygon3DIdPrefix) ||
            e.startsWith(GroundLineIdPrefix) ||
            e.startsWith(TextIdPrefix) ||
            e.startsWith(WallEntityPrefix) ||
            e.startsWith(TerrainIdPrefix) ||
            e.startsWith("marker")
        )
    );
}

export function drillPick(event, viewer) {
    if (event.drillPicked) return event.drillPicked;

    try {
        if (event.endPosition) {
            const pickedObjects = viewer.scene.drillPick(event.endPosition, 2, 2, 2);
            event.drillPicked = pickedObjects;

            return pickedObjects;
        }

        if (event.position) {
            const pickedObjects = viewer.scene.drillPick(event.position, 2);
            event.drillPicked = pickedObjects;

            return pickedObjects;
        }
    } catch {
        console.error("drillPick error");
    }

    return [];
}

export const utils = {
    rayPlane: function (ray, plane, result) {
        if (!defined(ray)) throw new DeveloperError("ray is required.");
        if (!defined(plane)) throw new DeveloperError("plane is required.");

        if (!defined(result)) {
            result = new Cartesian3();
        }

        const origin = ray.origin;
        const direction = ray.direction;
        const planeNormal = plane.normal;
        const dotProduct = Cartesian3.dot(planeNormal, direction);

        if (!(Math.abs(dotProduct) < CesiumMath.EPSILON15)) {
            const l = (-plane.distance - Cartesian3.dot(planeNormal, origin)) / dotProduct;

            if (!(l < 0)) {
                result = Cartesian3.multiplyByScalar(direction, l, result);

                return Cartesian3.add(origin, result, result);
            }
        }
    }
};

export function ctrlPressed(event, t) {
    const n = event || window.event;

    return (t && !n.ctrlKey) || (!t && n.ctrlKey);
}

export function getAngle(p1, p2) {
    return Math.atan2(p1.x * p2.y - p1.y * p2.x, p1.x * p2.x + p1.y * p2.y);
}

export function H_(e, t) {
    const n = defaultValue(t.pixelSize, 5);
    const i = defaultValue(t.color, Color.WHITE);
    const r = defaultValue(t.outlineColor, Color.BLACK);
    const a = defaultValue(t.depthTest, false);
    const s = defaultValue(t.selectable, true);
    const c = e.add({
        id: t.id,
        position: t.position,
        pixelSize: n,
        color: i,
        outlineColor: r,
        outlineWidth: 1,
        show: true,
        disableDepthTestDistance: a ? undefined : Number.POSITIVE_INFINITY,
        allowPicking: s
    });

    c.pickGroup = PickGroups.EDGES_DISABLED;

    return c;
}

export function getPositions(positions, position, angle, scale) {
    scale = defaultValue(scale, 1);

    const r = [];
    const a = Matrix3.fromRotationZ(angle);
    const s = Matrix4.fromRotationTranslation(a);

    for (let l = 0; l < positions.length; l += 1) {
        const c = Cartesian3.multiplyByScalar(positions[l], scale, new Cartesian3());
        const h = Matrix4.multiplyByPoint(s, c, new Cartesian3());

        r[l] = Cartesian3.add(position, h, new Cartesian3());
    }

    return r;
}

export function getPositionsArr(options) {
    const t = options.index;
    const n = options.polygon;
    const r = t;
    const s = options.points[t];

    let l = n.getLine(t === 0 ? n.linesCount - 1 : t - 1)?.reversed;
    let c = n.getLine(r);

    if (!l || !c) {
        console.error("!left || !rightline");
        return;
    }

    if (n.isClockwise) {
        const L = l;
        l = c;
        c = L;
    }

    const f = c.vectorNormalized;
    let m = getAngle(f, l.vectorNormalized);

    if (m < 0) {
        m = 2 * Math.PI + m;
    }

    const _ = [];
    const v = [];
    const A = Math.PI / 18;
    let x = m / 2;

    for (; x >= 0; x -= A) {
        const L = Math.cos(x);
        const U = Math.sin(x);

        _.push(new Cartesian3(L, U, 0));
    }

    if (x < 0) {
        const L = Math.cos(0);
        const U = Math.sin(0);

        _.push(new Cartesian3(L, U, 0));
    }

    for (x = m / 2; x <= m; x += A) {
        const L = Math.cos(x);
        const U = Math.sin(x);

        v.push(new Cartesian3(L, U, 0));
    }

    if (x > m) {
        const L = Math.cos(m);
        const U = Math.sin(m);

        v.push(new Cartesian3(L, U, 0));
    }

    const b = getAngle(Cartesian3.UNIT_X, f);
    const T = s.clone();
    const S = 0.2 * Math.min(l.length, c.length);

    T.z = options.height;

    return [
        getPositions(_, T, b, S).map((L) => Matrix4.multiplyByPoint(options.modelMatrix, L, new Cartesian3())),
        getPositions(v, T, b, S).map((L) => Matrix4.multiplyByPoint(options.modelMatrix, L, new Cartesian3()))
    ];
}

export function setMarginLeftFloat(element, labelAlignment) {
    const { style: n } = element;

    if (labelAlignment === LabelAlignments.trailing) {
        n.marginLeft = "-100%";
        n.float = "left";
    } else {
        n.marginLeft = "";
        n.float = "";
    }
}

export const ga = {
    Z: () => true // ?
};

export function getPlane(position, screenPosition, viewer) {
    const camera = viewer.scene.camera;
    const a = Plane.fromPointNormal(position, Ellipsoid.WGS84.geodeticSurfaceNormal(position));
    const l = new Cartesian2(viewer.canvas.offsetWidth / 2, screenPosition.y);
    const c = camera.getPickRay(l);
    const point = c ? utils.rayPlane(c, a, new Cartesian3()) : undefined;

    if (!point) return;

    const m = Plane.projectPointOntoPlane(a, camera.position);
    const _ = Cartesian3.subtract(m, point, new Cartesian3());
    const normal = Cartesian3.normalize(_, new Cartesian3());

    return Plane.fromPointNormal(point, normal);
}

export class LineInfo {
    constructor(axe, positions, toWorld, scene) {
        this.axe = axe;
        this.line = positions;

        const localCenter = calcCenterPoint(positions);
        const worldCenter = Matrix4.multiplyByPoint(toWorld, localCenter, new Cartesian3());

        this.middlePoint2d = SceneTransforms.wgs84ToWindowCoordinates(scene, worldCenter);
    }
}

const q3t = new Cartesian3();
const Q3t = new Cartesian3();

export function w2(e, t, n) {
    const i = Cartesian2.subtract(e, t, q3t);
    const r = Cartesian2.subtract(n, t, Q3t);

    return Math.atan2(i.x * r.y - i.y * r.x, i.x * r.x + i.y * r.y);
}

export const ote = CesiumMath.toRadians(5);

export function eMe(e) {
    return (
        e?.length === 4 &&
        e
            .map((t, n) => {
                const a = w2(e[(n + 1) % 4], t, e[(n + 3) % 4]);
                return Math.abs(a - Math.PI / 2);
            })
            .every((t) => t < ote)
    );
}
