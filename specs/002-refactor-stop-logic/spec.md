# Feature Specification: Unify Server Management API

**Feature Branch**: `002-refactor-stop-logic`  
**Created**: 2025-10-01  
**Status**: Draft  
**Input**: User description: "重构计划，使用find-process 和 tree-kill 去优化服务器的停止逻辑，并将新的服务器状态API与现有的liveServer API合并为统一的服务器管理API。 通过find-process + 端口获取服务的运行状态，通过find-process 暴露的进程名字可以获取端口对应的服务是本程序启动的还是其他程序启动， 如果是本程序启动，则可以安全停止，就是首先尝试SIGTERM, 然后是SIGKILL，如果前两者无法终止进程，则通过tree-kill 去kill port，从而停止进程。如果非本程序启动的，则也可以停止，但UI 上要让用户确认，是否可以直接kill。 再者就是通过优先使用SIGTERM/SIGKILL，tree-kill作为最后手段来停止服务， 而不是直接的调用live-server 的close 或者shutdown去停止，先尝试安全信号方法，然后是强制终止，会更安全，更直接。 不用retry，之前写的太复杂了。"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A user is managing multiple directory servers and wants to perform various server operations (start, stop, check status) using a unified interface. The user wants to stop a server, either one they started with the application or one that's already running on the same port. The user expects the application to handle both scenarios safely - automatically stopping servers that were started by the application, and prompting for confirmation when stopping servers that were started by other applications. The user accesses server status information through the UI, which retrieves it via a unified server management API from the main process. The stop operation should be fast and reliable without hanging or requiring multiple attempts, and all server operations should be accessible through a single cohesive API.

### Acceptance Scenarios
1. **Given** a server was started by this application, **When** the user requests to stop that server, **Then** the server stops immediately without confirmation prompts
2. **Given** a server is running on a port but was started by a different application, **When** the user requests to stop that server, **Then** a confirmation dialog appears asking if they want to kill the process
3. **Given** a user has requested to stop a server, **When** they confirm the action, **Then** the server stops reliably and quickly
4. **Given** a server is running on a port, **When** the application checks the status of that port, **Then** the system correctly identifies if the server was started by this application or another process
5. **Given** a server is not responding to normal shutdown commands, **When** the user requests to stop it, **Then** the application forces the stop operation without getting stuck
6. **Given** multiple servers are running on different ports, **When** the user stops all servers, **Then** all servers stop efficiently without requiring multiple attempts

### Edge Cases
- What happens when a server stops responding during a stop operation?
- How does the system handle ports that are temporarily unavailable during the stop process?
- What occurs if the underlying process identification mechanism fails?
- How does the system behave when many processes are running simultaneously?
- How does the system prevent killing the parent Electron process when terminating a child liveServer process?
- What information should be shown to users when they need to confirm termination of external processes?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST identify whether a running server on a specific port was started by this application
- **FR-002**: System MUST stop servers that were started by this application without requiring user confirmation
- **FR-003**: System MUST prompt user for confirmation when attempting to stop servers not started by this application
- **FR-004**: Users MUST be able to proceed with stopping external servers after confirmation
- **FR-005**: System MUST stop servers quickly and reliably without requiring multiple attempts
- **FR-006**: System MUST provide clear status information about running servers via unified server management API from main process to UI
- **FR-007**: System MUST handle non-responsive servers by first attempting SIGTERM, then SIGKILL before forcing termination with tree-kill if necessary
- **FR-008**: Users MUST receive immediate feedback when a server stop command is initiated
- **FR-009**: System MUST prevent hanging or freezing during server stop operations
- **FR-010**: System MUST provide consistent and predictable server termination behavior
- **FR-011**: System MUST provide detailed process information to users when confirmation is needed to stop externally started servers
- **FR-012**: System MUST use precise process identification to ensure only the target liveServer process is terminated, not the parent Electron process
- **FR-013**: System MUST use more precise process identification methods to avoid incorrectly killing parent processes
- **FR-014**: System MUST provide unified server management API that consolidates start, stop, and status operations into a single cohesive interface
- **FR-015**: System MUST merge the existing liveServer API with the new server management functionality and replace the legacy API with the unified interface
- **FR-016**: System MUST return an error indicating when attempting to start a server on an already used port, with appropriate UI messaging to inform the user of the conflict
- **FR-017**: System MUST migrate existing configuration settings to the unified format during the API unification process

