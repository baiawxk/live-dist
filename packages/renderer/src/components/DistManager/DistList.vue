<script setup lang="ts">
import type { DistConfig } from '@/types/dist'
import { useDistManager } from '@/composables/useDistManager'
import { ElMessageBox } from 'element-plus'

const {
  distList,
  loadingStates,
  batchLoading,
  startAllServers,
  stopAllServers,
  toggleServer,
  openInBrowser,
  removeDist,
} = useDistManager()

const emit = defineEmits<{
  (e: 'edit', dist: DistConfig): void
  (e: 'add'): void
}>()

function confirmDelete(dist: DistConfig) {
  ElMessageBox.confirm(
    '确定要删除这个目录吗？如果服务正在运行，会先停止服务。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(async () => {
    await removeDist(dist)
  }).catch(() => {
    // 用户取消删除
  })
}
</script>

<template>
  <el-main>
    <div class="toolbar">
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
      <el-button type="primary" @click="emit('add')">
        添加目录
      </el-button>
    </div>

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
            <el-button @click="emit('edit', row)">
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
</template>

<style scoped>
.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
</style>