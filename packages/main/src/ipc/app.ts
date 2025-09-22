import { shell, dialog } from 'electron'

// 在浏览器中打开链接
export async function openInBrowser(url: string): Promise<void> {
  shell.openExternal(url)
}

// 选择目录
export async function selectAppDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  return result.canceled ? null : result.filePaths[0]
}