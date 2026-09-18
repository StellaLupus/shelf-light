## ADDED Requirements

### Requirement: Eye marker can be dragged
The system SHALL let the user move the eye by grabbing the eye marker on the side-view diagram with a pointer. Hovering the grab target SHALL show a grab cursor; while the pointer is down on that target the cursor SHALL be grabbing. The grab target MUST be larger than the drawn circle. A press on the diagram that does not hit the grab target MUST NOT move the eye. While the pointer is down, the diagram scale MUST stay the same as at press time. Releasing the pointer SHALL write the placed eye into the same viewer distance and height as the numeric controls. The glare status and emit-to-eye rays MUST follow the placed eye during the gesture.

#### Scenario: Hover shows the marker is grabbable
- **GIVEN** a valid scene with the diagram visible
- **WHEN** the pointer hovers the eye grab target
- **THEN** the cursor is grab

#### Scenario: Dragging the marker moves the eye
- **GIVEN** a valid scene with the eye in free space
- **WHEN** the user presses the eye grab target and moves the pointer to another free-space point on the diagram
- **THEN** the eye marker follows that point
- **AND** the distance and height fields show the matching millimeter values
- **AND** the glare status matches the engine for the new eye

#### Scenario: Clicking empty space does not move the eye
- **GIVEN** a visible diagram and an eye at a known position
- **WHEN** the user presses the diagram away from the eye grab target
- **THEN** the eye stays at the known position

#### Scenario: Scale does not jump during the drag
- **GIVEN** the user started dragging the eye
- **WHEN** the pointer moves so the eye would otherwise enlarge the fitted frame
- **THEN** the diagram scale stays as it was at press
- **AND** the eye marker stays under the pointer

### Requirement: Viewer fields use the same eye placement
The system SHALL apply the same eye placement as the geometry engine when the user changes viewer distance or height from sliders, fields, or the URL. After apply, the controls, the diagram, and the URL MUST show the placed eye, not a point inside an occluder or behind the wall.

#### Scenario: Typing into a shelf snaps out
- **GIVEN** a lower shelf of positive thickness and a viewer X that crosses that shelf
- **WHEN** the user sets eye height to a value inside the shelf interior
- **THEN** the height field does not keep an interior value
- **AND** the diagram eye is outside that interior

#### Scenario: Shared URL with an interior eye is placed
- **GIVEN** a URL whose viewer coordinates lie inside the upper shelf
- **WHEN** the page opens
- **THEN** the shown eye is outside that shelf interior
- **AND** the query string matches the placed viewer coordinates
