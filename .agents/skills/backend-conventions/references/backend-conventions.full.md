# Backend 开发规范

- 版本：`v1.2`
- 同步日期：`2026-03-06`
- 对齐基线：`docs` 重构后路径 + 当前 `apps/backend` 错误码实现

## 目录

- [文档定位](#full-positioning)
- [1. 路由目录结构规范（按模块目录）](#full-route-structure)
- [2. OpenAPI 路由定义规范](#full-openapi)
- [3. 数据库写操作事务规范](#full-transaction)
- [4. 项目级注释规范（全项目，不仅数据库）](#full-comments)
- [5. Handler 与 Service/Repository 拆分策略](#full-splitting)
- [6. 最小实现示例](#full-minimal-impl)
  - [6.1 简单逻辑直接放 handlers](#full-minimal-impl-simple)
  - [6.2 复杂逻辑拆到 service（可选）](#full-minimal-impl-service)
- [7. 错误码设计规范（codes.ts / index.ts）](#full-error-codes)
  - [7.1 设计目标](#full-error-codes-goals)
  - [7.2 编码规则（5 位混合方案）](#full-error-codes-format)
  - [7.3 `codes.ts` 约束](#full-error-codes-codes-ts)
  - [7.4 `index.ts` / `AppError` 约束](#full-error-codes-index-ts)
  - [7.5 现有基础码基线（当前实现）](#full-error-codes-baseline)
  - [7.6 业务扩展示例（模型设置）](#full-error-codes-model-settings)
  - [7.7 变更流程](#full-error-codes-change-process)

<a id="full-positioning"></a>

## 文档定位

- 本文档用于约束 `apps/backend/src` 的路由组织、OpenAPI 写法、事务策略与注释规范。
- 本文档是后端工程约定，不直接改变运行时 API 行为。
- 规范优先级：若与仓库顶层约束冲突，以 `AGENTS.md` 为准。

<a id="full-route-structure"></a>

## 1. 路由目录结构规范（按模块目录）

统一采用以下结构：

```text
src/routes/{module}/
  {module}.routes.ts
  {module}.handlers.ts
  {module}.index.ts
  {module}.test.ts
```

拆分原则（避免过度模板化）：

- 简单逻辑直接放在 `handlers` 内实现。
- 出现复用或复杂编排时再拆 `service`。
- 出现复杂查询或查询复用时再拆 `repository`。

参考项目（结构风格）：

- <https://github.com/w3cj/hono-open-api-starter/blob/main/src/routes/tasks/tasks.handlers.ts>
- <https://github.com/w3cj/hono-open-api-starter/blob/main/src/routes/tasks/tasks.index.ts>
- <https://github.com/w3cj/hono-open-api-starter/blob/main/src/routes/tasks/tasks.routes.ts>
- <https://github.com/w3cj/hono-open-api-starter/blob/main/src/routes/tasks/tasks.test.ts>

可复制骨架与模板请使用：

- [templates.md §1 路由模块 4 文件骨架](./templates.md#tpl-route-module-skeleton)

<a id="full-openapi"></a>

## 2. OpenAPI 路由定义规范

统一约束：

- `tags` 必须使用大驼峰且不留空格，例如 `["ModelSettings"]`、`["PromptOptimize"]`。
- `request.body` 优先使用 `stoker/openapi/helpers` 的 `jsonContentRequired`。
- `responses` 按场景选择：
  - 场景 A（默认）：handler 使用 `ok/fail` 标准响应包裹时，统一使用 `jsonApiContent`、`jsonApiError`。
  - 场景 B（例外）：返回非标准响应结构（例如第三方回调透传、历史兼容原始结构）时可使用 `jsonContent`，且必须在代码中注释说明原因。
- 接口说明统一中文，包括请求体说明、响应说明、错误说明。
- 中间件统一放在 `createRoute({ middleware: [...] })` 中。

可复制模板请使用：

- [templates.md §2.1 `createRoute` 标准字段模板](./templates.md#tpl-2-1-create-route)
- [templates.md §2.3 `jsonApiContent` / `jsonContentRequired` / `jsonApiError` 用法片段](./templates.md#tpl-2-3-api-helpers)
- [templates.md §2.4 `HttpStatusCodes` 合法导入写法](./templates.md#tpl-2-4-http-status-import)
- [templates.md §2.5 何时允许 `jsonContent`（场景 B）](./templates.md#tpl-2-5-json-content-scene-b)

<a id="full-transaction"></a>

## 3. 数据库写操作事务规范

统一约束：

- 插入、更新、删除默认使用事务包裹。
- 多步写操作必须在同一事务内保证原子性。
- 发生异常时抛错回滚，不做“部分成功”写入。
- 事务中不混入外部网络调用（例如第三方 HTTP 请求），避免长事务占锁。

可复制模板请使用：

- [templates.md §3.1 单事务多步写入模板](./templates.md#tpl-3-1-transaction-write)
- [templates.md §3.2 禁止外部 HTTP 调用进入事务的注释模板](./templates.md#tpl-3-2-transaction-comment)

<a id="full-comments"></a>

## 4. 项目级注释规范（全项目，不仅数据库）

统一约束：

- 注释默认中文；专有名词、协议名与 API 名可保留英文。
- 注释聚焦“为什么/约束/副作用”，不写代码字面翻译。
- 公开函数、路由 handler、核心工具函数使用 JSDoc。
- 复杂分支允许短注释解释业务规则。
- TODO 统一格式：`TODO(责任人/日期): 原因 + 下一步`。
- 注释规范仅强制新增/修改代码，历史代码按需渐进治理。
- 禁止空话注释（例如“给变量赋值”“调用函数”）。

推荐写法：

```ts
/**
 * 拉取并缓存服务商模型列表。
 *
 * 约束：
 * 1. 仅允许已启用且已配置 apiKey 的服务商执行同步。
 * 2. 同步流程中数据库写入必须在事务内完成。
 */
```

```ts
// 兼容旧数据：默认模型缺失时返回 null，由前端引导用户重新配置。
const evaluateModelId = defaults?.evaluateModelId ?? null;
```

不推荐写法：

```ts
// 给变量赋值
const id = row.id;
```

<a id="full-splitting"></a>

## 5. Handler 与 Service/Repository 拆分策略

- 默认：`handlers` 直接实现简单业务逻辑。
- 当出现以下任一情况时拆 `service`：
  - 同一业务逻辑被多个 handler 复用；
  - handler 出现复杂分支与多步骤编排；
  - 需要事务 + 外部依赖协调。
- 当出现以下任一情况时拆 `repository`：
  - 查询明显复杂（多条件拼装、批量 upsert、多表联动）；
  - 同一查询逻辑跨 handler/service 复用。

<a id="full-minimal-impl"></a>

## 6. 最小实现示例

<a id="full-minimal-impl-simple"></a>

### 6.1 简单逻辑直接放 handlers

```ts
import type { AppRouteHandler } from "@/lib/types";
import db from "@/db";
import { aiProviders } from "@/db/schemas/ai-provider-schema";
import { ok } from "@/lib/utils/http";
import { listProvidersRoute } from "./model-settings.routes";

export const listProvidersHandler: AppRouteHandler<typeof listProvidersRoute> = async (c) => {
  const rows = await db.select().from(aiProviders);
  return ok(c, { items: rows });
};
```

<a id="full-minimal-impl-service"></a>

### 6.2 复杂逻辑拆到 service（可选）

```ts
// handlers.ts
export const syncProviderModelsHandler: AppRouteHandler<typeof syncProviderModelsRoute> = async (c) => {
  const providerId = c.req.valid("param").providerId;
  const result = await syncProviderModels(providerId);
  return ok(c, result);
};
```

```ts
// service.ts
export async function syncProviderModels(providerId: string) {
  // 触发拆分条件：远端模型拉取 + 批量写入 + 事务一致性
  // 具体实现可在此编排 adapter、事务和 upsert。
  return { providerId, synced: 0 };
}
```

<a id="full-error-codes"></a>

## 7. 错误码设计规范（codes.ts / index.ts）

适用范围：

- `apps/backend/src/lib/errors/codes.ts`
- `apps/backend/src/lib/errors/index.ts`
- 以及所有通过 `fail` / `AppError` 返回错误响应的后端模块。

<a id="full-error-codes-goals"></a>

### 7.1 设计目标

- 错误码是前后端契约，优先稳定、可枚举、可检索。
- HTTP 状态码表达传输语义，业务错误码表达业务语义；两者必须同时存在。
- 默认 `message` 使用中文，面向最终用户可读。

<a id="full-error-codes-format"></a>

### 7.2 编码规则（5 位混合方案）

统一格式：`CMMSS`

- `C`（1 位）：错误大类。
- `MM`（2 位）：业务模块。
- `SS`（2 位）：模块内顺序号（`01-99`）。

`C` 取值约定：

- `1`：系统/框架错误（例如未捕获异常、框架兜底异常）。
- `2`：业务状态错误（例如状态不满足、冲突、禁用）。
- `3`：请求参数校验错误。
- `4`：认证/权限/资源缺失错误。
- `5`：外部依赖错误（第三方 API、上游服务异常）。

`MM` 取值约定（当前已登记）：

- `00`：通用模块。
- `01`：认证模块。
- `03`：权限模块。
- `04`：路由/资源缺失模块。
- `20`：模型设置模块。
- `21`：Prompt 运行时模块。

示例：

- `30001`：参数校验失败（`3` + `00` + `01`）。
- `40401`：资源不存在（`4` + `04` + `01`）。
- `52001`：模型同步时调用外部服务失败（`5` + `20` + `01`）。

<a id="full-error-codes-codes-ts"></a>

### 7.3 `codes.ts` 约束

- `AppErrorCode` 是项目唯一错误码源；禁止在业务模块写散落常量码。
- Key 命名必须使用 `UPPER_SNAKE_CASE`，并与业务语义一致。
- 每个错误码常量注释必须包含：
  - 场景（何时触发）；
  - 对应 HTTP 状态码；
  - `details` 是否允许对外返回（若允许，说明字段范围）。
- 码值全局不可重复；已发布码值不可复用（即使逻辑下线也不回收）。
- 默认 `message` 必须为中文；业务层可按场景覆写，但不得改变原始错误语义。

<a id="full-error-codes-index-ts"></a>

### 7.4 `index.ts` / `AppError` 约束

- 业务层（handler/service）统一抛 `new AppError(...)`，由全局 `appOnError` 统一记录日志并输出标准错误响应。
- `status` 必须显式传入，不允许从 `code` 反推，避免语义耦合。
- `details` 仅放结构化调试信息，禁止写入密钥、token、隐私数据等敏感信息。
- 当前约束：`index.ts` 复用 `codes.ts` 导出的 `ErrorDescriptor`，保持错误描述结构单一来源。

<a id="full-error-codes-baseline"></a>

### 7.5 现有基础码基线（当前实现）

说明：本节描述当前仓库已采用的基础码值，用于规范与实现对照。

| 错误 Key | 码值 | 规范默认文案 |
| --- | --- | --- |
| `SYSTEM_ERROR` | `10001` | 系统内部错误 |
| `HTTP_ERROR` | `10002` | HTTP 异常 |
| `VALIDATION_ERROR` | `30001` | 请求参数校验失败 |
| `NOT_FOUND` | `40401` | 资源不存在 |
| `UNAUTHORIZED` | `40101` | 未认证或登录失效 |
| `FORBIDDEN` | `40301` | 无权限访问 |

<a id="full-error-codes-model-settings"></a>

### 7.6 业务扩展示例（模型设置）

以下为模型设置与运行时模型解析场景的建议错误码（与 `docs/implementations/impl-model-settings.md` 对齐）：

- `PROVIDER_NOT_FOUND = 42001`
- `MODEL_NOT_FOUND = 42002`
- `PROVIDER_DISABLED = 22001`
- `MODEL_DISABLED = 22002`
- `DEFAULT_MODEL_NOT_SET = 22003`
- `DEFAULT_MODEL_INVALID = 22004`
- `PROVIDER_API_KEY_MISSING = 22005`
- `MODEL_SYNC_FAILED = 52001`
- `MODEL_CONFLICT = 22006`

<a id="full-error-codes-change-process"></a>

### 7.7 变更流程

- 改码值属于 breaking change；PR 标题与说明必须明确标注错误码变更影响范围。
- 错误码变更必须同步更新：
  - OpenAPI 错误响应描述；
  - 前端错误码映射与提示策略；
  - 后端测试用例与联调用例。
- 新增错误码遵循“先登记、再实现”：先更新 `codes.ts` 与本规范，再进入业务代码实现。
