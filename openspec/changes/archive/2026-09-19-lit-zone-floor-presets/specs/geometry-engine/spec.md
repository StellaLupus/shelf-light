## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Eye stays outside solids
The system SHALL place the observer eye at the requested scene coordinates when that point is in free space (`x >= 0`, `y >= -H`, and not in the interior of an occluder), where `H` is `lower.heightFromFloor`. If the requested point is behind the wall (`x < 0`), below the floor (`y < -H`), or in the interior of an occluder, the system SHALL move the eye onto a position that is not behind the wall, not below the floor, and not inside any occluder. A point on an occluder boundary or on the floor SHALL be accepted. The solids that displace the eye MUST be the same occluders used for glare: upper shelf, lower shelf, valance, and the opaque profile body when present. A visual `triangle` or `radius` body that is not an occluder MUST NOT displace the eye. The floor MUST clamp the eye from below and MUST NOT be treated as a glare occluder. The glare test itself MUST keep using the placed eye as a point.

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
