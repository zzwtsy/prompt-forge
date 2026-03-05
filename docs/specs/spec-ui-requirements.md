# UI 需求文档（Prompt Forge）

- 版本：`v1.2`
- 日期：`2026-03-05`
- 适用范围：`apps/frontend` 前端页面与交互实现；涉及的后端接口联动约束

## 1. 来源对齐说明

- 本文档用于沉淀 UI 实现规格，避免与产品总需求混杂。
- 本文档与 [spec-product-requirements.md](./spec-product-requirements.md) 对齐，不替代产品需求文档。
- 本文档是 UI 交付规格，按“当前代码基线 + 目标实现”双视角描述。
- 历史搜索扩展能力依赖 [spec-extension-history-search.md](./spec-extension-history-search.md) 的增量定义。

## 2. 背景与目标

- 项目面向单人使用场景，提供提示词评估、提示词优化、模型配置、历史查看的完整前端闭环。
- 前端目标是以单页三标签工作台承载核心流程：
  - `提示词优化`：完成评估与优化主链路。
  - `模型设置`：完成默认模型、服务商、模型可用性管理。
  - `历史记录`：完成优化结果检索、查看、复制。

## 3. 技术栈与实现边界

### 3.1 技术栈约束

- 前端技术栈：`React 19 + Vite + TanStack Router + Alova + Tailwind CSS v4 + shadcn/ui`。
- 路由机制：使用 TanStack Router 文件路由，路由树由插件自动生成。
- API 类型来源：由 Alova 根据后端 OpenAPI 文档生成。

### 3.2 当前实现基线（避免误读为已实现）

- 当前 `apps/frontend` 仍是模板态，仅存在 `/` 路由与 Home 占位页面。
- 本文档描述的是 `apps/frontend` 目标交付态，不代表当前页面已完成。

### 3.3 生成产物与工程规则

- 下列文件/目录为生成产物，不允许手改：
  - `apps/frontend/src/routeTree.gen.ts`
  - `apps/frontend/src/api/*`（除 `index.ts` 外）
- 后端 OpenAPI 契约变化后，统一执行 `bun run gen:api` 刷新前端 API 类型。

### 3.4 工程目录约束

- 跨页面共享会话状态统一放在 `apps/frontend/src/store`。
- `apps/frontend/src/lib` 用于工具与跨模块复用能力，不作为 store 容器。

## 4. TanStack Router 约束下的信息架构

- 页面顶层结构：`Header + Tabs + TabPanel`。
- Tabs 固定三项：`提示词优化`、`模型设置`、`历史记录`。
- Tabs 视觉要求：整体胶囊长条（矩形主体 + 左右半圆端点），居中，非分离式按钮组。
- 默认页签：`提示词优化`。

### 4.1 强制路由状态

- 页面路由采用“路径表达 tab”方案：
  - `/optimize`：提示词优化
  - `/models`：模型设置
  - `/history`：历史记录
- 根路径 `/` 必须重定向到 `/optimize`。
- 不再使用 `tab` query 维护页签状态。

### 4.2 响应式与状态保留

- 响应式：
  - 桌面端优先双列/分区展示。
  - 移动端自动改为纵向堆叠。
- 状态保留规则：
  - URL 仅表达当前路径（`/optimize | /models | /history`）。
  - Tab 切换不清空当前会话内输入与结果状态。
  - 刷新后仅恢复当前路径对应页面，不恢复未持久化的评估/优化结果（本期不引入 localStorage 持久化）。

## 5. 鉴权与请求传输前置条件（P0）

### 5.1 鉴权前置条件

- 模型设置、评估/优化、历史记录相关业务接口均要求登录态。
- `401` 在前端语义上属于“前置条件失败”（会话无效/缺失），不是业务流程异常。
- 前端需提供统一登录失效提示，并引导用户重新登录后重试。

### 5.2 统一响应契约（ApiEnvelope）

- 成功响应：

```ts
{ success: true; data: T; requestId?: string }
```

- 失败响应：

```ts
{ success: false; error: { code: number; message: string; details?: unknown }; requestId?: string }
```

- 前端必须统一解析 `success` 字段，不得仅依赖 HTTP 状态做业务判断。

### 5.3 本地联调传输策略

- 固定联调方式：`Vite` 配置 `/api` 代理到 `http://localhost:3001`。
- 会话策略：请求需携带认证 cookie（与 Better Auth 会话机制一致）。
- 采用该策略的原因：当前 `alova` 默认 `baseURL=""`，若不配置代理，前后端跨端口联调不稳定。

