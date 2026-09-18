## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Corner mount
**Reason**: Реальный угловой профиль ставится в упор к бленде и имеет три формы; отрезок от стены под произвольным углом больше не описывает изделие.
**Migration**: Тип `corner` в состоянии и URL заменяется на `triangle`. Старое значение `mount=corner` читается как `triangle`. Поле угла излучения не используется.

## MODIFIED Requirements

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
