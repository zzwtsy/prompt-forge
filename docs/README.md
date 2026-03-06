# Docs 信息架构说明

本目录采用“按职责分层 + 统一命名前缀”的文档组织方式，目标是降低检索成本与跨文档维护成本。

## 1. 目录分层

```text
docs/
  README.md
  specs/
    spec-product-requirements.md
    spec-ui-requirements.md
    spec-extension-history-search.md
  implementations/
    impl-model-settings.md
    impl-prompt-history.md
  references/
    reference-backend-flow-overview.md
  assets/
    asset-prompt-evaluation-and-refinement.md
```

## 2. 命名规范

- `spec-*`：面向需求/规格定义（What + Scope + Acceptance）。
- `impl-*`：面向落地实施方案（How）。
- `reference-*`：面向系统认知与排障参考（Know-how）。
- `asset-*`：素材型文档（Prompt、模板、示例资产）。

## 3. 推荐阅读顺序

1. `specs/spec-product-requirements.md`
2. `specs/spec-ui-requirements.md`
3. `specs/spec-extension-history-search.md`（如涉及历史搜索扩展）
4. `references/reference-backend-flow-overview.md`
5. `implementations/impl-model-settings.md`
6. `implementations/impl-prompt-history.md`

## 4. 维护规则

- 新文档必须放入上述分类目录，不再放在 `docs/` 根目录。
- 任何重命名/移动都必须同步更新跨文档引用与 `README.md` 中的文档索引。
- 后端规范相关引用统一以 `AGENTS.md` 与 `.agents/skills/backend-conventions/SKILL.md` 为准。
- 工程实现规范入口位于 `.agents/skills/*/references`（例如前端规范），不纳入 `docs/` 目录树。
