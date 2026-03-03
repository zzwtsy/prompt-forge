# Frontend 模板库

> 适用范围：`apps/frontend/src`

## 目录

- [1. 根路由重定向模板（`/ -> /optimize`）](#tpl-root-redirect)
- [2. pathless 父路由 + 子路由模板](#tpl-pathless-layout)
- [3. useRequest 首屏加载模板](#tpl-use-request-load)
- [4. useRequest 手动提交模板](#tpl-use-request-submit)
- [5. usePagination 列表模板](#tpl-use-pagination)
- [6. useWatcher 条件查询模板](#tpl-use-watcher)
- [7. 薄 service 模板（方法工厂）](#tpl-thin-service)
- [8. request error mapper 模板](#tpl-error-mapper)

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

<a id="tpl-use-request-load"></a>

## 3. useRequest 首屏加载模板

```tsx
import { useRequest } from "alova/client";
import Apis from "@/api";

export function DomainList() {
  const {
    data,
    loading,
    error,
    send: refresh,
  } = useRequest(Apis.Domain.get_api_domain(), {
    immediate: true,
  });

  if (loading) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <button onClick={() => refresh()}>重试</button>;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

<a id="tpl-use-request-submit"></a>

## 4. useRequest 手动提交模板

```tsx
import { useRequest } from "alova/client";
import Apis from "@/api";

export function SaveButton() {
  const { loading, send } = useRequest(
    (payload: { name: string }) => Apis.Domain.post_api_domain({ data: payload }),
    { immediate: false },
  );

  const handleClick = async () => {
    await send({ name: "demo" });
  };

  return (
    <button type="button" disabled={loading} onClick={() => void handleClick()}>
      {loading ? "提交中..." : "提交"}
    </button>
  );
}
```

<a id="tpl-use-pagination"></a>

## 5. usePagination 列表模板

```tsx
import { usePagination } from "alova/client";
import Apis from "@/api";

interface Item {
  id: string;
  title: string;
}

export function HistoryList() {
  const {
    data,
    loading,
    page,
    pageSize,
    total,
    isLastPage,
    next,
  } = usePagination(
    (page, pageSize) => Apis.SavedPrompts.get_api_saved_prompts({
      params: { page, pageSize },
    }),
    {
      initialPage: 1,
      initialPageSize: 20,
      total: response => response.total,
      data: response => response.items as Item[],
    },
  );

  return (
    <div>
      <p>{`第 ${page} 页 / 共 ${total} 条 / 每页 ${pageSize} 条`}</p>
      {loading && <p>加载中...</p>}
      <ul>
        {(data ?? []).map(item => <li key={item.id}>{item.title}</li>)}
      </ul>
      <button type="button" disabled={isLastPage} onClick={next}>加载更多</button>
    </div>
  );
}
```

<a id="tpl-use-watcher"></a>

## 6. useWatcher 条件查询模板

```tsx
import { useMemo, useState } from "react";
import { useWatcher } from "alova/client";
import Apis from "@/api";

export function SearchPanel() {
  const [keyword, setKeyword] = useState("");
  const [providerId, setProviderId] = useState<string | undefined>(undefined);
  const watched = useMemo(() => [keyword, providerId], [keyword, providerId]);

  const { data, loading } = useWatcher(
    () => Apis.Domain.get_api_domain({
      params: {
        keyword: keyword.trim(),
        providerId,
      },
    }),
    watched,
    {
      immediate: true,
      debounce: 300,
    },
  );

  return (
    <div>
      <input value={keyword} onChange={event => setKeyword(event.target.value)} />
      {loading ? <p>搜索中...</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

<a id="tpl-thin-service"></a>

## 7. 薄 service 模板（方法工厂）

```ts
import Apis from "@/api";

export interface ListParams {
  keyword?: string;
  page: number;
  pageSize: number;
}

// 薄 service: 仅做参数归一化与方法聚合，不做机械转发。
export const domainMethods = {
  list(params: ListParams) {
    const keyword = params.keyword?.trim();
    return Apis.Domain.get_api_domain({
      params: {
        ...params,
        keyword: keyword?.length ? keyword : undefined,
      },
    });
  },
  save(payload: { id: string; name: string }) {
    return Apis.Domain.put_api_domain_id({
      pathParams: { id: payload.id },
      data: { name: payload.name.trim() },
    });
  },
};
```

<a id="tpl-error-mapper"></a>

## 8. request error mapper 模板

```ts
import { useCallback } from "react";
import { extractValidationFieldPaths, normalizeClientError } from "@/lib/api-envelope";

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
