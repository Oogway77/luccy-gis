import { defaultValue } from "cesium";

import { entityProps } from "./common";
import { Bh } from "./dummyClasses";

let entityCount = 0;

export class ToolEntity {
    constructor(options) {
        this.initialized = false;
        this._destroyed = false;
        this._selected = false;
        this._highlighted = false;
        this._visibleAtCurrentTime = true;
        this.id = (function () {
            entityCount += 1;
            return entityCount;
        })();
        this.name = options.name;
        this.type = options.type;
        this.viewer = options.viewer;
        this._customData = options.customData ?? {};
        this._orderIndex = defaultValue(options.orderIndex, 0);
        this._locked = defaultValue(options.locked, false);
        this._visible = defaultValue(options.visible, true);
        this.visibleFrom = typeof options.visibleFrom === "string" ? new Date(options.visibleFrom) : options.visibleFrom;
        this.visibleTo = typeof options.visibleTo === "string" ? new Date(options.visibleTo) : options.visibleTo;
    }

    get isDestroyed() {
        return this._destroyed;
    }

    removeFromCesium(viewer) {
        this._selected = false;
        this._highlighted = false;
        this._destroyed = true;

        viewer.scene.requestRender();
    }

    get customData() {
        return this._customData;
    }

    get selected() {
        return this._selected;
    }

    set selected(t) {
        this._selected = t;
        this.selectionChanged(t);
    }

    get orderIndex() {
        return this._orderIndex;
    }

    set orderIndex(t) {
        if (t !== this._orderIndex) this._orderIndex = t;
    }

    get locked() {
        return this._locked;
    }

    set locked(t) {
        this._locked = t;
    }

    get parent() {
        return this._parent;
    }

    set parent(t) {
        this._parent = t;
    }

    get visible() {
        return this._visible;
    }

    set visible(t) {
        this._visible = t;
    }

    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
    selectionChanged(t) {}
    // eslint-disable-next-line class-methods-use-this , @typescript-eslint/no-unused-vars
    supportsHighlightId(t) {
        return false;
    }

    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
    setHighlighted(t) {}
    clearHighlighted() {
        this._highlighted = false;
    }

    get flatEntitiesTree() {
        return [this];
    }

    get visibleAtCurrentTime() {
        return this._visibleAtCurrentTime;
    }

    tick(t) {
        this._visibleAtCurrentTime = this.isVisible(t);
    }

    isVisible(t) {
        if (!this._visible) return false;
        const n = (0, Bh.Dh)(t);
        const i = (0, Bh.Dh)(this.visibleFrom);
        const r = (0, Bh.Dh)(this.visibleTo);

        return (!i || i <= n) && (!r || r >= n);
    }

    getAllPropertiesAsMap() {
        const t = new Map();
        return (
            t.set(entityProps.visibleFrom, this.visibleFrom ? this.visibleFrom : null),
            t.set(entityProps.visibleTo, this.visibleTo ? this.visibleTo : null),
            t.set(entityProps.entityType, this.type),
            t.set(entityProps.entityId, this.id),
            t
        );
    }
}
