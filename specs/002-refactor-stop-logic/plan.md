
# Implementation Plan: Unify Server Management API

**Branch**: `002-refactor-stop-logic` | **Date**: 2025-10-02 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-refactor-stop-logic/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
This feature will refactor the server stop logic to use find-process and tree-kill libraries for more reliable process management. It will unify the existing liveServer API with new server management functionality to create a single cohesive interface for starting, stopping, and checking server status. The system will identify whether servers were started by this application or external processes, automatically stopping internal servers while prompting for confirmation when stopping external ones. Process termination will follow a safe sequence: SIGTERM, then SIGKILL, with tree-kill as a last resort.

## Technical Context
**Language/Version**: TypeScript (Node.js >=22.0.0)  
**Primary Dependencies**: find-process, tree-kill, live-server, Electron, Vite, Vue.js 3, Element Plus, Zod  
**Storage**: electron-store (JSON file-based storage)  
**Testing**: Vitest with workspace configuration  
**Target Platform**: Cross-platform desktop (Windows, macOS, Linux)
**Project Type**: web (Electron desktop application with main and renderer processes)  
**Performance Goals**: Server stop operations should complete within 10 seconds  
**Constraints**: Must not terminate parent Electron process when stopping child liveServer processes  
**Scale/Scope**: Configurable number of concurrent server processes (default maximum of 10)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

*Based on constitution v1.4.5:*
- All development code and test code must be placed in the appropriate package and not in the root directory
- All code should follow the development conventions of the corresponding package it belongs to
- Web pages will not directly import Electron APIs; they should only request or load Electron modules indirectly through the preload module
- Background processes communicate with the Electron main process exclusively through IPC calls; frontend components MUST NOT make HTTP requests to call backend API services
- Use @app/api layer to build API types and type definitions; main and preload processes must use the API layer's tool methods to establish IPC connections
- When integrating features into the UI: If the feature extends an existing function, extend the current UI entry point; If the feature is new and distinct, create a new menu entry; If unsure about how to integrate with existing code or functionality, raise clarification questions during the design phase
- For refactoring tasks: MUST analyze existing implementation, determine integration approach with existing functionality, ensure refactored code is actually used and replaces original implementation, and maintain functional consistency
- Code should be tested in the following sequence: first perform global typecheck with turbo, then perform global unit tests with vitest, then perform actual code testing with turbo dev, and finally fix all eslint issues with eslint --fix

**Evaluation**: 
All constitutional principles are satisfied by this implementation plan:
1. Code will be placed in appropriate packages (@app/main, @app/api, @app/preload)
2. Will follow existing development conventions in each package
3. IPC communication will be used exclusively for process management between renderer and main
4. @app/api layer will be used for type definitions and IPC connections
5. This is a refactoring task that extends existing server management functionality
6. Will ensure proper testing sequence is followed

## Project Structure

### Documentation (this feature)
```
specs/002-refactor-stop-logic/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
packages/
├── api/
│   └── src/
│       └── modules/
├── main/
│   └── src/
│       ├── ipc/
│       ├── services/
│       └── utils/
└── preload/
    └── src/
```

**Structure Decision**: Web application structure with Electron main and renderer processes. The feature will primarily affect the main process where server management occurs, with API definitions in the api package and IPC exposure in the preload package.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh qwen`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**Task Categories**:
1. **API Layer Tasks**:
   - Create Zod schemas for server management API contracts
   - Define IPC channel interfaces in @app/api package
   - Create type definitions for server entities (ServerStatus, ProcessIdentity, etc.)

2. **Main Process Tasks**:
   - Implement process identification using find-process library
   - Implement process termination logic with SIGTERM → SIGKILL → tree-kill sequence
   - Create server management service that unifies liveServer API with new functionality
   - Implement IPC handlers for server management operations
   - Add performance metrics collection for server operations

3. **Preload Tasks**:
   - Expose server management IPC APIs to renderer securely
   - Implement proper validation and error handling for IPC calls

4. **Renderer Tasks**:
   - Update UI components to use unified server management API
   - Implement confirmation dialogs for external process termination
   - Add real-time status updates through IPC events

5. **Testing Tasks**:
   - Create contract tests for all IPC APIs
   - Write unit tests for process identification and termination logic
   - Create integration tests for end-to-end server management workflows
   - Add performance tests for server start/stop operations

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
