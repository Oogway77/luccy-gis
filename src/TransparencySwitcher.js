import { Polygon3D } from "./Polygon3D";
import { Building } from "./dummyClasses";

export class TransparencySwitcher {
    constructor(options) {
        this.transparentEntities = {};
        this.tools = options.tools;
    }

    enableTransparency() {
        this.tools.entitiesList.forEach((t) => {
            this.addEntity(t, undefined);
        });
    }

    disableTransparency() {
        // eslint-disable-next-line no-restricted-syntax
        for (const t of Object.values(this.transparentEntities)) this.disableTransparencyFor(t);
        this.transparentEntities = {};
    }

    originalOpacityForEntityId(t) {
        return this.transparentEntities[t]?.opacity;
    }

    addEntity(t, n) {
        if (!this.transparentEntities[t.id] && (t instanceof Polygon3D || t instanceof Building)) {
            const i = Number.isFinite(n) ? n : t.opacity;
            this.transparentEntities[t.id] = { entity: t, opacity: i };
            t.opacity = 1;
        }
    }

    // eslint-disable-next-line class-methods-use-this
    disableTransparencyFor(t) {
        const n = t.entity;
        if (n instanceof Polygon3D || n instanceof Building) {
            n.opacity = t.opacity;
        }
    }
}
