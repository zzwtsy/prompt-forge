# 模型设置与运行时模型选择实施方案（OpenAI + OpenAI-Compatible）

## 1. 背景与目标

- 目标：为“模型设置页面 + 评估/优化运行时模型选择”提供可直接手写实现的后端实施蓝图。
- 范围：仅定义实现方案，不包含代码改动执行。
- 约束：后端任务入口规范以仓库根 `AGENTS.md` 为准，并以 `.agents/skills/backend-conventions/SKILL.md` 作为实现执行指南（若冲突以 `AGENTS.md` 为准）。

## 2. 已锁定实现决策

- 接口鉴权：模型设置与评估/优化相关接口全部要求登录。
- Provider 支持范围：`openai`（固定单实例）与 `openai-compatible`（可多实例）。
- 模型同步策略：缓存全部模型，暂不做能力标记。
- 运行时可用性：任意“启用”模型都可用于评估/优化。
- 默认模型失效：直接返回 422，不自动回退。
- 新模型默认状态：同步或手动新增后默认 `enabled=true`。
- 初始化策略：通过“服务启动时检测执行”的幂等 seed 补齐 OpenAI 默认 provider 与默认配置行。
- API Key 存储：数据库密文保存，接口仅返回脱敏值与存在标记。

## 3. 后端落地文件清单

```text
apps/backend/src/
  routes/
    index.ts
    model-settings/
      model-settings.routes.ts
      model-settings.handlers.ts
      model-settings.index.ts
      model-settings.test.ts
    prompt/
      prompt.routes.ts
      prompt.handlers.ts
      prompt.index.ts
      prompt.test.ts
  db/
    schemas/
      ai-provider-schema.ts
      ai-model-schema.ts
      ai-model-default-schema.ts
      index.ts
    seeds/
      model-settings-seed.ts
  lib/
    ai/
      provider-factory.ts
      model-resolver.ts
      provider-key-crypto.ts
```

## 4. 数据库设计（`ai_providers` / `ai_models` / `ai_model_defaults`）

### 4.1 `ai_providers`

字段建议：

- `id`: text 主键（UUID）。
- `kind`: text，取值 `openai | openai-compatible`。
- `code`: text 唯一（OpenAI 固定 `openai`）。
- `name`: text。
- `baseUrl`: text。
- `apiKeyCiphertext`: text，可空。
- `enabled`: boolean，默认 `false`。
- `createdAt` / `updatedAt`。

约束建议：

- `code` 唯一。
- 通过“只提供 openai-compatible 新建接口 + seed 固定 openai”保证 OpenAI 单实例。

### 4.2 `ai_models`

字段建议：

- `id`: text 主键。
- `providerId`: text，外键指向 `ai_providers.id`。
- `modelName`: text（上游模型 ID）。
- `displayName`: text，可空。
- `enabled`: boolean，默认 `true`。
- `source`: text，取值 `sync | manual`。
- `raw`: text，可空（保存上游模型原始 JSON）。
- `lastSyncedAt`: timestamp，可空。
- `createdAt` / `updatedAt`。

约束建议：

- 唯一键：`UNIQUE(providerId, modelName)`。

### 4.3 `ai_model_defaults`

字段建议：

- `id`: integer，固定为 `1`。
- `evaluateModelId`: text，可空，外键指向 `ai_models.id`。
- `optimizeModelId`: text，可空，外键指向 `ai_models.id`。
- `updatedAt`: timestamp。

约束建议：

- 表内仅维护一行配置（`id=1`）。

## 5. 启动阶段初始化脚本方案（幂等 seed）

目标：在服务启动阶段自动补齐基础数据，但不覆盖用户已配置数据。

流程建议：

1. 新建 `db/seeds/model-settings-seed.ts`，导出 `ensureModelSettingsSeed()`。
2. 在服务启动流程中调用（启动监听前执行）。
3. 在单个事务中完成以下动作：
   - 若不存在 `code=openai`，插入 OpenAI 默认 provider 行；
   - 若不存在 `ai_model_defaults.id=1`，插入空默认配置行。
4. 若数据已存在，则保持原值，确保幂等。

默认插入值建议：

- OpenAI `name="OpenAI"`。
- OpenAI `baseUrl="https://api.openai.com/v1"`。
- OpenAI `enabled=false`。
- OpenAI `apiKeyCiphertext=null`。

## 6. Model Settings API 契约（含请求/响应和校验规则）

接口列表：

1. `GET /api/providers`：查询 provider + models 列表（含脱敏 key 信息）。
2. `POST /api/providers/openai-compatible`：创建兼容 provider。
3. `PUT /api/providers/{providerId}`：更新 provider 配置与启用状态。
4. `POST /api/providers/{providerId}/models/sync`：拉取并缓存模型。
5. `POST /api/models`：手动新增模型。
6. `PUT /api/models/{modelId}`：更新模型名称/启用状态。
7. `GET /api/model-defaults`：读取评估/优化默认模型。
8. `PUT /api/model-defaults`：设置评估/优化默认模型。

核心校验规则：

- 全接口在 `createRoute.middleware` 中挂 `requireAuth()`。
- `openai-compatible` 创建时 `baseUrl` 必填且必须是合法 URL。
- 更新 `apiKey`：
  - 缺省表示不变；
  - 传空字符串表示清空；
  - 非空字符串表示替换并加密存储。
