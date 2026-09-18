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
