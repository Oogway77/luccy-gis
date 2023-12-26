import { Cartesian3, Cesium3DTileset, Color, Ion, Terrain, Transforms, Viewer } from "cesium";

import { CesiumEventsHandler } from "./CesiumEventsHandler";
import { CesiumTools } from "./CesiumTools";
import { EntityChangeUtil } from "./EntityChangeUtil";

export function main() {
    Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMDVmZDZlOS1jNzYxLTQ3MWYtYmNlNi0xMzA4NjA1OTc1NDgiLCJpZCI6OTc4NiwiaWF0IjoxNjE3MTU2MTQ2fQ.vtM1I7acSXgL6riYVHUMz_lWeaCESiUOeYXVM2lft50";

    const viewer = new Viewer("cesiumContainer", {
        terrain: Terrain.fromWorldTerrain(),
        shadows: true
    });

    viewer.scene.postProcessStages.fxaa.enabled = true;
    const shadowMap = viewer.shadowMap;

    shadowMap.softShadows = false;
    shadowMap.darkness = 0.7;
    shadowMap.maximumDistance = 5500;
    shadowMap.size = 4096;
    shadowMap.normalOffset = false;

    viewer.clock.multiplier = 1.0;
    viewer.clock.currentTime = new Cesium.JulianDate(2457522.154792);

    window.viewer = viewer;

    const promise = Cesium3DTileset.fromUrl("https://s3.us-east-2.wasabisys.com/construkted-assets/auzjvmih056/tileset.json", {});

    function onTilesetReady(tileset) {
        viewer.scene.primitives.add(tileset);

        const position = Cartesian3.fromDegrees(16.90721410171558, 43.451183339500545, 288.65);
        const toWorld = Transforms.eastNorthUpToFixedFrame(position);

        window.tileset = tileset;

        tileset.modelMatrix = toWorld;

        viewer.zoomTo(tileset);
    }

    promise
        .then((tileset) => {
            onTilesetReady(tileset);
        })
        .catch((error) => {
            console.error(`Error loading tileset ${error}`);
        });

    const cesiumTools = new CesiumTools();

    cesiumTools.setup({
        viewer: viewer,
        cesiumEventHandler: new CesiumEventsHandler(viewer)
    });

    function getSelected() {
        if (!cesiumTools._currentTool) {
            return undefined;
        }

        return cesiumTools.currentTool.selectedEntity;
    }

    jQuery("#add-building").click(() => {
        cesiumTools.selectTool("building");
    });

    const jqBuildingProps = jQuery("#building-props");
    const jqTotalHeight = jQuery("#total-height");
    const jqWidth = jQuery("#width");
    const jqLength = jQuery("#length");
    const jqAngle = jQuery("#angle");
    const jqPlaceOnTerrain = jQuery("#place-on-terrain");
    const jqHeightAboveTerrain = jQuery("#height-above-terrain");
    const jqShowFloors = jQuery("#show-floors");
    const jqNormalFloorsHeight = jQuery("#normal-floors-height");
    const jqGroundFloorsHeight = jQuery("#ground-floors-height");
    const jqGroundFloors = jQuery("#ground-floors");

    const jqOpacity = jQuery("#opacity");
    const jqSetColor = jQuery("#set-color");

    function displayBuildingProps(entities) {
        if (entities.length === 0) {
            jqBuildingProps.hide();
            return;
        }

        const entity = entities[0];
        const dimensions = entity.dimensions;

        jqTotalHeight.val(entity.height);
        jqWidth.val(dimensions.x);
        jqLength.val(dimensions.y);
        jqAngle.val(entity.angle);
        jqPlaceOnTerrain.prop("checked", entity.snapToTerrain);
        jqHeightAboveTerrain.val(entity.adjustZ);
        jqShowFloors.prop("checked", entity.showFloors);
        jqNormalFloorsHeight.val(entity.floorHeight);
        jqGroundFloorsHeight.val(entity.groundFloorsHeight);
        jqGroundFloors.val(entity.groundFloorsCount);

        jqOpacity.val(entity.opacity);

        jqBuildingProps.show();
    }

    cesiumTools.entitiesSelected.addEventListener((entities) => {
        displayBuildingProps(entities);
    });

    cesiumTools.updatedEntities.addEventListener((entities) => {
        displayBuildingProps(entities);
    });

    function setEntityParameters(parameters) {
        const selectedEntity = getSelected();

        if (!selectedEntity) {
            return;
        }

        EntityChangeUtil.setEntityParameters(selectedEntity, parameters);
        cesiumTools.currentTool?.onEntityUpdated(selectedEntity, parameters);
    }

    jqTotalHeight.change(() => {
        const height = parseFloat(jqTotalHeight.val());

        setEntityParameters({ height: height });
    });

    jqWidth.change(() => {
        const width = parseFloat(jqWidth.val());

        setEntityParameters({ x: width });
    });

    jqLength.change(() => {
        const length = parseFloat(jqLength.val());

        setEntityParameters({ y: length });
    });

    jqAngle.change(() => {
        const angle = parseFloat(jqAngle.val());

        setEntityParameters({ angle: angle });
    });

    jqPlaceOnTerrain.change(function () {
        setEntityParameters({ snapToTerrain: this.checked });
    });

    jqHeightAboveTerrain.change(() => {
        const height = parseFloat(jqHeightAboveTerrain.val());

        setEntityParameters({ adjustZ: height });
    });

    jqShowFloors.change(function () {
        setEntityParameters({ showFloors: this.checked });
    });

    jqNormalFloorsHeight.change(() => {
        const height = parseFloat(jqNormalFloorsHeight.val());

        setEntityParameters({ floorHeight: height });
    });

    jqGroundFloorsHeight.change(() => {
        const height = parseFloat(jqGroundFloorsHeight.val());

        setEntityParameters({ groundFloorsHeight: height });
    });

    jqGroundFloors.change(() => {
        const count = parseFloat(jqGroundFloors.val());

        setEntityParameters({ groundFloorsCount: count });
    });

    jqOpacity.change(() => {
        const opacity = parseFloat(jqOpacity.val());

        if (Number.isNaN(opacity)) {
            alert("invalid value");
            return;
        }

        if (opacity < 0 || opacity > 1) {
            alert("invalid value");
            return;
        }

        setEntityParameters({ opacity: opacity });
    });

    jqSetColor.click(() => {
        setEntityParameters({ color: Color.fromRandom() });
    });
}
