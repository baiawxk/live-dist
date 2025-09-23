export * from 'virtual:ipc-preload'

console.log('[preload] preload script loaded')

export function test() {
  console.log('test')
}
