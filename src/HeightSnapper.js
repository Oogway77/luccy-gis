import { ctrlPressed } from "./common";

export class HeightSnapper {
    constructor(options) {
        this.entity = options.entity;
        this.snapSettings = options.snapSettings;
    }

    adjustHeight(event, height) {
        let ret = height;
        const { entity: polygon3D } = this;
        const ctrl = ctrlPressed(event, this.snapSettings().alwaysSnap);

        if (polygon3D && ctrl && this.snapSettings().cornerGrid)
            if (polygon3D.showFloors) {
                const l = height;
                const c = polygon3D.basementFloorsHeight * polygon3D.basementFloorsCount;
                const h = polygon3D.groundFloorsCount * polygon3D.groundFloorsHeight;
                ret =
                    // eslint-disable-next-line no-nested-ternary
                    l <= c
                        ? Math.round(l / polygon3D.basementFloorsHeight) * polygon3D.basementFloorsHeight
                        : l <= c + h
                        ? Math.round((l - c) / polygon3D.groundFloorsHeight) * polygon3D.groundFloorsHeight + c
                        : Math.round((l - (c + h)) / polygon3D.floorHeight) * polygon3D.floorHeight + c + h;
            } else {
                ret = Math.round(height);
            }

        return ret;
    }
}
