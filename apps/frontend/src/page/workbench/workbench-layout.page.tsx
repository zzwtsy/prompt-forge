import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { NoticeBanner } from "./components/notice-banner";
import { WORKBENCH_TAB_PATHS, WORKBENCH_TABS } from "./constants";
import { OptimizeSessionProvider } from "./context/optimize-session";
import { useWorkbenchShell, WorkbenchShellProvider } from "./context/workbench-shell";
import { getWorkbenchTabFromPathname, tabLabel } from "./utils";

function WorkbenchLayoutContent() {
  const location = useLocation();
  const { notice, clearNotice } = useWorkbenchShell();

  const activeTab = getWorkbenchTabFromPathname(location.pathname);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_20%,rgba(239,246,255,0.95),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(236,253,245,0.9),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 md:px-8 md:py-10">
        <header>
          <p className="text-sm tracking-wide text-slate-500">Prompt Forge Workbench</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">提示词优化工作台</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
            在单页完成提示词评估、优化、模型配置与历史回查。Tab 切换不会清空当前会话输入。
          </p>
        </header>

        <div className="rounded-full border border-slate-200/80 bg-white/80 p-1.5 shadow-sm backdrop-blur">
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
            onClose={clearNotice}
          />
        )}

        <OptimizeSessionProvider>
          <Outlet />
        </OptimizeSessionProvider>
      </div>
    </main>
  );
}

export function WorkbenchLayoutPage() {
  return (
    <WorkbenchShellProvider>
      <WorkbenchLayoutContent />
    </WorkbenchShellProvider>
  );
}
