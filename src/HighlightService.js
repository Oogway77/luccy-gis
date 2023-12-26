import { pickObject, isToolEntityIdString, drillPick } from "./common";
import { PickUtil } from "./PickUtil";

export class HighlightService {
    constructor(cesiumTools) {
        this.tools = cesiumTools;
    }

    mouseMove(event) {
        const viewer = this.tools.viewer;

        if (!viewer) return;

        const pickedObject = pickObject(event, viewer);

        if (pickedObject) {
            const id = pickedObject.id ? pickedObject.id : pickedObject.primitive.id;

            if (isToolEntityIdString(id) && pickedObject.primitive) {
                this.highlightPrimitive(id, event, pickedObject.primitive);
            } else {
                this.highlightPrimitive(undefined, event, null);
            }
        } else this.highlightPrimitive(undefined, event, null);
    }

    highlightPrimitive(id, event, primitive) {
        const viewer = this.tools.viewer;

        if (viewer)
            if (primitive) {
                const entity = this.tools.findToolEntity(id);

                if (entity) {
                    if (
                        // (!(a instanceof WallEntity) && this.tools.editShapeAllowed === false) ||
                        this.tools.editShapeAllowed === false ||
                        !this.tools.selectedEntities.find((m) => m.id === entity.id)
                    )
                        return;
                    const l = drillPick(event, viewer)
                        .map((m) => (m.id ? m.id : m.primitive.id))
                        .filter((m) => typeof m === "string" && m.startsWith(entity.idPrefix))
                        .map((m) => PickUtil.getId(m))
                        .filter((m) => !!m);
                    const h = l.filter((m) => entity.supportsHighlightId(m))[0];

                    if (h) {
                        entity.setHighlighted(h);
                        this.lastHighlightedPrimitiveId = PickUtil.toString(h);
                    } else {
                        entity.clearHighlighted();
                        this.lastHighlightedPrimitiveId = undefined;
                    }

                    const currentTool = this.tools.currentTool;
                    if (currentTool && currentTool.setHighlighted(l)) {
                        this.lastHighlightedPrimitiveId = "tool";
                    }
                } else {
                    this.lastHighlightedPrimitiveId = undefined;
                    const currentTool = this.tools.currentTool;
                    if (currentTool) {
                        currentTool.setHighlighted([]);
                    }
                }
            } else if (this.lastHighlightedPrimitiveId) {
                this.tools.findToolEntity(this.lastHighlightedPrimitiveId)?.clearHighlighted();
                this.lastHighlightedPrimitiveId = undefined;
                const currentTool = this.tools.currentTool;

                if (currentTool) {
                    currentTool.setHighlighted([]);
                }
            }
    }
}
