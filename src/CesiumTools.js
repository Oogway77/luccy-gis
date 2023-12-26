/* eslint-disable no-lonely-if */
/* eslint-disable complexity */
/* eslint-disable consistent-return */
/* eslint-disable default-case */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
import { Cartesian2, Event } from "cesium";

import { EntityTypes, toolIds, k_ } from "./common";

import { BuildingTool } from "./BuildingTool";
import { LabelGenerator } from "./LabelGenerator";
import { LabelService } from "./LabelService";
import { HighlightService } from "./HighlightService";
import { EventsHandler } from "./EventHandler";
import { SelectTool } from "./SelectTool";
import { EntityCreator } from "./EntityCreator";
import { Polygon3DEditTool } from "./Polygon3DEditTool";
import { EE } from "./dummyClasses";

import { EntityContainer } from "./EntityContainer";

const toolTypesSet = new Set([
    toolIds.basic.distance,
    toolIds.basic.height,
    toolIds.basic.elevation,
    toolIds.basic.groundLine,
    toolIds.basic.groundPolygon,
    toolIds.basic.groundText,
    toolIds.basic.marker,
    toolIds.basic.walls,
    toolIds.basic.picker,
    toolIds.basic.model,
    toolIds.basic.importModel,
    toolIds.basic.excludeObjects,
    toolIds.basic.polygon,
    toolIds.basic.building,
    toolIds.basic.building2,
    toolIds.basic.fpsMode,
    toolIds.basic.locationSelect
]);

const Ls = {
    hD: () => {}
};
export class CesiumTools {
    constructor() {
        this.elementListeners = [];
        this.selectedToolEntities = [];
        this.persistentEntities = {};

        this.editShapeAllowed = true;
        this.selectedToolEntities = [];
        this.currentMousePosition = new Cartesian2();
        this.selectionEnabled = true;

        this.labelGenerator = new LabelGenerator(this, undefined);
        this.entitiesSelected = new Event();
        this.updatedEntities = new Event();
    }

    setup(options) {
        this.viewer = options.viewer;
        this.labelService = new LabelService(this.viewer);
        this.highlightService = new HighlightService(this);
        options.cesiumEventHandler.addMouseMoveListenerAsFirst((event) => {
            this.highlightService.mouseMove(event);
            return false;
        });

        this.eventsHandler = new EventsHandler(this, options.cesiumEventHandler);
        this.elementListeners.push({
            element: this.viewer?.canvas,
            eventType: "keydown",
            fn: this.keyDownHandler.bind(this)
        });
        this.elementListeners.push({
            element: this.viewer?.canvas,
            eventType: "keyup",
            fn: this.keyUpHandler.bind(this)
        });
        this.viewer?.canvas.setAttribute("tabindex", "0");
        this.defaultTool = new SelectTool(toolIds.basic.select, this);
        this.defaultTool.setup(this.viewer);

        if (this.viewer) {
            this.entityCreator = new EntityCreator(this);
        }
        this.elementListeners.push({
            element: window,
            eventType: "mousemove",
            fn: (r) => {
                if (!this.viewer?.cesiumWidget) return;
                const a = this.viewer.scene.canvas;
                const s = a.getBoundingClientRect();
                const h = r.clientX - s.left;
                const f = r.clientY - s.top;
                const m = h * (a.width / a.offsetWidth);
                const _ = f * (a.height / a.offsetHeight);

                if (m >= 0 && _ >= 0 && h < s.width && f < s.height) {
                    this.currentMousePosition.x = m;
                    this.currentMousePosition.y = _;
                }
            }
        });

        this.elementListeners.forEach((r) => r.element.addEventListener(r.eventType, r.fn, r.options));
        // (this.timerService = new KUt()),
        // this.timerService.updateEntities(this);
    }

    keyDownHandler(n) {
        if ((n.preventDefault(), n.key === "Control" || n.key === "Alt" || n.key === "Shift")) {
            this._curentCtrlAltShiftState = {
                ctrlKey: n.ctrlKey,
                altKey: n.altKey,
                shiftKey: n.shiftKey
            };
            const a = { ...this._curentCtrlAltShiftState, upOrDown: k_.DOWN };
            this.handleCtrlAltShiftKeyChange(a);
        }
        const i = this.isMac ? n.metaKey : n.ctrlKey;
        const r = n.key === "Z" || n.key === "z";

        if (r && i && n.shiftKey) {
            if (this._currentTool instanceof EE) {
                this._currentTool?.performRedo();
            }
        } else {
            if (r && i && this._currentTool instanceof EE) {
                this._currentTool?.performUndo();
            }
        }
    }

