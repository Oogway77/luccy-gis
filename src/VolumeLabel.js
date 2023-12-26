/* eslint-disable no-else-return */
import { Cartesian2, Cartesian3, DeveloperError, Matrix4 } from "cesium";

import { getLeftOrRightPointInfo, ScreenDirections } from "./common";
import { Label } from "./Label";

export class VolumeLabel {
    constructor(options) {
        this._groundPoints = [];
        this._modelMatrix = Matrix4.IDENTITY;
        this._text = "";
        this._height = 0;
        this._labelService = options.labelService;
        this._viewer = options.viewer;
    }

    destroy() {
        if (this._label) {
            this._label?.destroy();
            this._label = undefined;
        }
    }

    get groundPoints() {
        return this._groundPoints;
    }

    set groundPoints(t) {
        this._groundPoints = t;
    }

    get modelMatrix() {
        return this._modelMatrix;
    }

    set modelMatrix(t) {
        if (!(t instanceof Matrix4)) throw new DeveloperError("Matrix must be defined.");
        this._modelMatrix = t;
    }

    get height() {
        return this._height;
    }

    set height(t) {
        this._height = t;
    }

    set text(t) {
        this._text = t;
        this.updateText();
    }

    update() {
        if (this._groundPoints.length < 1) {
            console.error("Not enough points to form tooltip", this._groundPoints);
            return false;
        }

        const t = this.rightMostTopPlanePoint;

        if (t) {
            if (this._label) {
                this._label.cesiumPosition = t;
            } else {
                this._label = new Label({
                    position: t,
                    text: this._text,
                    offset: new Cartesian2(20, -20),
                    labelService: this._labelService
                });
            }

            return true;
        } else {
            console.error("No position was found");
            return false;
        }
    }

    updateText() {
        if (this._label) {
            this._label.text = this._text;
        }
    }

    get rightMostTopPlanePoint() {
        const { scene: t } = this._viewer;
        const n = this.groundPoints.map((r) => new Cartesian3(r.x, r.y, this._height));
        return getLeftOrRightPointInfo(ScreenDirections.RIGHT, n, this._modelMatrix, t)?.pointWC;
    }
}
