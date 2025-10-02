# API Contract: Unified Server Management

## Overview
This document defines the IPC API contracts for unified server management, consolidating start, stop, and status operations into a single cohesive API. This follows the constitutional requirement to use the @app/api layer for IPC communication and maintains the existing liveServer functionality while adding enhanced process management capabilities.

## 1. Get Server Status by Port

### Request
- **Channel**: `server-status:get-by-port`
- **Payload**: 
  ```json
  {
    "port": number
  }
  ```

### Response
- **Success**:
  ```json
  {
    "status": "success",
    "data": {
      "port": number,
      "isRunning": boolean,
      "isStartedByApp": boolean,
      "processInfo": {
        "pid": number,
        "name": string,
        "cmd": string,
        "exePath": string,
        "ppid"?: number
      } | null
    }
  }
  ```
- **Error**:
  ```json
  {
    "status": "error",
    "message": string
  }
  ```

## 2. Get All Server Statuses

### Request
- **Channel**: `server-status:get-all`
- **Payload**: (empty)

### Response
- **Success**:
  ```json
  {
    "status": "success",
    "data": {
      "serverStatuses": [
        {
          "port": number,
          "isRunning": boolean,
          "isStartedByApp": boolean,
          "processInfo": {
            "pid": number,
            "name": string,
            "cmd": string,
            "exePath": string,
            "ppid"?: number
          } | null
        }
      ]
    }
  }
  ```
- **Error**:
  ```json
  {
    "status": "error",
    "message": string
  }
  ```

## 3. Stop Server by Port

### Request
- **Channel**: `server-control:stop-by-port`
- **Payload**:
  ```json
  {
    "port": number,
    "force": boolean // whether to skip confirmation for external processes (for testing)
  }
  ```

### Response
- **Success**:
  ```json
  {
    "status": "success",
    "data": {
      "targetPort": number,
      "operationResult": "success" | "failure" | "timeout",
      "terminationMethod": "SIGTERM" | "SIGKILL" | "tree-kill",
      "confirmationStatus": "none" | "required" | "confirmed" | "cancelled"
    }
  }
  ```
- **Requires Confirmation**:
  ```json
  {
    "status": "requires-confirmation",
    "data": {
      "targetPort": number,
      "processInfo": {
        "pid": number,
        "name": string,
        "cmd": string,
        "exePath": string,
        "ppid"?: number
      }
    }
  }
  ```
- **Error**:
  ```json
  {
    "status": "error",
    "message": string
  }
  ```

## 4. Stop Multiple Servers

### Request
- **Channel**: `server-control:stop-multiple`
- **Payload**:
  ```json
  {
    "ports": number[],
    "force": boolean // whether to skip confirmation for external processes (for testing)
  }
  ```

### Response
- **Success**:
  ```json
  {
    "status": "success",
    "data": {
      "results": [
        {
          "port": number,
          "operationResult": "success" | "failure" | "timeout" | "cancelled",
          "terminationMethod": "SIGTERM" | "SIGKILL" | "tree-kill" | null,
          "confirmationStatus": "none" | "required" | "confirmed" | "cancelled"
        }
      ]
    }
  }
  ```
- **Requires Confirmation**:
  ```json
  {
    "status": "requires-confirmation",
    "data": {
      "pendingConfirmations": [
        {
          "port": number,
          "processInfo": {
            "pid": number,
            "name": string,
            "cmd": string,
            "exePath": string,
            "ppid"?: number
          }
        }
      ]
    }
  }
  ```
- **Error**:
  ```json
  {
    "status": "error",
    "message": string
  }
  ```

## 5. Cancel Stop Operation

### Request
- **Channel**: `server-control:cancel-stop`
- **Payload**:
  ```json
  {
    "port": number
  }
  ```

### Response
- **Success**:
  ```json
  {
    "status": "success",
    "data": {
      "cancelled": boolean
    }
  }
  ```
- **Error**:
  ```json
  {
    "status": "error",
    "message": string
  }
  ```

## 6. Server Status Change Notification

### Event
- **Channel**: `server-status:changed`
- **Payload**:
  ```json
  {
    "port": number,
    "newStatus": {
      "port": number,
      "isRunning": boolean,
      "isStartedByApp": boolean,
      "processInfo": {
        "pid": number,
        "name": string,
        "cmd": string,
        "exePath": string,
        "ppid"?: number
      } | null
    }
  }
  ```

## 7. Start Server

### Request
- **Channel**: `server-management:start`
- **Payload**:
  ```json
  {
    "directory": string,
    "port": number
  }
  ```

### Response
- **Success**:
  ```json
  {
    "status": "success",
    "data": {
      "targetDirectory": string,
      "port": number,
      "operationResult": "success" | "failure" | "timeout",
      "processInfo": {
        "pid": number,
        "name": string,
        "cmd": string,
        "exePath": string,
        "ppid"?: number
      } | null
    }
  }
  ```
- **Error**:
  ```json
  {
    "status": "error",
    "message": string
  }
  ```