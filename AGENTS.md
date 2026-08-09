# Agent-Verifiable Architecture (AVA)

This repository follows Agent-Verifiable Architecture (AVA).

AVA organizes software into bounded features that an AI coding agent can independently understand, modify, run, and verify through executable user behavior.

This repository is therefore organized around independently runnable and independently verifiable feature slices.

The primary architectural unit is not the frontend, backend, controller, service, or database layer.

The primary unit is the user-facing feature.

Each feature should contain everything required to understand, implement, run, test, and verify that capability with minimal knowledge of the rest of the application.

The goal is to make every AVA feature:

• bounded — understandable with limited context
• runnable — executable in a local or agent sandbox
• replaceable at its edges — external dependencies use explicit contracts/adapters
• verifiable — provable through real user interactions
• isolated from unrelated business logic
• safe to modify without understanding the entire codebase
• composable into the full production application

A feature is considered complete only when its user-visible behavior has been verified.

────────

## AVA Core Principle

> Every AVA feature should contain everything required to implement and prove its user-visible behavior, while depending on other capabilities only through explicit contracts.

Prefer:

```text
features/
  video-generation/
    frontend/
    backend/
    contracts/
    tests/
    fixtures/
```

over:

```text
frontend/
backend/
services/
repositories/
tests/
```

Technical layers may still exist inside a feature, but the feature is the primary boundary.

────────

## Repository Structure

Use this structure unless an existing feature already establishes a compatible convention:

```text
app/
  platform/
    auth/
    database/
    logging/
    telemetry/
    events/
    http/

  ui/
    button/
    modal/
    form/
    layout/

features/
  <feature-name>/
    frontend/
    backend/
    contracts/
    fixtures/
    tests/
      unit/
      integration/
      e2e/
    feature.yaml

journeys/
  e2e/

scripts/
  feature-dev
  feature-test
```

A feature may have sub-slices when it becomes large:

```text
features/
  video-generation/
    create/
    retry/
    cancel/
    history/
```

Do not introduce sub-slices prematurely.

────────

## Feature Ownership

A feature owns its business behavior.

Examples:

```text
features/billing
features/projects
features/video-generation
features/assets
features/notifications
```

A feature may own:

• frontend pages and components specific to the feature
• API routes
• application services
• domain logic
• persistence logic
• feature-owned database tables or schema
• feature contracts
• fixtures
• unit tests
• integration tests
• Playwright E2E tests

Do not move business behavior into shared, common, or utils merely because multiple files use it.

────────

## Shared Code Rules

Shared code is allowed only for infrastructure or genuinely generic UI primitives.

Good shared code:

```text
platform/auth
platform/database
platform/logging
platform/telemetry
platform/http

ui/button
ui/modal
ui/form
```

Bad shared code:

```text
shared/billing-logic
shared/user-business-rules
shared/video-generation-utils
shared/subscription-service
```

Rule:

> Share infrastructure. Do not share business implementation.

If two features need to communicate, define an explicit contract.

────────

## Cross-Feature Dependencies

Features must not import another feature’s internal implementation.

Forbidden:

```ts
import { billingRepository } from "../billing/backend/repository"
```

Forbidden:

```ts
import { userService } from "../users/backend/service"
```

Forbidden:

```sql
SELECT *
FROM video_generation.jobs j
JOIN billing.subscriptions b ON ...
```

Prefer explicit ports or contracts:

```ts
export interface CreditChecker {
  hasCredits(userId: string): Promise<boolean>
}
```

Production wiring:

```text
video-generation
      ↓
CreditChecker
      ↓
billing adapter
```

Feature sandbox wiring:

```text
video-generation
      ↓
CreditChecker
      ↓
FakeCreditChecker
```

Allowed cross-feature communication mechanisms:

• explicit interfaces
• application contracts
• commands
• queries
• events
• public feature APIs

Do not bypass these boundaries.

────────

## Platform Dependencies

Platform services provide infrastructure, not business rules.

Examples:

```text
AuthProvider
Database
Logger
EventBus
Clock
FileStorage
Telemetry
HTTP client
```

Features should depend on abstractions rather than vendor-specific implementations whenever practical.

Example:

```ts
interface AuthProvider {
  currentUser(): Promise<AuthContext | null>
}
```

Production:

```text
AuthProvider -> real auth implementation
```

Sandbox:

```text
AuthProvider -> fake auth implementation
```

────────

## Authentication and Authorization

Authentication is a platform concern.

Authorization should remain close to the feature when it contains business-specific rules.

Preferred split:

```text
platform/auth
  identity
  session
  authentication

feature
  permissions
  feature-specific authorization
```

Example:

```ts
const user = await auth.requireUser()

if (!videoPermissions.canGenerate(user)) {
  throw new ForbiddenError()
}
```

Avoid placing every business permission rule inside one global authorization service.

────────

## Database Boundaries

A single database is acceptable.

Prefer logical ownership by feature.

Example:

```text
auth.*
billing.*
video_generation.*
assets.*
```

A feature may access its own tables directly.

