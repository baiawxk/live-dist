import type { AppModule } from '../AppModule.js'
import type { ModuleContext } from '../ModuleContext.js'
import { Tray, Menu, nativeImage, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export class TrayIconModule implements AppModule {
  private tray: Tray | null = null

  async enable({ app }: ModuleContext): Promise<void> {
    // Wait for app to be ready before creating tray
    await app.whenReady()
    
    // Get the icon path
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const iconPath = join(__dirname, '../../../buildResources/icon.png')
    
    // Create tray icon
    const icon = nativeImage.createFromPath(iconPath)
    this.tray = new Tray(icon)

    // Set tooltip
    this.tray.setToolTip('Live Dist Manager')

    // Setup IPC handlers
    this.setupIPCHandlers(app)

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: '显示应用', 
        click: () => {
          // Send IPC message to show window
          ipcMain.emit('show-window')
        } 
      },
      { 
        label: '隐藏应用', 
        click: () => {
          // Send IPC message to hide window
          ipcMain.emit('hide-window')
        } 
      },
      { type: 'separator' },
      { 
        label: '退出', 
        click: () => {
          app.quit()
        } 
      }
    ])

    this.tray.setContextMenu(contextMenu)
  }

  private setupIPCHandlers(app: Electron.App) {
    // Listen for window show request
    ipcMain.on('show-window', () => {
      const windows = app.getWindows()
      for (const window of windows) {
        if (!window.isDestroyed()) {
          window.show()
          window.focus()
          break
        }
      }
    })

    // Listen for window hide request
    ipcMain.on('hide-window', () => {
      const windows = app.getWindows()
      for (const window of windows) {
        if (!window.isDestroyed()) {
          window.hide()
          break
        }
      }
    })
  }
}

export function createTrayIconModule(): TrayIconModule {
  return new TrayIconModule()
}