# Tasks: Unify Server Management API

**Input**: Design documents from `/specs/002-refactor-stop-logic/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Electron app**: `packages/api/src/`, `packages/main/src/`, `packages/preload/src/`, `packages/renderer/src/`
- Paths shown below follow the monorepo structure with packages

## Phase 3.1: Setup
- [x] T001 Add find-process and tree-kill dependencies to packages/main
- [x] T002 [P] Configure TypeScript paths for cross-package imports
- [x] T003 [P] Verify Zod validation setup in packages/api

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [x] T004 [P] Contract test for server:status:get in packages/api/__tests__/server-status-get.test.ts
- [x] T005 [P] Contract test for server:status:all in packages/api/__tests__/server-status-all.test.ts
- [x] T006 [P] Contract test for server:start in packages/api/__tests__/server-start.test.ts
- [x] T007 [P] Contract test for server:stop in packages/api/__tests__/server-stop.test.ts
- [x] T008 [P] Contract test for server:stop:all in packages/api/__tests__/server-stop-all.test.ts

### Integration Tests
- [x] T009 [P] Integration test for internal server stop in packages/main/tests/integration/internal-server-stop.test.ts
- [x] T010 [P] Integration test for external server confirmation in packages/main/tests/integration/external-server-confirmation.test.ts
- [x] T011 [P] Integration test for server status updates in packages/main/tests/integration/server-status-updates.test.ts
- [x] T012 [P] Integration test for unified API usage in packages/main/tests/integration/unified-api-usage.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### API Layer Implementation
- [x] T013 [P] Create Zod schemas for server management in packages/api/src/modules/server.ts
- [x] T014 [P] Define IPC channel interfaces in packages/api/src/modules/server.ts
- [x] T015 [P] Create type definitions for server entities in packages/api/src/modules/server.ts

### Main Process Implementation
- [x] T016 [P] Implement process identification service using find-process in packages/main/src/services/process-identification.ts
- [x] T017 [P] Implement process termination service with SIGTERM/SIGKILL/tree-kill sequence in packages/main/src/services/process-termination.ts
- [x] T018 [P] Create unified server management service in packages/main/src/services/server-manager.ts
- [x] T019 Implement IPC handlers for server management in packages/main/src/ipc/server-ipc.ts
- [x] T020 [P] Add performance metrics collection in packages/main/src/utils/performance-metrics.ts

### Preload Implementation
- [x] T021 Expose server management IPC APIs to renderer securely in packages/preload/src/exposed.ts
- [x] T022 Implement proper validation and error handling for IPC calls in packages/preload/src/exposed.ts

### Renderer Implementation
- [x] T023 Update UI components to use unified server management API in packages/renderer/src/components/ServerManager.vue
- [x] T024 Implement confirmation dialogs for external process termination in packages/renderer/src/components/ExternalProcessConfirmation.vue
- [x] T025 Add real-time status updates through IPC events in packages/renderer/src/services/server-service.ts

## Phase 3.4: Integration
- [ ] T026 Integrate process identification with existing liveServer logic in packages/main/src/services/server-manager.ts
- [ ] T027 Connect server manager to existing directory management in packages/main/src/modules/distMgr.ts
- [ ] T028 Implement event emission for server status changes in packages/main/src/services/server-manager.ts
- [ ] T029 Add proper error handling and logging throughout the server management flow

## Phase 3.5: Polish
- [ ] T030 [P] Unit tests for process identification service in packages/main/__tests__/services/process-identification.test.ts
- [ ] T031 [P] Unit tests for process termination service in packages/main/__tests__/services/process-termination.test.ts
- [ ] T032 [P] Unit tests for server manager service in packages/main/__tests__/services/server-manager.test.ts
- [ ] T033 Performance tests for server start/stop operations (<10s)
- [ ] T034 [P] Update documentation in IFLOW.md
- [ ] T035 Remove any code duplication between old and new server management implementations
- [ ] T036 Run manual testing of all server management scenarios

## Dependencies
- Tests (T004-T012) before implementation (T013-T025)
- T013-T015 block T016-T022
- T016-T018 block T019
- T019-T022 block T023-T025
- Implementation before integration (T026-T029)
- Integration before polish (T030-T036)

## Parallel Example
```
# Launch T004-T008 together (contract tests):
Task: "Contract test for server:status:get in packages/api/__tests__/server-status-get.test.ts"
Task: "Contract test for server:status:all in packages/api/__tests__/server-status-all.test.ts"
Task: "Contract test for server:start in packages/api/__tests__/server-start.test.ts"
Task: "Contract test for server:stop in packages/api/__tests__/server-stop.test.ts"
Task: "Contract test for server:stop:all in packages/api/__tests__/server-stop-all.test.ts"

# Launch T013-T015 together (API layer):
Task: "Create Zod schemas for server management in packages/api/src/modules/server.ts"
Task: "Define IPC channel interfaces in packages/api/src/modules/server.ts"
Task: "Create type definitions for server entities in packages/api/src/modules/server.ts"

# Launch T016-T018 together (main services):
Task: "Implement process identification service using find-process in packages/main/src/services/process-identification.ts"
Task: "Implement process termination service with SIGTERM/SIGKILL/tree-kill sequence in packages/main/src/services/process-termination.ts"
Task: "Create unified server management service in packages/main/src/services/server-manager.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

5. **Constitution Compliance**:
   - All development code and test code must be placed in the appropriate package and not in the root directory
   - Web pages will not directly import Electron APIs; they should only request or load Electron modules indirectly through the preload module
   - Background processes communicate with the Electron main process exclusively through IPC calls; frontend components MUST NOT make HTTP requests to call backend API services
   - Use @app/api layer to build API types and type definitions; main and preload processes must use the API layer's tool methods to establish IPC connections
   - When integrating features into the UI: If the feature extends an existing function, extend the current UI entry point; If the feature is new and distinct, create a new menu entry; If unsure about how to integrate with existing code or functionality, raise clarification questions during the design phase
   - For refactoring tasks: MUST analyze existing implementation, determine integration approach with existing functionality, ensure refactored code is actually used and replaces original implementation, and maintain functional consistency
   - Each package should follow its own development conventions as specified in the package's documentation
   - Every code adjustment must recognize the current project directory structure, ensure code is placed as expected, maintain clean architecture, and ensure clean naming

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task