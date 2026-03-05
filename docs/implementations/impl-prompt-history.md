# Prompt 历史与保存功能实施方案（PO-05 + SP-01/02/03）

## 1. 背景与目标

- 背景：当前后端已支持提示词评估与优化运行，但尚未落地优化任务与优化结果持久化。
- 目标：
  1. 落地 `PromptRun` / `SavedPrompt` 存储能力；
  2. 提供 `GET /api/saved-prompts` 查询能力；
  3. 在 `POST /api/prompt/optimize` 中实现“优化成功后自动尝试保存”；
  4. 保存失败时提供可重试的签名草稿，不重复调用模型。

## 2. 已锁定决策

- 仅补齐未实现后端缺口，不重构现有已上线能力。
- `POST /api/prompt/optimize` 优化成功后自动保存。
- 若保存失败，接口仍返回 200 与优化结果，并附带：
  - `persistence.saved=false`
  - `persistence.retryable=true`
  - `persistence.saveDraft`（签名草稿）
- 新增 `POST /api/saved-prompts/retry`，用于使用签名草稿补保存。
- `saveDraft` 必须签名并校验过期时间（默认 15 分钟）。
- `saveDraft` 签名密钥使用独立环境变量 `PROMPT_SAVE_DRAFT_SECRET`，缺失即启动失败。
- `GET /api/saved-prompts` 采用 cursor 分页，`limit` 默认 20，最大 50。

## 3. 数据模型

### 3.1 prompt_runs

字段：

- `id` (text, PK)
- `original_prompt` (text, not null)
- `evaluation_result` (text, nullable)
- `optimized_prompt` (text, not null)
- `evaluate_model_id` (text, nullable, FK -> `ai_models.id`, on delete set null)
- `optimize_model_id` (text, not null, FK -> `ai_models.id`)
- `evaluate_params` (json text, nullable)
- `optimize_params` (json text, nullable)
- `created_at` (timestamp_ms, not null, default now)

索引：

- `prompt_runs_created_at_idx` on `created_at`

### 3.2 saved_prompts

字段：

- `id` (text, PK)
- `prompt_run_id` (text, not null, FK -> `prompt_runs.id`, on delete cascade)
- `optimized_prompt` (text, not null)
- `created_at` (timestamp_ms, not null, default now)

约束与索引：

- `UNIQUE(prompt_run_id)`（一条 run 仅一条保存记录）
- `saved_prompts_created_at_id_idx` on `(created_at, id)`

## 4. API 契约

## 4.1 POST /api/prompt/optimize（修改）

请求体新增可选字段：

```ts
evaluateContext?: {
  modelId: string;
  temperature?: number;
}
```

成功响应扩展为：

```ts
{
  optimizedPrompt: string;
  resolvedModel: {
    providerId: string;
    providerKind: "openai" | "openai-compatible";
    modelId: string;
    modelName: string;
  };
  promptRunId: string;
  savedPromptId: string;
  persistence: {
    saved: boolean;
    retryable: boolean;
    saveDraft?: SignedSaveDraft;
  };
}
```

说明：

- `saved=true` 时表示本次已完成持久化；
- `saved=false` 时表示优化成功但持久化失败，可使用 `saveDraft` 调用重试接口补保存。

## 4.2 GET /api/saved-prompts（新增）

查询参数：

```ts
{
  limit?: number; // 1-50, default 20
  cursor?: string; // base64url(JSON: { createdAtMs, id })
}
```

成功响应：

```ts
{
  items: Array<{
    id: string;
    promptRunId: string;
    optimizedPrompt: string;
    createdAt: string; // ISO
  }>;
  nextCursor: string | null;
}
```

展示约束：

- 仅返回优化后提示词与追溯标识，不返回原始提示词正文。

## 4.3 POST /api/saved-prompts/retry（新增）

请求体：

```ts
{
  saveDraft: SignedSaveDraft;
}
```

成功响应：

```ts
{
  promptRunId: string;
  savedPromptId: string;
  saved: true;
}
```

错误行为：

