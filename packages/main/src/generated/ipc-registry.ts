
import { openInBrowser } from 'E:/workspaces/live-dist/packages/main/src/ipc/app.ts';
import { selectAppDirectory } from 'E:/workspaces/live-dist/packages/main/src/ipc/app.ts';
import { getAllDists } from 'E:/workspaces/live-dist/packages/main/src/ipc/distMgr.ts';
import { addDist } from 'E:/workspaces/live-dist/packages/main/src/ipc/distMgr.ts';
import { updateDist } from 'E:/workspaces/live-dist/packages/main/src/ipc/distMgr.ts';
import { removeDist } from 'E:/workspaces/live-dist/packages/main/src/ipc/distMgr.ts';
import { getDist } from 'E:/workspaces/live-dist/packages/main/src/ipc/distMgr.ts';
import { updateDistStatus } from 'E:/workspaces/live-dist/packages/main/src/ipc/distMgr.ts';
import { selectDistDirectory } from 'E:/workspaces/live-dist/packages/main/src/ipc/distMgr.ts';
import { startServer } from 'E:/workspaces/live-dist/packages/main/src/ipc/server.ts';
import { stopServer } from 'E:/workspaces/live-dist/packages/main/src/ipc/server.ts';
import { getServerStatus } from 'E:/workspaces/live-dist/packages/main/src/ipc/server.ts';
import { ipcMain } from 'electron';

export function registerIPCFunctions() {
  ipcMain.handle('app:openInBrowser', (_, ...args) => openInBrowser(...args));
ipcMain.handle('app:selectAppDirectory', (_, ...args) => selectAppDirectory(...args));
ipcMain.handle('distMgr:getAllDists', (_, ...args) => getAllDists(...args));
ipcMain.handle('distMgr:addDist', (_, ...args) => addDist(...args));
ipcMain.handle('distMgr:updateDist', (_, ...args) => updateDist(...args));
ipcMain.handle('distMgr:removeDist', (_, ...args) => removeDist(...args));
ipcMain.handle('distMgr:getDist', (_, ...args) => getDist(...args));
ipcMain.handle('distMgr:updateDistStatus', (_, ...args) => updateDistStatus(...args));
ipcMain.handle('distMgr:selectDistDirectory', (_, ...args) => selectDistDirectory(...args));
ipcMain.handle('server:startServer', (_, ...args) => startServer(...args));
ipcMain.handle('server:stopServer', (_, ...args) => stopServer(...args));
ipcMain.handle('server:getServerStatus', (_, ...args) => getServerStatus(...args));
}
