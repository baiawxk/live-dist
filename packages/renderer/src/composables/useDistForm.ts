import type { FormInstance, FormRules } from 'element-plus'
import type { ProxyRule } from '@/types/dist'
import { distMgr } from '@app/preload'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useDistManager } from './useDistManager'

export function useDistForm() {
  const formRef = ref<FormInstance>()
  const { loadDistList } = useDistManager()

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

          if (form.value.id) {
            console.log('updateDist', configData)
            await distMgr.updateDist(configData)
            ElMessage.success('更新成功')
          }
          else {
            console.log('addDist', configData)
            await distMgr.addDist(configData)
            ElMessage.success('添加成功')
          }
          await loadDistList()
        }
        catch (error) {
          console.log(error)
          ElMessage.error(form.value.id ? '更新失败' : '添加失败')
        }
      }
    })
    return formRef.value
  }

  return {
    formRef,
    form,
    rules,
    selectDirectory,
    addProxyRule,
    removeProxyRule,
    saveDistConfig,
  }
}