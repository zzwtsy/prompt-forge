import type { SavedPromptItem } from "@/lib/workbench-api";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HistoryDetailPanelProps {
  selectedItem: SavedPromptItem | null;
  onCopyPrompt: (text: string) => Promise<void>;
}

export function HistoryDetailPanel(props: HistoryDetailPanelProps) {
  const {
    selectedItem,
    onCopyPrompt,
  } = props;

  return (
    <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">完整提示词</CardTitle>
          <CardDescription>
            {selectedItem ? `PromptRun: ${selectedItem.promptRunId}` : "请选择一条历史记录"}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedItem === null}
          onClick={() => {
            if (selectedItem === null) {
              return;
            }
            void onCopyPrompt(selectedItem.optimizedPrompt);
          }}
        >
          <Copy className="size-3.5" />
          复制
        </Button>
      </CardHeader>
      <CardContent>
        <div className="min-h-72 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 whitespace-pre-wrap text-slate-700">
          {selectedItem?.optimizedPrompt ?? "暂无可查看内容。"}
        </div>
      </CardContent>
    </Card>
  );
}
