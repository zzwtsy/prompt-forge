# 扩展需求文档（Prompt Forge）

- 版本：`v1.1`
- 日期：`2026-03-02`
- 适用范围：历史记录搜索扩展（前端 `apps/frontend` 与后端 `apps/backend` 联动）

## 1. 变更基线说明

- 本文档是增量规格文档，仅描述相对当前仓库现状的新增需求。
- 本文档基于 [UI 需求文档（v1.1）](./spec-ui-requirements.md) 的决策背景，不重述主需求主体内容。
- 本文档不替代 [产品需求文档](./spec-product-requirements.md)，也不修改其主体内容。
- 继承约束说明：本扩展仅定义“历史搜索”增量；登录态前置、统一响应结构（ApiEnvelope）、路由 query 基础规则统一继承 `spec-ui-requirements.md v1.1`。

## 2. 扩展项清单与优先级

| 编号 | 名称 | 优先级 | 状态 |
| --- | --- | --- | --- |
| `EX-01` | 历史记录服务端关键词搜索 | P0 | 待实现 |

## 3. EX-01 详细规格

### 3.1 目标

- 将历史记录页搜索从“前端本地已加载筛选”升级为“后端全量查询”。
- 提升历史数据检索覆盖范围，避免未加载分页数据无法命中的问题。

### 3.2 范围与边界

- 搜索对象仅为 `optimizedPrompt`。
- 不搜索 `originalPrompt` 与 `evaluationResult`。
- 不新增历史详情接口。

### 3.3 行为规则

- 新增可选参数 `query` 用于关键词搜索。
- `query` 归一化规则：`trim` 后为空字符串时视为“未传”。
- 匹配规则：`contains`（包含匹配），默认大小写不敏感。
- 排序规则不变：`createdAt desc, id desc`。
- 分页规则不变：`limit + cursor + nextCursor`。
- 前端交互规则：搜索词变化时必须重置 `cursor`，从第一页重新请求。
- 降级触发条件：后端未支持 `query` 时，前端降级为“已加载列表本地筛选”。
- 退出降级条件：后端支持 `query` 且前端 API 类型更新后，必须切回服务端搜索。

## 4. API / 类型变更对照

### 4.1 后端路由查询参数

- 当前契约：
  - `GET /api/saved-prompts` query：`{ limit?: number; cursor?: string }`
- 目标契约：
  - `GET /api/saved-prompts` query：`{ limit?: number; cursor?: string; query?: string }`
- 兼容性：
  - `query` 为可选字段；未传时行为与当前一致。

### 4.2 后端服务函数签名

- 当前契约：
  - `listSavedPrompts(options: { limit?: number; cursor?: string })`
- 目标契约：
  - `listSavedPrompts(options: { limit?: number; cursor?: string; query?: string })`

### 4.3 前端 API 生成类型

- 变更对象：`SavedPrompts.get_api_saved_prompts`
- 当前契约：
  - `params: { limit?: number; cursor?: string }`
- 目标契约：
  - `params: { limit?: number; cursor?: string; query?: string }`

### 4.4 说明

- 本章定义的是增量目标，不表示当前代码已实现 `query` 搜索能力。

## 5. 前后端联动流程

1. 用户在历史记录页输入搜索词。
2. 前端对输入值做 `trim`，将结果作为 `query`。
3. 前端执行能力判定：
   - 若后端支持 `query`，进入服务端搜索流程。
   - 若后端不支持 `query`，进入本地筛选降级流程。
4. 服务端搜索流程：
   - 若搜索词与上一次请求不同，前端清空当前列表并重置 `cursor`。
   - 前端调用 `GET /api/saved-prompts?limit=...&cursor=...&query=...`。
   - 后端按 `optimizedPrompt` 执行包含匹配并返回分页结果。
5. 本地筛选降级流程：
   - 前端仅在已加载分页数据上执行本地匹配。
   - 前端需提示“当前为降级模式，结果仅覆盖已加载数据”。
6. 前端渲染结果，支持继续分页加载与复制。

## 6. 兼容性与回滚策略

### 6.1 兼容性策略

- 后端：`query` 可选，旧请求无需改动即可继续工作。
- 前端：新版本优先使用服务端搜索；旧后端环境可降级为本地筛选。

### 6.2 回滚策略

- 后端回滚：移除 `query` 逻辑后，接口仍可按旧参数工作。
- 前端回滚：保留本地筛选降级路径，保障基础可用。

## 7. 验收测试清单

1. 未传 `query` 时，返回结果与当前契约一致。
2. 传 `query` 时，仅返回命中 `optimizedPrompt` 的记录。
3. `query` 为全空白字符串时等同未传。
4. `query + cursor` 组合下分页可连续加载，且不丢项、不重项。
5. `limit` 边界行为保持原约束（`1~50`）。
6. 前端搜索词变化后，分页重置并从第一页返回新结果集。
7. 搜索模式下，历史列表复制与详情查看仍可用。
8. 后端未支持 `query` 时，前端可降级为本地筛选，并明确为临时方案。
9. 文档一致性验收：本扩展文档不得与 `spec-ui-requirements.md v1.1` 中“当前契约/目标契约”分层定义冲突。

## 8. 假设与非目标

- 本期扩展仅聚焦历史搜索能力。
- 本期不引入全文检索引擎或专用搜索索引。
- 本期不扩展搜索字段到原始提示词与评估结果。
- 默认不修改 `spec-ui-requirements.md`，仅修订本扩展文档。
- 默认不修改前后端代码与 API 生成文件。
- 本文档是增量规格文档，不替代 [spec-ui-requirements.md](./spec-ui-requirements.md) 的主需求定义。
