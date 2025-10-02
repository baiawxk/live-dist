<!-- 
Sync Impact Report:
- Version change: 1.4.4 → 1.4.5
- Modified principles: Clean Architecture and Directory Structure Awareness
- Added sections: N/A
- Removed sections: N/A
- Templates requiring updates: 
  - ✅ updated: .specify/templates/plan-template.md
  - ✅ updated: .specify/templates/spec-template.md
  - ✅ updated: .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# live-dist Development Constitution

## Core Principles

### Security-First Architecture
All Electron applications must follow the latest security practices; Context isolation is mandatory, nodeIntegration is disabled by default, and only necessary APIs are exposed through preload scripts; Use Zod for IPC validation to ensure type-safe communication

### Modular Monorepo Architecture
Project structure follows monorepo pattern with separate packages for main, preload, and renderer; Each package is independently manageable with @app/* naming convention; Each application part is an independent package with its own tech stack, tests, and dependencies; Strictly adhere to monorepo best practices including proper dependency management, independent testing, and clear package boundaries; All development code and test code must be placed in the appropriate package and not in the root directory

### Type Safety Across the Stack
All code must use TypeScript for complete type safety; Zod validation required for all IPC communications; Strict typing enforced throughout entire application to prevent runtime errors

### Clean Architecture and Directory Structure Awareness
Every code adjustment must recognize the current project directory structure, ensure code is placed as expected, maintain clean architecture, and ensure clean naming; All code placements must follow the established architectural patterns and directory conventions; When starting any coding task, always follow the existing directory architecture and have a clear understanding of the current code structure; Code must never be placed in unexpected directories; All code should conform to the current code conventions including naming and directory structure patterns

### Static Directory Management Focus
Application specifically designed to manage multiple static file directories and serve them via local server; Each directory served with proper MIME types and security headers; Support for directory browsing, file serving, and access control

### Test-Driven Development (NON-NEGOTIABLE)
Unit tests mandatory using Vitest with workspace configuration; Each package has independent vitest configuration with __tests__ directory at the same level as src; Test files follow __tests__/**/*.test.ts naming convention with .test extension required; All IPC communications verified with contract tests; IPC APIs must have corresponding unit tests that can run without starting Electron, testing only API functionality; TDD approach required before implementation

### Electron API Access via Preload
Web pages will not directly import Electron APIs; Web pages will only request or load Electron modules indirectly through the preload module; This ensures proper security boundaries between the renderer process and the main process

### IPC Communication Architecture
Background processes communicate with the Electron main process exclusively through IPC (Inter-Process Communication) calls; Frontend components MUST NOT make HTTP requests to call backend API services; All communication between renderer and main processes must use Electron's IPC mechanism with appropriate security validations

### API Layer Architecture
Use @app/api layer to build API types and type definitions; main and preload processes must use the API layer's tool methods to establish IPC connections; All IPC communication patterns must be defined through the @app/api module to maintain consistent type safety across the entire application

### UI Integration and Navigation
When integrating features into the UI: If the feature extends an existing function, extend the current UI entry point; If the feature is new and distinct, create a new menu entry; If unsure about how to integrate with existing code or functionality, raise clarification questions during the design phase to ensure proper integration approach

### Refactoring Integrity
When performing refactoring tasks: MUST first analyze the existing implementation to understand current functionality; MUST determine how the refactored part will integrate with the existing implementation to ensure functionality remains unified and consistent; MUST NOT create duplicate functionality or separate pages for the same feature; MUST ensure refactored code is actually used in place of the original implementation; Code that is refactored must completely replace the original implementation, not exist alongside it creating redundancy.

## Technology Stack Requirements

Electron for cross-platform desktop application; Vite for fast build and development; Vue.js 3 with Element Plus for UI components; TypeScript for type safety; Zod for IPC validation; Vitest for unit testing with workspace configuration; pnpm for node module management; Turbo for monorepo management; find-process for server process management

## Development Workflow and Conventions

Use modular architecture design where each feature is independent module; Follow Electron security guidelines strictly; Implement type-safe IPC communication with Zod-based validation; Maintain consistency with TypeScript across all packages; Use pnpm for node module management and Turbo for monorepo management; Efficiently manage server processes with proper identification and termination strategies; Each package follows vitest workspace configuration with __tests__ directory at the same level as src directory; Test files use __tests__/**/*.test.ts naming convention with .test extension required; Strictly adhere to monorepo best practices: clear package boundaries, independent testing and building, shared configuration management, and proper cross-package dependency handling; Prioritize functional programming for implementation unless class-based approach is clearly more suitable for the specific scenario; Maintain code simplicity by avoiding duplicate code, hardcoded values, and prefer latest node modules with tools to ensure API currency; All code should follow the development conventions of the corresponding package it belongs to; Code should be tested in the following sequence: first perform global typecheck with turbo, then perform global unit tests with vitest, then perform actual code testing with turbo dev, and finally fix all eslint issues with eslint --fix

## Governance

All changes must pass through code review process; Type safety must be maintained across all packages; Security practices must be followed; IPC communications must use Zod validation; Backward compatibility should be preserved when possible; Server management code must properly identify and handle processes started by this application versus external processes; Unit tests must follow vitest workspace configuration with __tests__ directory at the same level as src and use __tests__/**/*.test.ts naming convention with .test extension required; Use pnpm for node module management and Turbo for monorepo management; Strictly adhere to monorepo best practices: maintain clear package boundaries, enable independent testing and building, implement shared configuration management, and ensure proper cross-package dependency handling; Prioritize functional programming for implementation unless class-based approach is clearly more suitable for the specific scenario; Maintain code simplicity by avoiding duplicate code, hardcoded values, and prefer latest node modules with tools to ensure API currency; All code should follow the development conventions of the corresponding package it belongs to; Code should be tested in the following sequence: first perform global typecheck with turbo, then perform global unit tests with vitest, then perform actual code testing with turbo dev, and finally fix all eslint issues with eslint --fix

**Version**: 1.4.5 | **Ratified**: 2025-06-09 | **Last Amended**: 2025-10-01
