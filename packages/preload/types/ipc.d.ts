
// 按文件名分组的API对象类型定义
export const app: {
  openInBrowser: typeof import('../../main/src/ipc/app.ts').openInBrowser;
  selectAppDirectory: typeof import('../../main/src/ipc/app.ts').selectAppDirectory;
};

export const distMgr: {
  getAllDists: typeof import('../../main/src/ipc/distMgr.ts').getAllDists;
  addDist: typeof import('../../main/src/ipc/distMgr.ts').addDist;
  updateDist: typeof import('../../main/src/ipc/distMgr.ts').updateDist;
  removeDist: typeof import('../../main/src/ipc/distMgr.ts').removeDist;
  getDist: typeof import('../../main/src/ipc/distMgr.ts').getDist;
  updateDistStatus: typeof import('../../main/src/ipc/distMgr.ts').updateDistStatus;
  selectDistDirectory: typeof import('../../main/src/ipc/distMgr.ts').selectDistDirectory;
};

export const server: {
  startServer: typeof import('../../main/src/ipc/server.ts').startServer;
  stopServer: typeof import('../../main/src/ipc/server.ts').stopServer;
  getServerStatus: typeof import('../../main/src/ipc/server.ts').getServerStatus;
};
