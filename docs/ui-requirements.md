# UI 需求文档（Prompt Forge）

- 版本：`v1`
- 日期：`2026-03-02`
- 适用范围：`apps/frontend` 前端页面与交互实现；涉及的后端接口联动约束

## 1. 来源对齐说明

- 本文档用于沉淀 UI 实现规格，避免与产品总需求混杂。
- 本文档与 [requirements.md](/home/vscode/prompt-forge/docs/requirements.md) 对齐，不替代产品需求文档。
- 本文档不修改 [requirements.md](/home/vscode/prompt-forge/docs/requirements.md) 既有内容。

## 2. 背景与目标

- 项目面向单人使用场景，提供提示词评估、提示词优化、模型配置、历史查看的完整前端闭环。
- 前端目标是以单页三标签工作台承载核心流程：
  - `提示词优化`：完成评估与优化主链路。
  - `模型设置`：完成默认模型、服务商、模型可用性管理。
  - `历史记录`：完成优化结果检索、查看、复制。

## 3. 页面信息架构

- 页面顶层结构：`Header + Tabs + TabPanel`。
- Tabs 固定三项：`提示词优化`、`模型设置`、`历史记录`。
- Tabs 视觉要求：整体胶囊长条（矩形主体 + 左右半圆端点），居中，非分离式按钮组。
- 默认页签：`提示词优化`。
- 建议路由状态：`?tab=optimize|models|history`，用于刷新后保留当前页签。
- 响应式要求：
  - 桌面端优先双列/分区展示。
  - 移动端自动改为纵向堆叠。

## 4. 提示词优化页面

### 4.1 布局顺序

1. `原始提示词`输入框（多行）。
2. `评估模型`与`优化模型`两个选择区。
3. 每个模型选择区下分别提供参数：`temperature`、`maxTokens`。
4. 操作区按钮：`评估`、`优化`。
5. `评估结果`面板（含复制）。
6. `优化结果`面板（含复制、条件保存）。

### 4.2 字段与行为规则

- `原始提示词`为空时：`评估`按钮禁用。
- 无评估结果时：`优化`按钮禁用。
- 请求进行中：对应按钮禁用，防止重复提交。
- 模型下拉必须支持：`使用默认模型（不传 modelId）`。
- 参数约束：
  - `temperature`：`0 ~ 2`。
  - `maxTokens`：正整数。

### 4.3 结果与复制

- `评估结果`面板提供`复制`按钮，复制完整评估文本。
- `优化结果`面板提供`复制`按钮，复制完整优化文本。

### 4.4 保存策略（自动保存失败兜底）

- 优化成功后先依赖后端自动保存。
- 仅当返回 `optimize.persistence.saved=false` 且 `retryable=true` 且 `saveDraft` 存在时，显示可点击`保存`按钮。
- `保存`按钮点击后调用 `POST /api/saved-prompts/retry`。
- 重试保存成功后，清理本次 `saveDraft` 本地状态，并将`保存`按钮置为不可点击/不再展示可点击态。

### 4.5 请求映射

- 评估：`POST /api/prompt/evaluate`
  - 请求体：`prompt`、`modelId?`、`temperature?`、`maxTokens?`。
- 优化：`POST /api/prompt/optimize`
  - 请求体：`prompt`、`evaluationResult?`、`modelId?`、`temperature?`、`maxTokens?`、`evaluateContext?`。
  - 若已有评估执行记录，应传 `evaluateContext` 以保留追溯信息。

## 5. 模型设置页面

### 5.1 页面分区

1. 顶部：`默认模型设置`面板

    - `默认评估模型`
    - `默认优化模型`

2. 下方：`服务商设置`面板（左右双栏）

    - 左侧：服务商列表
    - 右侧：服务商详细设置

### 5.2 左侧服务商列表规则

- 顶部提供`添加自定义服务商`按钮。
- 列表排序统一为：已启用服务商优先，其次按名称升序。
- 点击某服务商后，右侧加载对应详细设置。

### 5.3 右侧详细设置规则

