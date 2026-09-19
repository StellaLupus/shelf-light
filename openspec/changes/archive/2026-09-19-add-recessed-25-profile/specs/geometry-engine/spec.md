## ADDED Requirements

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

## MODIFIED Requirements

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
