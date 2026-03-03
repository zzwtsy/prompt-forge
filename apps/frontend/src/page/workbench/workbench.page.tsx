import type { GlobalNotice, ModelDefaultsData, NoticeInput, ProviderItem, WorkbenchTab } from "./types";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useRequest } from "alova/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildLoginRedirectTarget } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { HistoryTab } from "./components/history-tab";
import { ModelSettingsTab } from "./components/model-settings-tab";
import { NoticeBanner } from "./components/notice-banner";
import { OptimizeTab } from "./components/optimize-tab";
import { WORKBENCH_TAB_PATHS, WORKBENCH_TABS } from "./constants";
import { useWorkbenchRequestError } from "./hooks/use-workbench-request-error";
import { modelSettingsMethods } from "./services/model-settings.service";
import { getWorkbenchTabFromPathname, tabLabel } from "./utils";

const EMPTY_DEFAULTS: ModelDefaultsData = {
  evaluateModelId: null,
  optimizeModelId: null,
};

function unwrapResponseData<T>(response: T | { data: T } | undefined): T | undefined {
  if (response === undefined) {
    return undefined;
  }

  return (typeof response === "object" && response !== null && "data" in response)
    ? response.data as T
    : response;
}

export function WorkbenchPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [notice, setNotice] = useState<GlobalNotice | null>(null);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  const {
    data: providersResponse,
    loading: providersLoading,
    error: providersError,
    send: refreshProviders,
  } = useRequest(() => modelSettingsMethods.queryProviders(), { immediate: true });

  const {
    data: defaultsData,
    loading: defaultsLoading,
    error: defaultsError,
    send: refreshDefaults,
  } = useRequest(() => modelSettingsMethods.queryDefaults(), { immediate: true });

  const providersData = unwrapResponseData<{ providers: ProviderItem[] }>(providersResponse);
  const providers = providersData?.providers ?? [];
  const defaults = unwrapResponseData<ModelDefaultsData>(defaultsData) ?? EMPTY_DEFAULTS;
  const settingsLoading = providersLoading || defaultsLoading;

  const activeTab = useMemo(() => {
    return getWorkbenchTabFromPathname(location.pathname);
  }, [location.pathname]);

  const showNotice = useCallback((input: NoticeInput) => {
    setNotice({
      id: Date.now(),
      ...input,
    });
  }, []);

  const navigateToTab = useCallback((tab: WorkbenchTab) => {
    void navigate({
      to: WORKBENCH_TAB_PATHS[tab],
    });
  }, [navigate]);

  const redirectToLogin = useCallback(() => {
    void navigate({
      to: "/login",
      search: {
        redirect: buildLoginRedirectTarget(location),
      },
      replace: true,
    });
  }, [location, navigate]);

  const { handleRequestError } = useWorkbenchRequestError({
    showNotice,
    navigateToTab,
    redirectToLogin,
  });

  const refreshModelSettings = useCallback(async (silent = false) => {
    try {
      await Promise.all([
        refreshProviders(),
        refreshDefaults(),
      ]);
      return true;
    } catch (error) {
      if (!silent) {
        handleRequestError(error, {
          fallbackTitle: "加载模型设置失败",
        });
      }
      return false;
    }
  }, [handleRequestError, refreshDefaults, refreshProviders]);

  const lastInitialErrorRef = useRef<unknown>(null);
  useEffect(() => {
    const error = providersError ?? defaultsError;
    if (error == null || lastInitialErrorRef.current === error) {
      return;
    }

    lastInitialErrorRef.current = error;
    handleRequestError(error, {
      fallbackTitle: "加载模型设置失败",
    });
  }, [defaultsError, handleRequestError, providersError]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_20%,rgba(239,246,255,0.95),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(236,253,245,0.9),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-8 md:py-10">
        <header className="animate-in fade-in-0 slide-in-from-top-1 duration-500">
          <p className="text-sm tracking-wide text-slate-500">Prompt Forge Workbench</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">提示词优化工作台</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
            在单页完成提示词评估、优化、模型配置与历史回查。Tab 切换不会清空当前会话输入。
          </p>
        </header>

        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-500 delay-75 rounded-full border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur">
          <div className="grid grid-cols-3 gap-1">
            {WORKBENCH_TABS.map((tabKey) => {
              const active = activeTab === tabKey;

              return (
                <Link
                  key={tabKey}
                  to={WORKBENCH_TAB_PATHS[tabKey]}
                  role="tab"
                  aria-selected={active}
                  className={cn(
                    "rounded-full px-3 py-2 text-center text-sm font-medium transition md:text-base",
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {tabLabel(tabKey)}
                </Link>
              );
            })}
          </div>
        </div>

        {notice && (
          <NoticeBanner
            notice={notice}
            onClose={() => setNotice(null)}
          />
        )}

        <section
          className={cn("animate-in fade-in-0 duration-500 delay-100", activeTab === "optimize" ? "block" : "hidden")}
          aria-hidden={activeTab !== "optimize"}
        >
          <OptimizeTab
            providers={providers}
            settingsLoading={settingsLoading}
            onRequestError={handleRequestError}
            onShowNotice={showNotice}
            onPersistedHistory={() => setHistoryRefreshToken(prev => prev + 1)}
          />
        </section>

        <section
          className={cn("animate-in fade-in-0 duration-500 delay-100", activeTab === "models" ? "block" : "hidden")}
          aria-hidden={activeTab !== "models"}
        >
          <ModelSettingsTab
            providers={providers}
            defaults={defaults}
            settingsLoading={settingsLoading}
            refreshSettings={refreshModelSettings}
            onRequestError={handleRequestError}
            onShowNotice={showNotice}
          />
        </section>

        <section
          className={cn("animate-in fade-in-0 duration-500 delay-100", activeTab === "history" ? "block" : "hidden")}
          aria-hidden={activeTab !== "history"}
        >
          <HistoryTab
            refreshToken={historyRefreshToken}
            onRequestError={handleRequestError}
            onShowNotice={showNotice}
          />
        </section>
      </div>
    </main>
  );
}