- 首次进入页面时，默认显示排序后的第一个服务商详情。
- 顶部展示服务商名称与启用开关。
- 基础配置项：
  - `API Key`
  - `BaseURL`
- 模型管理区：
  - 顶部操作：`模型搜索框`、`获取模型列表`、`手动添加模型`。
  - 列表排序统一为：已启用模型优先，其次按模型名称升序。
  - 每个模型项提供启用开关。

### 5.4 请求映射

- 读取服务商与模型：`GET /api/providers`
- 新增兼容服务商：`POST /api/providers/openai-compatible`
- 更新服务商：`PUT /api/providers/{providerId}`
- 同步模型：`POST /api/providers/{providerId}/models/sync`
- 手动新增模型：`POST /api/models`
- 更新模型状态/显示名：`PUT /api/models/{modelId}`
- 读取默认模型：`GET /api/model-defaults`
- 更新默认模型：`PUT /api/model-defaults`

## 6. 历史记录页面

### 6.1 展示与交互

- 顶部提供搜索框，用于搜索相关提示词。
- 列表项应显示：
  - 保存日期时间
  - 优化后提示词摘要
  - `复制`按钮
- 点击列表项时，展示完整提示词内容。
- “完整提示词”在本期定义为：`优化后完整提示词`（`optimizedPrompt`）。

### 6.2 分页与搜索

- 列表分页使用 `cursor` 机制。
- 搜索目标字段为 `optimizedPrompt`。
- 本期目标方案：后端关键词搜索（见第 8 章新增接口约束）。
- 临时降级策略：
  - 若后端 `query` 参数暂未就绪，允许仅对“已加载列表”执行本地筛选。
  - 该降级方案不作为最终验收标准。

## 7. 全局状态与交互规则

- 加载态：
  - 页面初始化加载 providers/defaults/history 时显示 loading。
  - 操作按钮在请求中进入 loading + disabled。
- 错误态：
  - `401`：提示登录失效并引导重新登录。
  - `422`（默认模型失效或模型不可用）：提示并引导至`模型设置`修复。
  - `saved-prompts/retry` 草稿无效或过期：提示需重新执行优化。
- 状态保留：
  - 切换 tabs 不清空当前会话内输入与结果状态。
  - 可通过 URL query 保存当前 tab。

## 8. API 映射与接口约束

### 8.1 直接复用的现有接口

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

### 8.2 新增后端需求（历史搜索）

- 为 `GET /api/saved-prompts` 增加可选查询参数：`query`。
- 语义：按关键词匹配 `optimizedPrompt`。
- 建议类型变化：
  - `ListSavedPromptsQuery` 从 `{ limit?: number; cursor?: string }`
  - 扩展为 `{ limit?: number; cursor?: string; query?: string }`。
- 分页语义保持不变：`items + nextCursor`。

### 8.3 优化页保存联动约束

- 当前端接收 optimize 响应中的 `persistence.saved=false` 时，前端需要保留 `saveDraft` 并开放手动保存入口。
- 手动保存仅调用 `POST /api/saved-prompts/retry`，不新增二次保存接口。

## 9. 验收测试清单

1. 原始提示词为空时，`评估`按钮禁用。
2. 无评估结果时，`优化`按钮禁用。
3. 评估成功后可复制评估结果全文。
4. 优化成功后可复制优化结果全文。
5. 自动保存成功时，`保存`按钮不可用或不展示可点击态。
6. 自动保存失败时，`保存`按钮可点击并可成功触发重试保存。
7. 模型设置页面首屏默认展示第一个服务商详情。
8. 服务商列表排序满足“启用优先 + 名称升序”。
9. 模型列表排序满足“启用优先 + 名称升序”。
10. 默认评估模型与默认优化模型设置成功后可回显。
11. 历史搜索可按关键词命中结果（依赖后端 `query` 实现）。
12. 点击历史记录项可查看优化后完整提示词。
13. 历史分页加载行为正确（`nextCursor` 连续可用）。
14. 历史列表项复制按钮可复制完整 `optimizedPrompt`。
