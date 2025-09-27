<script setup lang="ts">
import { ref } from 'vue'
import DistList from '@/components/DistManager/DistList.vue'
import DistDialog from '@/components/DistManager/DistDialog.vue'
import { useDistManager } from '@/composables'
import type { DistConfig } from '@/types/dist'

const { 
  loadDistList,
} = useDistManager()

const dialogVisible = ref(false)
const isEditing = ref(false)
const currentDist = ref<DistConfig | null>(null)

function handleAdd() {
  isEditing.value = false
  currentDist.value = null
  dialogVisible.value = true
}

function handleEdit(dist: DistConfig) {
  isEditing.value = true
  currentDist.value = { ...dist }  // 创建副本避免直接修改
  dialogVisible.value = true
}
</script>

<template>
  <el-container>
    <el-header>
      <div class="header-content">
        <h1>Dist Manager</h1>
      </div>
    </el-header>
    
    <DistList 
      @add="handleAdd"
      @edit="handleEdit"
    />
    
    <DistDialog
      v-model:visible="dialogVisible"
      v-model:is-editing="isEditing"
      :initial-data="currentDist"
      :load-dist-list="loadDistList"
    />
  </el-container>
</template>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}
</style>