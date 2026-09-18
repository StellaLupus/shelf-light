# geometry-engine Specification

## Purpose

Считает двумерный разрез двух полок, протяжённой светодиодной ленты и глаза и отвечает, есть ли прямой незаслонённый луч в глаза.

## Requirements

### Requirement: Scene uses millimeter 2D section
The system SHALL represent the wall-shelf scene as a 2D cross-section in millimeters, with the origin at the wall and the top face of the lower shelf, +X into the room and +Y up.

#### Scenario: Default planted plane
- **GIVEN** a valid scene with a lower shelf
- **WHEN** the geometry engine builds the scene
- **THEN** the top of the lower shelf lies on `y = 0` and the wall lies on `x = 0`

### Requirement: LED is an extended emitter
The system SHALL model the LED strip as an emitting segment of strictly positive width and MUST NOT treat the strip as a single point.

#### Scenario: Width participates in glare
- **GIVEN** a scene where only the outer end of the emitting segment has a clear path to the eye
- **WHEN** the engine evaluates direct glare
- **THEN** the result is glare present
- **AND** the inner end alone is not used as the sole sample

#### Scenario: Zero width rejected
- **GIVEN** a scene with `led.width <= 0`
- **WHEN** the engine validates the scene
- **THEN** the scene is rejected as invalid

### Requirement: Corner mount
The system SHALL place a `corner` emitter in the inner corner of the wall and the underside of the upper shelf, along an emit angle into the room and downward (default 45 degrees).

#### Scenario: Corner segment near the wall
- **GIVEN** mount type `corner` and a positive emit angle
- **WHEN** the engine builds the emitter
- **THEN** the inner end of the segment lies at the wall/underside corner (including profile drop)
- **AND** the segment extends along the emit angle by `led.width`

### Requirement: Downward mount
The system SHALL place a `downward` emitter as a horizontal segment on the underside of the upper shelf, starting at `led.offsetFromWall` from the wall, facing down, and MUST keep the segment within the upper shelf depth.

#### Scenario: Horizontal window under the shelf
- **GIVEN** mount type `downward` and an offset that leaves the full width under the upper shelf
- **WHEN** the engine builds the emitter
- **THEN** the emitting segment is horizontal
- **AND** it starts at the given wall offset
- **AND** it does not pass the front edge of the upper shelf

#### Scenario: Offset past the front edge
- **GIVEN** mount type `downward` and `offsetFromWall + led.width` greater than upper shelf depth
- **WHEN** the engine validates the scene
- **THEN** the scene is rejected as invalid

### Requirement: Solid occluders
The system SHALL treat the upper shelf body, the lower shelf body, and the upper-shelf valance (бленда) as opaque solids. A ray that grazes an occluder edge SHALL count as blocked. Plant and pot geometry SHALL NOT occlude.

#### Scenario: Valance blocks the outer ray
- **GIVEN** a downward emitter and a valance tall enough to intersect the segment from the outer emit point to the eye
- **WHEN** the engine tests that segment
- **THEN** the segment is reported as occluded

#### Scenario: Deeper lower shelf can block
- **GIVEN** an otherwise glaring path
- **WHEN** the lower shelf depth increases enough to intersect the emit-to-eye segment
- **THEN** that segment becomes occluded

### Requirement: Direct glare from any emit point
The system SHALL report direct glare if and only if at least one point on the emitting segment has an unobstructed path to the eye that also lies in the emitter front half-plane. The engine MUST sample both endpoints and at least 16 interior points.

#### Scenario: Inner edge glares when looking under the shelf
- **GIVEN** a viewer looking up under the upper shelf
- **AND** only the inner portion of the emitting segment is unobstructed
- **WHEN** the engine evaluates direct glare
- **THEN** glare is present even if the outer endpoint is occluded

#### Scenario: All samples blocked
- **GIVEN** every sampled emit-to-eye segment intersects an occluder or leaves the front half-plane
- **WHEN** the engine evaluates direct glare
- **THEN** glare is absent

### Requirement: Ray payloads for the diagram
The system SHALL return, together with the boolean glare flag, per-sample visibility so the UI can draw blocked and unblocked rays without recomputing geometry.

#### Scenario: Payload matches the boolean
- **GIVEN** a valid scene
- **WHEN** the engine evaluates the scene
- **THEN** `hasDirectGlare` is true if and only if at least one returned sample is unobstructed
