/* eslint-disable no-lonely-if */
/* eslint-disable no-restricted-syntax */
import { defaultValues, jIe, getDefaultLanguage } from "./common";
import { Lines } from "./Lines";
import { Building } from "./dummyClasses";
import { Polygon3D } from "./Polygon3D";

function Rte(e) {
    const t = e.height ?? 0;
    const n = e.basementFloorsCount ?? 0;
    const i = e.basementFloorsHeight ?? defaultValues.groundFloorsHeight;
    let a;
    let r = n * i;

    if (i === 0) {
        a = 0;
    } else {
        if (r > t) {
            a = Math.floor(t / i);
            r = t;
        } else {
            a = n;
        }
    }

    const s = e.groundFloorsCount ?? 0;
    const l = e.groundFloorsHeight ?? defaultValues.groundFloorsHeight;
    let h;
    let c = s * l;
    const f = t - r;

    if (l === 0) {
        h = 0;
    } else {
        if (c > f) {
            h = Math.floor(f / l);
            c = f;
        } else {
            h = s;
        }
    }

    const m = e.floorHeight ?? defaultValues.floorHeight;

    const _ = m === 0 || c > f ? 0 : Math.floor((f - c) / m);

    return { basementFloorsCount: a, groundFloorsCount: h, normalFloorsCount: _ };
}

function GMe(e) {
    const t = Rte(e);
    const n = t.basementFloorsCount + t.groundFloorsCount + t.normalFloorsCount;
    const r = Lines.createFromPoints(e.groundPoints).area;
    const a = r * e.height;
    const s = n * r;
    let l = e.basementFloorsCount * e.basementFloorsHeight;

    if (l > e.height) {
        l = e.height;
    }

    const c = r * t.basementFloorsCount;
    const h = r * l;
    const f = r * (t.normalFloorsCount + t.groundFloorsCount);
    const m = r * (e.height - l);
    const v = 0.5 * r * jIe(e.roofType, e.roofAngle, e.roofRotationIndex, e.groundPoints);

    return {
        entityId: e.id,
        volume: a + v,
        footprintArea: r,
        area: s,
        volumeUnderGround: h,
        volumeAboveGround: m,
        roofVolume: v,
        areaAboveGround: f,
        areaUnderGround: c,
        roofArea: r
    };
}

function Lte(e) {
    const t = (function (e2) {
        if (e2 instanceof Polygon3D) {
            return GMe(e2);
            // eslint-disable-next-line no-else-return
        } else {
            return e2 instanceof Building
                ? (function (e1) {
                      return e1.mShape.areaVolumeInfo;
                  })(e2)
                : (function (e3) {
                      return {
                          entityId: e3.id,
                          area: e3.customData.area ?? 0,
                          footprintArea: 0,
                          volume: e3.customData.volume ?? 0,
                          areaAboveGround: 0,
                          areaUnderGround: 0,
                          roofArea: 0,
                          volumeAboveGround: 0,
                          volumeUnderGround: 0,
                          roofVolume: 0
                      };
                  })(e2);
        }
    })(e);

    const i = (100 - (Number.isFinite(e.customData.volumeReduction) ? e.customData.volumeReduction : 0)) / 100;
    const a = (100 - (Number.isFinite(e.customData.areaReduction) ? e.customData.areaReduction : 0)) / 100;

    return {
        entityId: t.entityId,
        footprintArea: t.footprintArea,
        area: t.area * a,
        areaAboveGround: t.areaAboveGround * a,
        areaUnderGround: t.areaUnderGround * a,
        roofArea: t.roofArea * a,
        roofVolume: t.roofVolume * i,
        volume: t.volume * i,
        volumeAboveGround: t.volumeAboveGround * i,
        volumeUnderGround: t.volumeUnderGround * i
    };
}

function xte(e, t = getDefaultLanguage()) {
    let n = 1;

    if (e.toFixed(0).length < 3) {
        n = 3;
    }

    return `${Intl.NumberFormat(t, {
        minimumIntegerDigits: n,
        maximumFractionDigits: 0
    }).format(e)} m\xb3`;
}

function Dg(e, t = getDefaultLanguage()) {
    return `${Intl.NumberFormat(t, { maximumFractionDigits: 0 }).format(e)} m\xb2`;
}

export class LabelGenerator {
    constructor(n, i) {
        this.tools = n;
        this.translocoService = i;
        this.shouldRegenerate = true;
        this.variantInfos = {};
        this.entityVolumeInfos = {};
    }

    setupEntities(n) {
        this.variantInfos = {};
        this.entityVolumeInfos = {};

        for (const i of n) {
            const r = i.customData.variantId;

            if (!this.variantInfos[r]) {
                this.variantInfos[r] = {
                    variantId: r,
                    entityIds: [],
                    totalFloorArea: 0,
                    volume: 0
                };
            }

            if (
                // i instanceof Building || i instanceof Polygon3D || i instanceof Model)
                i instanceof Polygon3D
            ) {
                const a = Lte(i);
                const s = this.variantInfos[r];

                s.volume += a.volume;
                s.totalFloorArea += a.area;
                s.entityIds.push(i.id);
                this.entityVolumeInfos[i.id] = a;
            }
        }

        this.shouldRegenerate = false;
    }

    generateLabel(n) {
        if (n instanceof Polygon3D) {
            // if (n instanceof Polygon3D || n instanceof Model || n instanceof Building) {

            if (this.shouldRegenerate) {
                this.setupEntities(this.tools.entitiesList);
            }

            const i = Lte(n);
            const r = i.volume;
            const a = i.area;
            // s = this.translocoService.getActiveLang() + "-CH",
            const s = "en-CH";
            const l = xte(r, s);
            const c = Dg(i.footprintArea, s);
            const h = Dg(a, s);
            const f = Dg(i.roofArea, s);
            const m = Dg(i.areaAboveGround, s);
            const _ = Dg(i.areaUnderGround, s);
            // v = this.translocoService.translate("Volume"),
            const v = "Volume";
            // A = this.translocoService.translate("Floor area"),
            const A = "Floor area";
            // x = this.translocoService.translate("Roof area"),
            const x = "Roof area";
            // b = this.translocoService.translate("Area above ground"),
            const b = "Area above ground";
            // T = this.translocoService.translate("Area below ground"),
            const T = "Area below ground";
            // P = this.translocoService.translate("Footprint");
            const P = "Footprint";

            return `\n    <div class='map-tooltip-heading'>${n.name}</div>\n    <div class='map-tooltip-grid'>\n      <div class='title'>${v}</div>\n      <div class='value'>${l}</div>\n      <div class='title'>${A}</div>\n      <div class='value'>${h}</div>\n      \x3c!-- div class='title'>${x}</div>\n      <div class='value'>${f}</div--\x3e\n      <div class='title'>${b}</div>\n      <div class='value'>${m}</div>\n      <div class='title'>${T}</div>\n      <div class='value'>${_}</div>\n      <div class='title'>${P}</div>\n      <div class='value'>${c}</div>\n    </div>\n    `;
        }

        return `Unknown entity type: ${n}`;
    }
}
