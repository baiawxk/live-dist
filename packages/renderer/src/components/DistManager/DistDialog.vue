<script setup lang="ts">
import type { DistConfig } from '@/types/dist'
import { computed, watch } from 'vue'
import { useDistForm } from '@/composables/useDistForm'

const props = defineProps<{
  visible: boolean
  isEditing: boolean
  initialData: DistConfig | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
}>()

const {
  formRef,
  form,
  rules,
  selectDirectory,
  addProxyRule,
  removeProxyRule,
  saveDistConfig,
} = useDistForm()

// 监听 visible 变化
const visibleModel = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

// 监听初始数据变化
watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value = { ...newVal }
  }
  else {
    form.value = {
      id: '',
      name: '',
      path: '',
      port: 3000,
      proxyRules: [],
    }
  }
}, { immediate: true })

async function handleSave() {
  await saveDistConfig()
  visibleModel.value = false
}
</script>

<template>
  <el-dialog
    v-model="visibleModel"
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
      <el-button @click="visibleModel = false">
        取消
      </el-button>
      <el-button type="primary" @click="handleSave">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.proxy-rule {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 8px;
  margin-bottom: 8px;
}
</style>
