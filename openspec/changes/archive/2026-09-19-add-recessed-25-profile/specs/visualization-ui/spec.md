## ADDED Requirements

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

## MODIFIED Requirements

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