## 6. 提示词优化页面

### 6.1 布局顺序

1. `原始提示词`输入框（多行）。
2. `评估模型`与`优化模型`两个选择区。
3. 每个模型选择区下提供参数：`temperature`。
4. 操作区按钮：`评估`、`优化`。
5. `评估结果`面板（含复制）。
6. `优化结果`面板（含复制、条件保存）。

### 6.2 字段与行为规则

- `原始提示词`为空时：`评估`按钮禁用。
- 无评估结果时：`优化`按钮禁用。
- 请求进行中：对应按钮禁用，防止重复提交。
- 模型下拉必须支持：`使用默认模型（不传 modelId）`。
- 参数约束：
  - `temperature`：`0 ~ 2`。

### 6.3 结果与复制

- `评估结果`面板提供`复制`按钮，复制完整评估文本。
- `优化结果`面板提供`复制`按钮，复制完整优化文本。

### 6.4 保存策略（自动保存失败兜底）

- 优化成功后先依赖后端自动保存。
- 仅当满足以下条件时，展示可点击`保存`按钮：
  - `persistence.saved=false`
  - `persistence.retryable=true`
  - `persistence.saveDraft` 存在
- `保存`按钮点击后调用 `POST /api/saved-prompts/retry`。
- 重试保存成功后，清理本次 `saveDraft` 本地状态，并将`保存`按钮置为不可点击/不再展示可点击态。

### 6.5 请求与响应映射

- 评估：`POST /api/prompt/evaluate`
  - 请求体：`prompt`、`modelId?`、`temperature?`。
- 优化：`POST /api/prompt/optimize`
  - 请求体：`prompt`、`evaluationResult?`、`modelId?`、`temperature?`、`evaluateContext?`。
  - 若已有评估执行记录，应传 `evaluateContext` 以保留追溯信息。
  - 响应体关键字段：`optimizedPrompt`、`resolvedModel`、`promptRunId`、`savedPromptId`、`persistence`。

## 7. 模型设置页面

### 7.1 页面分区

1. 顶部：`默认模型设置`面板
    - `默认评估模型`
    - `默认优化模型`
2. 下方：`服务商设置`面板（左右双栏）
    - 左侧：服务商列表
    - 右侧：服务商详细设置

### 7.2 左侧服务商列表规则

- 顶部提供`添加自定义服务商`按钮。
- 列表排序统一为：已启用服务商优先，其次按名称升序。
- 点击某服务商后，右侧加载对应详细设置。

### 7.3 右侧详细设置规则

- 首次进入页面时，默认显示排序后的第一个服务商详情。
- 顶部展示服务商名称与启用开关。
- 基础配置项：
  - `API Key`
  - `BaseURL`
- 模型管理区：
  - 顶部操作：`模型搜索框`、`获取模型列表`、`手动添加模型`。
  - 列表排序统一为：已启用模型优先，其次按模型名称升序。
  - 每个模型项提供启用开关。

### 7.4 请求映射

- 读取服务商与模型：`GET /api/providers`
- 新增兼容服务商：`POST /api/providers/openai-compatible`
- 更新服务商：`PUT /api/providers/{providerId}`
- 同步模型：`POST /api/providers/{providerId}/models/sync`
- 手动新增模型：`POST /api/models`
- 更新模型状态/显示名：`PUT /api/models/{modelId}`
- 读取默认模型：`GET /api/model-defaults`
- 更新默认模型：`PUT /api/model-defaults`

## 8. 历史记录页面

### 8.1 展示与交互

- 顶部提供搜索框，用于搜索相关提示词。
- 列表项应显示：
  - 保存日期时间
  - 优化后提示词摘要
  - `复制`按钮
- 点击列表项时，展示完整提示词内容。
- “完整提示词”在本期定义为：`优化后完整提示词`（`optimizedPrompt`）。

### 8.2 当前契约模式（现状）

- `GET /api/saved-prompts` 当前查询参数：`{ limit?: number; cursor?: string }`。
- 列表分页使用 `cursor` 机制。
- 本模式下搜索仅能用于“已加载列表”的本地筛选。

### 8.3 扩展契约模式（目标）

- 扩展目标：`GET /api/saved-prompts` 支持 `query?` 参数。
- 目标查询参数：`{ limit?: number; cursor?: string; query?: string }`。
- 搜索目标字段为 `optimizedPrompt`。
- 该能力依赖 [spec-extension-history-search.md](./spec-extension-history-search.md) 落地。

