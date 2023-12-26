import { getPositionsArr } from "./common";
import { createPolylinePrimitive } from "./createPolylinePrimitive";

export function createPolylinePrimitives(options) {
    const { idPrefix: t } = options;

    const positionsArr = getPositionsArr({
        index: options.index,
        modelMatrix: options.modelMatrix,
        points: options.points,
        polygon: options.polygon,
        height: options.height
    });

    if (!positionsArr) {
        return [];
    }

    const [i, r] = positionsArr;

    return [
        createPolylinePrimitive({
            id: `${t}:0`,
            positions: i,
            color: options.color,
            width: options.width,
            hasArrow: options.hasArrow,
            alwaysOnTop: options.alwaysOnTop
        }),
        createPolylinePrimitive({
            id: `${t}:1`,
            positions: r,
            color: options.color,
            width: options.width,
            hasArrow: options.hasArrow,
            alwaysOnTop: options.alwaysOnTop
        })
    ];
}
