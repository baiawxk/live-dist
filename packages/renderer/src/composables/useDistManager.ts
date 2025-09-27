import type { DistConfig } from '@/types/dist'
import { distMgr, serverMgr, shell } from '@app/preload'
import { ElMessage } from 'element-plus'
import { ref, onMounted } from 'vue'

export function useDistManager() {
  // 状态
  const distList = ref<DistConfig[]>([])
  const loadingStates = ref<{ [key: string]: boolean }>({})
  const batchLoading = ref<'start' | 'stop' | false>(false)

  // 生命周期
  onMounted(async () => {
    await loadDistList()
    // 初始化时清除所有加载状态
    loadingStates.value = {}
  })

  // 方法
  async function loadDistList() {
    try {
      distList.value = await distMgr.getAllDists()
    }
    catch (error) {
      ElMessage.error('加载目录列表失败')
    }
  }

  // 批量启动所有服务
  async function startAllServers() {
    if (batchLoading.value)
      return

    try {
      batchLoading.value = 'start'
      const notRunningServers = distList.value.filter(dist => !dist.isActive)

      if (notRunningServers.length === 0) {
        ElMessage.info('没有需要启动的服务')
        return
      }

      let successCount = 0
      let failCount = 0

      // 依次启动每个服务
      for (const dist of notRunningServers) {
        try {
          await serverMgr.startServer(dist.id)
          successCount++
        }
        catch (error) {
          console.error(`Failed to start server ${dist.id}:`, error)
          failCount++
        }
      }

      await loadDistList() // 先更新列表

      // 显示最终结果
      if (failCount === 0) {
        ElMessage.success(`成功启动 ${successCount} 个服务`)
      }
      else {
        ElMessage.warning(`${successCount} 个服务启动成功，${failCount} 个服务启动失败`)
      }
    }
    catch (error) {
      console.error('Batch start error:', error)
      ElMessage.error('批量启动服务失败')
      await loadDistList() // 确保发生错误时也更新列表
    }
    finally {
      batchLoading.value = false
    }
  }

  // 批量停止所有服务
  async function stopAllServers() {
    if (batchLoading.value)
      return

    try {
      batchLoading.value = 'stop'
      const runningServers = distList.value.filter(dist => dist.isActive)

      if (runningServers.length === 0) {
        ElMessage.info('没有需要停止的服务')
        return
      }

      let successCount = 0
      let failCount = 0

      // 依次停止每个服务
      for (const dist of runningServers) {
        try {
          await serverMgr.stopServer(dist.id)
          successCount++
        }
        catch (error) {
          console.error(`Failed to stop server ${dist.id}:`, error)
          failCount++
        }
      }

      await loadDistList() // 先更新列表

      // 显示最终结果
      if (failCount === 0) {
        ElMessage.success(`成功停止 ${successCount} 个服务`)
      }
      else {
        ElMessage.warning(`${successCount} 个服务停止成功，${failCount} 个服务停止失败`)
      }
    }
    catch (error) {
      console.error('Batch stop error:', error)
      ElMessage.error('批量停止服务失败')
      await loadDistList() // 确保发生错误时也更新列表
    }
    finally {
      batchLoading.value = false
    }
  }

  // 服务器操作
  async function toggleServer(dist: DistConfig) {
    const serverId = dist.id

    // 如果已经在加载状态，直接返回
    if (loadingStates.value[serverId]) {
      return
    }

    try {
      // 设置加载状态
      loadingStates.value[serverId] = true

      if (dist.isActive) {
        await serverMgr.stopServer(serverId)
        ElMessage.success('服务已停止')
      }
      else {
        await serverMgr.startServer(serverId)
        ElMessage.success('服务已启动')
      }

      await loadDistList()
    }
    catch (error) {
      console.error('Server toggle error:', error)
      ElMessage.error(dist.isActive ? '停止服务失败' : '启动服务失败')
      // 出错时恢复之前的状态
      await loadDistList()
    }
    finally {
      // 清除加载状态
      loadingStates.value[serverId] = false
    }
  }

  // 打开浏览器
  function openInBrowser(dist: DistConfig) {
    shell.openInBrowser(`http://localhost:${dist.port}`)
  }

  // 删除目录
  async function removeDist(dist: DistConfig) {
    const serverId = dist.id
    const isActive = dist.isActive

    try {
      if (isActive) {
        await serverMgr.stopServer(serverId)
      }
      await distMgr.removeDist(serverId)
      ElMessage.success('删除成功')
      await loadDistList()
      return true
    }
    catch (error) {
      console.error('Delete error:', error)
      ElMessage.error('删除失败')
      return false
    }
  }

  return {
    distList,
    loadingStates,
    batchLoading,
    loadDistList,
    startAllServers,
    stopAllServers,
    toggleServer,
    openInBrowser,
    removeDist,
  }
}