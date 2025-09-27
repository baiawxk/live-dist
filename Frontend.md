# 前端开发规范

本文档定义了本项目的前端开发规范，旨在确保代码质量、一致性和可维护性。

## 技术栈

- **框架**: Vue.js 3 (Composition API)
- **语言**: TypeScript 5
- **构建工具**: Vite 7
- **组件库**: Element Plus
- **包管理**: pnpm
- **代码规范**: ESLint (使用 [@antfu/eslint-config](https://github.com/antfu/eslint-config))

## 项目结构

```
packages/renderer/
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── assets/          # 静态资源（会被构建处理）
│   ├── components/      # Vue 组件
│   ├── composables/     # Vue 组合式函数
│   ├── stores/          # 状态管理
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── index.html           # HTML 模板
├── package.json         # 项目配置
└── vite.config.ts       # Vite 配置
```

## 命名规范

### 文件命名

1. **组件文件**: 使用 PascalCase 命名，如 `MyComponent.vue`
2. **其他文件**: 使用 camelCase 命名，如 `useUser.ts`
3. **目录命名**: 使用 camelCase 命名，如 `userProfile`

### 组件命名

1. **单文件组件**: 使用 PascalCase 命名，如 `<MyComponent />`
2. **组件内引用**: 使用 PascalCase 命名

### 变量命名

1. **普通变量**: 使用 camelCase 命名，如 `userName`
2. **常量**: 使用 UPPER_SNAKE_CASE 命名，如 `MAX_COUNT`
3. **布尔值变量**: 使用 is/has/can 等前缀，如 `isLoading`, `hasPermission`
4. **私有变量**: 使用下划线前缀，如 `_privateVar`

## Vue 组件规范

### 组件结构

```vue
<script setup lang="ts">
// 导入语句
import { ref } from 'vue'

// 类型定义
interface Props {
  title: string
}

// Props 定义
const props = defineProps<Props>()

// Emits 定义
const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

// 响应式数据
const count = ref(0)

// 计算属性
const doubleCount = computed(() => count.value * 2)

// 方法
function increment() {
  count.value++
  emit('change', count.value.toString())
}

// 生命周期钩子
onMounted(() => {
  console.log('Component mounted')
})
</script>

<template>
  <div class="my-component">
    <h1>{{ props.title }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<style scoped>
.my-component {
  padding: 20px;
}
</style>
```

### 组件设计原则

1. **单一职责**: 每个组件只负责一个功能
2. **可复用性**: 组件应该设计为可复用的
3. **无状态**: 优先使用无状态组件
4. **Props 验证**: 所有 props 都应该有类型定义和验证

### 组件通信

1. **Props**: 父组件向子组件传递数据
2. **Emits**: 子组件向父组件传递事件
3. **Provide/Inject**: 跨层级组件通信
4. **状态管理**: 复杂状态使用 Pinia 或其他状态管理库

## TypeScript 规范

### 类型定义

1. **接口命名**: 使用 PascalCase 命名，如 `UserConfig`
2. **类型别名**: 使用 PascalCase 命名，如 `UserStatus`
3. **泛型参数**: 使用单个大写字母，如 `T`, `K`, `V`

### 类型注解

1. **函数参数**: 所有函数参数都应有类型注解
2. **返回值**: 函数返回值应有类型注解
3. **变量**: 复杂对象变量应有类型注解
4. **泛型**: 优先使用泛型而非 any

### 类型文件

1. **类型定义**: 所有类型定义放在 `src/types/` 目录下
2. **按模块组织**: 按功能模块组织类型文件
3. **导出**: 类型应统一导出，便于导入

## 样式规范

### CSS 类名

1. **命名**: 使用 kebab-case 命名，如 `.user-profile`
2. **语义化**: 类名应具有语义化，避免使用外观类名
3. **BEM 规范**: 复杂组件可使用 BEM 命名规范

### 样式作用域

1. **Scoped CSS**: 组件样式默认使用 `scoped` 属性
2. **全局样式**: 全局样式放在 `src/styles/` 目录下
3. **CSS 变量**: 使用 CSS 变量定义主题色和尺寸

## 组合式函数 (Composables)

### 命名规范

1. **文件名**: 使用 `use` 前缀，如 `useUser.ts`
2. **函数名**: 与文件名保持一致，如 `useUser()`

### 设计原则

1. **可组合性**: 函数应设计为可组合的
2. **响应式**: 返回响应式数据
3. **副作用管理**: 合理管理副作用
4. **生命周期**: 正确处理组件生命周期

### 示例

```ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  onMounted(() => {
    console.log('Counter mounted')
  })
  
  onUnmounted(() => {
    console.log('Counter unmounted')
  })
  
  return {
    count,
    increment,
    decrement
  }
}
```

## 状态管理

### 使用原则

1. **简单状态**: 使用组件内部状态
2. **跨组件状态**: 使用组合式函数
3. **全局状态**: 使用 Pinia 或其他状态管理库

### 状态结构

1. **模块化**: 按功能模块组织状态
2. **命名规范**: 使用清晰的命名
3. **类型安全**: 所有状态都有类型定义

## API 调用

### IPC 通信

1. **统一入口**: 通过 `@app/preload` 导入 IPC 方法
2. **错误处理**: 所有 IPC 调用都需要错误处理
3. **类型安全**: 使用 TypeScript 确保类型安全

### 示例

```ts
import { distMgr } from '@app/preload'
import { ElMessage } from 'element-plus'

async function loadDistList() {
  try {
    const distList = await distMgr.getAllDists()
    // 处理数据
  } catch (error) {
    ElMessage.error('加载目录列表失败')
    console.error(error)
  }
}
```

## 错误处理

1. **异常捕获**: 所有可能出错的地方都需要捕获异常
2. **用户提示**: 向用户提供友好的错误提示
3. **日志记录**: 记录错误日志便于调试
4. **优雅降级**: 出错时提供降级方案

## 性能优化

### 组件优化

1. **懒加载**: 使用动态导入实现组件懒加载
2. **虚拟滚动**: 长列表使用虚拟滚动
3. **缓存**: 合理使用缓存避免重复计算

### 网络优化

1. **请求合并**: 合并多个请求
2. **缓存策略**: 合理使用 HTTP 缓存
3. **图片优化**: 使用合适的图片格式和尺寸

## 代码质量

### ESLint 配置

项目使用 [@antfu/eslint-config](https://github.com/antfu/eslint-config) 作为代码规范，主要规则包括：

1. **无未使用变量**: 禁止声明未使用的变量
2. **无 console**: 禁止使用 console（部分例外）
3. **一致的引号**: 统一使用单引号
4. **分号**: 不使用分号
5. **缩进**: 使用 2 个空格缩进

### 代码审查

1. **功能正确性**: 代码是否实现了预期功能
2. **代码质量**: 代码是否符合规范
3. **性能**: 代码是否有性能问题
4. **可维护性**: 代码是否易于维护

## 开发流程

### 分支管理

1. **主分支**: `main` 分支为生产环境代码
2. **开发分支**: `dev` 分支为开发环境代码
3. **功能分支**: 从 `dev` 分支创建功能分支

### 提交规范

1. **提交信息**: 使用清晰的提交信息
2. **原子提交**: 每次提交只包含一个功能
3. **关联 Issue**: 提交信息关联相关 Issue

### 测试

1. **单元测试**: 为关键功能编写单元测试
2. **集成测试**: 编写集成测试确保功能正常
3. **端到端测试**: 使用 Playwright 编写端到端测试

## 工具链

### 开发工具

1. **Vite**: 开发服务器和构建工具
2. **TypeScript**: 类型检查
3. **ESLint**: 代码规范检查
4. **Prettier**: 代码格式化（可选）

### 构建流程

1. **开发模式**: `pnpm dev` 启动开发服务器
2. **构建**: `pnpm build` 构建生产版本
3. **类型检查**: `pnpm typecheck` 进行类型检查

## 最佳实践

### 代码组织

1. **按功能组织**: 按功能模块组织代码
2. **组件层级**: 合理控制组件层级深度
3. **文件大小**: 控制单个文件大小，避免过大

### 可访问性

1. **语义化 HTML**: 使用语义化的 HTML 标签
2. **键盘导航**: 支持键盘导航
3. **屏幕阅读器**: 支持屏幕阅读器

### 国际化

1. **文本抽取**: 将文本内容抽取到配置文件
2. **动态切换**: 支持语言动态切换
3. **格式化**: 支持日期、数字等格式化

## 参考资料

1. [Vue.js 官方文档](https://vuejs.org/)
2. [TypeScript 官方文档](https://www.typescriptlang.org/)
3. [Vite 官方文档](https://vitejs.dev/)
4. [Element Plus 官方文档](https://element-plus.org/)
