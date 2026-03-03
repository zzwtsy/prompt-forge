---
name: frontend-conventions
description: 前端工程开发规范技能。用于 `apps/frontend` 相关任务，包括 TanStack Router 路由拆分与重定向、Alova 请求封装与 ApiEnvelope 解包、页面解耦分层（Route/Page/Component/Hook/Service/Context）、前端错误码映射与状态管理一致性、以及类型检查/lint/验收清单。当需求涉及新增或重构前端路由、调整接口调用层、统一错误处理、补充前端验收规则、全局状态共享（Context）设计、或评审前端实现一致性时使用。
---

# Frontend Conventions

## Workflow

1. 先按任务类型选择阅读入口，不默认通读全文。
2. 路由与页面装配任务：阅读 `references/frontend-conventions.full.md` 的路由章节，并优先套用 `references/templates.md` 的根路由/薄壳路由/page 模块模板。
3. 请求层与错误处理任务：阅读 `references/frontend-conventions.full.md` 的 Alova 与 ApiEnvelope 章节，并套用 `references/templates.md` 的 alova hook、薄 service、error mapper 模板。
4. Context 与跨页面状态共享任务：阅读 `references/frontend-conventions.full.md` 的状态管理与 Context 章节，并套用 `references/templates.md` 的 Context 模板。
5. 提交前与评审任务：按 `references/checklists.md` 执行开发前、开发中、提交前与验收清单。

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
