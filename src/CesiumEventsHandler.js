/* eslint-disable no-return-assign */
/* eslint-disable no-lonely-if */
/* eslint-disable consistent-return */
/* eslint-disable no-restricted-syntax */
import { Cartesian2, defined, FeatureDetection } from "cesium";

import { getClickPixelTolerance, isSamePosition, MouseButton } from "./common";

function vte(e, t, n) {
    t.buttons = e.buttons == null ? 1 : e.buttons;
    t.altKey = e.altKey;
    t.shiftKey = e.shiftKey;
    t.ctrlKey = e.ctrlKey;
    t.picked = undefined;
    t.drillPicked = undefined;
    t.preventToolsDefault = false;
    t.startPosition = t.endPosition;
    t.endPosition = n;
}

function tx(e, t) {
    const n = new Cartesian2();

    if (t === document) {
        n.x = e.clientX;
        n.y = e.clientY;

        return n;
    }

    const i = t.getBoundingClientRect();

    n.x = e.clientX - i.left;
    n.y = e.clientY - i.top;

    return n;
}

function vMe(e) {
    let t;

    // eslint-disable-next-line no-cond-assign
    if ((t = "onwheel" in e)) {
        t = "wheel";
    } else {
        t = undefined !== document.onmousewheel ? "mousewheel" : "DOMMouseScroll";
    }

    return t;
}

function Pg(e, t, n) {
    t.altKey = e.altKey;
    t.shiftKey = e.shiftKey;
    t.ctrlKey = e.ctrlKey;
    t.picked = undefined;
    t.drillPicked = undefined;
    t.preventToolsDefault = false;
    t.position = n;
    t.button = e instanceof MouseEvent ? e.button : MouseButton.LEFT;
}

function F3t(e) {
    const n = e._aggregator;
    for (const i of Object.keys(n._isDown)) n._isDown[i] = false;
    for (const i of Object.keys(n._update)) n._update[i] = true;
}

function yte(e, t) {
    const n = e.changedTouches;
    if (!n[0]) return;
    const i = new Cartesian2();
    if (t === document) {
        i.x = n[0].clientX;
        i.y = n[0].clientY;
        return i;
    }

    const r = t.getBoundingClientRect();
    i.x = n[0].clientX - r.left;
    i.y = n[0].clientY - r.top;

    return i;
}

function Ekt(e, t) {
    const n = new Cartesian2();
    if (t === document) {
        n.x = e.clientX;
        n.y = e.clientY;

        return n;
    }

    const i = t.getBoundingClientRect();
    n.x = e.clientX - i.left;
    n.y = e.clientY - i.top;

    return n;
}

let listenerCount = 0;

