import type { EvaluateResolvedModel } from "@/store";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface EvaluationResultCardProps {
  evaluationResult: string;
  evaluateResolvedModel: EvaluateResolvedModel | null;
  onCopy: () => Promise<void>;
}

export function EvaluationResultCard(props: EvaluationResultCardProps) {
  const {
    evaluationResult,
    evaluateResolvedModel,
    onCopy,
  } = props;

  return (
    <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">评估结果</CardTitle>
          {evaluateResolvedModel && (
            <CardDescription>
              执行模型：
              {evaluateResolvedModel.modelName}
            </CardDescription>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!evaluationResult}
          onClick={() => {
            void onCopy();
          }}
        >
          <Copy className="size-3.5" />
          复制
        </Button>
      </CardHeader>
      <CardContent>
        <div className="min-h-44 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 whitespace-pre-wrap text-slate-700">
          {evaluationResult || "暂无评估结果。"}
        </div>
      </CardContent>
    </Card>
  );
}
