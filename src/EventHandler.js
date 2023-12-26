import { MouseButton } from "./common";

export class EventsHandler {
    constructor(cesiumTools, cesiumEventsHandler) {
        this.tools = cesiumTools;
        this.eventHandler = cesiumEventsHandler;
        this.leftClickHandle = cesiumEventsHandler.addClickListenerAsFirst((i) => this.handleLeftClick(i));
        this.rightClickHandle = cesiumEventsHandler.addRightClickListener((i) => this.handleRightClick(i));
        this.doubleClickHandle = cesiumEventsHandler.addDoubleClickListener((i) => this.mouseDoubleCLick(i));
        this.mouseDownHandle = cesiumEventsHandler.addMouseDownListener((i) => this.handleMouseDown(i));
        this.mouseUpHandle = cesiumEventsHandler.addMouseUpListener((i) => this.handleMouseUp(i));
        this.mouseMoveHandle = cesiumEventsHandler.addMouseMoveListener((i) => this.handleMouseMove(i));
    }

    onDestroy() {
        this.eventHandler.removeListener(this.leftClickHandle);
        this.leftClickHandle = null;
        this.eventHandler.removeListener(this.rightClickHandle);
        this.rightClickHandle = null;
        this.eventHandler.removeListener(this.mouseDownHandle)((this.mouseDownHandle = null));
        this.eventHandler.removeListener(this.mouseUpHandle)((this.mouseUpHandle = null));
        this.eventHandler.removeListener(this.mouseMoveHandle)((this.mouseMoveHandle = null));
    }

    handleLeftClick(event) {
        let ret;

        if (this.tools.currentTool) {
            ret = this.tools.currentTool.handleClick(event);

            if (!ret && !event.preventToolsDefault) {
                ret = this.tools.defaultTool.handleClick(event);
            }
        } else {
            ret = this.tools.defaultTool.handleClick(event);
        }

        return ret;
    }

    handleRightClick(event) {
        let ret;

        if (this.tools.currentTool) {
            ret = this.tools.currentTool.handleRightClick(event);

            if (!ret && !event.preventToolsDefault) {
                ret = this.tools.defaultTool.handleRightClick(event);
            }
        } else {
            ret = this.tools.defaultTool.handleRightClick(event);
        }

        return ret;
    }

    mouseDoubleCLick(event) {
        let ret;

        if (this.tools.currentTool) {
            ret = this.tools.currentTool.mouseDoubleClick(event);

            if (!ret && !event.preventToolsDefault) {
                ret = this.tools.defaultTool.mouseDoubleClick(event);
            }
        } else {
            ret = this.tools.defaultTool.mouseDoubleClick(event);
        }

        return ret;
    }

    handleMouseDown(event) {
        let ret;

        if (event.button === MouseButton.LEFT) {
            if (this.tools.currentTool) {
                ret = this.tools.currentTool.mouseDown(event);

                if (!ret && !event.preventToolsDefault) {
                    ret = this.tools.defaultTool.mouseDown(event);
                }
            } else {
                ret = this.tools.defaultTool.mouseDown(event);
            }
        }

        return ret;
    }

    handleMouseUp(event) {
        let ret = false;

        if (event.button === MouseButton.LEFT) {
            if (this.tools.currentTool) {
                ret = this.tools.currentTool.mouseUp(event);

                if (!ret && !event.preventToolsDefault) {
                    ret = this.tools.defaultTool.mouseUp(event);
                }
            } else {
                ret = this.tools.defaultTool.mouseUp(event);
            }
        }

        return ret;
    }

    handleMouseMove(event) {
        let ret;

        if (this.tools.currentTool) {
            ret = this.tools.currentTool.mouseMove(event);

            if (!ret && !event.preventToolsDefault) {
                ret = this.tools.defaultTool.mouseMove(event);
            }
        } else {
            ret = this.tools.defaultTool.mouseMove(event);
        }

        return ret;
    }
}
