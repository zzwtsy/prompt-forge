# Prompt Forge

提示词评估与优化工具（单人版），用于完成提示词评估、优化与结果留存。

## 项目状态

### 已实现

- 前后端基础工程（Bun monorepo）
- 后端基础服务与 OpenAPI 文档页
- Better Auth 基础鉴权路由

### 规划中

- 提示词评估与优化完整业务链路
- 模型设置页面与模型管理
- 优化结果保存与追溯页面

详细需求见：`docs/requirements.md`

## 核心能力（Roadmap）

- Prompt 评估（Planned）
- Prompt 优化（Planned）
- 模型服务商与模型管理（Planned）
- 优化记录保存与追溯（Planned）

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

### 已实现

- `GET /doc`
- `GET /reference`
- `GET|POST /api/auth/*`
- `GET /api/auth/reference`（开发环境）

### 规划中（Planned）

- `POST /api/prompt/evaluate`
- `POST /api/prompt/optimize`
- `GET/PUT /api/providers`
- `POST /api/providers/{id}/models/sync`
- `POST/PUT /api/models`
- `GET/PUT /api/model-defaults`
- `GET /api/saved-prompts`

## 文档

- `docs/requirements.md`
- `docs/prompt.md`

## License

AGPL-3.0-only
