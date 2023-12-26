import { Polygon3DIdPrefix } from "./common";
import { Polygon3D } from "./Polygon3D";
import { Building, GroundLine, GroundPolygon, Marker, Model } from "./dummyClasses";

export function findToolEntity(pickedObject, cesiiumTools) {
    let n;

    if (pickedObject) {
        const { id: i } = pickedObject;

        if (
            typeof i === "string" &&
            i.startsWith(Polygon3DIdPrefix)
            // (i.startsWith(Polygon3DIdPrefix) ||
            // i.startsWith(ModelIdPrefix) ||
            // i.startsWith(GroundLineIdPrefix) ||
            // i.startsWith(GroundPolygonIdPrefix) ||
            // i.startsWith(BuildingIdPrefix) ||
            // i.startsWith(xz))
        ) {
            const r = i.split(":");
            const a = parseInt(r[1], 10);

            if (Number.isFinite(a)) {
                const s = cesiiumTools.findToolEntity(a);

                if (
                    s instanceof Model ||
                    s instanceof GroundLine ||
                    s instanceof GroundPolygon ||
                    s instanceof Polygon3D ||
                    s instanceof Building ||
                    s instanceof Marker
                ) {
                    n = s;
                }
            }
        }
    }

    return n;
}
