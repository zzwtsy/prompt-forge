# Frontend 模板库（Page 主轴）

> 适用范围：`apps/frontend/src`

## 目录

- [1. 根路由重定向模板（`/ -> /optimize`）](#tpl-root-redirect)
- [2. 薄壳路由装配模板（Route -> Page）](#tpl-thin-route)
- [3. page 模块脚手架模板](#tpl-page-module)
- [4. useRequest 首屏加载模板](#tpl-use-request-load)
- [5. useRequest 手动提交模板](#tpl-use-request-submit)
- [6. usePagination 列表模板](#tpl-use-pagination)
- [7. useWatcher 条件查询模板](#tpl-use-watcher)
- [8. 薄 service 模板（方法工厂）](#tpl-thin-service)
- [9. request error mapper 模板](#tpl-error-mapper)

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

<a id="tpl-thin-route"></a>

## 2. 薄壳路由装配模板（Route -> Page）

```tsx
// routes/optimize.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { OptimizePage } from "@/page/optimize";

export const Route = createFileRoute("/optimize")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: OptimizePage,
});
```

```tsx
// routes/models.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ModelsPage } from "@/page/models";

export const Route = createFileRoute("/models")({
  component: ModelsPage,
});
```

<a id="tpl-page-module"></a>

## 3. page 模块脚手架模板

```text
src/
  page/
    optimize/
      optimize.page.tsx
      components/
        optimize-form.tsx
      hooks/
        use-optimize-state.ts
      services/
        optimize.service.ts
      types.ts
      constants.ts
      optimize.util.ts
      index.ts
```

```tsx
// page/optimize/index.ts
export { OptimizePage } from "./optimize.page";
```

```tsx
// page/optimize/optimize.page.tsx
import { OptimizeForm } from "./components/optimize-form";

export function OptimizePage() {
  return (
    <main>
      <OptimizeForm />
    </main>
  );
}
```

<a id="tpl-use-request-load"></a>

## 4. useRequest 首屏加载模板

```tsx
// page/optimize/components/model-list.tsx
import { useRequest } from "alova/client";
import Apis from "@/api";

export function ModelList() {
  const { data, loading, error, send: refresh } = useRequest(
    Apis.ModelSettings.get_api_providers(),
    { immediate: true },
  );

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

## 5. useRequest 手动提交模板

```tsx
// page/optimize/components/optimize-submit-button.tsx
import { useRequest } from "alova/client";
import Apis from "@/api";

export function OptimizeSubmitButton() {
  const { loading, send } = useRequest(
    (payload: { prompt: string }) => Apis.PromptRuntime.post_api_prompt_optimize({ data: payload }),
    { immediate: false },
  );

  const handleSubmit = async () => {
    await send({ prompt: "请优化这段提示词" });
  };

  return (
    <button type="button" disabled={loading} onClick={() => void handleSubmit()}>
      {loading ? "提交中..." : "提交"}
    </button>
  );
}
```

<a id="tpl-use-pagination"></a>

## 6. usePagination 列表模板

```tsx
// page/history/components/history-list.tsx
import { usePagination } from "alova/client";
import Apis from "@/api";

interface HistoryItem {
  id: string;
  optimizedPrompt: string;
}

export function HistoryList() {
  const { data, loading, isLastPage, next } = usePagination(
    (page, pageSize) => Apis.SavedPrompts.get_api_saved_prompts({
      params: { page, pageSize },
    }),
    {
      initialPage: 1,
      initialPageSize: 20,
      data: response => response.items as HistoryItem[],
      total: response => response.total,
    },
  );

  return (
    <div>
      {loading && <p>加载中...</p>}
      <ul>
        {(data ?? []).map(item => <li key={item.id}>{item.optimizedPrompt}</li>)}
      </ul>
      <button type="button" disabled={isLastPage} onClick={next}>加载更多</button>
    </div>
  );
}
```

<a id="tpl-use-watcher"></a>

## 7. useWatcher 条件查询模板

```tsx
// page/models/components/model-search.tsx
import { useMemo, useState } from "react";
import { useWatcher } from "alova/client";
import Apis from "@/api";

export function ModelSearch() {
  const [keyword, setKeyword] = useState("");
  const watched = useMemo(() => [keyword], [keyword]);

  const { data, loading } = useWatcher(
    () => Apis.ModelSettings.get_api_providers({
      params: {
        keyword: keyword.trim(),
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

## 8. 薄 service 模板（方法工厂）

```ts
// page/models/services/models.service.ts
import Apis from "@/api";

export interface QueryProvidersParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// 薄 service: 仅做参数归一化与方法聚合，不做机械转发。
export const modelMethods = {
  queryProviders(params: QueryProvidersParams) {
    const keyword = params.keyword?.trim();
    return Apis.ModelSettings.get_api_providers({
      params: {
        ...params,
        keyword: keyword?.length ? keyword : undefined,
      },
    });
  },
  saveDefaults(payload: { evaluateModelId: string | null; optimizeModelId: string | null }) {
    return Apis.ModelSettings.put_api_model_defaults({
      data: payload,
    });
  },
};
```

<a id="tpl-error-mapper"></a>

## 9. request error mapper 模板

```ts
// page/shared/hooks/use-request-error.ts
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
