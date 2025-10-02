# Server Management API Contract with IPC and Simple Node Modules

## Overview
This contract defines the unified server management API for status checking, starting, and stopping servers using IPC communication only (no HTTP APIs). The implementation uses simple node modules (find-process and tree-kill) for cross-platform process management. All communication follows IPC patterns with Zod validation as required by constitutional principles.

## IPC Channel Definitions

### Channels from Renderer to Main
- `server:status:get` - Get status of server on specific port
- `server:status:all` - Get status of all managed servers  
- `server:start` - Start a server with given configuration
- `server:stop` - Stop server on specific port
- `server:stop:all` - Stop all servers

### Channels from Main to Renderer
- `server-status:changed:{port}` - Emits when server status changes
- `server-operation:completed` - Emits when server operation completes

## API Definitions

### Get Server Status
- **IPC Channel**: `server:status:get`
- **Request Schema**: 
  ```typescript
  {
    port: number
  }
  ```
- **Success Response Schema**:
  ```typescript
  {
    success: true,
    data: {
      port: number,
      isRunning: boolean,
      isOwnedByApp: boolean,
      processInfo: {
        pid: number,
        name: string,
        command: string,
        arguments: string[],
        cwd: string
      } | null,
      statusMessage: string,
      lastCheckTime: string // ISO date string
    }
  }
  ```
- **Error Response Schema**:
  ```typescript
  {
    success: false,
    error: string,
    code: "INVALID_PORT" | "INTERNAL_ERROR" | "PROCESS_CHECK_FAILED"
  }
  ```
- **Zod Validation**:
  ```typescript
  import { z } from 'zod';
  
  export const GetStatusRequestSchema = z.object({
    port: z.number().int().min(1).max(65535)
  });
  
  export const ProcessInfoSchema = z.object({
    pid: z.number().int().positive(),
    name: z.string().min(1),
    command: z.string().min(1),
    arguments: z.array(z.string()),
    cwd: z.string().min(1)
  }).nullable();
  
  export const GetStatusResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
      port: z.number().int().min(1).max(65535),
      isRunning: z.boolean(),
      isOwnedByApp: z.boolean(),
      processInfo: ProcessInfoSchema,
      statusMessage: z.string(),
      lastCheckTime: z.string().datetime()
    }).optional(),
    error: z.string().optional(),
    code: z.enum(["INVALID_PORT", "INTERNAL_ERROR", "PROCESS_CHECK_FAILED"]).optional()
  });
  ```

### Get All Server Statuses
- **IPC Channel**: `server:status:all`
- **Request Schema**: (no parameters)
- **Success Response Schema**:
  ```typescript
  {
    success: true,
    data: {
      statuses: Array<{
        port: number,
        isRunning: boolean,
        isOwnedByApp: boolean,
        processInfo: {
          pid: number,
          name: string,
          command: string,
          arguments: string[],
          cwd: string
        } | null,
        statusMessage: string,
        lastCheckTime: string // ISO date string
      }>
    }
  }
  ```

### Start Server
- **IPC Channel**: `server:start`
- **Request Schema**:
  ```typescript
  {
    port: number,
    directory: string,
    options?: {
      open?: boolean,
      logLevel?: 0 | 1 | 2,
      wait?: number,
      middleware?: any[],
      cors?: boolean
    }
  }
  ```
- **Success Response Schema**:
  ```typescript
  {
    success: true,
    data: {
      port: number,
      directory: string,
      message: string
    }
  }
  ```
- **Error Response Schema**:
  ```typescript
  {
    success: false,
    error: string,
    code: "PORT_IN_USE" | "INVALID_DIRECTORY" | "PERMISSION_DENIED" | "INTERNAL_ERROR"
  }
  ```
- **Zod Validation**:
  ```typescript
  import { z } from 'zod';
  
  export const StartServerRequestSchema = z.object({
    port: z.number().int().min(1).max(65535),
    directory: z.string().min(1),
    options: z.object({
      open: z.boolean().optional(),
      logLevel: z.number().int().min(0).max(2).optional(),
      wait: z.number().int().min(0).optional(),
      middleware: z.array(z.any()).optional(),
      cors: z.boolean().optional()
    }).optional()
  });
  
  export const StartServerResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
      port: z.number().int().min(1).max(65535),
      directory: z.string().min(1),
      message: z.string()
    }).optional(),
    error: z.string().optional(),
    code: z.enum(["PORT_IN_USE", "INVALID_DIRECTORY", "PERMISSION_DENIED", "INTERNAL_ERROR"]).optional()
  });
  ```

