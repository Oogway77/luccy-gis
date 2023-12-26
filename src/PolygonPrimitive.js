/* eslint-disable no-lonely-if */
/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {
    Cartesian3,
    Color,
    ColorGeometryInstanceAttribute,
    ComponentDatatype,
    CoplanarPolygonGeometry,
    destroyObject,
    GeometryAttribute,
    GeometryInstance,
    HeadingPitchRoll,
    Matrix4,
    Primitive,
    ShadowMode,
    Transforms
} from "cesium";

import {
    RoofTypes,
    checkDuplicatedPositions,
    checkInfinitePosition,
    jIe,
    removeDuplicatedPositions,
    getFinitePositions,
    calcCenterPoint,
    PickGroups
} from "./common";
import { MaterialCreator } from "./MaterialCreator";
import { Yd } from "./dummyClasses";

function ete(e) {
    const t = new Cartesian3(0, 0, 0);
    for (let n = 0; n < e.length; n += 1) {
        const i = e[n];
        const r = e[(n + 1) % e.length];
        t.x += (i.y - r.y) * (i.z + r.z);
        t.y += (i.z - r.z) * (i.x + r.x);
        t.z += (i.x - r.x) * (i.y + r.y);
    }
    return Cartesian3.magnitude(t) === 0 ? new Cartesian3(0, 0, 1) : Cartesian3.normalize(t, t);
}
function rte(e, t) {
    return e > 0.85 ? e * t : (1 - t) * (1 - e) + e;
}

function JIe(e) {
    const t = e.clone();
    t.red = rte(e.red, 0.8);
    t.green = rte(e.green, 0.8);
    t.blue = rte(e.blue, 0.8);

    return t;
}

const WIe = (e, t, n, i, r) => {
    const a = [];

    for (let s = 0; s < r.length; s += 1) {
        const l = r[s].clone();
        const c = s === r.length - 1 ? r[0].clone() : r[s + 1].clone();
        const h = c.clone();
        h.z = e;
        const f = l.clone();
        f.z = e;
        let m = [l, c, h, f];

        if (n > 0)
            if (t === RoofTypes.basic.MONOPITCH) {
                const _ = (i + s) % 4;

                if (_ === 0) {
                    h.z = e + n;
                } else {
                    if (_ === 1) {
                        h.z = e + n;
                        f.z = e + n;
                    } else {
                        if (_ === 2) {
                            f.z = e + n;
                        }
                    }
                }
            } else if (s % 2 === i % 2) {
                const _ = calcCenterPoint([h, f]);
                _.z = e + n;
                m = [l, c, h, _, f];
            }
        a.push(m);
    }
    return a;
};

class X8 {
    constructor(options) {
        this.isHorizontal = options.isHorizontal;
        this.vertexes = options.vertexes;
        this.normal = options.normal;
        this.color = options.color;
        this.highlightColor = options.highlightColor;
        this.index = options.index;
        // (this.isGround = !!(0, WD.Z)(t.isGround) && t?.isGround);
        this.isGround = false;
    }

    get width() {
        return Cartesian3.distance(this.vertexes[0], this.vertexes[1]);
    }

    get lines() {
        const t = [];
        for (let n = 0; n < this.vertexes.length - 1; ++n) t.push([this.vertexes[n], this.vertexes[n + 1]]);
        return t;
    }
}

export class PolygonPrimitive {
    constructor(options) {
        this.__shouldRedraw = false;
        this.materialCreator = new MaterialCreator({
            floorHeight: 3.5,
            groundFloorsHeight: 4.5,
            groundFloorsCount: 1,
            basementFloorsHeight: 2.7,
            basementFloorsCount: 0
        });
        this._sides = [];
        this._angle = 0;
        this._shadow = true;
        this._groundPoints = [];
        this._showFloors = false;
        this._roofType = RoofTypes.basic.FLAT;
        this._roofAngle = 0;
        this._roofRotationIndex = 0;
        this._allowPicking = true;
        this._initialized = false;
        this._visibleAtCurrentTime = true;

        if (!options.groundPoints || options.groundPoints.length === 0)
            throw new Error("Cannot create polygon primitive with empty ground points");

        this._centerPoint = options.centerPoint;
        this._angle = options.angle;
        this.groundPoints = options.groundPoints;
        this._height = options.height;
        this._shadow = options.shadow;
        this._showFloors = options.showFloors;
        this._adjustZ = options.adjustZ;
        this._color = options.color;
        this._roofColor = options.roofColor;
        this._opacity = Number.isFinite(options.opacity) ? options.opacity : 1;
        this._roofType = options.roofType;
        this._roofAngle = options.roofAngle;
        this._roofRotationIndex = options.roofRotationIndex;
        this._pickGroup = options.pickGroup ?? PickGroups.EDGES_ENABLED;
        this._allowPicking = options.allowPicking;
        this.idPrefix = options.id;
        this._prefix = options.id;
        this._initialized = true;
        this._shouldRedraw = true;
    }

