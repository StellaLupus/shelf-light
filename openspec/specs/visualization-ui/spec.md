# visualization-ui Specification

## Purpose

Показывает разрез полок и ленты, статус прямого луча в глаза и даёт связанные ползунки, поля и URL для тех же параметров.

## Requirements

### Requirement: Side-view diagram
The system SHALL render a side-view diagram of the wall, both shelves, the valance, the LED as a strip with visible width, the eye, downward fill light toward the plant zone, and emit-to-eye rays.

#### Scenario: LED is not a dot
- **GIVEN** a valid scene with `led.width > 0`
- **WHEN** the diagram is shown
- **THEN** the LED is drawn as a strip or rectangle whose width matches the scene
- **AND** not as a single point marker

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

### Requirement: URL encodes the scene
The system SHALL encode the full calculator state in the page URL query string so opening the same URL locally or on a host restores the same scene.

#### Scenario: Reload keeps values
- **GIVEN** the user set mount type `corner` and a custom blend height
- **WHEN** the page is reloaded
- **THEN** mount type and blend height are the same
- **AND** the glare status is recomputed from those values

#### Scenario: Shared link
- **GIVEN** a URL produced by the app
- **WHEN** another browser opens that URL
- **THEN** all parameters and the glare status match the original scene

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