- 禁用 provider 或模型时，若命中默认模型，直接拒绝并返回 422，要求先调整默认配置。

## 7. Prompt 运行时模型解析流程（默认与覆盖逻辑）

适用于：

- `POST /api/prompt/evaluate`
- `POST /api/prompt/optimize`

解析步骤：

1. 请求携带 `modelId` 时，优先使用显式模型。
2. 未携带 `modelId` 时，回退到对应默认模型（评估或优化）。
3. 校验模型可用性：
   - 模型存在；
   - 模型启用；
   - provider 启用；
   - provider 已配置 apiKey。
4. 任一校验失败，返回 422（状态不合法）或 404（资源不存在）。
5. 解析成功后返回运行时模型对象用于 AI SDK 调用。

响应建议附带：

- `resolvedModel`: `{ providerId, providerKind, modelId, modelName }`，便于追踪实际执行模型。

## 8. AI SDK Provider 工厂设计（openai/openai-compatible）

建议统一工厂入口：`lib/ai/provider-factory.ts`。

分支规则：

- `openai`：
  - 使用 `createOpenAI({ apiKey, baseURL })`；
  - 通过 `provider(modelName)` 创建语言模型。
- `openai-compatible`：
  - 使用 `createOpenAICompatible({ name: provider.code, apiKey, baseURL })`；
  - 通过 `provider(modelName)` 创建语言模型。

baseUrl 规则：

- OpenAI 未配置时回落官方默认地址。
- openai-compatible 必须配置 `baseUrl`。

## 9. API Key 加密与脱敏策略

密钥来源：

- 使用 `AI_PROVIDER_SECRET_KEY`（base64 解码为 32 字节）作为主密钥。

加密建议：

- 算法：AES-256-GCM。
- 密文格式：`v1:iv:ciphertext:tag`（各片段 base64）。

返回策略：

- 任何接口均不返回明文 `apiKey`。
- 列表/详情返回 `hasApiKey` 与 `apiKeyMasked`（示例：`sk-****abcd`）。

日志策略：

- 不记录原始密钥、解密后密钥或完整授权头。

## 10. 事务与错误码约定

事务规范沿用 `AGENTS.md` 与 `.agents/skills/backend-conventions/SKILL.md` 中的事务与错误处理约定，这里仅列出与本方案相关的业务错误码。

错误码建议：

- `PROVIDER_NOT_FOUND`
- `MODEL_NOT_FOUND`
- `PROVIDER_DISABLED`
- `MODEL_DISABLED`
- `DEFAULT_MODEL_NOT_SET`
- `DEFAULT_MODEL_INVALID`
- `PROVIDER_API_KEY_MISSING`
- `MODEL_SYNC_FAILED`
- `MODEL_CONFLICT`

## 11. 前端联动调用流程

页面初始化：

1. 读取 `GET /api/providers`。
2. 读取 `GET /api/model-defaults`。

模型设置页操作：

1. 新增兼容 provider：`POST /api/providers/openai-compatible`。
2. 更新 provider：`PUT /api/providers/{providerId}`。
3. 同步模型：`POST /api/providers/{providerId}/models/sync`。
4. 手动新增模型：`POST /api/models`。
5. 更新模型状态：`PUT /api/models/{modelId}`。
6. 设置默认模型：`PUT /api/model-defaults`。

评估/优化页：

1. 默认选项为“使用默认模型”（不传 `modelId`）。
2. 选择具体模型时，显式传 `modelId` 覆盖默认。
3. 收到 422 默认失效错误时，引导用户进入模型设置页修复。

## 12. 实现顺序（你手写编码步骤）

1. 新增三张表 schema 与 migration。
2. 接入启动阶段幂等 seed（OpenAI 默认 provider + 默认配置行）。
3. 实现 key 加解密工具 `provider-key-crypto.ts`。
4. 实现 provider 工厂与运行时解析器（`provider-factory.ts`、`model-resolver.ts`）。
5. 完成 `model-settings` 路由模块（routes/handlers/index）。
6. 完成 `prompt` 路由模块并接入模型解析。
7. 在 `routes/index.ts` 聚合并挂载到应用入口。
8. 完成测试与联调。

## 13. 测试清单与验收场景

测试清单：

1. seed 幂等测试：重复执行不会插入重复 OpenAI 行。
2. 加解密测试：round-trip 成功，错误密钥解密失败。
3. 模型同步测试：新增/更新计数正确，重复同步不重复插入。
4. 默认模型校验测试：默认模型失效返回 422。
5. 覆盖逻辑测试：显式 `modelId` 覆盖默认模型生效。
6. 鉴权测试：未登录访问相关接口返回未授权。

验收场景：

1. 完成“配置 provider -> 同步模型 -> 设置默认模型 -> 评估/优化执行”全链路。
2. provider 禁用后，其模型不可执行。
3. API 响应不泄露明文 apiKey。
4. 接口文档说明与错误提示均为中文。

## 14. 假设与默认值

- 当前按单人项目上下文设计，不涉及多用户隔离。
- 模型能力标记在本期不做，后续需要可扩展字段与策略。
- 若后续调整鉴权范围、能力标记或默认回退策略，按同文件持续迭代更新。