    set _shouldRedraw(t) {
        this.__shouldRedraw = t;

        if (t && this._initialized) {
            const n = this.createSides();
            this.createSidePrimitives(n);
        }
    }

    get _shouldRedraw() {
        return this.__shouldRedraw;
    }

    get pickGroup() {
        return this._pickGroup;
    }

    set pickGroup(t) {
        if (this._pickGroup !== t) {
            this._pickGroup = t;
            this._shouldRedraw = true;
        }
    }

    get angle() {
        return this._angle;
    }

    set angle(t) {
        if (Number.isFinite(t) === false) throw Error(`Angle is not valid: ${t}`);

        if (this._angle !== t) {
            this._angle = t;
            this._shouldRedraw = true;
        }
    }

    get roofType() {
        return this._roofType;
    }

    set roofType(t) {
        if (this._roofType !== t) {
            this._roofType = t;
            this._shouldRedraw = true;
        }
    }

    get roofAngle() {
        return this._roofAngle;
    }

    set roofAngle(t) {
        if (Number.isFinite(t) === false) throw new Error(`Angle is not valid: ${t}`);
        if (this._roofAngle !== t) {
            this._roofAngle = t;
            this._shouldRedraw = true;
        }
    }

    get roofRotationIndex() {
        return this._roofRotationIndex;
    }

    set roofRotationIndex(t) {
        if (this._roofRotationIndex !== t) {
            this._roofRotationIndex = t;
            this._shouldRedraw = true;
        }
    }

    get adjustZ() {
        return this._adjustZ;
    }

    set adjustZ(t) {
        if (Number.isFinite(t) === false) throw Error(`AdjustZ is not valid: ${t}`);
        if (this._adjustZ !== t) {
            this._adjustZ = t;
            this._shouldRedraw = true;
        }
    }

    get centerPoint() {
        return this._centerPoint;
    }

    set centerPoint(t) {
        checkInfinitePosition(t);
        this._centerPoint = t;
        this._shouldRedraw = true;
    }

    get height() {
        return this._height;
    }

    set height(t) {
        if (Number.isFinite(t) === false) throw new Error(`Height is not valid number: ${t}`);
        if (this._height !== t) {
            this._height = t;
            this._shouldRedraw = true;
        }
    }

    get groundPoints() {
        return this._groundPoints;
    }

    set groundPoints(t) {
        checkDuplicatedPositions(t);
        this._groundPoints = t;
        this._shouldRedraw = true;
    }

    get highlightedSideIndex() {
        return this._highlightedSideIndex;
    }

    set highlightedSideIndex(t) {
        if (this._highlightedSideIndex !== t) {
            this._highlightedSideIndex = t;
            this._shouldRedraw = true;
        }
    }

    get sides() {
        return this._sides;
    }

    get showFloors() {
        return this._showFloors;
    }

    set showFloors(t) {
        if (this._showFloors !== t) {
            this._showFloors = t;
            this._shouldRedraw = true;
        }
    }

    get shadow() {
        return this._shadow;
    }

    get color() {
        return this._color;
    }

    set color(t) {
        if (this._color.equals(t) === false) {
            this._color = t;
            this._shouldRedraw = true;
        }
    }

    get roofColor() {
        return this._roofColor;
    }

    set roofColor(t) {
        if (this._roofColor.equals(t) === false) {
            this._roofColor = t;
            this._shouldRedraw = true;
        }
    }

    get opacity() {
        return this._opacity;
    }

    set opacity(t) {
        if (this._opacity !== t) {
            this._opacity = t;
            this._shouldRedraw = true;
        }
    }

    setCenterPointAndAngleRad(t, n) {
        this._angle = n;
        this._centerPoint = t.clone(this._centerPoint);
        this._shouldRedraw = true;
    }

    get modelMatrix() {
        const t = this._centerPoint;
        const n = new Cartesian3(0, 0, this._adjustZ);
        const i = Matrix4.fromTranslation(n);
        const r = Transforms.headingPitchRollToFixedFrame(t, new HeadingPitchRoll(this.angle, 0, 0));
        return Matrix4.multiply(r, i, new Matrix4());
    }

