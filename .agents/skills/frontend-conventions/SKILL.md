---
name: frontend-conventions
description: 前端工程开发规范技能。用于 `apps/frontend` 相关任务，包括 TanStack Router 路由拆分与重定向、Alova 请求封装与 ApiEnvelope 解包、页面解耦分层（Route/Page/Component/Hook/Service/Context）、前端错误码映射与状态管理一致性、以及类型检查/lint/验收清单。当需求涉及新增或重构前端路由、调整接口调用层、统一错误处理、补充前端验收规则、全局状态共享（Context）设计、或评审前端实现一致性时使用。
---

# Frontend Conventions

## Workflow

1. 先阅读 `references/frontend-conventions.full.md`，确认当前约束与优先级。
2. 当任务涉及新增页面、重构路由、拆分请求层时，优先套用 `references/templates.md` 中的骨架与片段。
3. 当任务涉及全局状态共享时，对照 Context 专章与 Context 模板，确认使用边界、文件拆分和性能约束。
4. 完成改动前，按 `references/checklists.md` 执行自检，逐条确认路由、分层、请求、错误处理、Context、状态保留与验证命令。

## References

- `references/frontend-conventions.full.md`
  规范正文镜像。用于完整阅读、引用和对照。
- `references/templates.md`
  路由装配模板、page 模块模板、alova 请求模板、Context 模板、错误映射模板。
- `references/checklists.md`
  开发前/开发中/提 PR 前的执行清单与验收清单。

## Guardrails

- 与仓库顶层规则冲突时，以 `AGENTS.md` 为准。
- 生成产物不手改：`apps/frontend/src/routeTree.gen.ts`、`apps/frontend/src/api/*`（除 `index.ts` 外）。
- 本 skill 只约束工程实现，不覆盖视觉风格规范；UI 设计方向由 `frontend-design` 等设计类 skill 负责。
