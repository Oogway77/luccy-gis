/* qeslint-disable */
// q@ts-nocheck

// @ts-ignore
import { Cesium3DTileset, ManagedArray, Model, PrimitiveCollection } from "cesium";

class VisibilityState {
    constructor() {
        this.states = new ManagedArray();
        this.count = 0;
    }

    hidePrimitiveCollection(primitiveCollection) {
        const primitivesLength = primitiveCollection.length;

        for (let i = 0; i < primitivesLength; ++i) {
            const primitive = primitiveCollection.get(i);

            if (primitive instanceof PrimitiveCollection) {
                this.hidePrimitiveCollection(primitive);
                continue;
            }

            this.states.push(primitive.show);

            if (primitive instanceof Cesium3DTileset || primitive instanceof Model) {
                continue;
            }

            primitive.show = false;
        }
    }

    restorePrimitiveCollection(primitiveCollection) {
        const primitivesLength = primitiveCollection.length;

        for (let i = 0; i < primitivesLength; ++i) {
            const primitive = primitiveCollection.get(i);

            if (primitive instanceof PrimitiveCollection) {
                this.restorePrimitiveCollection(primitive);
                continue;
            }

            primitive.show = this.states.get(this.count++);
        }
    }

    hide(scene) {
        this.states.length = 0;

        this.hidePrimitiveCollection(scene.primitives);
        this.hidePrimitiveCollection(scene.groundPrimitives);
    }

    restore(scene) {
        this.count = 0;

        this.restorePrimitiveCollection(scene.primitives);
        this.restorePrimitiveCollection(scene.groundPrimitives);
    }
}

export default VisibilityState;