A feature should not query another feature’s tables directly unless there is an explicitly documented exception.

Prefer:

```text
video-generation -> BillingContract -> billing
```

over:

```text
video-generation -> billing tables
```

This preserves isolation without requiring separate databases or microservices.

────────

## Feature Manifest

Each independently runnable feature should define a feature.yaml.

Example:

```yaml
name: video-generation

frontend:
  routes:
    - /create
    - /videos/:id

backend:
  modules:
    - video_generation
    - assets

requires:
  - auth
  - credits
  - storage

test_adapters:
  auth: fake
  credits: fake
  storage: local
  video_provider: fake

fixtures:
  - authenticated_user
  - user_with_credits

e2e:
  smoke:
    - tests/e2e/generate-video.spec.ts

  regression:
    - tests/e2e/generate-video.spec.ts
    - tests/e2e/retry-generation.spec.ts
    - tests/e2e/cancel-generation.spec.ts
    - tests/e2e/history.spec.ts
```

The exact schema may evolve.

The important property is that an agent can inspect the manifest and understand:

• what the feature owns
• what it depends on
• how to start it
• which dependencies can be replaced
• which tests prove the feature works

────────

## Runnable Feature Requirement

Every major feature should be runnable in isolation.

Target developer experience:

```bash
app dev video-generation
```

This command should start the smallest complete environment necessary to exercise that feature.

Example:

```text
real:
  video-generation frontend
  video-generation backend
  feature database schema

test adapters:
  fake auth
  fake billing
  fake external AI provider
  local storage
```

Do not require the entire production application unless the feature genuinely cannot operate independently.

────────

## Testing Philosophy

A feature is not done because:

• the code compiles
• unit tests pass
• types pass
• an API endpoint returns 200

A feature is done when its required user behavior has been demonstrated.

Use multiple test layers.

### Unit Tests

Use unit tests for:

• pure business logic
• validation
• transformations
• calculations
• domain rules

### Integration Tests

Use integration tests for:

• repositories
• database behavior
• API contracts
• adapters
• interactions between feature components

### Playwright E2E Tests

Use Playwright for user-visible behavior.

Playwright should interact with the application through the same interface a real user uses.

Example:

```ts
test("user can create a project", async ({ page }) => {
  await page.goto("/projects")

  await page
    .getByRole("button", { name: "New Project" })
    .click()

  await page
    .getByLabel("Project name")
    .fill("My Project")

  await page
    .getByRole("button", { name: "Create" })
    .click()

  await expect(page.getByText("My Project")).toBeVisible()

  await page.reload()

  await expect(page.getByText("My Project")).toBeVisible()
})
```

Prefer semantic selectors:

```ts
getByRole()
getByLabel()
getByText()
```

Avoid selectors tied to implementation details:

```ts
locator("#submit-btn")
locator(".modal > div:nth-child(2)")
```

Tests should describe user behavior, not DOM structure.

────────

## E2E Acceptance Criteria

Every feature change that alters user-visible behavior should include or update Playwright coverage.

Examples of behavior worth verifying:

• navigation
• form submission
• validation
• persistence after refresh
• permissions
• loading states
• error states
• retries
• cancellation
• success states
• user-visible API failures
• feature interactions

Whenever practical, verify the full path:

```text
browser
  ↓
frontend
  ↓
real feature API
  ↓
real feature business logic
  ↓
feature persistence
```

Do not mock the feature’s own API when the goal is true E2E verification.

External dependencies may be replaced with controlled adapters.

────────

## Feature Sandbox Testing

When testing one feature, use real feature code and controlled dependencies.

Example:

```text
Video Generation Sandbox

REAL
  frontend
  backend
  business logic
  persistence

FAKE / LOCAL
  auth
  billing
  email
  external AI provider
  object storage
```

The purpose is deterministic user-level verification without requiring the entire system.

────────

## Agent Development Loop

For every implementation task:

```text
1. Understand the requested user behavior
2. Identify the owning feature
3. Inspect the feature manifest
4. Read only the necessary feature and contract code
5. Add or update acceptance tests
6. Implement the change
7. Start the feature sandbox
8. Run Playwright
9. Inspect failures
10. Fix the implementation
11. Run feature regression
12. Run impacted cross-feature regression
13. Report verified behavior
```

Do not stop after generating code.

The agent should actively use the running application when sandbox/browser access is available.

────────

## Playwright Failure Investigation

When an E2E test fails, inspect available evidence before making speculative changes.

Use:

• screenshots
• Playwright traces
• DOM snapshots
• browser console
• network failures
• API responses
• backend logs
• database state where appropriate

Prefer diagnosing the observed failure over blindly changing selectors or increasing timeouts.

Do not hide real failures with arbitrary waits.

Avoid:

```ts
await page.waitForTimeout(5000)
```

Prefer event/state-driven waits:

```ts
await expect(page.getByText("Generation complete")).toBeVisible()
```

────────

## Regression Strategy

There are three regression levels.

### 1. Feature Regression

Run whenever the feature changes.

Example:

```bash
app test video-generation
```

This should run the feature’s full E2E suite.

