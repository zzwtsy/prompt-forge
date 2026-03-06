# Prompt Forge

提示词评估与优化工具（单人版），用于完成提示词评估、优化与结果留存。

## 项目状态

### 后端实现状态（按当前代码）

- 已实现：提示词评估与优化接口、模型服务商与模型管理接口、默认评估/优化模型配置、优化结果保存查询与重试保存链路、统一鉴权与错误响应。
- 前端已实现：`/optimize`、`/models`、`/history` 三个业务页面与核心交互链路（评估/优化、模型设置、历史查询与复制）。
- 前端持续演进：工程规范、拆分策略与可访问性/测试基线按前端规范文档持续收敛。

详细需求见：`docs/specs/spec-product-requirements.md`。  
说明：需求文档是目标态定义；README 中“已实现/未实现”按当前仓库后端代码（`apps/backend/src`）标注。

### 前端工程规范入口

- `apps/frontend/**` 相关实现规范请优先参考：`.agents/skills/frontend-conventions/SKILL.md`
- 规范正文与模板：
  - `.agents/skills/frontend-conventions/references/frontend-conventions.full.md`
  - `.agents/skills/frontend-conventions/references/templates.md`
  - `.agents/skills/frontend-conventions/references/checklists.md`

## 后端能力实现矩阵（对齐 spec-product-requirements.md）

| 需求编号 | 状态 | 后端实现说明 |
| --- | --- | --- |
| `MS-01` | 前端范围 | 独立“模型设置”页面属于前端 UI 范围；后端已提供所需模型设置接口。 |
| `MS-02` | 已实现 | 支持服务商启用/禁用（`PUT /api/providers/{providerId}`）。 |
| `MS-03` | 已实现 | 支持模型启用/禁用（`PUT /api/models/{modelId}`）。 |
| `MS-04` | 已实现 | 服务商支持配置 `baseUrl/apiKey`；`apiKey` 密文存储，仅返回脱敏值与存在标记。 |
| `MS-05` | 已实现 | 支持手动同步模型并缓存入库（`POST /api/providers/{providerId}/models/sync`）。 |
| `MS-06` | 已实现 | 支持手动新增模型（`POST /api/models`）。 |
| `MS-07` | 已实现 | 支持评估默认模型与优化默认模型读取/设置（`GET/PUT /api/model-defaults`）。 |
| `PO-01` | 已实现 | 评估与优化接口均支持显式传入 `modelId`。 |
| `PO-02` | 已实现 | 支持 `temperature` 参数配置，并映射到 AI SDK 调用参数。 |
| `PO-03` | 前端范围 | “复制评估结果”属于前端交互能力，不作为后端能力声明。 |
| `PO-04` | 前端范围 | “复制优化提示词”属于前端交互能力，不作为后端能力声明。 |
| `PO-05` | 已实现 | `POST /api/prompt/optimize` 优化后自动尝试保存，持久化 `prompt_runs/saved_prompts`。 |
| `SP-01` | 前端范围 | “优化结果保存页面”属于前端页面范围；后端接口已提供。 |
| `SP-02` | 已实现 | `GET /api/saved-prompts` 仅返回优化后提示词列表与分页游标。 |
| `SP-03` | 已实现 | 返回 `promptRunId`，支持追溯到来源优化任务。 |

## 后端实现说明

- 鉴权：模型设置与提示词运行时接口均要求登录态（`requireAuth` 中间件）。
- 统一响应结构：
  - 成功：`{ success: true, data, requestId? }`
  - 失败：`{ success: false, error: { code, message, details? }, requestId? }`
- 优化保存链路：
  - `POST /api/prompt/optimize` 优化成功后自动尝试保存 `prompt_runs/saved_prompts`。
  - 保存失败时返回 `persistence.saved=false` 与 `saveDraft`（可重试草稿）。
  - `POST /api/saved-prompts/retry` 支持幂等补保存（不重复调用模型）。
- Prompt 优化接口补充：
  - 请求支持可选 `evaluateContext`。
  - 响应包含 `promptRunId`、`savedPromptId`、`persistence`（`saveDraft` 可选）。
