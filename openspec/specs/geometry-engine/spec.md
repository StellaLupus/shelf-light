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
The system SHALL model the LED as one or more extended emit surfaces of strictly positive profile size and MUST NOT treat the source as a single point. For `downward`, `led.width` remains the horizontal window length. For `radius`, `ell`, and `triangle`, `led.width` is the body size W, and arc, square sides, and hypotenuse are derived from W.

#### Scenario: Width participates in glare
- **GIVEN** a scene where only the outer end of the emitting segment has a clear path to the eye
- **WHEN** the engine evaluates direct glare
- **THEN** the result is glare present
- **AND** the inner end alone is not used as the sole sample

#### Scenario: Zero width rejected
- **GIVEN** a scene with `led.width <= 0`
- **WHEN** the engine validates the scene
- **THEN** the scene is rejected as invalid

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

### Requirement: Valance-flush profile pocket
The system SHALL place `radius`, `ell`, and `triangle` profiles in the pocket at the underside of the upper shelf and the inner face of the valance. If valance thickness is zero, the pocket SHALL use the front edge of the upper shelf. `led.width` SHALL be the profile body size W. The system MUST apply `profileDrop` as today (lower the pocket below the underside). The system MUST reject a profile that would cross the wall (`W` larger than the remaining depth from the wall to the pocket).

#### Scenario: Pocket sits against the valance
- **GIVEN** an upper shelf with a valance of positive thickness and a `triangle` mount
- **WHEN** the engine builds the scene
- **THEN** the profile's right-angle corner lies on the underside line and on the inner valance face
- **AND** the body extends toward the wall and downward by W

#### Scenario: No valance uses the front edge
- **GIVEN** valance thickness 0 and a `radius` mount
- **WHEN** the engine builds the scene
- **THEN** the pocket corner lies at the front edge of the upper shelf underside

#### Scenario: Profile wider than remaining depth
- **GIVEN** `W` plus valance thickness greater than upper shelf depth
- **WHEN** the engine validates the scene
- **THEN** the scene is rejected as invalid

### Requirement: Radius diffuser profile
The system SHALL model `radius` as a quarter-circle diffuser of radius W in the pocket, emitting along the arc into the bay (toward the wall and down).

#### Scenario: Arc radius follows W
- **GIVEN** mount type `radius` and profile size W
- **WHEN** the engine builds the emitter
- **THEN** the emit surface is a quarter-circle of radius W
- **AND** the arc runs from the underside toward the wall to the inner valance face downward

### Requirement: L-shaped reflector profile
The system SHALL model `ell` as a W by W square in the pocket whose two free faces emit: the face toward the wall and the face downward.

#### Scenario: Two emit faces
- **GIVEN** mount type `ell` and profile size W
- **WHEN** the engine builds the emitter
- **THEN** the body is a square of side W in the pocket
- **AND** both the wall-facing side and the downward side are emit surfaces
- **AND** glare is present if either face has an unobstructed front-half-plane path to the eye

### Requirement: Triangle profile at 45 degrees
The system SHALL model `triangle` as a right triangle in the pocket with equal legs of length W and a 45-degree hypotenuse. The hypotenuse SHALL be the sole emit surface and SHALL face the bay. The system MUST NOT take an emit angle input for this profile.

#### Scenario: Hypotenuse is derived
- **GIVEN** mount type `triangle` and profile size W
- **WHEN** the engine builds the emitter
- **THEN** both legs have length W
- **AND** the hypotenuse length is W times the square root of two
- **AND** changing a leftover emit-angle field does not move the body

### Requirement: Solid occluders
The system SHALL treat the upper shelf body, the lower shelf body, the upper-shelf valance (бленда), and the opaque body of a valance-flush profile as opaque solids. A ray that grazes an occluder edge SHALL count as blocked. Plant and pot geometry SHALL NOT occlude.

#### Scenario: Valance blocks the outer ray
- **GIVEN** a downward emitter and a valance tall enough to intersect the segment from the outer emit point to the eye
- **WHEN** the engine tests that segment
- **THEN** the segment is reported as occluded

#### Scenario: Deeper lower shelf can block
- **GIVEN** an otherwise glaring path
- **WHEN** the lower shelf depth increases enough to intersect the emit-to-eye segment
- **THEN** that segment becomes occluded

#### Scenario: Profile body blocks a through-body ray
- **GIVEN** an `ell` profile and an eye in the room whose segment from the wall-facing emit face would cross the square body
- **WHEN** the engine tests that segment
- **THEN** the segment is reported as occluded

### Requirement: Direct glare from any emit point
The system SHALL report direct glare if and only if at least one point on any emitting surface has an unobstructed path to the eye that also lies in that surface's front half-plane. The engine MUST sample both endpoints and at least 16 interior points on every emit segment or arc.

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

### Requirement: Eye stays outside solids
The system SHALL place the observer eye at the requested scene coordinates when that point is in free space (`x >= 0` and not in the interior of an occluder). If the requested point is behind the wall (`x < 0`) or in the interior of an occluder, the system SHALL move the eye onto a position that is not behind the wall and not inside any occluder. A point on an occluder boundary SHALL be accepted. The solids that displace the eye MUST be the same occluders used for glare: upper shelf, lower shelf, valance, and the opaque profile body when present. A visual `triangle` or `radius` body that is not an occluder MUST NOT displace the eye. The glare test itself MUST keep using the placed eye as a point.

#### Scenario: Eye inside the lower shelf is moved out
- **GIVEN** a valid scene whose lower shelf occupies a rectangle in the section
- **AND** a requested eye point in the interior of that rectangle
- **WHEN** the engine places the eye
- **THEN** the placed eye is not in the interior of the lower shelf
- **AND** the placed eye is not behind the wall

#### Scenario: Eye behind the wall is moved to the wall
- **GIVEN** a requested eye with `x < 0` and a Y that is not inside an occluder
- **WHEN** the engine places the eye
- **THEN** the placed eye has `x = 0`
- **AND** its Y is unchanged

#### Scenario: Eye in the bay stays
- **GIVEN** a requested eye between the shelves, in front of the wall, and outside every occluder
- **WHEN** the engine places the eye
- **THEN** the placed coordinates equal the requested coordinates

#### Scenario: Eye on a shelf face stays
- **GIVEN** a requested eye that lies on the underside of the upper shelf and not in any occluder interior
- **WHEN** the engine places the eye
- **THEN** the placed coordinates equal the requested coordinates

#### Scenario: Eye inside the valance is moved out
- **GIVEN** a valance of positive size and a requested eye in its interior
- **WHEN** the engine places the eye
- **THEN** the placed eye is not in the interior of the valance

#### Scenario: Eye inside an ell body is moved out
- **GIVEN** an `ell` profile with an opaque square body and a requested eye in that square's interior
- **WHEN** the engine places the eye
- **THEN** the placed eye is not in the interior of the square
