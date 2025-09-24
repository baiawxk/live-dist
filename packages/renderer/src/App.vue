<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { distMgr, serverMgr, shell } from '@app/preload'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

interface ProxyRule {
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
  proxyRules: ProxyRule[]
}

// 状态
const distList = ref<DistConfig[]>([])
const dialogVisible = ref(false)
const isEditing = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
const form = ref({
  id: '',
  name: '',
  path: '',
  port: 3000,
  proxyRules: [] as ProxyRule[],
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  path: [
    { required: true, message: '请选择目录路径', trigger: 'blur' },
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1024, max: 65535, message: '端口号范围 1024-65535', trigger: 'blur' },
  ],
}

// 批量操作状态
const batchLoading = ref<'start' | 'stop' | false>(false)

// 生命周期
onMounted(async () => {
  await loadDistList()
})

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

    // 创建停止进度消息

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

// 方法
async function loadDistList() {
  try {
    distList.value = await distMgr.getAllDists()
  }
  catch (error) {
    ElMessage.error('加载目录列表失败')
  }
}

function showAddDistDialog() {
  isEditing.value = false
  form.value = {
    id: '',
    name: '',
    path: '',
    port: 3000,
    proxyRules: [],
  }
  dialogVisible.value = true
}

function showEditDistDialog(dist: DistConfig) {
  isEditing.value = true
  // 创建一个新的纯数据对象
  form.value = {
    id: dist.id,
    name: dist.name,
    path: dist.path,
    port: dist.port,
    proxyRules: dist.proxyRules.map(rule => ({
      path: rule.path,
      target: rule.target,
      changeOrigin: rule.changeOrigin ?? true,
      secure: rule.secure ?? false,
    })),
  }
  dialogVisible.value = true
}

async function selectDirectory() {
  try {
    const result = await distMgr.selectDirectory()
    if (result) {
      form.value.path = result
    }
  }
  catch (error) {
    ElMessage.error('选择目录失败')
  }
}

function addProxyRule() {
  // 创建一个新的纯数据对象作为代理规则
  const newRule = {
    path: '',
    target: '',
    changeOrigin: true,
    secure: false,
  }
  form.value.proxyRules = [...form.value.proxyRules, newRule]
}

function removeProxyRule(index: number) {
  form.value.proxyRules.splice(index, 1)
}

async function saveDistConfig() {
  if (!formRef.value)
    return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 创建一个新的纯数据对象，不包含任何方法或不可序列化的属性
        const configData = {
          id: form.value.id,
          name: form.value.name,
          path: form.value.path,
          port: form.value.port,
          isActive: false, // 添加必需的 isActive 字段
          proxyRules: form.value.proxyRules.map(rule => ({
            path: rule.path,
            target: rule.target,
            changeOrigin: rule.changeOrigin ?? true,
            secure: rule.secure ?? false,
          })),
        }

        if (isEditing.value) {
          console.log('updateDist', configData)
          await distMgr.updateDist(configData)
          ElMessage.success('更新成功')
        }
        else {
          console.log('addDist', configData)
          await distMgr.addDist(configData)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        await loadDistList()
      }
      catch (error) {
        console.log(error)
        ElMessage.error(isEditing.value ? '更新失败' : '添加失败')
      }
    }
  })
}

// 服务器操作的加载状态
const loadingStates = ref<{ [key: string]: boolean }>({})

// 初始化时清除所有加载状态
onMounted(() => {
  loadingStates.value = {}
})

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

function openInBrowser(dist: DistConfig) {
  shell.openInBrowser(`http://localhost:${dist.port}`)
}

function confirmDelete(dist: DistConfig) {
  const serverId = dist.id // 提前获取ID，避免后续可能的引用问题
  const isActive = dist.isActive

  ElMessageBox.confirm(
    '确定要删除这个目录吗？如果服务正在运行，会先停止服务。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(async () => {
    try {
      if (isActive) {
        await serverMgr.stopServer(serverId)
      }
      await distMgr.removeDist(serverId)
      ElMessage.success('删除成功')
      await loadDistList()
    }
    catch (error) {
      console.error('Delete error:', error)
      ElMessage.error('删除失败')
    }
  })
}
</script>

<template>
  <el-container>
    <el-header>
      <div class="header-content">
        <h1>Dist Manager</h1>
        <div class="header-buttons">
          <el-button
            type="success"
            :loading="batchLoading === 'start'"
            :disabled="distList.every(dist => dist.isActive) || distList.length === 0"
            @click="startAllServers"
          >
            一键启动所有服务
          </el-button>
          <el-button
            type="warning"
            :loading="batchLoading === 'stop'"
            :disabled="distList.every(dist => !dist.isActive) || distList.length === 0"
            @click="stopAllServers"
          >
            一键停止所有服务
          </el-button>
          <el-button type="primary" @click="showAddDistDialog">
            添加目录
          </el-button>
        </div>
      </div>
    </el-header>
    <el-main>
      <el-table :data="distList" style="width: 100%">
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="path" label="路径" />
        <el-table-column prop="port" label="端口" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">
              {{ row.isActive ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button-group>
              <el-button
                :type="row.isActive ? 'danger' : 'success'"
                :loading="loadingStates[row.id]"
                @click="toggleServer(row)"
              >
                {{ row.isActive ? '停止' : '启动' }}
              </el-button>
              <el-button @click="showEditDistDialog(row)">
                编辑
              </el-button>
              <el-button v-if="row.port" @click="openInBrowser(row)">
                打开
              </el-button>
              <el-button type="danger" @click="confirmDelete(row)">
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-main>

    <!-- 添加/编辑目录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑目录' : '添加目录'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="输入名称" />
        </el-form-item>
        <el-form-item label="目录路径" prop="path">
          <el-input v-model="form.path" placeholder="选择目录">
            <template #append>
              <el-button @click="selectDirectory">
                浏览
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number
            v-model="form.port"
            :min="1024"
            :max="65535"
            placeholder="输入端口号"
          />
        </el-form-item>

        <!-- 代理规则配置 -->
        <el-form-item label="代理规则">
          <div v-for="(rule, index) in form.proxyRules" :key="index" class="proxy-rule">
            <el-input v-model="rule.path" placeholder="路径 (如: /api)" />
            <el-input v-model="rule.target" placeholder="目标 (如: http://localhost:3000)" />
            <el-button type="danger" @click="removeProxyRule(index)">
              删除
            </el-button>
          </div>
          <el-button type="primary" @click="addProxyRule">
            添加代理规则
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="saveDistConfig">
          确定
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.proxy-rule {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
