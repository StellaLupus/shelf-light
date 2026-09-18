# static-hosting Specification

## Purpose

Позволяет запустить калькулятор локально и выложить его в интернет как статику без серверной логики и аккаунтов.

## Requirements

### Requirement: Local development server
The system SHALL start a local development server that serves the visualizer without a backend process.

#### Scenario: Dev server opens the app
- **GIVEN** dependencies are installed
- **WHEN** the user runs the documented dev command
- **THEN** the visualizer page loads in a browser
- **AND** changing a slider updates the diagram without a server round-trip

### Requirement: Static production build
The system SHALL produce a static file tree that contains the app and assets and can be served by any static file server.

#### Scenario: Preview the build
- **GIVEN** a successful production build
- **WHEN** the build is served by the documented preview or nginx
- **THEN** the visualizer loads
- **AND** URL state and glare calculation work without an API

### Requirement: Container image
The system SHALL provide a Docker image that serves the static build with nginx and exposes HTTP.

#### Scenario: Compose up
- **GIVEN** Docker is available
- **WHEN** the user starts the documented compose file
- **THEN** the visualizer is reachable on the published port
- **AND** no application backend container is required

### Requirement: No accounts or secrets
The system MUST NOT require login, a database, or committed secrets to use the calculator.

#### Scenario: Fresh clone
- **GIVEN** a clone of the repository and the documented install steps
- **WHEN** the user opens the app
- **THEN** the calculator is usable without credentials