export class CesiumEventsHandler {
    constructor(cesiumViewer) {
        this.viewer = cesiumViewer;
        this.elementListeners = [];
        this.previousMousePosition = undefined;
        this.leftClickListeners = [];
        this.leftClickPostListeners = [];
        this.rightClickListeners = [];
        this.doubleClicklisteners = [];
        this.mouseDownListeners = [];
        this.mouseUpListeners = [];
        this.mouseMoveListeners = [];
        this.wheelListeners = [];
        this._currentEvent = null;
        this.cameraIsMoving = false;
        this._interactionEnabled = false;
        this._touches = {};
        this._buttonsDown = [];
        this.mouseDownEventEx = {
            position: new Cartesian2(),
            button: MouseButton.LEFT,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            picked: undefined,
            preventToolsDefault: false
        };
        this.mouseUpEventEx = {
            position: new Cartesian2(),
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            picked: undefined,
            preventToolsDefault: false,
            button: MouseButton.LEFT
        };
        this.mouseMoveEvent = {
            startPosition: new Cartesian2(),
            endPosition: new Cartesian2(),
            shiftKey: false,
            altKey: false,
            ctrlKey: false,
            picked: undefined,
            preventToolsDefault: false,
            buttons: 0
        };
        this.mouseWheelEvent = {
            position: new Cartesian2(),
            shiftKey: false,
            altKey: false,
            ctrlKey: false,
            picked: undefined,
            preventToolsDefault: false,
            deltaMode: 0,
            deltaX: 0,
            deltaY: 0,
            deltaZ: 0
        };
        this.doubleClickEventEx = {
            position: new Cartesian2(),
            altKey: false,
            ctrlKey: false,
            shiftKey: false,
            picked: undefined,
            preventToolsDefault: false,
            button: MouseButton.LEFT
        };
        this.leftClickEventEx = {
            position: new Cartesian2(),
            altKey: false,
            ctrlKey: false,
            shiftKey: false,
            picked: undefined,
            preventToolsDefault: false,
            button: MouseButton.LEFT
        };
        this.rightClickEventEx = {
            position: new Cartesian2(),
            altKey: false,
            ctrlKey: false,
            shiftKey: false,
            picked: undefined,
            preventToolsDefault: false,
            button: MouseButton.RIGHT
        };
        this.mouseDownPosition = new Cartesian2();
        this.mouseDownMovedTooMuch = false;
        this.mouseDownTime = new Date();
        this._cameraMoveStartRemoveCallback = cesiumViewer.camera.moveStart.addEventListener(() => (this.cameraIsMoving = true));
        this._cameraMoveEndRemoveCallback = cesiumViewer.camera.moveEnd.addEventListener(() => (this.cameraIsMoving = false));
        const r = this.viewer.scene.screenSpaceCameraController._aggregator._eventHandler;
        this.clickPixelTolerance = getClickPixelTolerance(cesiumViewer);
        const { canvas: a } = cesiumViewer;
        const s = { capture: false, passive: false };

        (function (e, t) {
            if (e?._removalFunctions) {
                if (e._removalFunctions.mousedown) {
                    e._removalFunctions.mousedown();
                }
                if (e._removalFunctions.mouseup) {
                    e._removalFunctions.mouseup();
                }

                if (e._removalFunctions.mousemove) {
                    e._removalFunctions.mousemove();
                }

                if (e._removalFunctions.dblclick) {
                    e._removalFunctions.dblclick();
                }

                if (e._removalFunctions.pointercancel) {
                    e._removalFunctions.pointercancel();
                }
                if (e._removalFunctions.pointerdown) {
                    e._removalFunctions.pointerdown();
                }

                if (e._removalFunctions.pointermove) {
                    e._removalFunctions.pointermove();
                }
                if (e._removalFunctions.pointerup) {
                    e._removalFunctions.pointerup();
                }

                const n = vMe(t);

                if (e._removalFunctions[n]) {
                    e._removalFunctions[n]();
                }

                delete e._removalFunctions.mousedown;
                delete e._removalFunctions.mouseup;
                delete e._removalFunctions.mousemove;
                delete e._removalFunctions.dblclick;
                delete e._removalFunctions.pointercancel;
                delete e._removalFunctions.pointerdown;
                delete e._removalFunctions.pointermove;
                delete e._removalFunctions.pointerup;
                delete e._removalFunctions[n];
            }
        })(r, a);

        const l = a;

        if (FeatureDetection.supportsPointerEvents()) {
            this.elementListeners.push({
                element: l,
                eventType: "pointerdown",
                fn: (h) => {
                    this.handleNativePointerDown(h, a);
                }
            });
            this.elementListeners.push({
                element: l,
                eventType: "pointerup",
                fn: (h) => {
                    this.handleNativePointerUp(h, a);
                }
            });
            this.elementListeners.push({
                element: l,
                eventType: "pointermove",
                fn: (h) => {
                    this.handleNativePointerMove(h, a);
                }
            });
            this.elementListeners.push({
                element: l,
                eventType: "pointercancel",
                fn: (h) => {
                    this.handleNativePointerUp(h, a);
                }
            });
        } else {
            this.elementListeners.push({
                element: l,
                eventType: "mousedown",
                fn: (f) => {
                    this.handleNativeMouseDownEvent(f, a);
                },
                options: s
            });
            const h = defined(l.disableRootEvents) ? l : document;
            this.elementListeners.push({
                element: h,
                eventType: "mouseup",
                fn: (f) => {
                    this.handleNativeMouseUpEvent(f, a);
                },
                options: s
            });
            this.elementListeners.push({
                element: h,
                eventType: "mousemove",
                fn: (f) => {
                    this.handleNativeMouseMoveEvent(f, a);
                },
                options: s
            });
            this.elementListeners.push({
                element: l,
                eventType: "touchstart",
                fn: (f) => {
                    this.handleNativeTouchStartEvent(f, a);
                }
            });
            this.elementListeners.push({
                element: h,
                eventType: "touchend",
                fn: (f) => {
                    this.handleNativeTouchEndEvent(f, a);
                }
            });
            this.elementListeners.push({
                element: h,
                eventType: "touchmove",
                fn: (f) => {
                    this.handleNativeTouchMoveEvent(f, a);
                }
            });
            this.elementListeners.push({
                element: h,
                eventType: "touchcancel",
                fn: (f) => {
                    this.handleNativeTouchEndEvent(f, a);
                }
            });
        }

        this.elementListeners.push({
            element: l,
            eventType: "dblclick",
            fn: (h) => {
                this.handleNativeDoubleClickEvent(h, a);
            }
        });
        const c = vMe(l);
        this.elementListeners.push({
            element: l,
            eventType: c,
            fn: (h) => {
                this.handleNativeWhelEvent(h, a);
            }
        });

        this.completelyEnableInteraction();
    }

