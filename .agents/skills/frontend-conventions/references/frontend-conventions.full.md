# Frontend 开发规范

- 版本：`v1.0`
- 同步日期：`2026-03-02`
- 对齐基线：`apps/frontend` 当前技术栈（React 19 + TanStack Router + Alova + Tailwind v4 + shadcn/ui）

## 目录

- [文档定位](#full-positioning)
- [1. 路由规范（TanStack Router）](#full-router)
- [2. 页面解耦与目录分层规范](#full-layering)
- [3. Alova 与 ApiEnvelope 规范](#full-api)
- [4. 状态管理与会话保留规范](#full-state)
- [5. 组件与样式规范](#full-ui)
- [6. 质量门槛与验证命令](#full-quality)
- [7. PR 与评审关注点](#full-review)

<a id="full-positioning"></a>

## 文档定位

- 本文档用于约束 `apps/frontend` 工程实现方式，目标是降低耦合、提升可维护性与回归可控性。
- 本文档是前端工程约定，不直接替代产品需求文档。
- 规范优先级：若与仓库顶层约束冲突，以 `AGENTS.md` 为准。

<a id="full-router"></a>

## 1. 路由规范（TanStack Router）

统一约束：

- 使用 TanStack Router 文件路由，路径语义优先于 query 驱动 tab。
- 默认入口由根路由重定向到业务主路径（示例：`/ -> /optimize`）。
- 多 tab 工作台优先采用 pathless 父路由承载共享状态，子路由仅表达 URL。
- 页面内导航优先使用 `Link`，仅在副作用跳转时使用 `useNavigate`。
- 搜索参数属于用户输入，必须在 `validateSearch` 校验（仅当该页面确实使用 search 参数时）。

推荐路径形态：

- `/optimize`
- `/models`
- `/history`

禁止项：

- 在业务页面中混用“路径切换 + query tab 切换”双路由语义。
- 在组件中直接读取 `window.location` 并手动解析参数。

<a id="full-layering"></a>

## 2. 页面解耦与目录分层规范

建议分层：

```text
src/
  routes/                    # 路由壳与装配
  features/{domain}/
    components/              # 纯展示+交互组件
    hooks/                   # 领域级 hooks（状态编排/错误映射）
    services/                # 请求封装（调用 Apis）
    types.ts                 # 领域类型
    constants.ts             # 领域常量
    utils.ts                 # 纯函数
```

分层职责：

- Route 层：只负责路由定义、页面装配、顶层共享状态。
- Component 层：只处理视图、用户交互、局部状态。
- Hook 层：封装跨组件复用的状态机、错误分发、派生逻辑。
- Service 层：唯一允许出现 `Apis.*` 的位置。
- Utils 层：保持纯函数，不依赖 React 生命周期。

禁止项：

- 在单个 route 文件中同时堆叠路由、API 调用、领域类型、通用工具函数。
- 在 JSX 事件处理器里直接写 `Apis.*.send()`。

<a id="full-api"></a>

## 3. Alova 与 ApiEnvelope 规范

统一约束：

- API 类型来源于 `apps/frontend/src/api/*` 生成文件；业务代码只消费 `index.ts` 导出的 `Apis`。
- 统一在 service 层调用 `Apis`，并通过 `unwrapApiEnvelope` 解包。
- 组件层禁止直接处理 envelope 成功/失败分支。
- 错误处理统一通过共享 mapper/hook（例如 `useRequestError`）完成，避免散落判定。

错误处理约定：

- `40101`：登录失效提示。
- `22004`：默认模型不可用，提供跳转模型设置动作。
- `22005`：服务商 key 未配置，提供跳转模型设置动作。
- `32101`：保存草稿失效提示。
- `30001`：参数校验失败提示，并透传字段高亮回调。

<a id="full-state"></a>

## 4. 状态管理与会话保留规范

统一约束：

- 同一工作台跨 tab 共享状态放在 pathless 父路由。
- tab 组件默认保持 mounted，通过显隐切换而非条件卸载，确保会话内输入不丢失。
- URL 负责“当前页面位置”，业务草稿状态由内存态管理。
- 请求 loading 状态与业务内容状态分离，避免隐式耦合。

推荐实践：

- `useMemo` 只用于可证明有收益的派生数据。
- 对集合型异步状态（如操作中的 id 集）使用 `Set`，更新时创建新实例保证响应性。
- 需要重刷子页面时使用显式 token（如 `refreshToken`）而非隐式副作用。

<a id="full-ui"></a>

## 5. 组件与样式规范

统一约束：

- 优先复用 `@/components/ui/*`（shadcn/ui）作为基础组件。
- 类名合并统一使用 `cn`，避免字符串拼接样式分叉。
- 文本、占位符、按钮文案保持中文语义稳定。
- Tailwind 样式按“布局 -> 间距 -> 视觉”顺序组织，减少审查成本。

可访问性要求：

- icon-only 按钮必须有可读文案或可访问替代信息。
- 表单字段错误状态通过 `aria-invalid` 暴露。
- tab 导航需提供 `aria-selected` 等基础语义。

<a id="full-quality"></a>

## 6. 质量门槛与验证命令

基础门槛：

- TypeScript 严格模式通过。
- ESLint 通过。
- 前端构建通过。
- 关键纯函数具备最小单测或至少具备可复现的验收步骤。

推荐命令：

```bash
bunx tsc -p apps/frontend/tsconfig.app.json --noEmit
bun run lint
bun run build:frontend
```

<a id="full-review"></a>

## 7. PR 与评审关注点

评审优先级：

1. 是否消除高耦合（路由/请求/状态/纯函数是否解耦）。
2. 是否保持 API 契约与错误码行为稳定。
3. 是否出现隐藏回归（tab 切换丢状态、错误提示动作失效）。
4. 是否触碰生成文件边界与仓库禁改规则。
5. 是否附带清晰验证步骤与关键场景结果。

常见高风险信号：

- 单文件超过千行且同时包含多域状态和多类 API 调用。
- 相同错误码逻辑在多个组件重复实现。
- 通过 query 和 path 双轨维护同一 UI 状态。
