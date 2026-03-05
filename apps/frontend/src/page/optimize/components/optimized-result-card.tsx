import type {
  OptimizeResolvedModel,
} from "@/store";
import { Copy, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OptimizedResultCardProps {
  optimizedPrompt: string;
  optimizeResolvedModel: OptimizeResolvedModel | null;
  hasSaveDraft: boolean;
  retryPending: boolean;
  onRetrySave: () => Promise<void>;
  onCopy: () => Promise<void>;
}

export function OptimizedResultCard(props: OptimizedResultCardProps) {
  const {
    optimizedPrompt,
    optimizeResolvedModel,
    hasSaveDraft,
    retryPending,
    onRetrySave,
    onCopy,
  } = props;

  return (
    <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">优化结果</CardTitle>
          {optimizeResolvedModel && (
            <CardDescription>
              执行模型：
              {optimizeResolvedModel.modelName}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasSaveDraft && (
            <Button
              variant="outline"
              size="sm"
              disabled={retryPending}
              onClick={() => {
                void onRetrySave();
              }}
            >
              {retryPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              保存
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={!optimizedPrompt}
            onClick={() => {
              void onCopy();
            }}
          >
            <Copy className="size-3.5" />
            复制
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-44 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 whitespace-pre-wrap text-slate-700">
          {optimizedPrompt || "暂无优化结果。"}
        </div>
      </CardContent>
    </Card>
  );
}