    onDestroy() {
        this.completelyDisableInteraction();
        this.viewer.camera.moveStart.removeEventListener(this._cameraMoveStartRemoveCallback);
        this.viewer.camera.moveEnd.removeEventListener(this._cameraMoveEndRemoveCallback);
    }

    get currentEvent() {
        return this._currentEvent;
    }

    get interactionEnabled() {
        return this._interactionEnabled;
    }

    completelyEnableInteraction() {
        if (!this.interactionEnabled) {
            this.elementListeners.forEach((t) => t.element.addEventListener(t.eventType, t.fn, t.options));
            this._interactionEnabled = true;
        }
    }

    completelyDisableInteraction() {
        if (this.interactionEnabled) {
            this.elementListeners.forEach((t) => t.element.removeEventListener(t.eventType, t.fn, t.options));
            this._interactionEnabled = false;
        }
    }

    handleNativePointerDown(t, n) {
        // const i = this.screenSpaceEventHandler;
        let r = false;
        if (t.pointerType === "touch") {
            const a = tx(t, n);
            this._touches[t.pointerId] = {
                position: a,
                timestamp: new Date(),
                touchId: t.pointerId
            };

            if (Object.keys(this._touches).length === 1) {
                Pg(t, this.mouseDownEventEx, a);
                this.handleMouseDown(this.mouseDownEventEx);
            }
        } else {
            const a = tx(t, n);
            this._buttonsDown[t.button] = {
                button: t.button,
                position: a,
                timestamp: new Date()
            };
            Pg(t, this.mouseDownEventEx, a);
            r = this.handleMouseDown(this.mouseDownEventEx);

            // custom code
            if (r) {
                this.viewer.scene.screenSpaceCameraController.enableRotate = false;
            }
            // custom code end
        }
        // false === r && i.handlePointerDown(i, t);
    }

    handleNativePointerUp(t, n) {
        let i = false;
        // const r = this.screenSpaceEventHandler;
        if (t.pointerType === "touch") {
            const a = this._touches[t.pointerId];
            if ((delete this._touches[t.pointerId], Object.keys(this._touches).length === 0 && a)) {
                const l = tx(t, n);
                Pg(t, this.mouseUpEventEx, l);
                this.handleMouseUp(this.mouseUpEventEx);
                this.processClickIfNecessary(t, a, l);
            }
        } else {
            const a = tx(t, n);
            Pg(t, this.mouseUpEventEx, a);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            i = this.handleMouseUp(this.mouseUpEventEx);
            this.processClickIfNecessary(t, this._buttonsDown[t.button], a);
        }
        // false === i && r.handlePointerUp(r, t);

        // custom code
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        // custom code end
    }