    keyUpHandler(n) {
        n.preventDefault();
        let i = false;
        if (n.key === "Escape") i = this.handleEscapePress();
        else if (n.key === "Enter") i = this.handleEnterPress();
        else if (n.key === "Delete") i = this.handleDeletePress();
        else if (n.key === "Backspace") i = this.handleDeletePress();
        else if (n.key === "Control" || n.key === "Alt" || n.key === "Shift") {
            this._curentCtrlAltShiftState = {
                ctrlKey: n.ctrlKey,
                altKey: n.altKey,
                shiftKey: n.shiftKey
            };
            const r = { ...this._curentCtrlAltShiftState, upOrDown: k_.UP };
            this.handleCtrlAltShiftKeyChange(r);
        }

        if (i) {
            n.cancelBubble = true;
        }
    }

    get entitiesList() {
        return Object.values(this.persistentEntities);
    }

    get snapping() {
        return {
            alwaysSnap: true,
            cornerAngle: true,
            cornerGrid: true,
            cornerOtherShapeBorder: true,
            cornerOtherShapeCorner: true,
            cornerParalel: true,
            moveOtherShapeCorner: true
        };
    }

    get currentTool() {
        return this._currentTool;
    }

    canCreateEntityOfType() {
        return true;
    }

    getToolDefaults(toolId) {
        if (toolId === toolIds.basic.polygon) {
            return {
                adjustZ: 0,
                angle: 0,
                areaReduction: 0,
                basementFloorsCount: 0,
                basementFloorsHeight: 3.2,
                color: Cesium.Color.WHITE,
                //   Le {red: 1, green: 1, blue: 1, alpha: 1},
                floorHeight: 3.2,
                groundFloorsCount: 1,
                groundFloorsHeight: 4.5,
                roofAngle: 0,
                showFloors: true,
                snapToTerrain: true,
                volumeReduction: 0,
                x: 10,
                y: 10
            };
        }
    }

    findDefaultEntityName() {
        return "Building 1";
    }

    entitiesCreated(entities) {
        for (const i of entities) {
            if (this.persistentEntities[i.id]) throw new Error(`Entity with id ${i.id} already exists.`);
        }

        for (const i of entities) {
            this.persistentEntities[i.id] = i;

            if (i instanceof EntityContainer) {
                for (const r of i.children) {
                    this.persistentEntities[r.id] = r;
                }
            }
        }

        /*
      this._shapeCreatedEmitter.next(n),
        this.timerService.updateEntities(this);
        */
    }

    selectEntity(entity, shiftPressed) {
        if (entity?.isDestroyed) {
            throw (console.error("Cannot select entity that is destroyed", entity), new Error(`Entity ${entity.id} is already destroyed`));
        }

        if (entity?.locked) {
            this.store.dispatch((0, Ls.hD)({ entityName: entity.name }));
            this.emitEntitiesSelected([]);
            return;
        }

        if (!this.canSelectEntityHandler || this.canSelectEntityHandler(entity) !== false)
            if (shiftPressed) {
                if (entity.selected) {
                    this.selectedToolEntities = this.selectedToolEntities.filter((a) => a.id !== entity.id);
                } else {
                    this.selectedToolEntities.push(entity);
                }

                entity.selected = !entity.selected;

                if (this.selectedToolEntities.length === 0) {
                    this.selectTool(toolIds.basic.select);
                    this.emitEntitiesSelected([]);
                } else if (this.selectedToolEntities.length === 1)
                    switch ((this.doSelectSingleEntity(this.selectedToolEntities[0]), entity.type)) {
                        case EntityTypes.MODEL:
                        case EntityTypes.POLYLINE:
                        case EntityTypes.POLYGON_2D:
                        case EntityTypes.POLYGON_3D:
                        case EntityTypes.TEXT:
                        case EntityTypes.BUILDING:
                        case EntityTypes.MARKER:
                        case EntityTypes.TERRAIN:
                            this.emitEntitiesSelected([...this.selectedToolEntities]);
                    }
                else {
                    this.selectTool(toolIds.basic.multiSelect);
                    this._currentTool.selectedEntities = this.selectedToolEntities;
                    this.emitEntitiesSelected([...this.selectedToolEntities]);
                }
            } else {
                for (const r of this.selectedToolEntities) {
                    r.selected = false;
                }

                this.selectedToolEntities = [entity];
                this.doSelectSingleEntity(entity);

                switch (entity.type) {
                    case EntityTypes.MODEL:
                    case EntityTypes.POLYGON_2D:
                    case EntityTypes.POLYGON_3D:
                    case EntityTypes.TEXT:
                    case EntityTypes.POLYLINE:
                    case EntityTypes.BUILDING:
                    case EntityTypes.MARKER:
                    case EntityTypes.TERRAIN:
                        this.emitEntitiesSelected([entity]);
                }
            }
    }

    emitEntitiesSelected(n) {
        this.entitiesSelected.raiseEvent(n);
        // this._entitiesSelectedEmitter.next(n);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    emitToolChanged(n) {
        // this.toolChangedEmitter.next(n);
    }

