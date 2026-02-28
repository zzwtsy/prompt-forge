# Backend 执行清单

## 1. 开发前清单

- [ ] 已确认需求属于 `apps/backend` 范围，适用本规范。
- [ ] 已阅读 `backend-conventions.full.md`，确认当前版本号与同步日期。
- [ ] 已确认是否需要新增路由模块目录（`src/routes/{module}`）。
- [ ] 已确认是否涉及错误码新增或调整（`codes.ts` / `AppError`）。

## 2. 开发中清单

### 2.1 路由结构与拆分

- [ ] 路由模块目录采用 4 文件结构：`routes/handlers/index/test`。
- [ ] 简单逻辑保留在 `handlers`，仅在复用或复杂编排时拆 `service`。
- [ ] 复杂查询或复用查询才拆 `repository`。

### 2.2 OpenAPI 约束

- [ ] `tags` 使用大驼峰且无空格。
- [ ] `request.body` 优先使用 `jsonContentRequired`。
- [ ] 场景 A（默认标准响应）使用 `jsonApiContent`、`jsonApiError`。
- [ ] 场景 B（非标准响应）才可使用 `jsonContent`，且代码中有原因注释。
- [ ] 接口文案（请求/响应/错误说明）为中文。
- [ ] 中间件写在 `createRoute({ middleware: [...] })`。
- [ ] 状态码导入使用合法写法，未出现 `import { HttpStatusCodes } ...`。

### 2.3 事务与数据一致性

- [ ] 插入/更新/删除默认采用事务包裹。
- [ ] 多步写操作在同一事务内完成，保证原子性。
- [ ] 事务中没有外部网络调用。
- [ ] 异常路径会触发回滚，不存在“部分成功”写入。

### 2.4 错误码与错误响应

- [ ] 新增业务错误先在 `AppErrorCode` 登记，再在业务代码使用。
- [ ] 错误码遵循 `CMMSS` 五位规则，且全局不重复。
- [ ] `status` 显式传入 `AppError`，不从 `code` 反推。
- [ ] `message` 默认中文且语义稳定。
- [ ] `details` 不包含密钥/token/隐私数据。

### 2.5 注释规范

- [ ] 注释统一中文。
- [ ] 注释聚焦“为什么/约束/副作用”。
- [ ] 公开函数、handler、核心工具函数具备 JSDoc。
- [ ] TODO 使用 `TODO(责任人/日期): 原因 + 下一步` 格式。

## 3. 提交前清单

- [ ] 已补充或更新后端测试（`*.test.ts`），覆盖核心成功/失败场景。
- [ ] 已更新 `app.ts` 路由挂载（若新增模块）。
- [ ] 已运行目标验证命令（示例：`bun run --filter backend test`）。
- [ ] 若改动规范文本，已同步更新 docs 与 skill 镜像。

## 4. 验收场景清单

- [ ] “新增 backend 路由并写 openapi”场景下，能产出符合目录与 OpenAPI 约束的代码。
- [ ] “优化 frontend 组件样式”场景下，不应触发本 skill。
- [ ] 套用模板生成的模块文件结构与命名符合规范。
- [ ] 仅修改 docs 未同步 skill 镜像时，PR 清单可识别为不合规。
- [ ] 与 `AGENTS.md` 冲突时，执行结果以 `AGENTS.md` 为准。