    handleNativeMouseDownEvent(t, n) {
        const i = tx(t, n);

        this._buttonsDown[t.button] = {
            button: t.button,
            position: i,
            timestamp: new Date()
        };
        Pg(t, this.mouseDownEventEx, i);

        if (this.handleMouseDown(this.mouseDownEventEx) === false) {
            // const a = this.screenSpaceEventHandler;
            // a.handleMouseDown(a, t);
        } else {
            // custom code
            this.viewer.scene.screenSpaceCameraController.enableRotate = false;
            // custom code end
        }
    }

    handleNativeMouseUpEvent(t, n) {
        const i = tx(t, n);
        Pg(t, this.mouseUpEventEx, i);
        this.handleMouseUp(this.mouseUpEventEx);
        this.processClickIfNecessary(t, this._buttonsDown[t.button], i);
        // const a = this.screenSpaceEventHandler;
        // a.handleMouseUp(a, t);

        // custom code
        this.viewer.scene.screenSpaceCameraController.enableRotate = true;
        // custom code end
    }

    handleNativeTouchStartEvent(t, n) {
        const i = this.screenSpaceEventHandler;
        const r = yte(t, n);
        for (let a = 0; a < t.changedTouches.length; a += 1) {
            const s = t.changedTouches.item(a);
            if (s) {
                const l = Ekt(s, n);
                this._touches[s.identifier] = {
                    position: l,
                    timestamp: new Date(),
                    touchId: s.identifier
                };
            }
        }
        if (t.touches.length === 1 && r) {
            Pg(t, this.mouseDownEventEx, r);
            const a = false;
            this.handleMouseDown(this.mouseDownEventEx);
            if (a === false) {
                i.handleTouchStart(i, t);
            }
        } else i.handleTouchStart(i, t);
    }

    handleNativeTouchEndEvent(t, n) {
        const i = yte(t, n);
        let r;
        for (let a = 0; a < t.changedTouches.length; a += 1) {
            const s = t.changedTouches.item(a);
            if (s) {
                r = this._touches[s.identifier];
                delete this._touches[s.identifier];
            }
        }
        if (t.touches.length === 0 && i) {
            if ((Pg(t, this.mouseUpEventEx, i), this.handleMouseUp(this.mouseUpEventEx) === false)) {
                const s = this.screenSpaceEventHandler;
                s.handleTouchEnd(s, t);
            }

            if (r) {
                this.processTouchClickIfNecessary(t, r, i);
            }
        } else {
            const a = this.screenSpaceEventHandler;
            a.handleTouchEnd(a, t);
        }
    }

    handleNativePointerMove(t, n) {
        const i = tx(t, n);
        if ((vte(t, this.mouseMoveEvent, i), this.handleMouseMove(this.mouseMoveEvent) === false)) {
            // const a = this.screenSpaceEventHandler;
            // a.handlePointerMove(a, t);
        }
    }

    handleNativeMouseMoveEvent(t, n) {
        const i = tx(t, n);
        if ((vte(t, this.mouseMoveEvent, i), this.handleMouseMove(this.mouseMoveEvent) === false)) {
            // const a = this.screenSpaceEventHandler;
            // a.handleMouseMove(a, t);
        }
    }

    handleNativeTouchMoveEvent(t, n) {
        if (t.touches.length === 1) {
            const i = yte(t, n);
            if (i && (vte(t, this.mouseMoveEvent, i), this.handleMouseMove(this.mouseMoveEvent) === false)) {
                const a = this.screenSpaceEventHandler;
                a.handleTouchMove(a, t);
            }
        } else {
            const i = this.screenSpaceEventHandler;
            i.handleTouchMove(i, t);
        }
    }

    handleNativeWhelEvent(t, n) {
        const i = tx(t, n);
        if (
            ((function (e, t1, n1) {
                Pg(e, t1, n1);
                t1.deltaMode = e.deltaMode;
                t1.deltaX = e.deltaX;
                t1.deltaY = e.deltaY;
                t1.deltaZ = e.deltaZ;
            })(t, this.mouseWheelEvent, i),
            this.handleWheelEvent(this.mouseWheelEvent))
        ) {
            t.preventDefault();
            this.stopCameraOrPropagateInput();
        } else {
            // const a = this.screenSpaceEventHandler;
            this.viewer.scene.screenSpaceCameraController._aggregator._currentMousePosition = i;
            // a.handleWheel(a, t);
        }
    }

