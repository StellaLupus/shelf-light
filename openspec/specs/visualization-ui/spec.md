# visualization-ui Specification

## Purpose

Показывает разрез полок и ленты, статус прямого луча в глаза и даёт связанные ползунки, поля и URL для тех же параметров.

## Requirements

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

### Requirement: Side-view diagram
The system SHALL render a side-view diagram of the wall, both shelves, the floor, the valance, the LED profile body, and the eye. In glare-ray mode the diagram SHALL also show downward fill light toward the plant zone and emit-to-eye rays. In fill mode the diagram SHALL show the direct-lit region from the engine and MUST NOT use the decorative plant fan as a substitute for that region. For `downward` the LED SHALL remain a strip with visible width. For `radius` the body SHALL be a quarter-circle. For `ell` the body SHALL be a square. For `triangle` the body SHALL be a right triangle. For `recessed25` the upper shelf SHALL show the 35 mm groove cutout and the profile SHALL be drawn as the catalog channel section with the milky emit face, not as a valance-pocket body and not as a lone underside strip. The LED MUST NOT be a single point marker.

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

#### Scenario: Recessed channel is drawn with a cutout
- **GIVEN** a valid `recessed25` scene
- **WHEN** the diagram is shown
- **THEN** the upper shelf is drawn with a groove in the underside
- **AND** the profile is drawn as a channel section in that groove
- **AND** the milk face is a visible segment, not a single point

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

### Requirement: Slider and field stay in sync
The system SHALL expose every numeric scene parameter as both a slider and a numeric field, and the two controls SHALL stay synchronized.

#### Scenario: Slider updates the field
- **GIVEN** the upper shelf depth field shows 250
- **WHEN** the user moves the matching slider to 300
- **THEN** the numeric field shows 300
- **AND** the diagram updates to the new depth

#### Scenario: Field updates the slider
- **GIVEN** a visible gap slider
- **WHEN** the user types a valid new gap into the field
- **THEN** the slider position matches the typed value
- **AND** the diagram uses that gap

### Requirement: Mount controls match the active profile
The system SHALL offer five mount choices: downward, radius, L-shaped, triangle, and recessed 25°. The emit-angle control MUST NOT be shown. The wall-offset control SHALL appear for `downward` and for `recessed25`. Profile size SHALL stay visible for `downward`, `radius`, `ell`, and `triangle`, and MUST be hidden for `recessed25`. Profile drop SHALL stay visible except for `recessed25`, where it MUST be hidden.

#### Scenario: Offset hidden on a valance-flush profile
- **GIVEN** the user selected the triangle mount
- **WHEN** the controls render
- **THEN** the wall-offset field and slider are hidden
- **AND** no emit-angle field is shown

#### Scenario: Offset visible on downward
- **GIVEN** the user selected downward mount
- **WHEN** the controls render
- **THEN** the wall-offset field and slider are shown

#### Scenario: Recessed hides catalog-locked fields
- **GIVEN** the user selected the recessed 25° mount
- **WHEN** the controls render
- **THEN** the wall-offset field and slider are shown
- **AND** the profile-size field and slider are hidden
- **AND** the profile-drop field and slider are hidden
- **AND** no emit-angle field is shown

### Requirement: Recessed facing control
The system SHALL show a facing control for `recessed25` with two values: toward the wall and toward the room. The control MUST NOT appear for `downward`, `radius`, `ell`, or `triangle`. The emit-angle control MUST NOT be shown.

#### Scenario: Facing visible on recessed
- **GIVEN** the user selected the recessed 25° mount
- **WHEN** the controls render
- **THEN** the facing control is shown
- **AND** no emit-angle field is shown

#### Scenario: Facing hidden on downward
- **GIVEN** the user selected downward mount
- **WHEN** the controls render
- **THEN** the facing control is hidden

### Requirement: URL encodes the scene
The system SHALL encode the full calculator state in the page URL query string so opening the same URL locally or on a host restores the same scene. Allowed mount values are `downward`, `radius`, `ell`, `triangle`, and `recessed25`. The value `corner` SHALL be read as `triangle`. An emit-angle query parameter SHALL be ignored. For `recessed25` the query SHALL include facing `wall` or `room`; a missing facing parameter SHALL mean `wall`. The query SHALL include `lower.heightFromFloor` and the view mode. A missing height-from-floor parameter SHALL mean 1200. A missing or unknown view parameter SHALL mean glare-ray mode.

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

#### Scenario: Recessed mount and facing round-trip
- **GIVEN** the user set mount type `recessed25` and facing toward the room
- **WHEN** another browser opens the produced URL
- **THEN** the mount is recessed 25°
- **AND** facing is toward the room

#### Scenario: Missing facing means wall
- **GIVEN** a URL with `mount=recessed25` and no facing key
- **WHEN** the page opens
- **THEN** facing is toward the wall

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

### Requirement: Layout for desktop and narrow screens
The system SHALL place the diagram and controls side by side on a wide viewport and stack the diagram above the controls on a narrow viewport.

#### Scenario: Narrow stack
- **GIVEN** a viewport narrower than the desktop breakpoint
- **WHEN** the page is shown
- **THEN** the diagram appears above the controls

### Requirement: Eye marker can be dragged
The system SHALL let the user move the eye by grabbing the eye marker on the side-view diagram with a pointer. Hovering the grab target SHALL show a grab cursor; while the pointer is down on that target the cursor SHALL be grabbing. The grab target MUST be larger than the drawn circle. A press on the diagram that does not hit the grab target MUST NOT move the eye. While the pointer is down, the diagram scale MUST stay the same as at press time. Releasing the pointer SHALL write the placed eye into the same viewer distance and height as the numeric controls. The glare status and emit-to-eye rays MUST follow the placed eye during the gesture.

#### Scenario: Hover shows the marker is grabbable
- **GIVEN** a valid scene with the diagram visible
- **WHEN** the pointer hovers the eye grab target
- **THEN** the cursor is grab

#### Scenario: Dragging the marker moves the eye
- **GIVEN** a valid scene with the eye in free space
- **WHEN** the user presses the eye grab target and moves the pointer to another free-space point on the diagram
- **THEN** the eye marker follows that point
- **AND** the distance and height fields show the matching millimeter values
- **AND** the glare status matches the engine for the new eye

#### Scenario: Clicking empty space does not move the eye
- **GIVEN** a visible diagram and an eye at a known position
- **WHEN** the user presses the diagram away from the eye grab target
- **THEN** the eye stays at the known position

#### Scenario: Scale does not jump during the drag
- **GIVEN** the user started dragging the eye
- **WHEN** the pointer moves so the eye would otherwise enlarge the fitted frame
- **THEN** the diagram scale stays as it was at press
- **AND** the eye marker stays under the pointer

### Requirement: Viewer fields use the same eye placement
The system SHALL apply the same eye placement as the geometry engine when the user changes viewer distance or height from sliders, fields, or the URL. After apply, the controls, the diagram, and the URL MUST show the placed eye, not a point inside an occluder or behind the wall.

#### Scenario: Typing into a shelf snaps out
- **GIVEN** a lower shelf of positive thickness and a viewer X that crosses that shelf
- **WHEN** the user sets eye height to a value inside the shelf interior
- **THEN** the height field does not keep an interior value
- **AND** the diagram eye is outside that interior

#### Scenario: Shared URL with an interior eye is placed
- **GIVEN** a URL whose viewer coordinates lie inside the upper shelf
- **WHEN** the page opens
- **THEN** the shown eye is outside that shelf interior
- **AND** the query string matches the placed viewer coordinates
