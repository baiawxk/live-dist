<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {distMgr} from '@app/preload'

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
  proxyRules: [] as ProxyRule[]
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请选择目录路径', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1024, max: 65535, message: '端口号范围 1024-65535', trigger: 'blur' }
  ]
}

// 生命周期
onMounted(async () => {
  await loadDistList()
})

// 方法
const loadDistList = async () => {
  try {
    distList.value = await distMgr.getAllDists()
  } catch (error) {
    ElMessage.error('加载目录列表失败')
  }
}

const showAddDistDialog = () => {
  isEditing.value = false
  form.value = {
    id: '',
    name: '',
    path: '',
    port: 3000,
    proxyRules: []
  }
  dialogVisible.value = true
}

const showEditDistDialog = (dist: DistConfig) => {
  isEditing.value = true
  form.value = { ...dist }
  dialogVisible.value = true
}

const selectDirectory = async () => {
  try {
    const result = await distMgr.selectDirectory()
    if (result) {
      form.value.path = result
    }
  } catch (error) {
    ElMessage.error('选择目录失败')
  }
}

const addProxyRule = () => {
  form.value.proxyRules.push({
    path: '',
    target: '',
    changeOrigin: true,
    secure: false
  })
}

const removeProxyRule = (index: number) => {
  form.value.proxyRules.splice(index, 1)
}

const saveDistConfig = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEditing.value) {
          await distMgr.updateDist(form.value)
          ElMessage.success('更新成功')
        } else {
          await distMgr.addDist(form.value)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        await loadDistList()
      } catch (error) {
        ElMessage.error(isEditing.value ? '更新失败' : '添加失败')
      }
    }
  })
}

const toggleServer = async (dist: DistConfig) => {
  try {
    if (dist.isActive) {
      await distMgr.stopServer(dist.id)
      ElMessage.success('服务已停止')
    } else {
      await distMgr.startServer(dist.id)
      ElMessage.success('服务已启动')
    }
    await loadDistList()
  } catch (error) {
    ElMessage.error(dist.isActive ? '停止服务失败' : '启动服务失败')
  }
}

const openInBrowser = (dist: DistConfig) => {
  distMgr.openInBrowser('http://localhost:' + dist.port)
}

const confirmDelete = (dist: DistConfig) => {
  ElMessageBox.confirm(
    '确定要删除这个目录吗？如果服务正在运行，会先停止服务。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      if (dist.isActive) {
        await distMgr.stopServer(dist.id)
      }
      await distMgr.removeDist(dist.id)
      ElMessage.success('删除成功')
      await loadDistList()
    } catch (error) {
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
        <el-button type="primary" @click="showAddDistDialog">添加目录</el-button>
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
                @click="toggleServer(row)"
              >
                {{ row.isActive ? '停止' : '启动' }}
              </el-button>
              <el-button @click="showEditDistDialog(row)">编辑</el-button>
              <el-button @click="openInBrowser(row)" v-if="row.isActive">
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
              <el-button @click="selectDirectory">浏览</el-button>
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
            <el-button type="danger" @click="removeProxyRule(index)">删除</el-button>
          </div>
          <el-button type="primary" @click="addProxyRule">添加代理规则</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDistConfig">确定</el-button>
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