    doSelectSingleEntity(entity) {
        let toolId;

        switch (entity.type) {
            case EntityTypes.POLYGON_2D:
                toolId = toolIds.basic.groundPolygonEdit;
                break;
            case EntityTypes.POLYLINE:
                toolId = toolIds.basic.groundLineEdit;
                break;
            case EntityTypes.WALLS:
                toolId = toolIds.basic.editWalls;
                break;
            case EntityTypes.PICKER:
            case EntityTypes.MODEL:
                toolId = toolIds.basic.modelEdit;
                break;
            case EntityTypes.POLYGON_3D:
                toolId = toolIds.basic.polygonEdit;
                break;
            case EntityTypes.TEXT:
                toolId = toolIds.basic.groundTextEdit;
                break;
            case EntityTypes.BUILDING:
                toolId = toolIds.basic.buildingBlocks;
                break;
            case EntityTypes.MARKER:
                toolId = toolIds.basic.markerEdit;
                break;
            case EntityTypes.TERRAIN:
                toolId = toolIds.basic.terrainEdit;
        }

        if (toolId) {
            this.selectTool(toolId);
            this.currentTool.selectedEntity = entity;
        }
    }

    selectTool(toolType) {
        if (this._currentTool?.type === toolType || !this.viewer?.cesiumWidget || this.isToolBeingSelectedJustNow) {
            return;
        }

        this.isToolBeingSelectedJustNow = true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const selectedToolEntities = [...this.selectedToolEntities];

        try {
            const oldToolType = this.currentTool?.type || toolIds.basic.select;

            if (this.viewer?.canvas) {
                this.focus();
            }

            this.beforeSwitchTools();
            this._currentTool?.onDestroy();

            if (toolType == null) {
                // eslint-disable-next-line no-param-reassign
                toolType = toolIds.basic.select;
            }

            switch (toolType) {
                case toolIds.basic.building:
                    this._currentTool = new BuildingTool(this);
                    break;
                case toolIds.basic.polygonEdit:
                    this._currentTool = new Polygon3DEditTool(this);
                    break;

                default:
                    this._currentTool = undefined;
            }

            if (this.currentTool) {
                this.currentTool.setup(this.viewer);

                if (oldToolType !== this.currentTool.type) {
                    this.emitToolChanged(this.currentTool.type);
                }
            } else {
                if (toolType === toolIds.basic.pluginTool) {
                    this.emitToolChanged(toolIds.basic.pluginTool);
                } else {
                    if (oldToolType !== toolIds.basic.select) {
                        this.emitToolChanged(toolIds.basic.select);
                    }
                }
            }

            if (toolTypesSet.has(toolType) || toolType === toolIds.basic.select || !toolType) {
                this.deselectAll(false);
            }
        } catch (r) {
            console.error(`Cannot select tool: ${toolType}`, r);
        } finally {
            this.isToolBeingSelectedJustNow = false;
        }
    }

    focus() {
        if (!new URLSearchParams(window.location.search)?.get("embedded") && !this.embedded) {
            this.viewer?.canvas.focus();
        }
    }

    beforeSwitchTools(n = true) {
        if (this.currentTool && n) {
            this.currentTool.cancelTool();
        }
    }

    selectCesiumEntity(entity, shiftPressed) {
        if (entity) {
            const foundEntity = this.findToolEntity(entity.id);

            if (foundEntity) {
                this.selectEntity(foundEntity, shiftPressed);
            } else {
                this.deselectAll();
                if (!entity?.properties?.luucy_actions) {
                    this.emitEntitiesSelected([]);
                }
            }
        } else this.deselectAll();
    }

    selectCesiumPrimitive(id, primitive, event, shiftPressed) {
        if (primitive) {
            const foundEntity = this.findToolEntity(id);

            if (foundEntity) {
                this.selectEntity(foundEntity, shiftPressed);
                this.highlightService.highlightPrimitive(id, event, primitive);
            } else {
                console.error(`Cannot find cesium '${id}' primitive in tool entities`, primitive, this.persistentEntities);
            }
        } else {
            this.deselectAll();
        }
    }

    findToolEntity(n) {
        if (undefined === n) return;

        if (typeof n !== "string") return this.persistentEntities[n];

        const i = n.split(":");
        if (i.length < 2) return;
        const a = parseInt(i[1], 10);

        return this.persistentEntities[a];
    }

    entitiesUpdated(n) {
        this.updatedEntities.raiseEvent(n);
        /*
            this._shapesUpdatedEmitter.next(n),
            this.timerService.updateEntities(this);
      */
    }

    deselectAll(n = true) {
        console.info("need to revise deselectAll");

        for (const i of this.selectedToolEntities) i.selected = false;

        this.emitEntitiesSelected([]);

        if (n) {
            this.selectTool(null);
        }

        this.selectedToolEntities = [];
        this.viewer?.scene.requestRender();
    }

    get selectedEntities() {
        return this.selectedToolEntities;
    }
}
