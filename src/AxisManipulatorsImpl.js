/* eslint-disable no-restricted-syntax */
/* eslint-disable consistent-return */
/* qeslint-disable */

import { Cartesian3, Color, defaultValue, destroyObject, Matrix4, PointPrimitiveCollection } from "cesium";

import { Vr, KC, H_, hz } from "./common";
import { createPolylinePrimitive } from "./createPolylinePrimitive";

const wMe = 2;
const Bkt = 20;

function Tte(e, t) {
    if (e)
        return {
            axe: t,
            editable: defaultValue(e.editable, false),
            showArrow: defaultValue(e.showArrow, false),
            visible: defaultValue(e.visible, false),
            primitives: [],
            width: defaultValue(e.width, t === Vr.z ? Bkt : wMe)
        };
}

export class AxisManipulatorsImpl {
    constructor(options) {
        this._shouldRedraw = false;
        this._axesConfig = [];
        this._centerPointLocal = new Cartesian3();
        this._angleRad = 0;
        this._dragging = false;
        this._modelMatrix = options.modelMatrix;
        this._invModelMatrix = Matrix4.inverse(this._modelMatrix, new Matrix4());
        this._angleRad = options.angle;
        this._radius = options.radius;
        const n = Tte(options.xyConfig, Vr.x);

        if (n) {
            this._axesConfig[Vr.x] = n;
        }

        const i = Tte(options.xyConfig, Vr.y);

        if (i) {
            this._axesConfig[Vr.y] = i;
        }
        const r = Tte(options.zConfig, Vr.z);

        if (r) {
            this._axesConfig[Vr.z] = r;
        }

        const a = (function (e) {
            if (e)
                return {
                    axe: Vr.angle,
                    editable: defaultValue(e.editable, false),
                    showArrow: defaultValue(e.editable, false),
                    visible: defaultValue(e.visible, false),
                    primitives: [],
                    width: defaultValue(e.width, wMe)
                };
        })(options.angleConfig);

        if (a) {
            this._axesConfig[Vr.angle] = a;
        }

        const s = (function (e) {
            return {
                axe: Vr.point,
                editable: defaultValue(e.editable, false),
                visible: defaultValue(e.visible, false),
                primitives: [new PointPrimitiveCollection()],
                size: defaultValue(e.size, 20)
            };
        })(options.pointConfig);

        if (s) {
            this._axesConfig[Vr.point] = s;
        }
        this.idPrefix = options.id;
        this.prefix = `${options.id}:${hz}`;
        this._distanceFromCamera = options.distanceFromCamera;
        this._shouldRedraw = true;
    }

    update(t) {
        if (this._shouldRedraw) {
            this.removePrimitives();
            this.createPrimitives();
        }

        for (const n of this._axesConfig) if (n) for (const i of n.primitives) i?.update(t);
        this._shouldRedraw = false;
    }