    get visibleAtCurrentTime() {
        return this._visibleAtCurrentTime;
    }

    set visibleAtCurrentTime(t) {
        if (this._visibleAtCurrentTime !== t) {
            this._visibleAtCurrentTime = t;
            this._shouldRedraw = true;
        }
    }

    update(frameState) {
        if (this._shouldRedraw) {
            this.removePrimitives();
            this._sides = this.createSides();
            this.createSidePrimitives(this._sides);
        }

        if (this._visibleAtCurrentTime) {
            for (let n = 0; n < this._sides.length; n += 1) {
                this._sides[n].primitive?.update(frameState);
            }
        }

        this._shouldRedraw = false;
    }

    removePrimitives() {
        for (let t = 0; t < this._sides.length; t += 1) this._sides[t]?.primitive?.destroy();
        this._sides = [];
    }

    destroy() {
        for (let t = 0; t < this._sides.length; t += 1) this._sides[t].primitive?.destroy();

        this._sides = [];

        return destroyObject(this);
    }

    isDestroyed() {
        return false;
    }

    getSideId(t) {
        return `${this._prefix}:side:${t}`;
    }

    createSides() {
        const n = Cartesian3.multiplyByScalar(new Cartesian3(20, 20, 20), 0.5, new Cartesian3());
        Cartesian3.negate(n, new Cartesian3()).z = 0;

        const r = [];
        const a = jIe(this._roofType, this._roofAngle, this._roofRotationIndex, this._groundPoints);
        const l = removeDuplicatedPositions(getFinitePositions(this._groundPoints));
        const c = WIe(this._height, this._roofType, 0, this._roofRotationIndex, l);

        for (let m = 0; m < c.length; m += 1) {
            const _ = c[m];
            const v = ete(_);
            r[m] = new X8({
                isHorizontal: false,
                normal: v,
                vertexes: _,
                color: this._color.withAlpha(this._opacity),
                highlightColor: undefined,
                index: m
            });
        }
        if (a > 0) {
            const m = l.map((v) => {
                const A = v.clone();
                A.z = this._height;

                return A;
            });

            const _ = WIe(this._height, this._roofType, a, this._roofRotationIndex, m);

            for (const v of _) {
                const A = this.filterRoofWallPoints(v);
                if (A.length >= 3) {
                    const x = ete(A);
                    const b = new X8({
                        isHorizontal: true,
                        normal: x,
                        vertexes: A,
                        color: this._color.withAlpha(this._opacity),
                        highlightColor: undefined,
                        index: -1
                    });
                    r.push(b);
                }
            }
        }
        const h = ((e, t, n1, i, r1) => {
            const a1 = r1.map((l1) => l1.clone());
            let s = [a1];
            if (n1 > 0) {
                const l2 = a1[0];
                const c1 = a1[1];
                const h1 = a1[2];
                const f = a1[3];
                if (t === RoofTypes.basic.DOUBLEPITCH)
                    if (i % 2 === 0) {
                        const m = new Cartesian3(l2.x + (c1.x - l2.x) / 2, l2.y + (c1.y - l2.y) / 2, n1);
                        const _ = new Cartesian3(h1.x + (f.x - h1.x) / 2, h1.y + (f.y - h1.y) / 2, n1);
                        s = [
                            [l2, m, _, f],
                            [m, c1, h1, _]
                        ];
                    } else {
                        const m = new Cartesian3(c1.x + (h1.x - c1.x) / 2, c1.y + (h1.y - c1.y) / 2, n1);
                        const _ = new Cartesian3(l2.x + (f.x - l2.x) / 2, l2.y + (f.y - l2.y) / 2, n1);
                        s = [
                            [l2, c1, m, _],
                            [_, m, h1, f]
                        ];
                    }
                else {
                    if (t === RoofTypes.basic.MONOPITCH) {
                        if (i === 0) {
                            c1.z = n1;
                            h1.z = n1;
                        } else {
                            if (i === 1) {
                                l2.z = n1;
                                c1.z = n1;
                            } else {
                                if (i === 2) {
                                    l2.z = n1;
                                    f.z = n1;
                                } else {
                                    h1.z = n1;
                                    f.z = n1;
                                }
                            }
                        }
                    }
                }
            }
            return s.map((l3) => l3.map((c2) => new Cartesian3(c2.x, c2.y, c2.z + e)));
        })(this._height, this._roofType, a, this._roofRotationIndex, l);
        for (const m of h) {
            const _ = ete(m);
            const v = new X8({
                isHorizontal: true,
                normal: _,
                vertexes: m,
                color: this._roofColor.withAlpha(this.opacity),
                highlightColor: JIe(this._roofColor).withAlpha(this.opacity),
                index: -1
            });
            r.push(v);
        }

        const f = this.createFloorSide(l);
        r.push(f);

        return r;
    }

