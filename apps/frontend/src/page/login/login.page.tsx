import type { FormEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AuthLoadingScreen } from "@/components/auth-loading-screen";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { sanitizeRedirectTarget } from "@/lib/auth-redirect";

interface LoginPageProps {
  redirect?: string;
  isAuthPending: boolean;
}

export function LoginPage({ redirect, isAuthPending }: LoginPageProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTarget = useMemo(() => {
    return sanitizeRedirectTarget(redirect);
  }, [redirect]);

  const canSubmit = !submitting && email.trim().length > 0 && password.length > 0;

  if (isAuthPending) {
    return <AuthLoadingScreen />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (response.error != null) {
        const { message } = response.error;
        setErrorMessage(typeof message === "string" && message.trim().length > 0
          ? message
          : "邮箱或密码不正确，请重试。");
        return;
      }

      await router.invalidate();
      router.history.push(redirectTarget);
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("登录失败，请稍后重试。");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_20%_12%,rgba(226,232,240,0.9),transparent_38%),radial-gradient(circle_at_86%_0%,rgba(220,252,231,0.75),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-12 md:px-8">
      <Card className="w-full max-w-md border-slate-200/90 bg-white/90 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle>账号登录</CardTitle>
          <CardDescription>使用邮箱和密码登录。</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
            </div>

            {errorMessage != null && (
              <p
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit}
            >
              {submitting ? "登录中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
