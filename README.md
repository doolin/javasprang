# Todo Application

A Spring Boot application for managing todo items with user authentication.

## Project Structure

- `src/main/java/com/todoapp/` - Main application code
- `src/test/java/com/todoapp/` - Test code
- `src/main/resources/` - Application properties and resources

## Building and Running

```bash
# Build the application
./mvnw clean package

# Run the application
./mvnw spring-boot:run
```

After signing in, the root route (`/`) shows a Kanban board with three columns:

- `To Do`
- `In Progress`
- `Done`

Cards can be created, moved between columns, and deleted.

## Local Database (Docker, Port 55432)

The application datasource is configured for PostgreSQL on `localhost:55432`.

```bash
# Build and start the project Postgres container
docker compose -f docker/postgres/compose.yaml up -d --build

# Verify container status
docker compose -f docker/postgres/compose.yaml ps
```

To stop it:

```bash
docker compose -f docker/postgres/compose.yaml down
```

## Synthetic Seed Data

Use the provisioning script to insert synthetic users and todos:

```bash
./scripts/provision_synthetic_data.sh
```

Reset synthetic rows and re-seed:

```bash
./scripts/provision_synthetic_data.sh --reset
```

The provisioning now uses PostgreSQL `MERGE` statements for idempotent upserts
instead of insert-if-missing stopgaps.

Note: this is still an interim approach. A proper migration/seed strategy (for
example Flyway/Liquibase with versioned data fixtures) should replace this in a
future hardening pass.

Default seed users (password: `password123`):

- `synth_alice`
- `synth_bob`
- `synth_carol`

## Testing

```bash
# Run tests
./mvnw test
```

## Current Findings (March 2026)

Recent verification runs found two important test-suite issues:

1. Backend tests are not fully hermetic.
- Running `./mvnw test` currently fails in JPA tests when a local PostgreSQL database named `todoapp` is unavailable.
- Several tests expect H2 test behavior but are resolving to the PostgreSQL datasource at runtime.

2. Frontend auth service tests are out of sync with implementation.
- `AuthService` calls `/api/v1/auth/...` endpoints.
- `auth.service.spec.ts` expects `/api/auth/...`, causing request matcher failures and cascading async test errors.

These findings indicate that the repository builds, but does not currently provide reliable out-of-the-box green tests.

## Stabilization Plan

### Phase 1: Restore deterministic tests

Goal: Make `./mvnw test` and frontend unit tests pass on a clean machine without local PostgreSQL requirements.

1. Backend profile and datasource alignment.
- Ensure test execution always activates a test profile (`test`) or explicit datasource override.
- Confirm `@DataJpaTest` classes bind to H2/test configuration consistently.
- Remove or scope any properties that force external DB usage during tests.

2. Frontend auth test alignment.
- Update auth service test URL expectations to `/api/v1/auth/login` and `/api/v1/auth/register`.
- Adjust observable assertions to account for initial `BehaviorSubject` emission (`null`) before success emission.

Acceptance criteria:
- `./mvnw test` exits successfully.
- `npm test -- --watch=false --browsers=ChromeHeadless` exits successfully from `src/main/frontend`.

### Phase 2: Guardrails against regressions

Goal: Prevent endpoint and config drift from silently breaking CI.

1. Introduce shared constants for API base path in frontend service/tests.
2. Add a simple CI job that runs backend and frontend tests on every PR.
3. Keep generated artifacts and local outputs out of commits (already mostly addressed via `.gitignore`).

Acceptance criteria:
- PR checks fail fast on backend or frontend test regressions.
- Endpoint path changes require updates in one place.

### Phase 3: Security and configuration hardening

Goal: Improve production readiness after test stability is restored.

1. Replace development JWT secret defaults with environment-based configuration.
2. Review dual Spring Security filter chains and simplify matchers where possible.
3. Add/update docs for required runtime env vars and local setup.

Acceptance criteria:
- No hardcoded sensitive defaults in production configuration.
- Security rules are documented and easier to reason about.

## Suggested Local Verification Workflow

```bash
# backend
./mvnw test

# frontend
cd src/main/frontend
npm test -- --watch=false --browsers=ChromeHeadless
```

## Handling Large Files

This repository is configured to prevent large files from being committed. The following files and directories are ignored:

- `target/` - Build output directory
- `*.exec` - JaCoCo execution data files
- `target/site/jacoco/` - JaCoCo reports
- `target/surefire-reports/` - Test reports

### If you need to add a large file

1. Add the file pattern to `.gitignore`
2. Remove the file from git tracking with `git rm --cached <file>`
3. Commit the changes

### Pre-commit Hook

A pre-commit hook is installed to prevent files larger than 1MB from being committed. If you need to commit a large file:

1. Temporarily disable the hook: `git commit --no-verify -m "Your message"`
2. Or modify the hook to allow your specific file

## License

This project is licensed under the MIT License - see the LICENSE file for details. 