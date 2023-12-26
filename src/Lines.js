/* eslint-disable max-classes-per-file */
import { Cartesian3 } from "cesium";

const scratchCartesian1 = new Cartesian3();
const scratchCartesian2 = new Cartesian3();
const scratchCartesian3 = new Cartesian3();

export class Line {
    constructor(point0, point1) {
        this.p0 = point0;
        this.p1 = point1;
    }

    crossProductNormalized(t) {
        const n = Cartesian3.subtract(this.p1, this.p0, scratchCartesian1);
        const i = Cartesian3.subtract(t.p1, t.p0, scratchCartesian2);
        const r = Cartesian3.cross(n, i, scratchCartesian3);

        return Cartesian3.normalize(r, new Cartesian3());
    }

    get points() {
        return [this.p0, this.p1];
    }

    get vector() {
        return Cartesian3.subtract(this.p1, this.p0, new Cartesian3());
    }

    get vectorNormalized() {
        const t = this.vector;
        return Cartesian3.normalize(t, t);
    }

    get reversed() {
        return new Line(this.p1.clone(), this.p0.clone());
    }

    get middlePoint() {
        return new Cartesian3(
            this.p0.x + (this.p1.x - this.p0.x) / 2,
            this.p0.y + (this.p1.y - this.p0.y) / 2,
            this.p0.z + (this.p1.z - this.p0.z) / 2
        );
    }

    get length() {
        return Cartesian3.distance(this.p1, this.p0);
    }

    // eslint-disable-next-line consistent-return
    closestPointOnLine(t) {
        const n = this.p0;
        const i = this.p1;
        const r = new Cartesian3(t.x - n.x, t.y - n.y, 0);
        const a = new Cartesian3(i.x - n.x, i.y - n.y, 0);
        const s = a.x * a.x + a.y * a.y;
        const l = a.x * r.x + a.y * r.y;
        const c = l / s;

        if (!(c < 0 || l > s)) return new Cartesian3(n.x + a.x * c, n.y + a.y * c, 0);
    }
}

export class Lines {
    static createFromPoints(points) {
        // eslint-disable-next-line no-param-reassign
        points = points.filter((r) => Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.z));

        const n = [];

        for (let r = 1; r < points.length; ++r) {
            const a = new Line(points[r - 1], points[r]);
            n.push(a);
        }

        if (points.length > 2) {
            const r = new Line(points[points.length - 1], points[0]);
            n.push(r);
        }

        const i = n.filter((r) => r.length > 0);

        return new Lines(i);
    }

    constructor(lines) {
        this._lines = [];
        this._lines = lines;
    }

    get isPolygon() {
        return this._lines.length >= 3;
    }

    get pointsCount() {
        return this._lines.length;
    }

    get linesCount() {
        return this._lines.length;
    }

    getLine(index) {
        return this._lines[index];
    }

    // eslint-disable-next-line class-methods-use-this
    areLinesIntersecting() {
        return true;
    }

    get area() {
        let t = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const n of this._lines) t += n.p0.x * n.p1.y - n.p1.x * n.p0.y;

        return Math.abs(t) / 2;
    }

    getPoint(index) {
        return this._lines[index].p0;
    }

    get points() {
        return this._lines.map((t) => t.p0);
    }

    // eslint-disable-next-line getter-return, consistent-return
    get isClockwise() {
        let t = 0;
        for (let n = 0; n < this._lines.length; ++n) {
            const i = this._lines[n].p0;
            const r = this._lines[n].p1;
            t += (r.x - i.x) * (i.y + r.y);
        }
        if (t !== 0) return t >= 0;
    }

    optimize() {
        this._lines = this._lines.filter((t) => t.length > 1e-8);
    }
}

export function createGroundPointsOfBox(dimension) {
    const halfWidth = dimension.x / 2;
    const halfHeight = dimension.y / 2;

    const points = [
        new Cartesian3(-halfWidth, -halfHeight, 0),
        new Cartesian3(halfWidth, -halfHeight, 0),
        new Cartesian3(halfWidth, halfHeight, 0),
        new Cartesian3(-halfWidth, halfHeight, 0)
    ];

    let ret = points;

    if (Lines.createFromPoints(points).isClockwise) {
        ret = points.reverse();
    }

    return ret;
}
