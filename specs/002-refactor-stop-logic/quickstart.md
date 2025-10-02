# Quickstart Guide: Unify Server Management API with IPC and Simple Node Modules

## Overview
This guide demonstrates how to use the unified server management API for checking server status and controlling server processes. The implementation follows constitutional requirements using IPC API only (no HTTP API) and simple node modules (find-process and tree-kill) for cross-platform process management.

## Prerequisites
- Node.js >=22.0.0
- pnpm installed
- Electron development environment set up
- TypeScript 5.6

## Setup
1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm build
   ```

## Basic Usage Examples

### Check Server Status via IPC
```javascript
import { ipcRenderer } from 'electron';

// Check if a server is running on port 3000 using IPC
const getStatus = async (port) => {
  const response = await ipcRenderer.invoke('server:status:get', { port });
  if (response.success) {
    console.log(`Port 3000 status: ${response.data.isRunning ? 'RUNNING' : 'STOPPED'}`);
    console.log(`Owned by app: ${response.data.isOwnedByApp}`);
    if (response.data.processInfo) {
      console.log(`Process PID: ${response.data.processInfo.pid}`);
    }
    return response.data;
  } else {
    throw new Error(response.error);
  }
};

const status = await getStatus(3000);
```

### Start a Server via IPC
```javascript
import { ipcRenderer } from 'electron';

const startServer = async (config) => {
  const response = await ipcRenderer.invoke('server:start', config);
  if (response.success) {
    console.log('Server started successfully');
    return response.data;
  } else {
    throw new Error(response.error);
  }
};

const config = {
  port: 3001,
  directory: './public',
  options: {
    open: false,
    logLevel: 2
  }
};

try {
  await startServer(config);
  console.log('Server started successfully on port 3001');
} catch (error) {
  console.error('Failed to start server:', error.message);
}
```

### Stop a Server via IPC
```javascript
import { ipcRenderer } from 'electron';

const stopServer = async (port) => {
  const response = await ipcRenderer.invoke('server:stop', { port });
  if (response.success) {
    console.log('Stop operation result:', response.data);
    return response.data;
  } else {
    throw new Error(response.error);
  }
};

// Stop a server, with confirmation for external processes
const result = await stopServer(3001);
console.log('Stop operation result:', result);
```

### Stop All Servers via IPC
```javascript
import { ipcRenderer } from 'electron';

const stopAllServers = async () => {
  const response = await ipcRenderer.invoke('server:stop:all');
  if (response.success) {
    console.log('Stopped all servers:', response.data.results);
    return response.data.results;
  } else {
    throw new Error(response.error);
  }
};

const results = await stopAllServers();
console.log('Stopped all servers:', results);
```

## Cross-Platform Process Management with Simple Node Modules

The implementation leverages simple node modules for cross-platform process management:

### Process Identification (find-process)
- Uses `find-process` module to identify processes running on specific ports
- Works consistently across Windows, macOS, and Linux
- Provides detailed process information for ownership verification

### Process Termination (tree-kill)
- Uses `tree-kill` module for cross-platform process termination
- Implements SIGTERM → SIGKILL → tree-kill sequence for safe termination
- Handles platform differences automatically

## Package Structure

The implementation is organized according to constitutional requirements:

### packages/main/
- `server-management.ts` - Core server management logic using find-process and tree-kill
- `process-identification.ts` - Functions for identifying processes using find-process (simple node module)
- `process-termination.ts` - Functions for safely terminating processes using tree-kill (simple node module)
- `ipc-handlers.ts` - IPC event handlers for server management
- `utils/cross-platform.ts` - Minimal cross-platform utilities (using simple node modules)

### packages/api/
- `server-api.ts` - Type definitions for server management API
- `validation-schemas.ts` - Zod schemas for IPC request/response validation
- `ipc-channels.ts` - IPC channel definitions

### packages/renderer/
- `components/ServerManager.vue` - UI component for server management
- `services/server-service.ts` - IPC client functions for server API calls
- `store/server-store.ts` - State management for server statuses

### packages/preload/
- `ipc-client.ts` - Secure IPC communication functions
- `api-exposure.ts` - Controlled exposure of APIs to renderer

## Testing Structure

Following constitutional requirements, all tests are organized within each package:

### packages/main/__tests__/
- `server-management.test.ts` - Unit tests for server management logic
- `process-identification.test.ts` - Unit tests for process identification (with mocked find-process)
- `process-termination.test.ts` - Unit tests for process termination (with mocked tree-kill)

### packages/api/__tests__/
- `validation-schemas.test.ts` - Tests for Zod validation schemas
- `contract-tests/` - Contract tests for IPC communications

### packages/renderer/__tests__/
- `components/ServerManager.test.ts` - Component tests
- `services/server-service.test.ts` - Service tests

### packages/preload/__tests__/
- `ipc-client.test.ts` - Tests for IPC communication

## No HTTP APIs

Following constitutional requirements, this implementation uses IPC API only:
- All communication between renderer and main process uses Electron's IPC mechanism
- No HTTP requests are made from the renderer to call backend services
- All security boundaries are maintained through the preload script

## Error Handling

### Common Error Cases
- **Port in Use**: When attempting to start a server on an already-used port
- **Insufficient Permissions**: When unable to terminate an external process
- **Process Not Found**: When attempting to stop a server that isn't running
- **Timeout**: When a process doesn't respond to termination signals within 10s

### IPC Error Response Format
```javascript
{
  success: false,
  error: "Port 3000 is already in use by another process",
  code: "PORT_IN_USE"
}
```

## Testing the Implementation
1. Run unit tests across all packages:
   ```bash
   pnpm test
   ```
2. Run contract tests:
   ```bash
   pnpm test:contract
   ```
3. Test the API manually through the UI to ensure process identification works correctly
4. Verify that all code is properly organized within package directories per constitutional requirements
5. Confirm that no HTTP APIs are used, only IPC communication between renderer and main process
6. Verify that cross-platform process management is handled through simple node modules (find-process and tree-kill)