    createPrimitives() {
        const t = this._axesConfig[Vr.x];
        if (t?.visible) {
            const s = this._highlightedPart === Vr.x ? Color.RED.withAlpha(0.3) : Color.RED;
            const l = Cartesian3.multiplyByScalar(Cartesian3.UNIT_X, 0.1, new Cartesian3());
            t.primitives = [
                createPolylinePrimitive({
                    id: `${this.prefix}:x`,
                    positions: this.adjustPoints([l, Cartesian3.UNIT_X], 0.5),
                    color: s,
                    modelMatrix: this._modelMatrix,
                    hasArrow: t.showArrow,
                    width: t.width,
                    selectable: t.editable,
                    alwaysOnTop: true
                })
            ];
        }
        const n = this._axesConfig[Vr.y];
        if (n?.visible) {
            const s = this._highlightedPart === Vr.y ? Color.GREEN.withAlpha(0.3) : Color.GREEN;
            const l = Cartesian3.multiplyByScalar(Cartesian3.UNIT_Y, 0.1, new Cartesian3());
            n.primitives = [
                createPolylinePrimitive({
                    id: `${this.prefix}:y`,
                    positions: this.adjustPoints([l, Cartesian3.UNIT_Y], 0.5),
                    color: s,
                    modelMatrix: this._modelMatrix,
                    hasArrow: n.showArrow,
                    width: n.width,
                    selectable: n.editable,
                    alwaysOnTop: true
                })
            ];
        }
        const i = this._axesConfig[Vr.z];
        if (i?.visible) {
            const s = Color.YELLOW;
            const l = Cartesian3.multiplyByScalar(Cartesian3.UNIT_Z, 0.1, new Cartesian3());
            i.primitives = [
                createPolylinePrimitive({
                    id: `${this.prefix}:z`,
                    positions: this.adjustPoints([l, Cartesian3.UNIT_Z]),
                    color: s,
                    modelMatrix: this._modelMatrix,
                    hasArrow: i.showArrow,
                    width: i.width,
                    selectable: i.editable,
                    alwaysOnTop: true
                })
            ];
        }
        const r = this._axesConfig[Vr.angle];
        if (r?.visible) {
            const s = this._highlightedPart === Vr.angle ? Color.BLUE.withAlpha(0.5) : Color.BLUE;
            const l = [];
            const c = [];
            const h = Math.PI / 180;
            for (let _ = 42; _ >= 0; _ -= 10) {
                const v = Math.cos(_ * h);
                const A = Math.sin(_ * h);
                l.push(new Cartesian3(v, A, 0));
            }
            for (let _ = 38; _ <= 90; _ += 10) {
                const v = Math.cos(_ * h);
                const A = Math.sin(_ * h);
                c.push(new Cartesian3(v, A, 0));
            }
            const f = this.adjustPoints(l, 0.6);
            const m = this.adjustPoints(c, 0.6);
            r.primitives = [
                createPolylinePrimitive({
                    id: `${this.prefix}:angle0`,
                    positions: f,
                    color: s,
                    modelMatrix: this._modelMatrix,
                    width: r.width,
                    hasArrow: r.showArrow,
                    selectable: r.editable,
                    alwaysOnTop: true
                }),
                createPolylinePrimitive({
                    id: `${this.prefix}:angle1`,
                    positions: m,
                    color: s,
                    modelMatrix: this._modelMatrix,
                    width: r.width,
                    hasArrow: r.showArrow,
                    selectable: r.editable,
                    alwaysOnTop: true
                })
            ];
        }
        const a = this._axesConfig[Vr.point];
        if (a?.visible) {
            const s = new PointPrimitiveCollection({ modelMatrix: this._modelMatrix });
            const l = this._highlightedPart === Vr.point ? KC : Color.WHITE;
            H_(s, {
                id: `${this.prefix}:point`,
                position: this._centerPointLocal.clone(),
                pixelSize: a.size,
                color: l,
                selectable: this._dragging === false && a.editable,
                outlineColor: KC
            });
            a.primitives = [s];
        }
    }

    removePrimitives() {
        for (const t of this._axesConfig)
            if (t) {
                for (const n of t.primitives) n.destroy();
                t.primitives = [];
            }
    }

    destroy() {
        this.removePrimitives();
        return destroyObject(this);
    }

    // eslint-disable-next-line class-methods-use-this
    isDestroyed() {
        return false;
    }

    get axesConfig() {
        return this._axesConfig;
    }

    get isDragging() {
        return this._dragging;
    }

    set isDragging(t) {
        if (this._dragging !== t) {
            this._dragging = t;
            this._shouldRedraw = true;
        }
    }

    get modelMatrix() {
        return this._modelMatrix;
    }

    set modelMatrix(t) {
        this._modelMatrix = t;
        this._invModelMatrix = Matrix4.inverse(this._modelMatrix, new Matrix4());
        this._shouldRedraw = true;
    }

    get distanceFromCamera() {
        return this._distanceFromCamera;
    }

    set distanceFromCamera(t) {
        if (this._distanceFromCamera !== t) {
            this._distanceFromCamera = t;
            this._shouldRedraw = true;
        }
    }

    get invModelMatrix() {
        return this._invModelMatrix;
    }

    get radius() {
        return this._radius;
    }

    set radius(t) {
        this._radius = t;
        this._shouldRedraw = true;
    }

    get angle() {
        return this._angleRad;
    }

    set angle(t) {
        if (t !== this._angleRad) {
            this._angleRad = t;
            this._shouldRedraw = true;
        }
    }

    set showZAxe(t) {
        const n = this._axesConfig[Vr.z];
        if (n.visible !== t) {
            n.visible = t;
            this._shouldRedraw = true;
        }
    }

    get highlightedPart() {
        return this._highlightedPart;
    }

    set highlightedPart(t) {
        this._highlightedPart = t;
        this._shouldRedraw = true;
    }

    set centerPointLocal(t) {
        this._centerPointLocal = t;
        this._shouldRedraw = true;
    }

    get centerPointLocal() {
        return this._centerPointLocal;
    }

    adjustPoints(t, n) {
        // eslint-disable-next-line no-param-reassign
        n = defaultValue(n, 1);
        const i = 0.1 * this._distanceFromCamera * n;
        const r = [];
        const a = new Cartesian3();

        for (let s = 0; s < t.length; ++s) {
            const l = Cartesian3.multiplyByScalar(t[s], i, a);
            r[s] = Cartesian3.add(this._centerPointLocal, l, new Cartesian3());
        }

        return r;
    }

    getVisiblePrimitives() {
        const ret = [];

        const axesConfig = this.axesConfig;

        axesConfig.forEach((axisConfig) => {
            if (axisConfig.visible) {
                axisConfig.primitives.forEach((primitive) => {
                    ret.push(primitive);
                });
            }
        });

        return ret;
    }
}
