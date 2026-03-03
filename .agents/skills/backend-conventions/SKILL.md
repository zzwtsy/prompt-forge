---
name: backend-conventions
description: 后端开发规范技能。用于 `apps/backend` 相关任务，包括 Hono 路由目录拆分、OpenAPI 路由定义、数据库事务写入策略、`AppError`/`codes.ts` 错误码设计、以及中文注释规范。当需求涉及新增或重构后端接口、修改错误处理、补充后端测试、或评审后端实现一致性时使用。
---

# Backend Conventions

## Workflow

1. 先按任务类型选择阅读入口，不默认通读全文。
2. 路由与 OpenAPI 任务：阅读 `references/backend-conventions.full.md` 的路由与 OpenAPI 章节，并优先套用 `references/templates.md` 的路由模块骨架与 OpenAPI 片段模板。
3. 事务与写操作任务：阅读 `references/backend-conventions.full.md` 的事务与拆分策略章节，并优先套用 `references/templates.md` 的事务模板。
4. 错误码与错误响应任务：阅读 `references/backend-conventions.full.md` 的错误码章节，套用 `references/templates.md` 的错误码与 `AppError` 模板，并按 `references/checklists.md` 的错误码检查项自检。
5. 提交前与评审任务：按 `references/checklists.md` 执行开发中、提交前与验收清单。

## References

- `references/backend-conventions.full.md`
  规范正文镜像。用于完整对照、按需查阅和引用。
- `references/templates.md`
  路由模块骨架、OpenAPI 片段、事务模板、错误码与 `AppError` 模板。
- `references/checklists.md`
  开发前/开发中/提 PR 前的执行清单与验收清单。
- 与仓库 docs 对齐时，实施方案优先引用 `docs/implementations/*`，规格优先引用 `docs/specs/*`，总览优先引用 `docs/references/*`。

## Guardrails

- 与仓库顶层规则冲突时，以 `AGENTS.md` 为准。
- 注释与面向用户的错误文案默认使用中文，且语义保持稳定。
- 规范用于约束实现方式，不直接替代业务需求与接口契约评审。
