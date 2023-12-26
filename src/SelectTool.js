import { defined, Entity } from "cesium";

import { MouseButton, pickObject, isToolEntityIdString, DraggingStates } from "./common";
import { AbstractTool } from "./AbstractTool";
import { Building, GroundLine, GroundPolygon, Model, PMe } from "./dummyClasses";
import { Polygon3D } from "./Polygon3D";

function shiftPressed(e) {
    return e.shiftKey;
}

export class SelectTool extends AbstractTool {
    constructor() {
        // eslint-disable-next-line prefer-rest-params
        super(...arguments);
        this.enableDnD = false;
    }

    handleClick(event) {
        if (this.cesiumTools.selectionEnabled === false || event.altKey) return false;
        const pickedObject = pickObject(event, this.viewer);

        if (defined(pickedObject)) {
            const object = pickedObject.id ? pickedObject.id : pickedObject.primitive.id;

            if (object instanceof Entity) {
                if (isToolEntityIdString(object.id)) {
                    const r = shiftPressed(event);
                    this.selectEntity(object, r);

                    return true;
                }

                if (object?.onClick) {
                    object.onClick();
                }

                return false;
            }

            if (isToolEntityIdString(object) && pickedObject.primitive) {
                const shift = shiftPressed(event);
                this.selectPrimitive(object, pickedObject.primitive, event, shift);

                return true;
            }

            if ("primitive" in pickedObject && pickedObject.primitive?.onClick) {
                pickedObject.primitive?.onClick();
            }

            this.selectEntity(undefined, false);
        } else {
            this.selectEntity(undefined, false);
        }

        return false;
    }

    mouseDown(t) {
        if (t.ctrlKey || t.altKey || t.shiftKey || t.button !== MouseButton.LEFT) return false;
        const n = pickObject(t, this.viewer);
        if (this.enableDnD && n) {
            const i = n.id ? n.id : n.primitive.id;
            if (isToolEntityIdString(i) && n.primitive) {
                const r = this.cesiumTools.findToolEntity(i);
                if (
                    this.isEntityOnlySelectedEntity(r) === false &&
                    (r instanceof Polygon3D ||
                        r instanceof Model ||
                        r instanceof Building ||
                        r instanceof GroundPolygon ||
                        r instanceof GroundLine)
                ) {
                    const s = this.viewer.scene;
                    const l = s.pickPosition(t.position);

                    this.draggingEntity = r;

                    this.pointDragManipulator = new PMe({
                        startDragPoint: l,
                        centerPoint: r.centerPoint,
                        snapToTerrain: r.snapToTerrain,
                        scene: s,
                        moveHandler: (c, h) => {
                            this.moveEntity(c, h);
                        }
                    });

                    this.pointDragManipulator.mouseDown(t);

                    return true;
                }
            }
        }
        return super.mouseDown(t);
    }

    mouseUp(t) {
        if (this.pointDragManipulator) {
            const n = this.pointDragManipulator.mouseUp(t);
            this.draggingEntity = undefined;
            this.pointDragManipulator = undefined;

            return n;
        }

        return super.mouseUp(t);
    }

    mouseMove(t) {
        return !(!this.draggingEntity || !this.pointDragManipulator) && this.pointDragManipulator.mouseMove(t);
    }

    selectEntity(entity, shift) {
        this.viewer.selectedEntity = entity;
        this.cesiumTools.selectCesiumEntity(entity, shift);
    }

    selectPrimitive(id, primitive, event, r) {
        if (this.cesiumTools.editShapeAllowed !== false) {
            this.viewer.selectedEntity = undefined;
            this.cesiumTools.selectCesiumPrimitive(id, primitive, event, r);
        }
    }

    moveEntity(t, n) {
        if (n !== DraggingStates.BEGIN && this.draggingEntity) {
            this.draggingEntity.centerPoint = t;
            this.viewer.scene.requestRender();

            if (n === DraggingStates.FINISHED) {
                this.cesiumTools.entitiesUpdated([this.draggingEntity]);
            }
        }
    }

    isEntityOnlySelectedEntity(t) {
        if (!t) return false;
        const n = this.cesiumTools.selectedEntities;
        return !(n.length === 0 || n.length > 1) && n[0].id === t.id;
    }
}