- 错误码：使用统一 `AppError` + `AppErrorCode` 体系，覆盖认证、参数校验、资源不存在、模型不可用等场景。
- 密钥安全：Provider `apiKey` 使用 AES-256-GCM 密文存储，接口侧仅返回 `hasApiKey` 与 `apiKeyMasked`。
- 启动初始化：服务启动时执行幂等 seed，补齐 OpenAI provider 与默认模型配置单例行。
- 测试现状：后端 Vitest 当前覆盖 9 个测试文件、38 个用例（当前仓库状态）。

## 技术栈

- 前端：React 19 + Vite + TanStack Router + Tailwind CSS v4 + shadcn/ui
- 后端：Bun + Hono + Zod OpenAPI + Better Auth
- 数据库：SQLite + Drizzle ORM
- AI：Vercel AI SDK（OpenAI / OpenAI-compatible）

## 目录结构

```txt
.
├─ apps/
│  ├─ frontend/   # Web 前端
│  └─ backend/    # API 与鉴权服务
├─ docs/          # 需求与提示词文档
└─ README.md
```

## 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 配置环境变量

```bash
cp apps/backend/.env.example apps/backend/.env
```

按需填写以下关键变量：

- `DATABASE_URL`：SQLite 数据库连接串（本地文件）
- `BETTER_AUTH_SECRET`：鉴权密钥（至少 32 位）
- `BETTER_AUTH_URL`：鉴权服务访问地址（本地通常是 `http://localhost:3001`）
- `AI_PROVIDER_SECRET_KEY`：Provider API Key 加密主密钥（base64）
- `PROMPT_SAVE_DRAFT_SECRET`：保存草稿签名密钥（用于 `/api/saved-prompts/retry`）
- `LOG_LEVEL`：日志级别（建议开发环境使用 `debug`）

### 3. 初始化数据库

```bash
bun run db:migrate
```

### 4. 启动开发服务

终端 1：

```bash
bun run dev:backend
```

终端 2：

```bash
bun run dev:frontend
```

### 5. 访问地址

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- API Reference: `http://localhost:3001/reference`
- Auth Reference（开发环境）: `http://localhost:3001/api/auth/reference`

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `bun run dev:frontend` | 启动前端开发服务 |
| `bun run dev:backend` | 启动后端开发服务 |
| `bun run build:frontend` | 构建前端 |
| `bun run build:backend` | 构建后端 |
| `bun run preview:frontend` | 本地预览前端构建结果 |
| `bun run db:generate` | 生成 Drizzle migration |
| `bun run db:check` | 检查 migration 与 schema 状态 |
| `bun run db:migrate` | 执行 migration |
| `bun run db:push` | 将 schema 直接推送到数据库 |
| `bun run db:studio` | 打开 Drizzle Studio |
| `bun run lint` | 代码检查 |
| `bun run lint:fix` | 自动修复可修复的问题 |

## API 状态

### 已实现接口（按当前后端代码）

- `GET /doc`
- `GET /reference`
- `GET|POST /api/auth/*`
- `GET /api/auth/reference`（开发环境）
- `GET /api/providers`
- `POST /api/providers/openai-compatible`
- `PUT /api/providers/{providerId}`
- `POST /api/providers/{providerId}/models/sync`
- `POST /api/models`
- `PUT /api/models/{modelId}`
- `GET /api/model-defaults`
- `PUT /api/model-defaults`
- `POST /api/prompt/evaluate`
- `POST /api/prompt/optimize`
- `GET /api/saved-prompts`
- `POST /api/saved-prompts/retry`

### 需求外扩展接口

- `POST /api/saved-prompts/retry`：用于“优化成功但保存失败”场景下的补保存能力（幂等重试）。

## 文档

- `docs/README.md`
- `docs/specs/spec-product-requirements.md`
- `docs/specs/spec-ui-requirements.md`
- `docs/specs/spec-extension-history-search.md`
- `docs/implementations/impl-model-settings.md`
- `docs/implementations/impl-prompt-history.md`
- `docs/references/reference-backend-flow-overview.md`
- `docs/assets/asset-prompt-evaluation-and-refinement.md`

## License

AGPL-3.0-only
