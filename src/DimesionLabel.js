import { Cartographic, Cartesian2, Color, defaultValue } from "cesium";

import { DimensionLabelTypes, LabelAlignments, setMarginLeftFloat } from "./common";

function setBorderColor(element, color) {
    element.style.borderColor = `transparent ${color} ${color} transparent`;
}

function getBackgroundColor(options) {
    let t = options.showBackground ? Math.floor(255 * options.opacity).toString(16) : "00";

    if (t.length === 1) {
        t = `0${t}`;
    }

    return options.backgroundColor.toCssHexString() + t;
}

export class DimensionLabel {
    constructor(options) {
        this._type = options.type;
        this._text = options.text;
        this._alignment = defaultValue(options.alignment, LabelAlignments.leading);
        this._textColor = defaultValue(options.textColor, Color.BLACK);
        this._backgroundColor = defaultValue(options.backgroundColor, Color.WHITE);
        this._showBackground = defaultValue(options.showBackground, true);
        this._opacity = defaultValue(options.opacity, 1);
        this._fontSize = defaultValue(options.fontSize, 14);
        this.labelService = options.labelService;
        this._offset = options.offset ?? new Cartesian2(0, 0);
        this._alignment = options.alignment ?? LabelAlignments.leading;
        this._cesiumPosition = options.position;
        this._adjustZ = defaultValue(options.adjustZ, 0);
        this._selectable = options.selectable ?? false;
        this._showBottomArrow = options.showBottomArrow ?? false;
        const n = options.labelService.viewer;

        this.container = (function (e) {
            const t = document.createElement("div");
            const { style: n1 } = t;
            n1.fontWeight = "200";
            n1.position = "absolute";
            const i = e.viewer.scene.cartesianToCanvasCoordinates(e.cesiumPosition, new Cartesian2());

            if (i) {
                n1.left = `${i.x + e.offset.x}px`;
                n1.top = `${i.y + e.offset.y}px`;
            } else {
                n1.left = "100px";
                n1.top = "10px";
            }

            if (!e.pointerEvents) {
                n1.pointerEvents = "none";
            }

            return t;
        })({
            cesiumPosition: this._cesiumPosition,
            offset: this._offset,
            pointerEvents: this._selectable,
            viewer: n
        });
        n.container.appendChild(this.container);
        options.labelService.addCesiumText(this);
        this.createLabel();
        this.tick();
    }

    destroy() {
        this.labelService.removeCesiumText(this);
        this.destroyLabel();
        this.container.parentElement?.removeChild(this.container);
    }

    tick() {
        const t = this.labelService.viewer;
        let n = this._cesiumPosition;
        if (this._adjustZ > 0) {
            const r = Cartographic.fromCartesian(n);
            const s = this.labelService.viewer.scene.globe.getHeight(r);
            if (Number.isFinite(s)) {
                r.height = s + this._adjustZ;
            } else {
                r.height += this._adjustZ;
                n = Cartographic.toCartesian(r);
            }
        }
        const i = t.scene.cartesianToCanvasCoordinates(n, new Cartesian2());
        if (i) {
            const r = this.container.style;
            r.left = `${i.x + this._offset.x}px`;
            r.top = `${i.y + this._offset.y}px`;
        }
    }

    get type() {
        return this._type;
    }

    get text() {
        return this._text;
    }

    set text(t) {
        if (this._text !== t) {
            this._text = t;

            if (this.label) {
                if (this._type === DimensionLabelTypes.HTML) {
                    this.label.innerHTML = t;
                } else {
                    this.label.innerText = t;
                }
            }
        }
    }

    get cesiumPosition() {
        return this._cesiumPosition;
    }

    set cesiumPosition(t) {
        this._cesiumPosition = t;
        this.tick();
    }

    get fontSize() {
        return this._fontSize;
    }

    set fontSize(t) {
        if (this._fontSize !== t) {
            this._fontSize = t;

            if (this.label) {
                this.label.style.fontSize = `${t}pt`;
            }
        }
    }

    get offset() {
        return this._offset;
    }

    set offset(t) {
        this._offset = t;
        this.tick();
    }

    get alignment() {
        return this._alignment;
    }

    set alignment(t) {
        this._alignment = t;
        if (this.label) {
            setMarginLeftFloat(this.label, t);
        }
    }

    get opacity() {
        return this._opacity;
    }

    set opacity(t) {
        this._opacity = t;
        if (this.label) {
            this.updateBackgroundColor();
        }
    }

    get textColor() {
        return this._textColor;
    }

    set textColor(t) {
        this._textColor = t;
        if (this.label) {
            this.label.style.color = `rgb(${255 * t.red}, ${255 * t.green}, ${255 * t.blue})`;
        }
    }

    get showBackground() {
        return this._showBackground;
    }

    set showBackground(t) {
        this._showBackground = t;

        if (this.label) {
            this.updateBackgroundColor();
        }
    }

    get backgroundColor() {
        return this._backgroundColor;
    }

    set backgroundColor(t) {
        this._backgroundColor = t;
        if (this.label) {
            this.updateBackgroundColor();
        }
    }

    get adjustZ() {
        return this._adjustZ;
    }

    set adjustZ(t) {
        this._adjustZ = t;
        this.tick();
    }

    updateBackgroundColor() {
        const t = getBackgroundColor({
            showBackground: this._showBackground,
            backgroundColor: this._backgroundColor,
            opacity: this._opacity
        });

        if (this.label) {
            this.label.style.backgroundColor = t;
        }

        if (this.bottomArrow) {
            setBorderColor(this.bottomArrow, t);
        }
    }

    createLabel() {
        if (!this.label) {
            this.label = (function (e) {
                const t = document.createElement("div");
                const { style: n } = t;
                n.backgroundColor = getBackgroundColor(e);
                n.color = e.textColor.toCssHexString();
                n.padding = "2px";
                n.fontSize = `${e.fontSize}pt`;
                setMarginLeftFloat(t, e.alignment);

                return t;
            })({
                textColor: this._textColor,
                showBackground: this._showBackground,
                backgroundColor: this._backgroundColor,
                alignment: this._alignment,
                opacity: this._opacity,
                fontSize: this._fontSize
            });

            this.container.appendChild(this.label);

            if (this._showBottomArrow && !this.bottomArrow) {
                this.bottomArrow = (function (e) {
                    const n = document.createElement("div");
                    const { style: i } = n;

                    i.content = "";
                    i.position = "absolute";
                    i.borderStyle = "solid";
                    i.right = "calc(50% - 5px)";
                    i.transform = "rotate(45deg)";
                    i.bottom = "-5px";
                    i.borderWidth = "5px";
                    setBorderColor(n, getBackgroundColor(e));

                    return n;
                })({
                    showBackground: this._showBackground,
                    backgroundColor: this._backgroundColor,
                    opacity: this._opacity
                });

                this.container.append(this.bottomArrow);
            }

            if (this._type === DimensionLabelTypes.HTML) {
                this.label.innerHTML = this._text;
            } else {
                this.label.innerText = this._text;
            }
        }
    }

    destroyLabel() {
        if (this.label) {
            this.container.removeChild(this.label);
            this.label = undefined;
        }

        if (this.bottomArrow) {
            this.container.removeChild(this.bottomArrow);
            this.bottomArrow = undefined;
        }
    }
}