### Stop Server
- **IPC Channel**: `server:stop`
- **Request Schema**:
  ```typescript
  {
    port: number,
    forceTerminate?: boolean // Only for external processes after user confirmation
  }
  ```
- **Success Response Schema**:
  ```typescript
  {
    success: true,
    data: {
      port: number,
      result: "SUCCESS" | "ALREADY_STOPPED" | "EXTERNAL_NEEDS_CONFIRMATION",
      terminationMethod?: "SIGTERM" | "SIGKILL" | "TREEKILL",
      durationMs: number,
      processInfo?: { // Returned when external process needs confirmation
        pid: number,
        name: string,
        command: string,
        arguments: string[],
        cwd: string
      }
    }
  }
  ```
- **Error Response Schema**:
  ```typescript
  {
    success: false,
    error: string,
    code: "INVALID_PORT" | "PERMISSION_DENIED" | "TIMEOUT" | "INTERNAL_ERROR"
  }
  ```
- **Zod Validation**:
  ```typescript
  import { z } from 'zod';
  
  export const StopServerRequestSchema = z.object({
    port: z.number().int().min(1).max(65535),
    forceTerminate: z.boolean().optional()
  });
  
  export const StopServerResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
      port: z.number().int().min(1).max(65535),
      result: z.enum(["SUCCESS", "ALREADY_STOPPED", "EXTERNAL_NEEDS_CONFIRMATION"]),
      terminationMethod: z.enum(["SIGTERM", "SIGKILL", "TREEKILL"]).optional(),
      durationMs: z.number().nonnegative().optional(),
      processInfo: ProcessInfoSchema.optional()
    }).optional(),
    error: z.string().optional(),
    code: z.enum(["INVALID_PORT", "PERMISSION_DENIED", "TIMEOUT", "INTERNAL_ERROR"]).optional()
  });
  ```

### Stop All Servers
- **IPC Channel**: `server:stop:all`
- **Request Schema**: (no parameters)
- **Success Response Schema**:
  ```typescript
  {
    success: true,
    data: {
      results: Array<{
        port: number,
        result: "SUCCESS" | "ALREADY_STOPPED" | "FAILED",
        terminationMethod?: "SIGTERM" | "SIGKILL" | "TREEKILL",
        durationMs: number,
        error?: string
      }>
    }
  }
  ```

## Cross-Platform Process Management with Simple Node Modules

### find-process (Simple Node Module)
- Used for identifying processes running on specific ports
- Provides cross-platform process identification
- Returns detailed process information for ownership verification
- No custom cross-platform logic needed

### tree-kill (Simple Node Module)
- Used for terminating processes with proper sequence: SIGTERM → SIGKILL → tree-kill
- Handles cross-platform differences in process termination
- Terminates process trees reliably on Windows, macOS, and Linux
- No custom cross-platform logic needed

## Implementation Requirements
1. **IPC Only**: All communication between renderer and main process MUST use IPC API only, no HTTP APIs
2. **Zod Validation**: All IPC communications must use Zod validation as per constitutional requirements
3. **Simple Node Modules**: Use find-process and tree-kill for cross-platform process management instead of custom implementation
4. **Process Identification**: Must use executable path matching to determine if a process was started by this application
5. **Termination Sequence**: Must follow SIGTERM → SIGKILL → tree-kill as a last resort
6. **External Process Confirmation**: External process termination must be confirmed via UI before proceeding
7. **Timeout Handling**: Operations must timeout after 10 seconds if unresponsive
8. **Performance Metrics**: Detailed performance metrics must be collected for all operations
9. **Package Structure**: Implementation files must be placed in appropriate packages:
   - Main process logic in `packages/main/`
   - API definitions in `packages/api/`
   - UI components in `packages/renderer/`
   - Preload functions in `packages/preload/`
10. **Unit Tests**: Must be placed in `__tests__` directories within each package