    handleWheelEvent(t) {
        let n = false;
        for (let i = 0; i < this.wheelListeners.length; i += 1) {
            const r = this.wheelListeners[i];
            let a = false;
            try {
                a = r.fn(t);
            } catch (s) {
                console.error("Cannot handle wheel event", s);
            }
            if (a) {
                n = true;
                break;
            }
        }

        this._currentEvent = null;
        this.previousMousePosition = t.position;

        return n;
    }

    handleNativeDoubleClickEvent(t, n) {
        const i = tx(t, n);
        Pg(t, this.doubleClickEventEx, i);
        this.handleDoubleClickEvent(this.doubleClickEventEx);
    }

    handleDoubleClickEvent(event) {
        this._currentEvent = event;
        this.stopCameraOrPropagateInput();

        for (let n = 0; n < this.doubleClicklisteners.length; n += 1) {
            const i = this.doubleClicklisteners[n];
            let r = false;

            try {
                r = i.fn(event);
            } catch (a) {
                console.error("Cannot handle double click", a);
            }

            if (r) return true;
        }

        return false;
    }

    handleLeftClick(event) {
        let n = false;

        this._currentEvent = event;
        this.stopCameraOrPropagateInput();

        for (let i = 0; i < this.leftClickListeners.length; i += 1) {
            const r = this.leftClickListeners[i];
            let a = false;
            try {
                a = r.fn(event);
            } catch (s) {
                console.error("Cannot handle left click", s);
            }
            if (a) {
                n = true;
                break;
            }
        }
        for (let i = 0; i < this.leftClickPostListeners.length; i += 1) {
            const r = this.leftClickPostListeners[i];
            try {
                r.fn(event);
            } catch (a) {
                console.error("Cannot handle post left click", a);
            }
        }

        this._currentEvent = null;
        this.previousMousePosition = event.position;

        return n;
    }

    handleRightClick(event) {
        let n = false;
        this._currentEvent = event;
        this.stopCameraOrPropagateInput();

        for (let i = 0; i < this.rightClickListeners.length; i += 1) {
            const r = this.rightClickListeners[i];
            let a = false;
            try {
                a = r.fn(event);
            } catch (s) {
                console.error("Cannot handle right click", s);
            }
            if (a) {
                n = true;
                break;
            }
        }

        this._currentEvent = null;
        this.previousMousePosition = event.position;

        return n;
    }

    handleMouseDown(event) {
        let n = false;
        this._currentEvent = event;
        this.stopCameraOrPropagateInput();
        this.mouseDownTime = new Date();
        this.mouseDownPosition = event.position;
        this.mouseDownMovedTooMuch = false;

        for (let i = 0; i < this.mouseDownListeners.length; i += 1) {
            const r = this.mouseDownListeners[i];
            let a = false;
            try {
                a = r.fn(event);
            } catch (s) {
                console.error("Cannot handle mouse down click", s);
            }
            if (a) {
                n = true;
                break;
            }
        }

        this._currentEvent = null;
        this.previousMousePosition = event.position;

        return n;
    }

    handleMouseUp(event) {
        let n = false;
        this._currentEvent = event;
        this.stopCameraOrPropagateInput();

        for (let i = 0; i < this.mouseUpListeners.length; i += 1) {
            const r = this.mouseUpListeners[i];
            let a = false;
            try {
                a = r.fn(event);
            } catch (s) {
                console.error("Cannot handle mouse up click", s);
            }
            if (a) {
                F3t(this.viewer.scene.screenSpaceCameraController);
                n = true;
                break;
            }
        }
        this._currentEvent = null;
        this.previousMousePosition = event.position;

        return n;
    }

    simulateMouseMoveAtTheSameMousePosition() {
        this.mouseMoveEvent.picked = undefined;
        this.mouseMoveEvent.drillPicked = undefined;
        this.mouseMoveEvent.preventToolsDefault = false;
        this.handleMouseMove(this.mouseMoveEvent);
    }

