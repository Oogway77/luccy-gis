### 1.0.9 - 2023-08-18

#### Fixed

-   It is now possible to create a building on a photomesh, however, when I try to move the building, the base of the building snaps back to the terrain in most cases.
-   If I try to stack buildings, I think it takes into account the height of the ground floor for the first floor stacked on top of the building. This results on the last floor beeing chrunked.

### 1.0.8 - 2023-08-17

#### Updated

-   Glitch on faces (both on Mac and Windows), can it be improved.

### 1.0.7 - 2023-08-17

#### Updated

-   Photomesh - is it possible to add a photomesh in your environment to assess if it also works on top of a photomesh?.

#### Fixed

-   CesiumEventsHandler.js:636 Cannot handle mouse move click Error: geometry is not valid.

### 1.0.6 - 2023-08-17

#### Added

-   sample 3D Tiles.

#### Fixed

-   Pan camera does not work once we edit a 3D building.
-   Bug with Firefox (Chrome and Safari work well).
-   Ground floor - the attribute “Ground floors” does not seem to be important as we can’t change the value and the value should always be 1.
-   Width & Length dynamic attributes - we can manually type and update them on the top left corner; but they don’t change dynamically when changing the 3D shape by dragging a vertex.

### 1.0.5 - 2023-08-14

#### Added

-   the interface for getting, setting building properties.
-   shadow map.
-   style for label of a building.
-   release build.

#### Fixed

-   initial ShadowRectanglePrimitive 's color is not white.
-   editing tool is not activated when building is clicked(selected).

### 1.0.4 - 2023-08-11

#### Update

-   Fix undefined variable variable errors. add dummy classes, functions.

### 1.0.3 - 2023-08-10

#### Update

-   Split sources.

### 1.0.2 - 2023-08-09

#### Update

-   Setup Eslint, ES6 structure.

### 1.0.1 - 2023-08-09

#### Update

-   update class names, Cesium class.

### 1.0 - 2023-08-09

#### Added

-   add missing classes for basic functionality.