    createFloorSide(t) {
        const n = t.map((r) => {
            const a = r.clone();
            a.z = 0;

            return a;
        });

        return new X8({
            isHorizontal: true,
            normal: new Cartesian3(0, 0, -1),
            vertexes: n,
            color: this._color.withAlpha(this.opacity),
            highlightColor: JIe(this._color).withAlpha(this.opacity),
            isGround: true,
            index: -2
        });
    }

    filterRoofWallPoints(t) {
        const n = [];

        t.forEach((i) => {
            if (!n.find((a) => (0, Yd.Z)(i, a))) {
                n.push(i);
            }
        });

        return n;
    }

    createSidePrimitives(t) {
        const n = this.modelMatrix;
        for (let i = 0; i < t.length; i += 1) {
            const r = t[i];
            r.primitive = this.createSidePrimitive(r, i, n);
        }
    }

    createSidePrimitive(t, n, modelMatrix) {
        const r = [...t.vertexes];

        if (r.length < 3) {
            console.error(`Primitive at ${n} has invalid number of vertices.`, r);
            return;
        }

        let a = this._highlightedSideIndex === n ? t.highlightColor : t.color;

        if (!a) {
            a = t.color;
        }

        const s = t.isHorizontal === false && this._showFloors;
        const l = this.materialCreator.getVertexFormat({ showFloors: s });
        const c = CoplanarPolygonGeometry.fromPositions({
            positions: r,
            vertexFormat: l
        });
        const appearance = this.materialCreator.createMaterial({
            showFloors: s,
            totalH: this._height,
            color: a,
            translucent: !!a && a.alpha < 1,
            faceForward: true,
            closed: false
        });
        const { normal: f } = t;
        const m = r.length;
        const _ = new Float32Array(3 * m);

        for (let b = 0; b < m; b += 1) {
            if (f) {
                _[3 * b] = f.x;
                _[3 * b + 1] = f.y;
                _[3 * b + 2] = f.z;
            } else {
                _[3 * b] = 0;
                _[3 * b + 1] = 0;
                _[3 * b + 2] = 1;
            }
        }

        const geometry = CoplanarPolygonGeometry.createGeometry(c);

        if (!geometry) return;

        geometry.attributes.normal = new GeometryAttribute({
            componentDatatype: ComponentDatatype.FLOAT,
            componentsPerAttribute: 3,
            values: _
        });

        const id = this.getSideId(n);

        return new Primitive({
            geometryInstances: new GeometryInstance({
                id: id,
                geometry: geometry,
                modelMatrix: modelMatrix,
                attributes: {
                    color: ColorGeometryInstanceAttribute.fromColor(a ?? Color.WHITE),
                    depthFailColor: ColorGeometryInstanceAttribute.fromColor(a ?? Color.WHITE)
                }
            }),
            appearance: appearance,
            allowPicking: this._allowPicking,
            asynchronous: false,
            shadows: ShadowMode.ENABLED,
            pickGroup: this._pickGroup
        });
    }

    setNeedsUpdate() {
        this._shouldRedraw = true;
    }

    clone() {
        return new PolygonPrimitive({
            id: this.idPrefix,
            groundPoints: this.groundPoints.map((n) => n.clone()),
            height: this._height,
            color: this._color.clone(),
            roofColor: this._roofColor.clone(),
            opacity: this._opacity,
            angle: this._angle,
            shadow: this._shadow,
            adjustZ: this._adjustZ,
            showFloors: this._showFloors,
            roofType: this.roofType,
            roofAngle: this._roofAngle,
            roofRotationIndex: this._roofRotationIndex,
            centerPoint: this._centerPoint,
            pickGroup: this._pickGroup,
            allowPicking: this._allowPicking
        });
    }

    get show() {
        const sidePrimitives = this._sides;

        if (sidePrimitives.length === 0) {
            return false;
        }

        return sidePrimitives[0].primitive.show;
    }

    set show(show) {
        const sidePrimitives = this._sides;

        sidePrimitives.forEach((sidePrimitive) => {
            sidePrimitive.primitive.show = show;
        });
    }

    get primitives() {
        const ret = [];

        const sidePrimitives = this._sides;

        sidePrimitives.forEach((sidePrimitive) => {
            ret.push(sidePrimitive.primitive);
        });

        return ret;
    }
}
