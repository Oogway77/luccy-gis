/* eslint-disable no-unused-expressions */
/* eslint-disable no-return-assign */
import { Cartesian2, defaultValue } from "cesium";

import { LabelAlignments, setMarginLeftFloat } from "./common";

export class Label {
    constructor(options) {
        this._text = options.text;
        this._alignment = defaultValue(options.alignment, LabelAlignments.leading);
        this.labelService = options.labelService;
        this._offset = options.offset ?? new Cartesian2(0, 0);
        this._alignment = options.alignment ?? LabelAlignments.leading;
        this._cesiumPosition = options.position;
        const viewer = options.labelService.viewer;
        this.container = (function (e) {
            const t = document.createElement("div");
            const { style: n } = t;
            const i = e.viewer.scene.cartesianToCanvasCoordinates(e.cesiumPosition, new Cartesian2());
            return (
                i ? ((n.left = `${i.x + e.offset.x}px`), (n.top = `${i.y + e.offset.y}px`)) : ((n.left = "100px"), (n.top = "10px")),
                t.classList.add("map-tooltip"),
                t
            );
        })({
            cesiumPosition: this._cesiumPosition,
            offset: this._offset,
            viewer: viewer
        });
        viewer.container.appendChild(this.container);
        options.labelService.addCesiumText(this);
        this.createLabel();
        this.tick();
    }

    destroy() {
        this.labelService.removeCesiumText(this);
        this.destroyLabel();
    }

    tick() {
        const i = this.labelService.viewer.scene.cartesianToCanvasCoordinates(this._cesiumPosition, new Cartesian2());
        if (i) {
            const r = this.container.style;
            r.left = `${i.x + this._offset.x}px`;
            r.top = `${i.y + this._offset.y}px`;
        }
    }

    get text() {
        return this._text;
    }

    set text(t) {
        this._text !== t && ((this._text = t), this.label && (this.label.innerHTML = t));
    }

    get cesiumPosition() {
        return this._cesiumPosition;
    }

    set cesiumPosition(t) {
        this._cesiumPosition = t;
        this.tick();
    }

    get offset() {
        return this._offset;
    }

    set offset(t) {
        this._offset = t;
        this.tick();
    }

    get alignment() {
        return this._alignment;
    }

    set alignment(t) {
        this._alignment = t;

        if (this.label) {
            setMarginLeftFloat(this.label, t);
        }
    }

    createLabel() {
        this.label ||
            ((this.label = (function (e) {
                const t = document.createElement("div");
                setMarginLeftFloat(t, e.alignment);
                t.classList.add("map-tooltip-inner");
                return t;
            })({ alignment: this._alignment })),
            this.container.appendChild(this.label),
            (this.label.innerHTML = this._text));
    }

    destroyLabel() {
        if (this.label) {
            this.container.parentElement?.removeChild(this.container);
            this.label = undefined;
        }
    }
}