- 草稿签名不合法或已过期 -> `422`
- 未登录 -> `401`

## 5. 签名草稿机制

内部类型：

```ts
type PromptCallParams = { temperature?: number };

type SignedSaveDraft = {
  version: "v1";
  issuedAt: string;
  expiresAt: string;
  payload: {
    promptRunId: string;
    savedPromptId: string;
    originalPrompt: string;
    evaluationResult: string | null;
    optimizedPrompt: string;
    evaluateModelId: string | null;
    optimizeModelId: string;
    evaluateParams: PromptCallParams | null;
    optimizeParams: PromptCallParams | null;
    createdAt: string;
  };
  signature: string;
};
```

实现约束：

- 算法：`HMAC-SHA256`
- 编码：`base64url`
- 签名内容：固定字段顺序的 JSON 文本
- 默认 TTL：15 分钟
- 验签失败、版本不匹配、过期均视为无效草稿

## 6. 实现步骤（文件级）

1. 新增文档：`docs/implementations/impl-prompt-history.md`（当前文件）。
2. 新增 schema：
   - `apps/backend/src/db/schemas/prompt-run-schema.ts`
   - `apps/backend/src/db/schemas/saved-prompt-schema.ts`
3. 更新 schema 聚合导出：
   - `apps/backend/src/db/schemas/index.ts`
4. 生成 migration（下一号）到：
   - `apps/backend/src/db/migrations/*`
   - `apps/backend/src/db/migrations/meta/*`
5. 新增签名工具：
   - `apps/backend/src/lib/ai/save-draft-signing.ts`
6. 更新环境变量与样例：
   - `apps/backend/src/env.ts`
   - `apps/backend/.env.example`
   - `apps/backend/.env.test`
7. 更新 prompt 路由契约与 handler：
   - `apps/backend/src/routes/prompt/prompt.routes.ts`
   - `apps/backend/src/routes/prompt/prompt.handlers.ts`
8. 新增 saved-prompts 路由模块：
   - `apps/backend/src/routes/saved-prompts/saved-prompts.routes.ts`
   - `apps/backend/src/routes/saved-prompts/saved-prompts.handlers.ts`
   - `apps/backend/src/routes/saved-prompts/saved-prompts.index.ts`
   - `apps/backend/src/routes/saved-prompts/saved-prompts.test.ts`
9. 路由聚合挂载：
   - `apps/backend/src/routes/index.ts`

## 7. 测试与验收

新增/更新测试目标：

1. `prompt.test.ts`
   - optimize 保存成功返回 `saved=true`
   - optimize 保存失败返回 `saved=false + saveDraft`
   - 新响应字段契约回归
2. `saved-prompts.test.ts`
   - `GET/retry` 未登录返回 401
   - `GET` 列表不泄露原始提示词
   - cursor 分页稳定
   - `retry` 篡改/过期草稿返回 422
   - `retry` 幂等返回同一记录
3. `save-draft-signing.test.ts`
   - 签名验签通过
   - 篡改失败
   - 过期失败
4. 回归命令：

```bash
bun run --filter backend test
```

验收标准：

- 优化接口在模型成功时总能返回优化结果；
- 保存成功时直接回传 `promptRunId/savedPromptId`；
- 保存失败时返回可重试草稿，重试成功后不再调用模型；
- 保存页面查询接口仅输出优化结果与追溯标识。

## 8. 迁移与兼容

- 本期新增表与接口，不破坏已实现接口的基础语义。
- `POST /api/prompt/optimize` 响应为向后兼容扩展字段（保留已有字段）。
- 新增环境变量 `PROMPT_SAVE_DRAFT_SECRET` 后，部署时必须同步配置。

## 9. 假设与默认值

- 单人使用场景，不引入多用户数据隔离模型。
- `evaluateContext` 可选；缺失时 `evaluateModelId/evaluateParams` 持久化为 `null`。
- `saveDraft` 默认有效期 15 分钟，可后续配置化。
- 本期不新增前端实现，仅提供后端契约与落地能力。
