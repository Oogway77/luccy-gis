/* eslint-disable no-return-assign */
/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
import { defined } from "cesium";

export class PickUtil {
    static toString(options) {
        return Number.isFinite(options.componentIndex)
            ? `${options.entityType}:${options.entityId}:${options.componentType}:${options.componentIndex}`
            : `${options.entityType}:${options.entityId}:${options.componentType}`;
    }

    static toStringFromPrefix(t) {
        return defined(t.componentIndex) ? `${t.prefix}:${t.componentType}:${t.componentIndex}` : `${t.prefix}:${t.componentType}`;
    }

    static isPickedPartOfEntity(t) {
        const n = t.picked;
        if (n) {
            const i = n.id ? n.id : n.primitive.id;
            if (typeof i === "string") return i.startsWith(t.componentType ? `${t.prefix}:${t.componentType}` : t.prefix);
        }
        return false;
    }

    static getId(t) {
        if (t) {
            const n = t.split(":");
            if (n) {
                let i = parseInt(n[3], 10);
                return (
                    Number.isFinite(i) === false && (i = n[3]),
                    {
                        entityType: n[0],
                        entityId: parseInt(n[1], 10),
                        componentType: n[2],
                        componentIndex: i
                    }
                );
            }
        }
    }

    static getPickedId(pickedObject, n) {
        if (!pickedObject) return;
        const i = pickedObject.id ? pickedObject.id : pickedObject.primitive?.id;
        if (typeof i !== "string") return;
        const r = this.getId(i);
        if (r) {
            if (!n) return r;
            if (!n.idPrefix || `${r?.entityType}:${r?.entityId}` === n.idPrefix) {
                if (n.componentType) {
                    const a = typeof n.componentType === "string" ? [n.componentType] : n.componentType;
                    let s = false;
                    // eslint-disable-next-line no-unused-expressions
                    for (const l of a) r.componentType === l && (s = true);
                    if (s === false) return;
                }
                return r;
            }
        }
    }

    static getComponentIndexNum(t) {
        const n = this.getComponentIndex(t);
        return Number.isFinite(n) ? n : undefined;
    }

    static getComponentIndex(t) {
        const n = PickUtil.getPickedId(t.picked);
        if (n) {
            const i = typeof t.componentType === "string" ? [t.componentType] : t.componentType;
            for (const r of i)
                if (`${n.entityType}:${n.entityId}:${n.componentType}`.startsWith(`${t.idPrefix}:${r}`)) return n.componentIndex;
        }
    }

    static getEntityComponentIdByPrefix(t, n) {
        const i = PickUtil.getPickedId(t);
        if (i && `${i.entityType}:${i.entityId}` === n) return i;
    }
}
