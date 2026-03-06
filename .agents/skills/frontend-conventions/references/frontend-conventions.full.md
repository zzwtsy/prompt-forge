# Frontend 开发规范

- 版本：`v1.5`
- 同步日期：`2026-03-06`
- 对齐基线：`apps/frontend` 当前技术栈（React 19 + TanStack Router + Alova + Tailwind v4 + shadcn/ui）

## 目录

- [文档定位](#full-positioning)
- [1. 路由规范（TanStack Router）](#full-router)
- [2. 页面解耦与目录分层规范](#full-layering)
- [3. Alova 与 ApiEnvelope 规范](#full-api)
- [4. 状态管理与会话保留规范](#full-state)
- [5. React Context 规范](#full-context)
- [6. 组件与样式规范](#full-ui)
- [7. 质量门槛与验证命令](#full-quality)
- [8. PR 与评审关注点](#full-review)

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
- `routes/*` 统一采用“薄壳路由”：只负责路由契约、守卫、页面装配，不承载业务实现细节。

薄壳路由允许项：

- `createFileRoute` 路由定义。
- `beforeLoad`、`loader`、`validateSearch`、`redirect` 等路由契约能力。
- 通过 import 引用 `@/page/{module}` 的页面入口组件并完成装配。

薄壳路由禁止项：

- route 文件内实现业务表单、列表等 JSX 细节。
- route 文件内直接调用 `Apis.*`。
- route 文件内堆叠领域状态机、复杂业务编排逻辑。

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
  components/                # 全局共享组件（含 ui 基础组件）
  hooks/                     # 全局共享 hooks
  store/                     # 全局共享 Zustand store（统一入口）
  lib/                       # 全局共享工具函数
  page/{module}/
    {module}.page.tsx        # 模块页面入口（页面编排）
    components/              # 模块私有组件
    hooks/                   # 模块私有 hooks
    services/                # 模块请求层（薄 service）
    types.ts                 # 模块类型
    constants.ts             # 模块常量
    {module}.util.ts         # 工具较少时单文件
    utils/                   # 工具较多时目录化拆分
    index.ts                 # 模块公共导出
  routes/                    # 文件路由（薄壳）
```

分层职责：

- Route 层：只负责路由契约、守卫和页面装配。
- Page 层：模块入口与页面编排，组合私有组件、hooks 与 service。
- Component 层：只处理视图、用户交互、局部状态。
- Hook 层：封装跨组件复用的状态机、错误分发、派生逻辑。
- Service 层：仅在满足“薄封装”条件时存在（参数归一化、多端点编排、跨页面复用、领域语义封装）。
- Utils 层：保持纯函数，不依赖 React 生命周期。

禁止项：

- 在单个 route 文件中同时堆叠路由、API 调用、领域类型和通用工具函数。
- 在 JSX 事件处理器里直接写 `Apis.*.send()`（应通过 alova hooks 触发请求）。

### 2.1 存量过渡策略

- 禁止新增 `src/features/**`。
- 允许对遗留 `src/features/**` 做 bugfix 和小范围维护。
- 新增需求与重构后的模块统一落到 `src/page/**`。

### 2.2 Hook 分级规范（新增）

- `Page orchestration hook`：页面业务编排入口，负责请求编排、错误分发、跨组件状态协同与副作用触发。
- `Section hook`：页面子域编排单元，负责某个业务区块的状态机与动作集合，可由 Page 统一组合。
- `Component-local hook`：组件私有交互逻辑（展开、输入草稿、局部派生），不承载跨组件业务编排。

默认策略：

- 请求编排、错误处理、跨组件共享状态协同优先放在 `Page orchestration hook` 或 `Section hook`。
- 组件层允许使用 hook，但应以局部 UI 状态和纯展示派生为主。
- 组件直接承载跨组件业务编排（含多端点请求链路）属于高风险实现，需在 PR 中给出豁免说明。

### 2.3 组件与 Hook 拆分触发阈值（新增）

- 组件拆分触发：单文件 `>200` 行，或包含 `>=3` 独立业务区块，或同时承担“布局 + 业务分发 + 复杂条件渲染”。
- Hook 拆分触发：单文件 `>180` 行，或异步动作 `>4` 个，或同时承担“请求编排 + 校验 + 派生 + 副作用通知”。
- 触发阈值后未拆分并非绝对禁止，但必须在 PR 描述中写明保留理由与后续治理计划。

### 2.4 `xxx-content` 容器策略（新增）

- `content container` 保留条件：承担多个区块聚合、跨区块 props 映射或统一布局编排价值。
- 可去除条件：仅一层透传、无布局与编排增益，可直接内联到 `.page.tsx`。
- 命名建议：保留时使用 `{module}-content.tsx`，并保持该组件“装配优先、业务最小化”的边界。

<a id="full-api"></a>

## 3. Alova 与 ApiEnvelope 规范

统一约束：

- API 类型来源于 `apps/frontend/src/api/*` 生成文件；业务代码统一从 `@/api` 消费 `Apis`。
- 仅 `apps/frontend/src/api/index.ts` 可维护；`src/api` 其余文件为生成产物，禁止手改。
- `ApiEnvelope` 统一在 alova 全局 `responded` 中解包，并在失败时抛出 `ApiEnvelopeError`。
- 组件/页面层禁止处理 envelope 的 `success` 分支与 `error` 分支。
- 模块请求封装统一放在 `page/{module}/services`，并遵守“薄 service”边界。

### 3.1 Hook 优先级矩阵（React）

- 首屏加载、手动重试、按钮触发请求：`useRequest`。
- 依赖条件变化自动重拉：`useWatcher`（首次拉取需显式 `immediate: true`）。
- 列表分页/加载更多：`usePagination`。
- 表单提交与提交流程状态：`useForm` 或 `useRequest({ immediate: false })`。
- 跨组件静默刷新：`useFetcher`。

工程要求：

- Page/Section hook 优先使用 alova hooks 管理业务请求状态；组件仅在局部独立请求场景使用 alova hooks。
- 非 React 组件上下文（例如工具脚本、单次副作用流程）才允许直接 `await method` 或 `method.send()`。

### 3.2 薄 Service 边界（MUST）

满足以下任一条件才允许新增 service：

- 该请求逻辑会在 2 个及以上组件复用。
- 需要参数归一化、响应结构转换、方法工厂聚合。
- 需要跨端点编排（串并行请求、先决请求）。
- 需要沉淀领域语义（例如统一业务动作入口）。

禁止项：

- 将单个接口机械包装成“仅转发”的样板 service。
- 在 service 中重复实现与页面无关的通用错误提示逻辑。

### 3.3 缓存与一致性（保持 alova 默认缓存）

- 默认保持 alova 缓存行为，不做全局禁用。
- 写操作后必须定义一致性策略：优先 `hitSource` 自动失效，其次手动失效/重拉。
- 强一致场景必须显式绕过缓存或强制重取，不能依赖默认命中。
- 跨组件请求状态同步优先使用 alova 提供的缓存/动作机制，避免引入额外全局状态重复管理。

### 3.4 错误处理链路

- `responded` 抛出的业务错误统一进入 `normalizeClientError`。
- 业务错误码映射统一放在共享 mapper/hook（如 `useRequestError`），禁止在页面散落重复判定。

错误处理约定：

- `40101`：登录失效提示。
- `22004`：默认模型不可用，提供跳转模型设置动作。
- `22005`：服务商 key 未配置，提供跳转模型设置动作。
- `32101`：保存草稿失效提示。
- `30001`：参数校验失败提示，并透传字段高亮回调。

### 3.5 异步竞态与取消策略（新增）

- 对同一资源的重复请求必须定义竞态策略（`latest-wins`、显式取消、或忽略过期响应）。
- 请求参数变化导致重拉时，应避免旧响应覆盖新状态。
- 写后读链路需明确刷新时机和并发行为，避免“后发先至”造成状态回滚。
- 涉及刷新 token 的场景必须说明触发源、消费方与幂等保证。

常见坑：

- `useWatcher` 首参数必须是返回 Method 的函数，不能直接传 Method 实例。
- `useWatcher` 默认不会首次请求，需显式设置 `immediate: true`。
- alova v3 的缓存操作按异步处理，调用方需等待完成后再依赖结果。
- `updateState` 仅在拥有该状态的组件仍处于 mounted 时生效。

<a id="full-state"></a>

## 4. 状态管理与会话保留规范

统一约束：

- 同一工作台跨 tab 共享状态放在 pathless 父路由。
- 全局共享 Zustand store 统一放在 `src/store/**`。
- store 消费统一使用 `@/store` 入口。
- 禁止新增 `src/lib/store/**`。
- `src/lib/**` 保持工具函数与跨域能力定位，不再承载 store 容器。
- tab 组件默认保持 mounted，通过显隐切换而非条件卸载，确保会话内输入不丢失。
- URL 负责“当前页面位置”，业务草稿状态由内存态管理。
- 请求 loading 状态与业务内容状态分离，避免隐式耦合。

推荐实践：

- `useMemo` 只用于可证明有收益的派生数据。
- 对集合型异步状态（如操作中的 id 集）使用 `Set`，更新时创建新实例保证响应性。
- 需要重刷子页面时使用显式 token（如 `refreshToken`）而非隐式副作用。

### 4.1 Tab mounted 例外策略（新增）

- 默认保留 mounted，不作为性能问题的唯一解决手段。
- 当 tab 内容存在高内存或高计算负载时，可采用 lazy mount + 草稿持久化 + 恢复策略。
- 采用 lazy mount 时需补充回归验证：切换后输入、结果、错误高亮与进行中状态不丢失。

<a id="full-context"></a>

## 5. React Context 规范

### 5.1 使用边界（MUST）

- Context 仅用于跨页面/跨模块共享、更新频率低或中等的状态（如认证、主题、全局配置）。
- 高变更频率状态（输入框实时值、滚动位移、动画帧状态）禁止放入 Context。
- 请求数据状态优先使用 Alova hooks；Context 仅承载跨组件共享的会话级派生状态。

### 5.2 目录与命名（MUST）

- 全局 Context 放在 `src/lib/context/{domain}/`。
- 页面私有 Context 放在 `src/page/{module}/context/`。
- 文件拆分职责：
  - `xxx-context.ts`：`createContext` 与类型定义。
  - `xxx-provider.tsx`：仅 Provider 组件。
  - `use-xxx.ts`：消费 hook。

### 5.3 API 设计（MUST）

- Context 声明统一使用 `createContext<T | null>(null)`。
- 统一通过 `useXxx` 暴露消费入口，业务代码禁止直接消费原 Context 对象。
- `useXxx` 在无 Provider 时必须抛出明确错误信息。

### 5.4 React 19 风格（项目默认）

- 主推 `use(Context)` 与 `<Context value={value}>`。
- 允许 `useContext`/`<Context.Provider>` 作为兼容写法，但规范示例统一使用 React 19 风格。

### 5.5 性能与拆分（MUST/SHOULD）

- Provider 的 `value` 必须 `useMemo` 稳定化。
- 下发给子组件的函数必须 `useCallback` 稳定化。
- 高频更新或大对象场景建议按需拆分 `StateContext + ActionsContext`，降低无关重渲染。

### 5.6 与现有规范联动

- Route 薄壳不承载 Context 业务实现细节，仅消费已装配的快照（如 auth snapshot）。
- 错误链路保持 `normalizeClientError`，Context 不重复实现错误提示分发逻辑。

禁止项：

- Provider 文件同时导出非组件函数（规避 `react-refresh/only-export-components` 风险）。
- 在多个页面重复创建语义相同的全局 Context。

<a id="full-ui"></a>

## 6. 组件与样式规范

统一约束：

- 优先复用 `@/components/ui/*`（shadcn/ui）作为基础组件。
- 类名合并统一使用 `cn`，避免字符串拼接样式分叉。
- 文本、占位符、按钮文案保持中文语义稳定。
- Tailwind 样式按“布局 -> 间距 -> 视觉”顺序组织，减少审查成本。

可访问性要求：

- icon-only 按钮必须有可读文案或可访问替代信息。
- 表单字段错误状态通过 `aria-invalid` 暴露。
- tab 导航需提供 `aria-selected` 等基础语义。
- 关键交互必须支持键盘操作（Tab/Enter/Escape）并具备可见焦点状态。
- 动态反馈（提交结果、错误提示）应在必要时提供 `aria-live` 语义。
- 表单控件应具备可关联标签（`label`/`htmlFor` 或等价语义）。

<a id="full-quality"></a>

## 7. 质量门槛与验证命令

基础门槛：

- TypeScript 严格模式通过。
- ESLint 通过。
- 前端构建通过。
- 关键主流程（如提交、保存、重试）具备最小自动化测试（hook/组件/集成任一层级）。
- 关键纯函数具备最小单测。
- 手工验收可作为补充，但不可替代关键主流程自动化测试。

推荐命令：

```bash
bunx tsc -p apps/frontend/tsconfig.app.json --noEmit
bun run lint
bun run build:frontend
```

<a id="full-review"></a>

## 8. PR 与评审关注点

评审优先级：

1. 是否消除高耦合（路由/请求/状态/纯函数是否解耦）。
2. 是否保持 API 契约与错误码行为稳定。
3. 是否出现隐藏回归（tab 切换丢状态、错误提示动作失效）。
4. 是否触碰生成文件边界与仓库禁改规则。
5. 是否附带清晰验证步骤与关键场景结果。

常见高风险信号：

- 单文件超过千行且同时包含多域状态和多类 API 调用。
- 组件超过拆分阈值却仍持续堆叠业务逻辑且无豁免说明。
- Hook 超过拆分阈值且混合多类职责（请求编排、校验、副作用）未拆分。
- `xxx-content` 仅做一层透传却长期保留，造成额外心智负担。
- 相同错误码逻辑在多个组件重复实现。
- 通过 query 和 path 双轨维护同一 UI 状态。
- 新增功能未进入 `src/page/**`，而是继续扩展 `src/features/**`。
