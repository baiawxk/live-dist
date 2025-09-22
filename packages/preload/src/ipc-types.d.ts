
// Automatically generated IPC type definitions
import { ipcRenderer } from 'electron';

// 定义所有IPC方法的类型
interface ProxyConfig {
  path: string
  target: string
  changeOrigin?: boolean
  secure?: boolean
}

interface DistConfig {
  id: string
  name: string
  path: string
  port: number
  isActive: boolean
  proxyRules: ProxyConfig[]
  createdAt: number
  updatedAt: number
}

export function openInBrowser(url): Promise<any>;
export function selectAppDirectory(): Promise<any>;
export function getAllDists(): Promise<any>;
export function addDist(config): Promise<any>;
export function updateDist(id, update): Promise<any>;
export function removeDist(id): Promise<any>;
export function getDist(id): Promise<any>;
export function updateDistStatus(id, isActive): Promise<any>;
export function selectDistDirectory(): Promise<any>;
export function startServer(id): Promise<any>;
export function stopServer(id): Promise<any>;
export function getServerStatus(id): Promise<any>;

export const ipcClient: {
  openInBrowser(url): Promise<any>;
  selectAppDirectory(): Promise<any>;
  getAllDists(): Promise<any>;
  addDist(config): Promise<any>;
  updateDist(id, update): Promise<any>;
  removeDist(id): Promise<any>;
  getDist(id): Promise<any>;
  updateDistStatus(id, isActive): Promise<any>;
  selectDistDirectory(): Promise<any>;
  startServer(id): Promise<any>;
  stopServer(id): Promise<any>;
  getServerStatus(id): Promise<any>;
};

export const apiClient: {
  'openInBrowser': (url) => Promise<any>;
  'selectAppDirectory': () => Promise<any>;
  'getAllDists': () => Promise<any>;
  'addDist': (config) => Promise<any>;
  'updateDist': (id, update) => Promise<any>;
  'removeDist': (id) => Promise<any>;
  'getDist': (id) => Promise<any>;
  'updateDistStatus': (id, isActive) => Promise<any>;
  'selectDistDirectory': () => Promise<any>;
  'startServer': (id) => Promise<any>;
  'stopServer': (id) => Promise<any>;
  'getServerStatus': (id) => Promise<any>;
};

export const distMgr: {
  getAllDists(): Promise<DistConfig[]>;
  addDist(config: Omit<DistConfig, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<DistConfig>;
  updateDist(config: Partial<Omit<DistConfig, 'id' | 'createdAt'>> & { id: string }): Promise<DistConfig | null>;
  removeDist(id: string): Promise<boolean>;
  selectDirectory(): Promise<string | null>;
  startServer(id: string): Promise<boolean>;
  stopServer(id: string): Promise<boolean>;
  openInBrowser(url: string): Promise<void>;
  getDist(id: string): Promise<DistConfig | null>;
  updateDistStatus(id: string, isActive: boolean): Promise<boolean>;
  getServerStatus(id: string): Promise<boolean>;
  selectAppDirectory(): Promise<string | null>;
};
