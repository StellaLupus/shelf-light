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
The system SHALL model the LED as one or more extended emit surfaces of strictly positive profile size and MUST NOT treat the source as a single point. For `downward`, `led.width` remains the horizontal window length. For `radius`, `ell`, and `triangle`, `led.width` is the body size W, and arc, square sides, and hypotenuse are derived from W. For `recessed25`, the emit surface is the catalog milk and `led.width` MUST NOT size that surface.

#### Scenario: Width participates in glare
- **GIVEN** a scene where only the outer end of the emitting segment has a clear path to the eye
- **WHEN** the engine evaluates direct glare
- **THEN** the result is glare present
- **AND** the inner end alone is not used as the sole sample

#### Scenario: Zero width rejected
- **GIVEN** a `downward`, `radius`, `ell`, or `triangle` scene with `led.width <= 0`
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

### Requirement: Recessed 25-degree catalog profile
The system SHALL place mount `recessed25` as a catalog inset channel in a groove cut into the underside of the upper shelf. The body SHALL be 40 mm along X including 2.5 mm stops on each side. The groove SHALL be 35 mm wide and 14 mm deep into the shelf. The sole emit surface SHALL be the milky diffuser: a 14 mm segment at 25 degrees from vertical. The horizontal window SHALL be 27 mm from the lower edge of the milk to the far end of the cutout. The milk MUST sit on the near side of that window, with its upper end closer to the cutout end than its lower edge. `led.width` MUST NOT size the body or the emit segment. `led.profileDrop` MUST NOT move the groove; the stops MAY stand 2 mm proud of the underside. The LED pocket height 11.5 mm MUST NOT be an emit surface.

#### Scenario: Catalog milk sits in the groove
- **GIVEN** a valid `recessed25` scene whose 40 mm body fits under the upper shelf
- **WHEN** the engine builds the emitter
- **THEN** the emit surface is a single 14 mm segment
- **AND** that segment is 25 degrees from vertical
- **AND** the horizontal span from the milk's lower edge to the far groove wall is 27 mm
- **AND** changing a leftover `led.width` value does not move the milk

#### Scenario: Offset positions the 40 mm body
- **GIVEN** mount type `recessed25` and `offsetFromWall = 40`
- **WHEN** the engine builds the scene
- **THEN** the wall-side edge of the 40 mm body lies 40 mm from the wall
- **AND** the 35 mm groove lies between the stops

### Requirement: Recessed facing flip
The system SHALL orient `recessed25` by a facing flag `wall` or `room`. Facing `wall` SHALL point the 27 mm window and the milk normal toward the wall (into the bay). Facing `room` SHALL mirror the channel internals in X about the body so the window points into the room. The 40 mm body span MUST stay the same; only the milk, window, and opaque channel side SHALL swap.

#### Scenario: Default faces the wall
- **GIVEN** a valid `recessed25` scene with facing `wall`
- **WHEN** the engine builds the emitter
- **THEN** a point in the bay below the window and toward the wall lies in the milk's front half-plane
- **AND** the far end of the 27 mm window is the wall-side groove wall

#### Scenario: Room facing mirrors internals
- **GIVEN** the same offset and body as a wall-facing `recessed25` scene
- **WHEN** facing is `room`
- **THEN** the 40 mm body occupies the same X span
- **AND** the 27 mm window opens toward the room
- **AND** a point in the room below the window lies in the milk's front half-plane

### Requirement: Groove cutout in the upper shelf
The system SHALL treat the `recessed25` groove as air. Upper-shelf glare occluders MUST be the remaining wood: a cap above the groove and cheeks on both sides of the 35 mm cutout. A ray that crosses a cheek or the cap SHALL count as blocked. A ray that stays in the groove cavity MUST NOT be blocked by the upper shelf. Opaque aluminum behind the milk MAY be an additional occluder. The engine MUST NOT keep the upper shelf as one solid rectangle that contains the milk.

#### Scenario: Sample starts in groove air
- **GIVEN** a valid `recessed25` scene
- **WHEN** the engine samples the milk
- **THEN** each sample start lies in the groove cavity or just outside the mouth
- **AND** the start is not in the interior of any upper-shelf wood occluder

#### Scenario: Cheek blocks a path through the shelf
- **GIVEN** a `recessed25` emit sample whose straight path to the eye crosses an upper-shelf cheek
- **WHEN** the engine tests that segment
- **THEN** the segment is reported as occluded

### Requirement: Recessed profile validation
The system SHALL reject `recessed25` when the upper shelf is thinner than the 14 mm groove, when `offsetFromWall` is negative, or when `offsetFromWall + 40` is greater than the upper shelf depth. The system MUST NOT reject `recessed25` because a leftover `led.width` is non-positive.

#### Scenario: Thin shelf rejected
- **GIVEN** mount type `recessed25` and upper thickness 12
- **WHEN** the engine validates the scene
- **THEN** the scene is rejected as invalid

#### Scenario: Body past the front edge
- **GIVEN** mount type `recessed25` and `offsetFromWall + 40` greater than upper shelf depth
- **WHEN** the engine validates the scene
- **THEN** the scene is rejected as invalid

#### Scenario: Leftover width ignored
- **GIVEN** a `recessed25` scene that otherwise fits
- **AND** a stored `led.width` of 0
- **WHEN** the engine validates the scene
- **THEN** the scene is not rejected for width

