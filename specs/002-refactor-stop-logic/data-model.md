# Data Model: Unify Server Management API with IPC and Simple Node Modules

## Entities

### ServerStatus
Represents the state of a server running on a specific port.

- **port**: number - The port number the server is running on
- **isRunning**: boolean - Whether the server is currently running
- **isOwnedByApp**: boolean - Whether the server was started by this application
- **processInfo**: ProcessIdentity | null - Information about the process if running
- **statusMessage**: string - Human-readable status message
- **lastCheckTime**: Date - Timestamp of the last status check

### ProcessIdentity
Represents information about a process running on a port.

- **pid**: number - Process identifier
- **name**: string - Process name
- **command**: string - Command line used to start the process
- **arguments**: string[] - Arguments passed to the process
- **cwd**: string - Current working directory of the process
- **isOwnedByApp**: boolean - Whether the process was started by this application (determined by executable path matching)

### StopOperation
Represents a server stop action.

- **targetPort**: number - The port of the server to stop
- **initiationTime**: Date - When the stop operation was initiated
- **terminationMethod**: "SIGTERM" | "SIGKILL" | "TREEKILL" | "LIVESERVER_CLOSE" - Method used to terminate
- **isConfirmed**: boolean - Whether user confirmed termination of external process
- **result**: "SUCCESS" | "FAILURE" | "TIMEOUT" | "USER_CANCELLED" - Operation result
- **durationMs**: number - Time taken for the operation in milliseconds
- **errorMessage**: string | null - Error message if operation failed

### ServerStartConfig
Configuration for starting a server.

- **port**: number - Port to start the server on
- **directory**: string - Directory to serve
- **options**: LiveServerConfig - Additional live-server configuration options
- **autoClose**: boolean - Whether to automatically close when parent process exits

### LiveServerConfig
Configuration for the live-server module.

- **port**: number - Port to use
- **host**: string - Host to bind to
- **root**: string - Root directory to serve
- **open**: boolean | string - Whether to open in browser
- **file**: string - Path to file to open in browser
- **wait**: number - Milliseconds to wait before reloading
- **logLevel**: 0 | 1 | 2 - Logging level
- **middleware**: Function[] - Express middleware to use
- **proxy**: ProxyConfig[] - Proxy configuration
- **cors**: boolean - Enable CORS
- **https**: HttpsConfig | boolean - HTTPS configuration

## Relationships

```
ServerStatus 1 -- 0..1 ProcessIdentity
StopOperation 1 -- 1 ServerStatus (at time of operation)
```

## State Transitions

### Server Status States
```
NOT_RUNNING -> STARTING -> RUNNING -> STOPPING -> NOT_RUNNING
     ^                                              |
     |----------------------------------------------|
```

### Stop Operation States
```
INITIATED -> SIGTERM_SENT -> SIGKILL_SENT -> TREEKILL_ATTEMPTED -> COMPLETED
                                    |              |
                                    |-> USER_CONFIRMATION -> SIGKILL_SENT
```

## Validation Rules

### ServerStatus Validation
- port must be between 1024 and 65535 (user ports)
- isRunning and processInfo must be consistent (if isRunning is true, processInfo should exist)
- lastCheckTime must not be in the future

### ProcessIdentity Validation
- pid must be a positive integer
- isOwnedByApp must be determinable through executable path matching
- name should not be empty

### StopOperation Validation
- targetPort must be a valid port number
- if result is "FAILURE" or "TIMEOUT", errorMessage must not be null
- durationMs must be non-negative
- if isConfirmed is true, the process should have been external

## IPC-Only API Design

Following constitutional requirements, all communication between renderer and main process uses IPC API only, with no HTTP API. The server management functionality is exposed through secure IPC channels with proper validation.

### IPC Channels

#### Main Process to Renderer (Events)
- `server-status:changed:{port}` - Emits when server status changes
- `server-operation:completed` - Emits when server operation completes

#### Renderer to Main (Requests)
- `server:status:get` - Get status of server on specific port
- `server:status:all` - Get status of all managed servers
- `server:start` - Start a server with given configuration
- `server:stop` - Stop server on specific port
- `server:stop:all` - Stop all servers

#### IPC Response Format
All IPC responses follow this structure:
```
{
  success: boolean,
  data?: any,
  error?: string
}
```

## Package Structure for Implementation

Per constitutional requirements, all implementation will be placed in appropriate packages:

### packages/main
- Server management logic (core business logic)
- Process identification functions using find-process (simple node module)
- Process termination functions using tree-kill (simple node module)
- Server status checking functions
- Main process IPC handlers for server management
- Cross-platform utilities (minimal, using simple node modules)

### packages/api
- Type definitions for server management APIs
- Zod schemas for IPC request/response validation
- IPC channel definitions
- Shared interfaces between main and renderer processes

### packages/renderer
- UI components for server management
- Frontend logic for displaying server status
- User confirmation modals for external processes
- IPC client functions to communicate with main process
- State management for server statuses

### packages/preload
- Secure IPC communication functions
- API exposure to renderer with proper security boundaries
- Validation of IPC calls from renderer

### Package-level Testing
- Each package will have its own __tests__ directory following the pattern: `packages/[package-name]/__tests__`
- Unit tests will use Vitest with appropriate mocking of dependencies
- Contract tests will verify IPC communications between packages
- Tests will mock external dependencies like find-process and tree-kill

## Cross-Platform Process Management with Simple Node Modules

Instead of implementing custom cross-platform logic, the solution uses simple node modules:

### find-process
- Handles cross-platform process identification
- Used in packages/main for identifying processes on specific ports
- Provides consistent API across Windows, macOS, and Linux
- Returns detailed process information needed for ownership verification

### tree-kill
- Handles cross-platform process termination
- Used in packages/main for terminating processes
- Provides SIGTERM → SIGKILL → tree-kill sequence
- Terminates process trees reliably across platforms
- Abstracts platform differences automatically