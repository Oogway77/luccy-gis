/* eslint-disable class-methods-use-this */
import { Color, Material, MaterialAppearance } from "cesium";

export class MaterialCreator {
    constructor(options) {
        this.floorHeight = options.floorHeight;
        this.groundFloorsHeight = options.groundFloorsHeight;
        this.groundFloorsCount = options.groundFloorsCount;
        this.basementFloorsHeight = options.basementFloorsHeight;
        this.basementFloorsCount = options.basementFloorsCount;
    }

    getVertexFormat(t) {
        return t.showFloors ? MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat : MaterialAppearance.VERTEX_FORMAT;
    }

    createMaterial(options) {
        let ret;

        if (options.showFloors) {
            const material = (function (e) {
                const basementLimit = (e.basementFloorsCount * e.basementFloorsHeight) / e.totalH;
                const basementRepeat = e.totalH / e.basementFloorsHeight;
                const basementLinePerc = 0.2 / e.basementFloorsHeight;
                const groundLimit = basementLimit + (e.groundFloorsCount * e.groundFloorsHeight) / e.totalH;
                const groundRepeat = e.totalH / e.groundFloorsHeight;
                const groundLinePerc = 0.2 / e.groundFloorsHeight;
                const normalRepeat = e.totalH / e.floorHeight;
                const floorLinePerc = 0.2 / e.floorHeight;

                const uniforms = {
                    backgroundColor: e.backgroundColor,
                    undergroundBackgroundColor: e.backgroundColor?.darken(0.2, new Color()),
                    normalColor: new Color(0.75, 0.75, 0.75),
                    normalRepeat: normalRepeat,
                    floorLinePerc: floorLinePerc,
                    groundLimit: groundLimit,
                    groundColor: Color.BLACK,
                    groundRepeat: groundRepeat,
                    groundLinePerc: groundLinePerc,
                    basementLimit: basementLimit,
                    basementColor: new Color(0.5, 0.5, 0.5),
                    basementRepeat: basementRepeat,
                    basementLinePerc: basementLinePerc
                };

                return new Material({
                    translucent: false,
                    fabric: {
                        type: "CustomStripes",
                        source: "uniform vec4 groundColor;\nuniform vec4 normalColor;\nuniform vec4 backgroundColor;\nuniform vec4 undergroundBackgroundColor;\nuniform float groundRepeat;\nuniform float normalRepeat;\nuniform float groundLimit;\nuniform float basementLimit;\nuniform vec4 basementColor;\nuniform float basementRepeat;\nuniform float floorLinePerc;\nuniform float groundLinePerc;\nuniform float basementLinePerc;\n\nczm_material czm_getMaterial(czm_materialInput materialInput)\n{\n  czm_material m = czm_getDefaultMaterial(materialInput);\n  vec2 st = materialInput.st;\n  float stY = st.y;\n  vec4 lineColor;\n  float lineEdge = 0.10;\n\n  if (st.y < basementLimit) {\n    st *= basementRepeat;\n    lineColor = basementColor;\n    lineEdge = basementLinePerc;\n  }\n  else if (st.y < groundLimit) {\n    // We are smaller than ground floors limit, so let's draw ground\n    st.y -= basementLimit;\n    st *= groundRepeat;\n    lineColor = groundColor;\n    lineEdge = groundLinePerc;\n  }\n  else {\n    // Move the pixels down\n    st.y -= groundLimit;\n    st *= normalRepeat;\n    lineColor = normalColor;\n    lineEdge = floorLinePerc;\n  }\n  st = fract(st);\n\n  vec4 clr;\n  if (fract(st.y) < lineEdge) {\n    clr = lineColor;\n  }\n  else if (materialInput.st.y < basementLimit) { \n    clr = undergroundBackgroundColor;\n  } \n  else {\n    clr = backgroundColor;\n  }\n\n  clr = czm_gammaCorrect(clr);\n  m.diffuse = clr.rgb;\n  m.alpha = clr.a;\n\n  return m;\n}\n",
                        uniforms: uniforms
                    }
                });
            })({
                floorHeight: this.floorHeight,
                basementFloorsCount: this.basementFloorsCount,
                basementFloorsHeight: this.basementFloorsHeight,
                groundFloorsCount: this.groundFloorsCount,
                groundFloorsHeight: this.groundFloorsHeight,
                totalH: options.totalH,
                backgroundColor: options.color
            });

            ret = new MaterialAppearance({
                material: material,
                flat: false,
                closed: options.closed,
                translucent: options.translucent,
                faceForward: options.faceForward
            });
        } else
            ret = new MaterialAppearance({
                flat: false,
                closed: options.closed,
                translucent: options.translucent,
                faceForward: options.faceForward,
                material: Material.fromType("Color", { color: options.color })
            });

        return ret;
    }
}