### Non-Functional Requirements
- **NFR-001**: System MUST timeout force termination attempts after 10 seconds if server is unresponsive
- **NFR-002**: System MUST support configurable number of concurrent server processes with default maximum of 10
- **NFR-003**: Process identification MUST match on executable path to determine if process was started by this application
- **NFR-004**: System MUST log process termination failures at ERROR level
- **NFR-005**: System MUST first attempt SIGTERM, then SIGKILL to terminate processes, using tree-kill only as a last resort, optimizing for safety first, then speed
- **NFR-006**: System MUST use precise process identification to avoid terminating parent process (Electron main process)
- **NFR-007**: System MUST provide detailed process information (PID, process name, command line arguments) when asking user to confirm stop of external processes
- **NFR-008**: Multiple server stop operations SHOULD run in parallel for faster completion
- **NFR-009**: System SHOULD provide feedback to UI as soon as possible during stop operations, but no specific timeframe requirement
- **NFR-010**: System MUST provide detailed performance metrics for all server start/stop operations

### User Interface Requirements
- **UIR-001**: Confirmation prompts for external server termination MUST use a modal dialog approach
- **UIR-002**: Confirmation modal MUST be implemented using frontend methods, not through IPC APIs

### Key Entities
- **ServerStatus**: Represents the state of a server running on a specific port, including whether it was started by this application or an external process; retrieved by UI via IPC from main process
- **StopOperation**: Represents a server stop action with properties including target port, confirmation status, operation result, and termination method (SIGTERM, SIGKILL, or tree-kill)
- **ProcessIdentity**: Represents information about a process running on a port, including the application that started it, PID, process name, and command line arguments; uses executable path matching to distinguish processes started by this application versus external ones

---

## Clarifications

### Session 2025-10-01
- Q: What timeout value should be used for unresponsive servers before force termination? → A: 10s
- Q: For the confirmation prompts when stopping external servers, should we use a modal dialog or an inline notification? → A: A, but the confirmation may not use ipc api, just use frontend to implement it
- Q: What is the expected maximum number of concurrent server processes this feature should support? → A: i think it is configable , and now may set to 10
- Q: When identifying if a process was started by this application, should we match on process name, executable path, or process ID lineage? → A: B
- Q: For error logging, should we use a specific log level for process termination failures? → A: A
- Q: Regarding user roles, should we differentiate between different user permissions for server stop functionality? → A: C
- Q: For performance requirements, are there any specific metrics for stop operations beyond the 10s timeout? → A: 如果是杀进程的话，应该可以马上停止。 不需要等待。这是想优化的地方，而且杀进行，只想杀对应liveServer的进程，不能杀到父进程（即electron main进程）
- Q: When using tree-kill to terminate processes, if there's a risk of confusing target process with parent process (Electron main process), how should the system handle this? → A: C
- Q: If find-process library fails to accurately identify process ownership, how should the system handle this situation? → A: 提供进程信息供前端用户确认
- Q: Should the UI display detailed process information (such as PID, process name, command line arguments, etc.) for users to reference when confirming the stop of external processes? → A: A
- Q: 当使用find-process库识别进程时，如果遇到权限不足无法访问某些进程信息的情况，系统应该如何处理？ → A: 不考虑此case
- Q: 对于在容器化环境（如Docker）中运行的应用程序，进程识别是否仍然按预期工作？ → A: C
- Q: 服务器状态检查（运行/停止）应该在哪个层面执行？ → A: UI 通过ipc 模块获取服务运行状态，主进程提供ipc 实现获取服务运行状态
- Q: 在终止进程时，是否需要先尝试SIGTERM然后是SIGKILL，还是直接使用tree-kill强制终止？ → A: 先尝试sigterm 然后是sigkill，如果前两者已经可以kill，那么可以不用引入tree-kill
- Q: When stopping multiple servers concurrently, should the system handle these operations sequentially to avoid resource conflicts, or should they run in parallel for faster completion? → A: B
- Q: For performance expectations during server stop operations, should the system provide immediate feedback to the user interface within a specific timeframe? → A: C
- Q: How should the unified server management API handle existing liveServer API calls to maintain backward compatibility? → A: just merge the liveServer api,than replace it
- Q: For the unified API, what should be the default behavior when starting a server on a port that's already in use? → A: throw a error indicating the port is in use, then the ui will display a human message to this case, then the user will know this case
- Q: What security measures should be implemented for the unified server management API to prevent unauthorized server operations? → A: no need
- Q: Should the unified API provide detailed performance metrics for server start/stop operations? → A: a
- Q: How should the unified API handle configuration settings that differ between the original liveServer API and new functionality? → A: c

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---