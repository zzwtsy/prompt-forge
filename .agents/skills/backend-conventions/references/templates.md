# Backend 模板库

> 适用范围：`apps/backend/src`  
> 使用方式：先按本文件生成最小骨架，再按 `backend-conventions.full.md` 补全业务细节。

## 1. 路由模块 4 文件骨架

```text
src/routes/{module}/
  {module}.routes.ts
  {module}.handlers.ts
  {module}.index.ts
  {module}.test.ts
```

### 1.1 `{module}.routes.ts`

```ts
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContentRequired } from "stoker/openapi/helpers";

import { jsonApiContent, jsonApiError } from "@/lib/openapi/helpers";
import { requireAuth } from "@/middlewares/require-permission";

const tags = ["ModuleName"];

const CreateModuleBodySchema = z.object({
  name: z.string().min(1),
});

const ModuleItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const CreateModuleResponseSchema = z.object({
  id: z.string(),
});

const ListModuleResponseSchema = z.object({
  items: z.array(ModuleItemSchema),
});

export const createModuleRoute = createRoute({
  path: "/api/{module}",
  method: "post",
  tags,
  middleware: [requireAuth()],
  request: {
    body: jsonContentRequired(CreateModuleBodySchema, "创建 {module} 请求参数"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(CreateModuleResponseSchema, "创建 {module} 成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("请求参数校验失败"),
  },
});

export const listModuleRoute = createRoute({
  path: "/api/{module}",
  method: "get",
  tags,
  middleware: [requireAuth()],
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(ListModuleResponseSchema, "查询 {module} 列表成功"),
    [HttpStatusCodes.UNAUTHORIZED]: jsonApiError("未登录或登录已失效"),
  },
});
```

### 1.2 `{module}.handlers.ts`

```ts
import type { AppRouteHandler } from "@/lib/types";
import { ok } from "@/lib/utils/http";

import { createModuleRoute, listModuleRoute } from "./{module}.routes";

export const createModuleHandler: AppRouteHandler<typeof createModuleRoute> = async (c) => {
  const body = c.req.valid("json");

  // TODO(责任人/日期): 补充真实写入逻辑。
  return ok(c, {
    id: `mock-${body.name}`,
  });
};

export const listModuleHandler: AppRouteHandler<typeof listModuleRoute> = async (c) => {
  // TODO(责任人/日期): 替换为真实查询逻辑。
  return ok(c, {
    items: [],
  });
};
```

### 1.3 `{module}.index.ts`

```ts
import { createRouter } from "@/lib/app/create-app";

import { createModuleHandler, listModuleHandler } from "./{module}.handlers";
import { createModuleRoute, listModuleRoute } from "./{module}.routes";

const router = createRouter();
router.openapi(createModuleRoute, createModuleHandler);
router.openapi(listModuleRoute, listModuleHandler);

export default router;
```

### 1.4 `{module}.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { createTestApp } from "@/lib/app/create-app";
import router from "./{module}.index";

describe("{module} routes", () => {
  it("GET /api/{module} 返回 200", async () => {
    const app = createTestApp(router);
    const response = await app.request("/api/{module}");

    expect(response.status).toBe(200);
  });
});
```

## 2. OpenAPI 片段模板

### 2.1 `createRoute` 标准字段模板

默认适用于场景 A（handler 使用 `ok/fail` 标准响应包裹）：

```ts
createRoute({
  path: "/api/{resource}",
  method: "post",
  tags: ["ResourceTag"],
  middleware: [requireAuth()],
  request: {
    body: jsonContentRequired(RequestBodySchema, "请求体说明（中文）"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonApiContent(ResponseSchema, "成功响应说明（中文）"),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("请求参数校验失败"),
  },
});
```

### 2.2 `tags` 命名示例

- 合法：`["ModelSettings"]`
- 合法：`["PromptOptimize"]`
- 非法：`["model-settings"]`
- 非法：`["Model Settings"]`

### 2.3 `jsonApiContent` / `jsonContentRequired` / `jsonApiError` 用法片段

```ts
request: {
  body: jsonContentRequired(UpdateBodySchema, "更新请求参数"),
},
responses: {
  [HttpStatusCodes.OK]: jsonApiContent(UpdateResponseSchema, "更新成功"),
  [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiError("请求参数校验失败"),
}
```

### 2.4 `HttpStatusCodes` 合法导入写法

```ts
import * as HttpStatusCodes from "stoker/http-status-codes";
```

```ts
import { OK, UNAUTHORIZED, UNPROCESSABLE_ENTITY } from "stoker/http-status-codes";
```

```ts
// 不允许
import { HttpStatusCodes } from "stoker/http-status-codes";
```

### 2.5 何时允许 `jsonContent`（场景 B）

当接口必须返回非标准结构（例如第三方协议透传或历史兼容结构）时，可使用 `jsonContent`，并在代码里注明原因：

```ts
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

const RawCallbackSchema = z.object({
  event: z.string(),
  payload: z.unknown(),
});

export const rawCallbackRoute = createRoute({
  path: "/api/callback/raw",
  method: "post",
  tags: ["Callback"],
  responses: {
    // 场景 B：响应结构受第三方协议约束，不走统一 success 包裹。
    [HttpStatusCodes.OK]: jsonContent(RawCallbackSchema, "第三方回调原始响应"),
  },
});
```

## 3. 事务模板

### 3.1 单事务多步写入模板

```ts
await db.transaction(async (tx) => {
  await tx
    .update(tableA)
    .set({ status: "disabled" })
    .where(eq(tableA.id, targetId));

  await tx
    .insert(tableB)
    .values({
      entityId: targetId,
      action: "DISABLED",
    });
});
```

### 3.2 禁止外部 HTTP 调用进入事务的注释模板

```ts
/**
 * 约束：
 * 1. 事务仅执行本地数据库写操作，避免锁持有期间等待外部网络。
 * 2. 外部服务调用需放在事务前后，并处理重试/补偿。
 */
```

## 4. 错误码模板

### 4.1 `codes.ts` 新增项注释模板

```ts
/**
 * 服务商未启用
 * - 场景: 调用运行时能力前发现 provider.enabled = false
 * - 对应 HTTP: 409
 * - details 对外: 否（仅日志保留 providerId）
 */
PROVIDER_DISABLED: { code: 22001, message: "服务商已禁用" },
```

### 4.2 `AppError` 抛出模板（status/code/message/details）

```ts
import { CONFLICT } from "stoker/http-status-codes";
import { AppError } from "@/lib/errors";
import { AppErrorCode } from "@/lib/errors/codes";

throw new AppError(
  AppErrorCode.PROVIDER_DISABLED,
  CONFLICT,
  "服务商已禁用，请启用后重试",
  {
    providerId,
    reason: "provider_disabled",
  },
);
```

## 5. 应用注册模板（`app.ts`）

在新增模块后，将路由模块加入应用挂载数组：

```ts
import modelSettingsRoutes from "@/routes/model-settings/model-settings.index";

const routes = [
  modelSettingsRoutes,
] as const;
```
