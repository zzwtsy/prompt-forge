# 扩展需求文档（Prompt Forge）

- 版本：`v1`
- 日期：`2026-03-02`
- 适用范围：历史记录搜索扩展（前端 `apps/frontend` 与后端 `apps/backend` 联动）

## 1. 变更基线说明

- 本文档是增量规格文档，仅描述相对当前仓库现状的新增需求。
- 本文档基于 [UI 需求文档（V1）](./ui-requirements.md) 的决策背景，不重述 V1 主体需求。
- 本文档不替代 [产品需求文档](./requirements.md)，也不修改其主体内容。

## 2. 扩展项清单与优先级

| 编号 | 名称 | 优先级 | 状态 |
| --- | --- | --- | --- |
| `EX-01` | 历史记录服务端关键词搜索 | P0 | 本期实现 |

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

## 4. API / 类型变更对照

### 4.1 后端路由查询参数

- 变更前：
  - `GET /api/saved-prompts` query：`{ limit?: number; cursor?: string }`
- 变更后：
  - `GET /api/saved-prompts` query：`{ limit?: number; cursor?: string; query?: string }`
- 兼容性：
  - `query` 为可选字段；未传时行为与当前一致。

### 4.2 后端服务函数签名

- 变更前：
  - `listSavedPrompts(options: { limit?: number; cursor?: string })`
- 变更后：
  - `listSavedPrompts(options: { limit?: number; cursor?: string; query?: string })`

### 4.3 前端 API 生成类型

- 变更对象：`SavedPrompts.get_api_saved_prompts`
- 变更前：
  - `params: { limit?: number; cursor?: string }`
- 变更后：
  - `params: { limit?: number; cursor?: string; query?: string }`

## 5. 前后端联动流程

1. 用户在历史记录页输入搜索词。
2. 前端对输入值做 `trim`，将结果作为 `query`。
3. 若搜索词与上一次请求不同，前端清空当前列表并重置 `cursor`。
4. 前端调用 `GET /api/saved-prompts?limit=...&cursor=...&query=...`。
5. 后端按 `optimizedPrompt` 执行包含匹配并返回分页结果。
6. 前端渲染结果，支持继续分页加载与复制。

## 6. 兼容性与回滚策略

### 6.1 兼容性策略

- 后端：
  - `query` 可选，旧请求无需改动即可继续工作。
- 前端：
  - 新版本优先使用服务端搜索。
  - 旧后端环境若不支持 `query`，可回退为“已加载数据本地筛选”。

### 6.2 回滚策略

- 后端回滚：
  - 移除 `query` 逻辑后，接口仍可按旧参数工作。
- 前端回滚：
  - 保留原本地筛选逻辑作为兜底路径，确保基础可用性。

## 7. 验收测试清单

1. 未传 `query` 时，返回结果与现状一致。
2. 传 `query` 时，仅返回命中 `optimizedPrompt` 的记录。
3. `query` 为全空白字符串时等同未传。
4. `query + cursor` 组合下分页可连续加载，且不丢项、不重项。
5. `limit` 边界行为保持原约束（`1~50`）。
6. 前端搜索词变化后，分页重置并从第一页返回新结果集。
7. 搜索模式下，历史列表复制与详情查看仍可用。
8. 后端未支持 `query` 时，前端可降级为本地筛选，并明确为临时方案。

## 8. 假设与非目标

- 本期扩展仅聚焦历史搜索能力。
- 本期不引入全文检索引擎或专用搜索索引。
- 本期不扩展搜索字段到原始提示词与评估结果。
- 本文档是增量规格文档，不替代 [ui-requirements.md](./ui-requirements.md) 的主需求定义。
