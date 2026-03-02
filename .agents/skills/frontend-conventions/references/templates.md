# Frontend 模板库

> 适用范围：`apps/frontend/src`

## 目录

- [1. 根路由重定向模板（`/ -> /optimize`）](#tpl-root-redirect)
- [2. pathless 父路由 + 子路由模板](#tpl-pathless-layout)
- [3. service 请求模板（含 ApiEnvelope 解包）](#tpl-service)
- [4. request error mapper 模板](#tpl-error-mapper)
- [5. tab 页面组件模板（状态边界）](#tpl-tab-component)

<a id="tpl-root-redirect"></a>

## 1. 根路由重定向模板（`/ -> /optimize`）

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/optimize" });
  },
  component: () => null,
});
```

<a id="tpl-pathless-layout"></a>

## 2. pathless 父路由 + 子路由模板

```tsx
// routes/_workbench.tsx
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_workbench")({
  component: WorkbenchLayout,
});

function WorkbenchLayout() {
  return (
    <main>
      <nav>
        <Link to="/optimize">优化</Link>
        <Link to="/models">模型</Link>
        <Link to="/history">历史</Link>
      </nav>
      {/* 三个面板保持 mounted，仅通过显隐切换 */}
    </main>
  );
}
```

```tsx
// routes/_workbench.optimize.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_workbench/optimize")({
  component: () => null,
});
```

<a id="tpl-service"></a>

## 3. service 请求模板（含 ApiEnvelope 解包）

```ts
import Apis from "@/api";
import { unwrapApiEnvelope } from "@/lib/api-envelope";

export async function fetchDomainData() {
  const response = await Apis.Domain.get_api_domain().send();
  return unwrapApiEnvelope<{ items: Array<{ id: string }> }>(response);
}
```

<a id="tpl-error-mapper"></a>

## 4. request error mapper 模板

```ts
import { useCallback } from "react";
import {
  extractValidationFieldPaths,
  normalizeClientError,
} from "@/lib/api-envelope";

export function useRequestError(showNotice: (payload: { title: string; message: string }) => void) {
  const handleRequestError = useCallback((error: unknown, onValidationError?: (paths: Set<string>) => void) => {
    const normalized = normalizeClientError(error);

    if (normalized.code === 30001 && onValidationError) {
      onValidationError(extractValidationFieldPaths(normalized.details));
      return;
    }

    showNotice({
      title: "请求失败",
      message: normalized.message,
    });
  }, [showNotice]);

  return { handleRequestError };
}
```

<a id="tpl-tab-component"></a>

## 5. tab 页面组件模板（状态边界）

```tsx
interface TabProps {
  onShowNotice: (payload: { title: string; message: string }) => void;
  onRequestError: (error: unknown) => void;
}

export function DomainTab(props: TabProps) {
  const { onShowNotice, onRequestError } = props;

  const handleSubmit = async () => {
    try {
      // 调用 service 层函数
      onShowNotice({ title: "成功", message: "操作已完成" });
    } catch (error) {
      onRequestError(error);
    }
  };

  return <button onClick={handleSubmit}>提交</button>;
}
```
