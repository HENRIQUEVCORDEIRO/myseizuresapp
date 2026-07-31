<!--
Sync Impact Report
Version change: template → 1.0.0
Modified principles: template placeholders → five founding principles
Added sections: Technical Constraints; Development Workflow
Removed sections: none
Follow-up TODOs: none
-->
# MySeizures Constitution

## Core Principles

### I. Clean Architecture and Explicit Boundaries
The application MUST use Clean Architecture and maintain explicit boundaries among interface,
domain, and persistence. The domain MUST remain independent of React Native, SQLite, and delivery
mechanisms; dependencies MUST point inward. This protects clinical rules from infrastructure change.

### II. SOLID, Clean Code, and Focused Components
Code MUST apply SOLID principles and favor readability, simplicity, low coupling, and cohesive
abstractions. React Native components MUST have one clear responsibility; business rules MUST NOT
be embedded in screens or UI components. This keeps clinical behavior understandable and safe to
evolve.

### III. Specification and Acceptance Before Completion
Work MUST be specification-driven: requirements, acceptance criteria, and relevant architectural
decisions MUST be documented before implementation. A feature MUST NOT be considered complete
until every stated acceptance criterion is demonstrably met.

### IV. Verified Clinical Rules
Critical business rules MUST have automated tests. Changes to such rules MUST update or add tests
and MUST pass them before integration. Tests are the executable evidence that clinical behavior
remains correct.

### V. Privacy, Accessibility, and Offline Resilience
Clinical data MUST be protected through safeguards compatible with LGPD principles, including data
minimization, access control, and secure handling. Accessibility is mandatory: interfaces MUST
support people with neurological limitations. The app MUST be offline-first, with SQLite as its
local persistence foundation.

## Technical Constraints

The codebase MUST use TypeScript or modern JavaScript consistently, with clear types and modern
language practices. SQLite access MUST be isolated in the persistence layer. Interface code MUST
depend on application/domain contracts, not storage implementations.

## Development Workflow

Commits MUST be small, coherent, and traceable to a specification or decision. Architecture and
material technical decisions MUST be documented continuously. Reviews MUST check compliance with
these principles, acceptance criteria, tests for critical rules, privacy, and accessibility.

## Governance

This Constitution governs all project practices and takes precedence over conflicting guidance.
Amendments MUST document their rationale, impact, and any required migration, then be reviewed
before adoption. Versioning follows semantic intent: MAJOR for incompatible governance changes,
MINOR for new or materially expanded principles, and PATCH for clarifications. Each review MUST
verify compliance and record justified exceptions.

**Version**: 1.0.0 | **Ratified**: 2026-07-31 | **Last Amended**: 2026-07-31
