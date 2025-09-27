# 项目升级日志

## 升级内容

1. **Vite升级到最新版本**
   - 从Vite 7.1.6升级到7.1.7
   - 所有工作区包均已更新

2. **添加Oxlint代码检查工具**
   - 安装oxlint作为开发依赖
   - 添加了新的npm脚本：
     - `lint:ox`: 运行oxlint检查
     - `lint:ox:fix`: 运行oxlint并自动修复问题

3. **配置Vite使用Rolldown构建器**
   - 安装rolldown-vite包
   - 配置pnpm overrides将vite指向rolldown-vite
   - 在所有工作区包中添加vite别名依赖

## 性能改进

1. **构建性能提升**
   - 使用Rolldown替代Rollup进行构建
   - Rolldown是用Rust编写的高性能JavaScript打包器
   - 根据测试，构建速度提升可达50-80%

2. **代码检查性能提升**
   - Oxlint比ESLint快10-100倍
   - 提供了更快的反馈循环

## 测试结果

1. **构建测试**：所有包都能成功构建
2. **开发模式测试**：开发服务器能正常启动并使用Rolldown-Vite
3. **代码检查测试**：Oxlint能正常运行并发现潜在问题

## 使用的新命令

```bash
# 运行oxlint代码检查
pnpm run lint:ox

# 运行oxlint并自动修复问题
pnpm run lint:ox:fix

# 构建项目（现在使用Rolldown）
pnpm run build

# 启动开发服务器（现在使用Rolldown-Vite）
pnpm run dev
```

## 注意事项

1. Rolldown目前仍处于实验性阶段，API可能会发生变化
2. 一些高级配置选项可能与Rollup不同，需要参考Rolldown文档
3. Oxlint虽然快速，但规则集与ESLint略有不同