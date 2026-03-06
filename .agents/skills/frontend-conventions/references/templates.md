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
- [10. React Context 标准模板（React 19）](#tpl-react-context)
- [11. Page + Content 与内联选择模板](#tpl-page-content)
- [12. 大 hook 拆分模板](#tpl-large-hook-split)
- [13. SectionVM 页面装配模板](#tpl-section-vm)

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
        optimize-content.tsx    # 可选：仅当需要容器编排价值时保留
        optimize-form.tsx
      hooks/
        use-optimize-page-state.ts
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

适用边界：

- 优先用于局部独立请求组件（不会承担跨组件业务编排）。
- 业务主流程请求建议放在 `Page orchestration hook` 或 `Section hook`。

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

适用边界：

- 适合单一动作按钮或局部提交组件。
- 若涉及跨组件协同（校验链路、写后刷新、错误分发），应上移到 page/section hook。

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

适用边界：

- 适合局部列表组件自管分页状态。
- 若分页结果需与页面其他区块联动，建议提升到 page/section hook 统一编排。

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

适用边界：

- 适合局部条件查询和即时过滤组件。
- 若查询结果是页面级共享数据源，应由 page/section hook 承担。

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

<a id="tpl-react-context"></a>

## 10. React Context 标准模板（React 19）

Context 适用边界：

- 适合跨模块共享、更新频率低或中等的状态。
- 请求 loading/data/error 不放 Context，优先用 Alova hooks。

### 10.1 基础模板（单 Context）

```ts
// src/lib/context/auth/auth-context.ts
import { createContext } from "react";

export interface AuthSnapshot {
  isAuthenticated: boolean;
  isPending: boolean;
  user: unknown | null;
  session: unknown | null;
}

export const AuthContext = createContext<AuthSnapshot | null>(null);
```

```tsx
// src/lib/context/auth/auth-provider.tsx
import type { ReactNode } from "react";
import { useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const sessionState = authClient.useSession();
  const sessionData = sessionState.data;

  const value = useMemo(() => ({
    isAuthenticated: Boolean(sessionData?.user && sessionData?.session),
    isPending: sessionState.isPending,
    user: sessionData?.user ?? null,
    session: sessionData?.session ?? null,
  }), [sessionData, sessionState.isPending]);

  return <AuthContext value={value}>{children}</AuthContext>;
}
```

```ts
// src/lib/context/auth/use-auth.ts
import { use } from "react";
import { AuthContext } from "./auth-context";

export function useAuth() {
  const value = use(AuthContext);
  if (value === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
```

### 10.2 按需拆分模板（State + Actions）

升级时机：

- 状态更新频率高，或 Context value 体积大导致无关组件重渲染明显。

```ts
// src/lib/context/settings/settings-state-context.ts
import { createContext } from "react";

export interface SettingsState {
  language: "zh-CN" | "en-US";
  compactMode: boolean;
}

export const SettingsStateContext = createContext<SettingsState | null>(null);
```

```ts
// src/lib/context/settings/settings-actions-context.ts
import { createContext } from "react";

export interface SettingsActions {
  setLanguage: (lang: "zh-CN" | "en-US") => void;
  toggleCompactMode: () => void;
}

export const SettingsActionsContext = createContext<SettingsActions | null>(null);
```

```tsx
// src/lib/context/settings/settings-provider.tsx
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { SettingsActionsContext } from "./settings-actions-context";
import { SettingsStateContext } from "./settings-state-context";

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [language, setLanguage] = useState<"zh-CN" | "en-US">("zh-CN");
  const [compactMode, setCompactMode] = useState(false);

  const stateValue = useMemo(() => ({
    language,
    compactMode,
  }), [compactMode, language]);

  const toggleCompactMode = useCallback(() => {
    setCompactMode(prev => !prev);
  }, []);

  const actionValue = useMemo(() => ({
    setLanguage,
    toggleCompactMode,
  }), [toggleCompactMode]);

  return (
    <SettingsActionsContext value={actionValue}>
      <SettingsStateContext value={stateValue}>
        {children}
      </SettingsStateContext>
    </SettingsActionsContext>
  );
}
```

```ts
// src/lib/context/settings/use-settings-state.ts
import { use } from "react";
import { SettingsStateContext } from "./settings-state-context";

export function useSettingsState() {
  const value = use(SettingsStateContext);
  if (value === null) {
    throw new Error("useSettingsState must be used within SettingsProvider");
  }
  return value;
}
```

```ts
// src/lib/context/settings/use-settings-actions.ts
import { use } from "react";
import { SettingsActionsContext } from "./settings-actions-context";

export function useSettingsActions() {
  const value = use(SettingsActionsContext);
  if (value === null) {
    throw new Error("useSettingsActions must be used within SettingsProvider");
  }
  return value;
}
```

<a id="tpl-page-content"></a>

## 11. Page + Content 与内联选择模板

选择规则：

- 保留 `xxx-content`：当页面需要聚合多个区块并进行 props 映射/编排。
- 直接内联到 `.page.tsx`：当仅有一层透传、无额外编排价值。

```tsx
// page/optimize/optimize.page.tsx (保留 content)
import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { OptimizeContent } from "./components/optimize-content";
import { useOptimizePageState } from "./hooks/use-optimize-page-state";

export function OptimizePage() {
  const { handleRequestError } = useWorkbenchErrorHandler();
  const { state, actions } = useOptimizePageState({
    onRequestError: handleRequestError,
  });

  return <OptimizeContent state={state} actions={actions} />;
}
```

```tsx
// page/history/history.page.tsx (可内联)
import { useWorkbenchErrorHandler } from "@/lib/workbench-shell";
import { useWorkbenchShellStore } from "@/store";
import { useHistoryPageState } from "./hooks/use-history-page-state";
import { HistoryListPanel } from "./components/history-list-panel";

export function HistoryPage() {
  const historyRefreshToken = useWorkbenchShellStore(state => state.historyRefreshToken);
  const { handleRequestError } = useWorkbenchErrorHandler();
  const { state, actions } = useHistoryPageState({
    refreshToken: historyRefreshToken,
    onRequestError: handleRequestError,
  });

  return (
    <HistoryListPanel
      items={state.items}
      filteredItems={state.filteredItems}
      activeItemId={state.activeItemId}
      nextCursor={state.nextCursor}
      initialLoading={state.initialLoading}
      loadingMore={state.loadingMore}
      onSelectItem={actions.selectItem}
      onCopyPrompt={actions.copyPrompt}
      onLoadMore={actions.loadMore}
    />
  );
}
```

<a id="tpl-large-hook-split"></a>

## 12. 大 hook 拆分模板

适用边界：

- 单 hook `>180` 行，或异步动作 `>4`，或混合请求编排/校验/副作用时。

```ts
// page/optimize/hooks/use-optimize-page-state.ts
import type { OptimizePageActions, OptimizePageState } from "../types";
import { useOptimizeActions } from "./use-optimize-actions";
import { useOptimizeResource } from "./use-optimize-resource";

export function useOptimizePageState(): { state: OptimizePageState; actions: OptimizePageActions } {
  const resource = useOptimizeResource();
  const actions = useOptimizeActions(resource);

  return {
    state: resource.state,
    actions,
  };
}
```

```ts
// page/optimize/hooks/use-optimize-resource.ts
export function useOptimizeResource() {
  // 负责请求状态、共享数据、派生状态
  return {
    state: {
      // ...
    },
    refs: {
      // ...
    },
  };
}
```

```ts
// page/optimize/hooks/use-optimize-actions.ts
export function useOptimizeActions(resource: {
  state: Record<string, unknown>;
  refs: Record<string, unknown>;
}) {
  // 负责动作、校验、通知、副作用
  return {
    // ...
  };
}
```

<a id="tpl-section-vm"></a>

## 13. SectionVM 页面装配模板

适用边界：

- 页面由多个业务区块组成，且每个区块有独立状态与动作集合。

```ts
// page/models/types.ts
export interface SectionVM<S, A> {
  state: S;
  actions: A;
}
```

```tsx
// page/demo/demo.page.tsx (示意)
import type { SectionVM } from "./types";
import { DemoContent } from "./components/demo-content";
import { useSidebarSection } from "./hooks/use-sidebar-section";
import { useSettingsSection } from "./hooks/use-settings-section";

interface DemoSections {
  sidebar: SectionVM<{ activeId: string | null }, { select: (id: string) => void }>;
  settings: SectionVM<{ loading: boolean }, { save: () => Promise<void> }>;
}

export function DemoPage() {
  const sidebar = useSidebarSection();
  const settings = useSettingsSection({ activeId: sidebar.state.activeId });

  const sections: DemoSections = {
    sidebar,
    settings,
  };

  return <DemoContent sections={sections} />;
}
```
