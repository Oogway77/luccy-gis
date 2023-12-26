export class LabelService {
    constructor(options) {
        this.viewer = options;
        this.labels = [];
        this.removeCallback = options.camera.changed.addEventListener(() => {
            this.labels.forEach((i) => {
                i.tick();
            });
        });
        new ResizeObserver(() => {
            this.labels.forEach((i) => {
                i.tick();
            });
        }).observe(options.container);
    }

    addCesiumText(t) {
        if (this.labels.indexOf(t) === -1) {
            this.labels.push(t);
        } else {
            console.error("Duplicate cesium label");
        }
    }

    removeCesiumText(t) {
        const n = this.labels.indexOf(t);
        if (n >= 0) {
            this.labels.splice(n, 1);
        } else {
            console.error("Cannot find label to remove: ", t);
        }
    }
}
