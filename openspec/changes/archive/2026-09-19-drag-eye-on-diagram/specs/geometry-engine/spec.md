## ADDED Requirements

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
