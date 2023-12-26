/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
import { EntityTypes } from "./common";
import { ToolEntity } from "./ToolEntity";
import { Polygon3D } from "./Polygon3D";
import { Model } from "./dummyClasses";

export class EntityContainer extends ToolEntity {
    constructor(options) {
        super({
            name: options.name,
            viewer: options.viewer,
            type: EntityTypes.CONTAINER,
            locked: options.locked,
            orderIndex: options.orderIndex,
            visible: options.visible,
            visibleFrom: options.visibleFrom,
            visibleTo: options.visibleTo,
            customData: options.customData
        });
        this._entities = [];
        this.centerPoint = options.centerPoint;
    }

    addChildren(t) {
        t.forEach((n) => {
            this._entities.push(n);
            n.parent = this;
        });
    }

    get children() {
        return [...this._entities];
    }

    getChild(t) {
        return this._entities[t];
    }

    get childrenCount() {
        return this._entities.length;
    }

    get idPrefix() {
        return "";
    }

    removeFromCesium(t) {
        super.removeFromCesium(t);
        this.children.forEach((n) => {
            n.removeFromCesium(t);
        });
    }

    setCenterPointAndAngleRad(t, n) {
        this.centerPoint = t;
        for (const i of this._entities) {
            i.setCenterPointAndAngleRad(t, n);
        }
    }

    get flatEntitiesTree() {
        return [this, ...this._entities];
    }

    removeChild(t) {
        const n = this._entities.findIndex((i) => i.id === t.id);
        if (n >= 0) {
            this._entities.splice(n, 1);
        }
    }

    clone() {
        const t = new EntityContainer({
            name: this.name,
            centerPoint: this.centerPoint.clone(),
            viewer: this.viewer,
            orderIndex: 0,
            customData: { ...this.customData },
            locked: this._locked,
            visible: this._visible,
            visibleFrom: this.visibleFrom,
            visibleTo: this.visibleTo
        });

        const n = this.children.map((i) => (i instanceof Model || i instanceof Polygon3D ? i.clone() : null)).filter((i) => !!i);

        t.addChildren(n);

        return t;
    }

    get snapToTerrain() {
        let t = true;

        if (this.children.length > 0) {
            const n = this.children[0];

            if (n instanceof Model || n instanceof Polygon3D) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                t = n.snapToTerrain;
            }
        }

        return true;
    }
}
