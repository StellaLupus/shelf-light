# visualization-ui Specification

## Purpose

Показывает разрез полок и ленты, статус прямого луча в глаза и даёт связанные ползунки, поля и URL для тех же параметров.

## Requirements

### Requirement: Side-view diagram
The system SHALL render a side-view diagram of the wall, both shelves, the valance, the LED profile body, the eye, downward fill light toward the plant zone, and emit-to-eye rays. For `downward` the LED SHALL remain a strip with visible width. For `radius` the body SHALL be a quarter-circle. For `ell` the body SHALL be a square. For `triangle` the body SHALL be a right triangle. The LED MUST NOT be a single point marker.

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

### Requirement: Ray colors match geometry
The system SHALL draw unobstructed emit-to-eye samples in red and occluded samples in green. The on-screen glare status MUST match the geometry engine boolean.

#### Scenario: Status follows the engine
- **GIVEN** the engine reports `hasDirectGlare = true`
- **WHEN** the page renders
- **THEN** the status reads that a direct ray reaches the eyes
- **AND** at least one red ray is shown

#### Scenario: Clear status when blocked
- **GIVEN** the engine reports `hasDirectGlare = false`
- **WHEN** the page renders
- **THEN** the status reads that no direct ray reaches the eyes
- **AND** emit-to-eye rays that are shown are green

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
The system SHALL offer four mount choices: downward, radius, L-shaped, and triangle. The emit-angle control MUST NOT be shown. The wall-offset control SHALL appear only for `downward`. Profile size SHALL stay visible for every mount.

#### Scenario: Offset hidden on a valance-flush profile
- **GIVEN** the user selected the triangle mount
- **WHEN** the controls render
- **THEN** the wall-offset field and slider are hidden
- **AND** no emit-angle field is shown

#### Scenario: Offset visible on downward
- **GIVEN** the user selected downward mount
- **WHEN** the controls render
- **THEN** the wall-offset field and slider are shown

### Requirement: URL encodes the scene
The system SHALL encode the full calculator state in the page URL query string so opening the same URL locally or on a host restores the same scene. Allowed mount values are `downward`, `radius`, `ell`, and `triangle`. The value `corner` SHALL be read as `triangle`. An emit-angle query parameter SHALL be ignored.

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

### Requirement: Invalid input does not crash the view
The system SHALL reject physically impossible values in the controls (non-positive gap, LED past the upper front edge, non-positive LED width) and MUST keep the previous valid diagram visible with a validation message.

#### Scenario: LED past the front edge
- **GIVEN** a valid downward scene
- **WHEN** the user sets an offset that pushes the strip past the upper shelf front
- **THEN** a validation message is shown
- **AND** the page does not go blank

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