### 8.4 降级触发与退出条件

- 降级触发：后端环境未支持 `query` 时，启用“已加载列表本地筛选”。
- 降级退出：后端支持 `query` 且前端 API 类型更新后，必须切回服务端搜索。
- 服务端搜索模式下，搜索词变化必须重置 `cursor` 并从第一页重新请求。

## 9. 全局状态与错误处理规则

### 9.1 加载态

- 页面初始化加载 providers/defaults/history 时显示 loading。
- 操作按钮在请求中进入 loading + disabled。

### 9.2 错误态（细化到错误码）

- `40101`（未认证或登录失效）：提示登录失效并引导重新登录。
- `22004`（默认模型不可用）：提示并引导至`模型设置`修复默认模型。
- `22005`（服务商 API Key 未配置）：提示并引导至`模型设置`补齐密钥。
- `32101`（保存草稿无效或过期）：提示“需重新执行优化后再保存”。
- `30001`（请求参数校验失败）：提示输入参数不合法并高亮对应字段。

### 9.3 状态保留

- 切换 tabs 不清空当前会话内输入与结果状态。
- 当前 tab 通过 URL 路径持久化。
- 跨页面共享会话状态统一由 `apps/frontend/src/store` 承载，避免与 `src/lib` 职责混用。

## 10. API 映射与接口约束

### 10.1 直接复用的现有接口

- `POST /api/prompt/evaluate`
- `POST /api/prompt/optimize`
- `POST /api/saved-prompts/retry`
- `GET /api/providers`
- `POST /api/providers/openai-compatible`
- `PUT /api/providers/{providerId}`
- `POST /api/providers/{providerId}/models/sync`
- `POST /api/models`
- `PUT /api/models/{modelId}`
- `GET /api/model-defaults`
- `PUT /api/model-defaults`
- `GET /api/saved-prompts`

### 10.2 `GET /api/saved-prompts` 参数契约分层

- 当前契约（已实现）：`params: { limit?: number; cursor?: string }`
- 扩展契约（目标态）：`params: { limit?: number; cursor?: string; query?: string }`

### 10.3 前端调用契约

- 统一遵循 `ApiEnvelope`：
  - 成功：`{ success: true; data: T; requestId?: string }`
  - 失败：`{ success: false; error: { code: number; message: string; details?: unknown }; requestId?: string }`

### 10.4 路由路径契约

- `/`：重定向到 `/optimize`
- `/optimize`：提示词优化页
- `/models`：模型设置页
- `/history`：历史记录页
- 不提供 `/?tab=*` 兼容映射。

## 11. 验收测试清单

1. 直接访问 `/optimize`、`/models`、`/history` 可正确落位对应页签。
2. 访问 `/` 时自动重定向到 `/optimize`。
3. 访问 `/?tab=models` 不进入 query 分流逻辑，按根路由策略进入 `/optimize`。
4. 原始提示词为空时，`评估`按钮禁用。
5. 无评估结果时，`优化`按钮禁用。
6. 评估成功后可复制评估结果全文。
7. 优化成功后可复制优化结果全文。
8. 自动保存成功时，`保存`按钮不可用或不展示可点击态。
9. 优化返回 `persistence.saved=false` 时，展示可点击`保存`入口。
10. 重试保存成功后，`保存`入口消失且 `saveDraft` 本地状态被清理。
11. 模型设置页面首屏默认展示第一个服务商详情。
12. 服务商列表排序满足“启用优先 + 名称升序”。
13. 模型列表排序满足“启用优先 + 名称升序”。
14. 默认评估模型与默认优化模型设置成功后可回显。
15. 未登录访问业务接口时触发统一登录失效提示与引导。
16. 历史列表在“当前契约模式”只用 `limit/cursor` 仍可分页。
17. 历史列表在“扩展契约模式”中，`query` 变化会重置分页并从第一页请求。
18. 后端未支持 `query` 时，前端降级本地过滤并给出明确提示。
19. 接口代码生成后（`bun run gen:api`），业务代码不依赖手写 API 类型。

## 12. 假设与默认值

- 默认采用多路由路径方案：`/optimize | /models | /history`。
- 默认不提供旧 `/?tab=*` 兼容映射。
- 默认将“登录态”定义为 UI 执行前置条件；保留“单人使用”定位，但不再等同“无登录”。
- 默认将 `query` 搜索作为扩展能力管理：本主文档记录“现状 + 目标”，详细规则以扩展文档为准。