### 2. Impacted Regression

Run tests for features affected by the changed feature or contract.

Example:

```text
billing changed

run:
  billing
  subscriptions
  checkout
  video-generation
  critical purchase journeys
```

Use dependency metadata where available.

### 3. Full Regression

Run the entire application regression suite:

• before major merges when practical
• in CI
• on release branches
• on a scheduled basis if the suite is expensive

Do not make every inner development loop depend on the entire E2E suite.

Keep the local agent feedback loop small.

────────

## Cross-Feature User Journeys

Some behavior is larger than one feature.

Store those tests separately.

Example:

```text
journeys/e2e/
  new-user-first-project.spec.ts
  signup-to-first-generation.spec.ts
  subscription-upgrade.spec.ts
```

These tests verify composition between multiple real features.

Example:

```text
signup
  ↓
create project
  ↓
upload asset
  ↓
generate video
  ↓
view result
```

Feature tests prove local capability behavior.

Journey tests prove application composition.

────────

## Bug Fix Rule

Every escaped regression should become a permanent test.

Required workflow:

```text
1. Reproduce bug
2. Add a test that fails
3. Confirm the test fails for the expected reason
4. Fix the implementation
5. Confirm the new test passes
6. Run the feature regression suite
7. Keep the test permanently
```

Do not fix significant user-visible bugs without preserving the reproduction as regression coverage.

────────

## Definition of Done

A user-facing feature change is complete only when:

```text
[ ] implementation is complete
[ ] feature boundaries remain intact
[ ] contracts are explicit
[ ] unit tests pass
[ ] integration tests pass where relevant
[ ] Playwright acceptance behavior passes
[ ] feature regression passes
[ ] impacted regression passes where applicable
[ ] no new browser console errors are introduced
[ ] no unexpected network failures are introduced
[ ] test artifacts are available for failures
```

For significant work, report:

```text
Feature: <name>

Implementation
✓ ...

Playwright
✓ scenario 1
✓ scenario 2

Regression
✓ feature suite
✓ impacted suite

Artifacts
- trace
- screenshots
- relevant logs
```

Do not claim success without running the relevant verification when tools are available.

────────

## Architectural Smells

Treat the following as warnings:

### Feature reaches into another feature’s internals

```text
feature A -> feature B repository
```

Create a contract instead.

### Shared folder contains business logic

Move the behavior back to the owning feature.

### Feature sandbox requires the entire application

Investigate whether dependencies can be expressed as ports/adapters.

### E2E tests mock the feature’s own backend

This usually defeats the purpose of user-level verification.

### Tests depend heavily on CSS selectors

Prefer semantic and accessible selectors.

### Changes require editing many unrelated features

This may indicate weak boundaries.

### One feature cannot be understood without reading the entire repository

Refactor toward clearer ownership and contracts.

────────

## Migration Rules for Existing Code

Do not perform a large repository rewrite solely to conform to this architecture.

Migrate incrementally.

When modifying an existing capability:

1. identify the business feature
2. move new logic toward the feature boundary
3. introduce explicit contracts for external dependencies
4. add feature-owned E2E coverage
5. create a runnable sandbox if practical
6. avoid increasing existing coupling
7. improve boundaries opportunistically

Prefer safe incremental convergence over a disruptive architectural rewrite.

────────

## Agent Scope Discipline

When assigned to one feature:

Prefer editing:

```text
features/<feature>/**
```

and explicitly related contracts.

Avoid unrelated cleanup.

Do not refactor other features unless required by the requested change.

If a cross-feature dependency is needed:

1. define the smallest explicit contract
2. update the providing feature
3. update the consuming feature
4. add integration/regression coverage

Keep the blast radius small.

────────

## Architectural Summary

The architecture described in this document is Agent-Verifiable Architecture (AVA).

An AVA feature should satisfy four properties:

```text
BOUNDED
Agent reasoning can stay primarily inside the feature.

RUNNABLE
The feature can execute without booting the entire product.

REPLACEABLE
External capabilities are supplied through contracts/adapters.

VERIFIABLE
User-visible behavior can be proven through automated E2E interaction.
```

This repository should behave like:

```text
                 Application

      ┌────────────┬────────────┬────────────┐
      │            │            │            │
    Feature      Feature      Feature      Feature
      │            │            │            │
      └──────── explicit contracts ──────────┘
                        │
                     Platform
```

Each feature should be capable of becoming:

```text
             Feature Sandbox

            Real Frontend
                 ↓
             Real API
                 ↓
          Real Feature Logic
                 ↓
          Feature Persistence

         + controlled adapters
         + deterministic fixtures
         + Playwright
```

The guiding idea behind AVA is:

> **Optimize the architecture around bounded change, independent execution, and behavioral verification.**

For an AI agent, the ideal task environment is:

```text
small context
+ explicit dependencies
+ runnable feature
+ deterministic fixtures
+ browser access
+ executable acceptance criteria
+ regression safety
```

The agent’s job is not merely to write code.

The agent’s job is to implement and prove user-visible behavior without breaking previously accepted behavior.
