export interface ModuleContext {
  readonly app: Electron.App
}

export interface Module {
  name: string
  startup?: () => void | Promise<void>
  shutdown?: () => void | Promise<void>
}