### Requirement: Solid occluders
The system SHALL treat the upper shelf body, the lower shelf body, the upper-shelf valance (бленда), and the opaque body of a valance-flush or recessed profile as opaque solids. For `recessed25` the upper shelf body SHALL be the wood that remains after the groove cutout, not a single rectangle that fills the groove. A ray that grazes an occluder edge SHALL count as blocked. Plant and pot geometry SHALL NOT occlude.

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

### Requirement: Floor sits below the lower shelf
The system SHALL model a floor as a horizontal room bound at `y = -H`, where `H` is `lower.heightFromFloor` — the distance from the floor to the top face of the lower shelf. The origin MUST stay at the wall and the planting plane. The floor MUST NOT be a glare occluder. The scene MUST be rejected if `H` is not finite, if `H <= 0`, or if `H` is not greater than `lower.thickness`.

#### Scenario: Floor is below the planting plane
- **GIVEN** a valid scene with `lower.heightFromFloor = 1200`
- **WHEN** the engine builds the scene
- **THEN** the planting plane remains at `y = 0`
- **AND** the floor lies at `y = -1200`

#### Scenario: Shelf intersecting the floor is rejected
- **GIVEN** `lower.thickness = 18` and `lower.heightFromFloor = 18`
- **WHEN** the engine validates the scene
- **THEN** the scene is rejected as invalid

### Requirement: Direct-lit region
The system SHALL compute a direct-lit region in the room: a point belongs to the region if and only if treating that point as the observer would report direct glare. The region MUST be clipped to the wall (`x = 0`), the floor (`y = -H`), and a stable room box that does not depend on the current eye. The engine MUST return that region together with the glare flag and emit-to-eye samples so the UI can draw the fill without recomputing visibility. A point with `y < -H` or `x < 0` MUST NOT belong to the region.

#### Scenario: Eye membership matches glare
- **GIVEN** a valid scene
- **WHEN** the engine evaluates glare and the direct-lit region
- **THEN** the placed eye is inside the region if and only if `hasDirectGlare` is true

#### Scenario: Planting plane under a downward strip is lit
- **GIVEN** a valid `downward` scene whose emit segment sits above the lower shelf
- **WHEN** the engine evaluates the direct-lit region
- **THEN** a point on `y = 0` directly below the emit segment and in front of the wall is inside the region

#### Scenario: Valance shadow is not lit
- **GIVEN** a downward emitter and a valance tall enough to block paths from every emit sample to a point just outside the valance, in its geometric shadow
- **WHEN** the engine evaluates the direct-lit region
- **THEN** that shadowed point is outside the region

#### Scenario: Floor clips the region
- **GIVEN** a valid scene with `lower.heightFromFloor = 1200`
- **WHEN** the engine evaluates the direct-lit region
- **THEN** every point of the returned region has `y >= -1200`
- **AND** `x >= 0`

### Requirement: Eye stays outside solids
The system SHALL place the observer eye at the requested scene coordinates when that point is in free space (`x >= 0`, `y >= -H`, and not in the interior of an occluder), where `H` is `lower.heightFromFloor`. If the requested point is behind the wall (`x < 0`), below the floor (`y < -H`), or in the interior of an occluder, the system SHALL move the eye onto a position that is not behind the wall, not below the floor, and not inside any occluder. A point on an occluder boundary or on the floor SHALL be accepted. The solids that displace the eye MUST be the same occluders used for glare: upper shelf, lower shelf, valance, and the opaque profile body when present. A visual `triangle` or `radius` body that is not an occluder MUST NOT displace the eye. Groove air of `recessed25` MUST NOT displace the eye. The floor MUST clamp the eye from below and MUST NOT be treated as a glare occluder. The glare test itself MUST keep using the placed eye as a point.

#### Scenario: Eye inside the lower shelf is moved out
- **GIVEN** a valid scene whose lower shelf occupies a rectangle in the section
- **AND** a requested eye point in the interior of that rectangle
- **WHEN** the engine places the eye
- **THEN** the placed eye is not in the interior of the lower shelf
- **AND** the placed eye is not behind the wall

#### Scenario: Eye behind the wall is moved to the wall
- **GIVEN** a requested eye with `x < 0` and a Y that is not inside an occluder and not below the floor
- **WHEN** the engine places the eye
- **THEN** the placed eye has `x = 0`
- **AND** its Y is unchanged

#### Scenario: Eye in the bay stays
- **GIVEN** a requested eye between the shelves, in front of the wall, above the floor, and outside every occluder
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

#### Scenario: Eye below the floor is lifted
- **GIVEN** a valid scene with `lower.heightFromFloor = 1200`
- **AND** a requested eye at `y = -1300` whose X is not inside an occluder
- **WHEN** the engine places the eye
- **THEN** the placed eye has `y = -1200`
- **AND** its X is unchanged

#### Scenario: Eye in recessed groove air stays
- **GIVEN** a valid `recessed25` scene
- **AND** a requested eye in the groove cavity, not in wood or aluminum
- **WHEN** the engine places the eye
- **THEN** the placed coordinates equal the requested coordinates

#### Scenario: Eye inside a recessed cheek is moved out
- **GIVEN** a valid `recessed25` scene
- **AND** a requested eye in the interior of an upper-shelf cheek
- **WHEN** the engine places the eye
- **THEN** the placed eye is not in the interior of that cheek
