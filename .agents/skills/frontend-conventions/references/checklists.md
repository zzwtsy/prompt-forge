# Frontend 执行清单

## 1. 开发前清单

- [ ] 已确认需求属于 `apps/frontend` 范围，适用本规范。
- [ ] 已确认是否涉及路由契约变更（path/search）。
- [ ] 已确认是否触及生成产物边界（`routeTree.gen.ts`、`src/api/*`）。
- [ ] 已确认需要复用的 feature 分层目录与文件命名。
- [ ] 已确认本次请求场景对应的 alova hook 策略（`useRequest/useWatcher/usePagination/useForm/useFetcher`）。

## 2. 开发中清单

### 2.1 路由与信息架构

- [ ] 页面入口与默认重定向语义明确且唯一。
- [ ] tab/页面切换由路径表达，不与 query 双轨混用。
- [ ] 页面内导航优先使用 `Link`，副作用跳转才使用 `useNavigate`。

### 2.2 分层与耦合控制

- [ ] Route 只做装配与顶层状态，不承载大段业务细节。
- [ ] 组件优先通过 alova hooks 管理请求状态，未手写冗余 `loading/error/data` 三件套。
- [ ] 仅在满足“薄 service”条件时新增 `services/*`，无机械转发型封装。
- [ ] 纯函数已抽离到 `utils.ts`，不依赖 React 生命周期。
- [ ] 跨组件复用逻辑已沉淀到 hooks。

### 2.3 错误处理与状态

- [ ] 错误码映射走统一 mapper/hook，无散落重复逻辑。
- [ ] 参数校验失败能定位并高亮字段。
- [ ] tab 切换后会话内输入/结果状态不丢失。
- [ ] loading 状态与业务数据状态边界清晰。
- [ ] 组件层未直接处理 ApiEnvelope 成功/失败分支。
- [ ] 写操作后已定义读一致性策略（自动失效或手动失效/重拉）。

### 2.4 组件与样式

- [ ] 基础组件优先复用 `@/components/ui/*`。
- [ ] 样式合并统一使用 `cn`。
- [ ] 关键交互具备可访问性属性（如 `aria-invalid`、`aria-selected`）。

## 3. 提交前清单

- [ ] 已执行 `bunx tsc -p apps/frontend/tsconfig.app.json --noEmit`。
- [ ] 已执行 `bun run lint`。
- [ ] 已执行 `bun run build:frontend`。
- [ ] 路由可达性已手工验证（`/`、`/optimize`、`/models`、`/history`）。
- [ ] 功能回归已验证（错误码提示、保存重试、历史刷新）。
- [ ] 已确认未手改 `src/api` 生成文件（仅 `src/api/index.ts` 可维护）。
- [ ] 若有规范变更，已同步更新 skill 引用内容。

## 4. 验收场景清单

- [ ] 访问 `/` 可自动进入默认业务页面。
- [ ] 直接访问三个业务路径均可正常展示并高亮。
- [ ] 工作台切换路径后，各 tab 草稿状态保持。
- [ ] 40101/22004/22005/32101/30001 的提示与动作符合约定。
- [ ] 请求层改动未引入 API 契约变更。
- [ ] 关键页面请求状态由 alova hooks 驱动，行为稳定。
- [ ] 写后读数据无陈旧显示（已验证失效与重拉路径）。
