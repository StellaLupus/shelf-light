## ADDED Requirements

### Requirement: View mode toggle
The system SHALL offer a control that switches the diagram between glare-ray mode and direct-lit fill mode. Both modes MUST show the same scene, the same eye, and the same glare status. The control MUST sit with the diagram, not among the mount choices.

#### Scenario: Switching to fill hides emit-to-eye rays
- **GIVEN** a valid scene in glare-ray mode
- **WHEN** the user selects fill mode
- **THEN** emit-to-eye rays are not shown
- **AND** the direct-lit region is shown
- **AND** the eye marker remains visible
- **AND** the glare status still matches the engine

#### Scenario: Switching back shows rays
- **GIVEN** a valid scene in fill mode
- **WHEN** the user selects glare-ray mode
- **THEN** emit-to-eye rays are shown again
- **AND** the fill is not shown as the primary light drawing

### Requirement: Floor and shelf height control
The system SHALL draw the floor on the side-view diagram at `y = -H` and SHALL expose `lower.heightFromFloor` as a slider and a numeric field, default **1200** mm. Changing `H` MUST NOT move the eye in scene coordinates. The wall MUST extend down to the floor.

#### Scenario: Default height from floor
- **GIVEN** a page opened without a height-from-floor query parameter
- **WHEN** the controls render
- **THEN** the height-from-floor field shows 1200
- **AND** the floor is drawn 1200 mm below the planting plane

#### Scenario: Changing H keeps scene eye
- **GIVEN** the eye at scene Y 180 and `H = 1200`
- **WHEN** the user sets `H` to 1400
- **THEN** the eye height field still shows 180
- **AND** the floor moves to `y = -1400`

### Requirement: Observer height presets
The system SHALL offer observer presets **стоя** (1600 mm from the floor), **сидя** (1200 mm from the floor), and **лёжа** (600 mm from the floor). A preset MUST set `viewer.eyeHeight` to `presetFromFloor - H` after the same eye placement as the engine. A preset MUST NOT change the distance from the wall. Presets MUST NOT replace the sliders, fields, or drag.

#### Scenario: Standing writes scene Y from the floor
- **GIVEN** `H = 1200` and an eye at some other height
- **WHEN** the user chooses the standing preset
- **THEN** the eye height field shows 400
- **AND** the distance field is unchanged

#### Scenario: Sitting writes scene Y from the floor
- **GIVEN** `H = 1200`
- **WHEN** the user chooses the sitting preset
- **THEN** the eye height field shows 0
- **AND** the distance field is unchanged

#### Scenario: Lying writes scene Y from the floor
- **GIVEN** `H = 1200`
- **WHEN** the user chooses the lying preset
- **THEN** the eye height field shows -600
- **AND** the distance field is unchanged

## MODIFIED Requirements

### Requirement: Side-view diagram
The system SHALL render a side-view diagram of the wall, both shelves, the floor, the valance, the LED profile body, and the eye. In glare-ray mode the diagram SHALL also show downward fill light toward the plant zone and emit-to-eye rays. In fill mode the diagram SHALL show the direct-lit region from the engine and MUST NOT use the decorative plant fan as a substitute for that region. For `downward` the LED SHALL remain a strip with visible width. For `radius` the body SHALL be a quarter-circle. For `ell` the body SHALL be a square. For `triangle` the body SHALL be a right triangle. The LED MUST NOT be a single point marker.

#### Scenario: LED is not a dot
- **GIVEN** a valid downward scene with `led.width > 0`
- **WHEN** the diagram is shown
- **THEN** the LED is drawn as a strip or rectangle whose width matches the scene
- **AND** not as a single point marker

#### Scenario: Triangle body is drawn
- **GIVEN** a valid `triangle` scene
- **WHEN** the diagram is shown
- **THEN** the profile is drawn as a filled right triangle in the valance pocket
- **AND** not as a lone segment at the wall

#### Scenario: Radius body is drawn
- **GIVEN** a valid `radius` scene
- **WHEN** the diagram is shown
- **THEN** the profile is drawn as a quarter-circle of radius W in the valance pocket

#### Scenario: Floor is drawn
- **GIVEN** a valid scene with `lower.heightFromFloor = 1200`
- **WHEN** the diagram is shown
- **THEN** a floor is drawn at `y = -1200`
- **AND** the wall reaches that floor

### Requirement: Ray colors match geometry
The system SHALL draw unobstructed emit-to-eye samples in red and occluded samples in green when glare-ray mode is active. The on-screen glare status MUST match the geometry engine boolean in both modes. In fill mode the system MUST NOT require emit-to-eye rays to be visible.

#### Scenario: Status follows the engine
- **GIVEN** the engine reports `hasDirectGlare = true`
- **AND** glare-ray mode is active
- **WHEN** the page renders
- **THEN** the status reads that a direct ray reaches the eyes
- **AND** at least one red ray is shown

#### Scenario: Clear status when blocked
- **GIVEN** the engine reports `hasDirectGlare = false`
- **AND** glare-ray mode is active
- **WHEN** the page renders
- **THEN** the status reads that no direct ray reaches the eyes
- **AND** emit-to-eye rays that are shown are green

#### Scenario: Fill mode still shows glare status
- **GIVEN** the engine reports `hasDirectGlare = true`
- **AND** fill mode is active
- **WHEN** the page renders
- **THEN** the status reads that a direct ray reaches the eyes
- **AND** emit-to-eye rays are not shown

### Requirement: URL encodes the scene
The system SHALL encode the full calculator state in the page URL query string so opening the same URL locally or on a host restores the same scene. Allowed mount values are `downward`, `radius`, `ell`, and `triangle`. The value `corner` SHALL be read as `triangle`. An emit-angle query parameter SHALL be ignored. The query SHALL include `lower.heightFromFloor` and the view mode. A missing height-from-floor parameter SHALL mean 1200. A missing or unknown view parameter SHALL mean glare-ray mode.

#### Scenario: Reload keeps values
- **GIVEN** the user set mount type `triangle` and a custom blend height
- **WHEN** the page is reloaded
- **THEN** mount type and blend height are the same
- **AND** the glare status is recomputed from those values

#### Scenario: Shared link
- **GIVEN** a URL produced by the app
- **WHEN** another browser opens that URL
- **THEN** all parameters and the glare status match the original scene

#### Scenario: Legacy corner query
- **GIVEN** a URL with `mount=corner`
- **WHEN** the page opens
- **THEN** the mount is triangle
- **AND** the profile sits in the valance pocket

#### Scenario: Shared link keeps fill mode and H
- **GIVEN** the user set fill mode and `H = 1400`
- **WHEN** another browser opens the produced URL
- **THEN** fill mode is active
- **AND** the height-from-floor field shows 1400

#### Scenario: Legacy URL without new keys
- **GIVEN** a URL that has no height-from-floor and no view keys
- **WHEN** the page opens
- **THEN** `H` is 1200
- **AND** glare-ray mode is active

### Requirement: Invalid input does not crash the view
The system SHALL reject physically impossible values in the controls (non-positive gap, LED past the upper front edge, non-positive LED width, `H` not greater than lower-shelf thickness) and MUST keep the previous valid diagram visible with a validation message.

#### Scenario: LED past the front edge
- **GIVEN** a valid downward scene
- **WHEN** the user sets an offset that pushes the strip past the upper shelf front
- **THEN** a validation message is shown
- **AND** the page does not go blank

#### Scenario: Shelf height not above thickness
- **GIVEN** a valid scene with lower thickness 18
- **WHEN** the user sets height from floor to 18
- **THEN** a validation message is shown
- **AND** the previous valid diagram stays visible
