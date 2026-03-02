export function AuthLoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_18%_20%,rgba(239,246,255,0.95),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(236,253,245,0.9),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="rounded-2xl border border-slate-200/80 bg-white/85 px-6 py-4 text-sm text-slate-600 shadow-sm backdrop-blur">
        正在校验登录状态...
      </div>
    </main>
  );
}