    handleMouseMove(event) {
        this._currentEvent = event;
        let n = false;
        if (!isSamePosition(this.mouseDownPosition, event.endPosition, this.clickPixelTolerance)) {
            this.mouseDownMovedTooMuch = true;
        }

        for (let r = 0; r < this.mouseMoveListeners.length; r += 1) {
            const a = this.mouseMoveListeners[r];
            let s = false;
            try {
                s = a.fn(event);
            } catch (l) {
                console.error("Cannot handle mouse move click", l);
            }
            if (s) {
                n = true;
                break;
            }
        }

        this._currentEvent = null;
        this.previousMousePosition = event.endPosition;

        return n;
    }

    stopCameraOrPropagateInput() {
        if (this.cameraIsMoving) {
            this.viewer.camera.cancelFlight();
        }
    }

    addPostClickHandler(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.leftClickPostListeners.push({ handle: n, fn: t });
        return n;
    }

    addClickListener(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.leftClickListeners.push({ handle: n, fn: t });
        return n;
    }

    addClickListenerAsFirst(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.leftClickListeners.unshift({ handle: n, fn: t });
        return n;
    }

    addDoubleClickListener(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.doubleClicklisteners.push({ handle: n, fn: t });
        return n;
    }

    addRightClickListener(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.rightClickListeners.push({ handle: n, fn: t });
        return n;
    }

    addMouseDownListener(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.mouseDownListeners.push({ handle: n, fn: t });

        return n;
    }

    addMouseUpListener(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.mouseUpListeners.push({ handle: n, fn: t });
        return n;
    }

    addMouseMoveListener(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.mouseMoveListeners.push({ handle: n, fn: t });
        return n;
    }

    addMouseMoveListenerAsFirst(t) {
        const n = listenerCount;
        listenerCount += 1;
        this.mouseMoveListeners.unshift({ handle: n, fn: t });
        return n;
    }

    addMouseWheelListener(t) {
        const n = listenerCount;

        listenerCount += 1;
        this.wheelListeners.push({ handle: n, fn: t });

        return n;
    }

    removeListener(t) {
        const n = this.leftClickListeners.findIndex((c) => c.handle === t);
        if (n >= 0) {
            this.leftClickListeners.splice(n, 1);
            return true;
        }

        const i = this.rightClickListeners.findIndex((c) => c.handle === t);

        if (i >= 0) {
            this.rightClickListeners.splice(i, 1);
            return true;
        }

        const r = this.mouseUpListeners.findIndex((c) => c.handle === t);

        if (r >= 0) {
            this.mouseUpListeners.splice(r, 1);
            return true;
        }

        const a = this.mouseDownListeners.findIndex((c) => c.handle === t);

        if (a >= 0) {
            this.mouseDownListeners.splice(a, 1);
            return true;
        }

        const s = this.mouseMoveListeners.findIndex((c) => c.handle === t);

        if (s >= 0) {
            this.mouseMoveListeners.splice(s, 1);

            return true;
        }

        const l = this.wheelListeners.findIndex((c) => c.handle === t);

        if (l >= 0) {
            this.wheelListeners.splice(l, 1);
            return true;
        }
    }

    processClickIfNecessary(t, n, i) {
        if (!n) return;
        const r = isSamePosition(n.position, i, this.clickPixelTolerance);
        const s = new Date(new Date().getTime() - 1e3);

        if (this.mouseDownMovedTooMuch === false && r && this.mouseDownTime > s) {
            if (!(t instanceof PointerEvent && t.pointerType === "touch")) {
                if (t.button === MouseButton.LEFT) {
                    Pg(t, this.leftClickEventEx, i);
                    this.handleLeftClick(this.leftClickEventEx);
                } else {
                    if (t.button === MouseButton.RIGHT) {
                        Pg(t, this.rightClickEventEx, i);
                        this.handleRightClick(this.rightClickEventEx);
                    }
                }
            }
        }
    }

    processTouchClickIfNecessary(t, n, i) {
        if (n && isSamePosition(n.position, i, this.clickPixelTolerance)) {
            Pg(t, this.leftClickEventEx, i);
            this.handleLeftClick(this.leftClickEventEx);
        }
    }

    get screenSpaceEventHandler() {
        return this.viewer.scene.screenSpaceCameraController._aggregator._eventHandler;
    }
}
