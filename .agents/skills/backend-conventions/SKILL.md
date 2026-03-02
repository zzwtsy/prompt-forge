---
name: backend-conventions
description: 后端开发规范技能。用于 `apps/backend` 相关任务，包括 Hono 路由目录拆分、OpenAPI 路由定义、数据库事务写入策略、`AppError`/`codes.ts` 错误码设计、以及中文注释规范。当需求涉及新增或重构后端接口、修改错误处理、补充后端测试、或评审后端实现一致性时使用。
---

# Backend Conventions

## Workflow

1. 先阅读 `references/backend-conventions.full.md`，确认当前约束与优先级。
2. 当任务涉及新增模块或改造接口时，优先套用 `references/templates.md` 中的骨架与片段。
3. 完成改动前，按 `references/checklists.md` 执行自检，逐条确认目录结构、OpenAPI、事务、错误码、注释与测试。

## References

- `references/backend-conventions.full.md`
  规范正文镜像。用于完整阅读、引用和对照。
- `references/templates.md`
  路由模块骨架、OpenAPI 片段、事务模板、错误码与 `AppError` 模板。
- `references/checklists.md`
  开发前/开发中/提 PR 前的执行清单与验收清单。
- 与仓库 docs 对齐时，实施方案优先引用 `docs/implementations/*`，规格优先引用 `docs/specs/*`，总览优先引用 `docs/references/*`。

## Guardrails

- 与仓库顶层规则冲突时，以 `AGENTS.md` 为准。
- 注释与面向用户的错误文案默认使用中文，且语义保持稳定。
- 规范用于约束实现方式，不直接替代业务需求与接口契约评审。
