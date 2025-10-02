# Research: Unify Server Management API with IPC and Simple Node Modules

## Executive Summary

This research document analyzes the requirements for unifying the server management API by refactoring the stop logic using find-process and tree-kill libraries. The implementation will distinguish between processes started by this application versus external processes, providing appropriate termination mechanisms. Communication between renderer and main process will use IPC API only, with no HTTP API. Cross-platform process killing will be handled through simple node modules rather than custom implementation.

## Decision: IPC-Only Communication
**Rationale**: Following constitutional requirements and user specifications, all communication between renderer and main process will use IPC API only, with no HTTP API. This provides secure communication between processes while maintaining proper boundaries in the Electron application architecture.
**Alternatives considered**: 
- HTTP API: Would violate constitutional requirement that "Background processes communicate with the Electron main process exclusively through IPC calls; Frontend components MUST NOT make HTTP requests to call backend API services"
- Direct access to Electron APIs from renderer: Would violate security principle of using preload scripts

## Decision: Process Identification Library (find-process)
**Rationale**: The find-process library was selected to identify processes running on specific ports and determine their origin (internal vs external). This is a simple node module that abstracts cross-platform differences in process identification, eliminating the need for custom cross-platform logic.
**Alternatives considered**: 
- Using Node.js built-in net library to check port availability - insufficient for process identification
- Using ps-list library - would not provide the same port-specific functionality
- Using process.pid directly - would not help identify external processes
- Custom cross-platform implementation - unnecessary complexity when a suitable library already exists

## Decision: Process Termination Library (tree-kill)
**Rationale**: The tree-kill library was selected for cross-platform process termination. This is a simple node module that handles differences between Windows, macOS, and Linux, eliminating the need for custom cross-platform logic. It can terminate process trees reliably across platforms.
**Alternatives considered**:
- Custom implementation with platform-specific code - more complex and error-prone
- Using only built-in Node.js methods - insufficient for cross-platform process tree termination
- Direct system calls - would require more complex error handling and cross-platform management

## Decision: SIGTERM → SIGKILL → tree-kill Sequence
**Rationale**: Implementation will follow SIGTERM → SIGKILL → tree-kill sequence as specified in requirements. This ensures graceful termination while providing force termination as a last resort, meeting the safety requirements and preventing hanging operations. Using simple node modules for this sequence (with tree-kill for cross-platform support) rather than implementing custom logic.
**Alternatives considered**:
- Direct use of live-server close/shutdown methods - already being replaced due to unreliability
- Only using tree-kill - less safe as it bypasses graceful termination
- Custom signal implementation - would require complex cross-platform handling

## Decision: Package Structure Implementation
**Rationale**: All code and tests will be placed in appropriate package directories (packages/main, packages/api, packages/renderer, packages/preload) as required by the constitutional principle that "All development code and test code must be placed in the appropriate package and not in the root directory".
**Alternatives considered**:
- Keeping code in src/ and tests/ directories at root - violates constitutional requirements
- Creating new top-level directories - would also violate constitutional requirements

## Decision: IPC Communication Pattern with Zod Validation
**Rationale**: The unified server management API will use Zod-validated IPC communications between the main process and renderer, following the constitutional requirement for type-safe communication. This includes:
- Server status requests from renderer to main
- Server start/stop commands from renderer to main
- Status updates from main to renderer
All using secure IPC channels with proper validation.
**Alternatives considered**:
- HTTP requests from frontend - violates constitutional requirement
- Direct Electron API access from renderer - violates security principle of using preload scripts

## Decision: UI Confirmation Approach
**Rationale**: Confirmation for external process termination will be implemented using frontend modal dialogs rather than IPC APIs, as clarified in the feature specification. This ensures that the UI handles the user interaction directly while still using IPC for the actual process termination.
**Alternatives considered**:
- IPC-based confirmation mechanisms - explicitly rejected per clarifications
- Inline notifications - insufficient for destructive operation confirmation

## Cross-Platform Process Killing Strategy

### Using Simple Node Modules Instead of Custom Implementation
- **find-process**: Handles cross-platform process identification
  - Works on Windows, macOS, and Linux
  - Provides consistent API across platforms
  - Returns detailed process information (PID, command, arguments, etc.)

- **tree-kill**: Handles cross-platform process termination
  - Uses SIGTERM/SIGKILL on Unix-like systems
  - Uses taskkill on Windows
  - Terminates process trees reliably across platforms
  - Abstracts platform differences automatically

### Benefits of Using Simple Node Modules
- Reduced code complexity
- Maintained cross-platform compatibility
- Well-tested and maintained libraries
- Less maintenance overhead
- Follows the principle of leveraging established tools

## Technical Unknowns Resolved
1. **Process Identification**: Use find-process to identify if a process on a port was started by this application using executable path matching
2. **Parent Process Safety**: Use precise process identification to ensure only target liveServer processes are terminated, not parent Electron process
3. **Timeout Handling**: Implement 10-second timeout for force termination attempts as specified
4. **Concurrent Operations**: Allow multiple server stop operations to run in parallel as clarified in specifications
5. **Package Structure Compliance**: Ensure all implementation goes into appropriate packages as required by the constitution
6. **IPC-Only Communication**: Use Electron's IPC mechanism for all renderer-to-main communication, as required
7. **Simple Node Modules**: Use find-process and tree-kill libraries instead of custom cross-platform logic
8. **Performance Metrics**: Include detailed performance metrics for all start/stop operations as required

## Architecture Considerations
1. **Clean Architecture**: Server management functionality will be placed in appropriate layers following the monorepo architecture
2. **Security**: All IPC communications will use Zod validation as required by the constitution
3. **Type Safety**: Full TypeScript implementation with strict typing throughout
4. **Testing**: Unit tests will be created following Vitest workspace configuration with __tests__ directory at package level
5. **Constitutional Compliance**: All code and tests will be placed in package directories, not in root directory
6. **No HTTP APIs**: All communication will use IPC as required by constitutional principles
7. **Simple Node Modules**: Leverage find-process and tree-kill instead of implementing custom cross-platform logic