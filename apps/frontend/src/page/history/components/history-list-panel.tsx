import type { SavedPromptItem } from "@/lib/workbench-api";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  createSnippet,
  formatDateTime,
} from "../utils";

interface HistoryListPanelProps {
  items: SavedPromptItem[];
  filteredItems: SavedPromptItem[];
  activeItemId: string | null;
  nextCursor: string | null;
  initialLoading: boolean;
  loadingMore: boolean;
  onSelectItem: (itemId: string) => void;
  onCopyPrompt: (text: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
}

export function HistoryListPanel(props: HistoryListPanelProps) {
  const {
    items,
    filteredItems,
    activeItemId,
    nextCursor,
    initialLoading,
    loadingMore,
    onSelectItem,
    onCopyPrompt,
    onLoadMore,
  } = props;

  return (
    <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">记录列表</CardTitle>
        <CardDescription>
          已加载
          {" "}
          {items.length}
          {" "}
          条，筛选命中
          {" "}
          {filteredItems.length}
          {" "}
          条。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {initialLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
            <Loader2 className="size-4 animate-spin" />
            正在加载历史记录...
          </div>
        )}

        {!initialLoading && filteredItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
            未命中历史记录。
          </div>
        )}

        {!initialLoading && filteredItems.map(item => (
          <button
            type="button"
            key={item.id}
            onClick={() => onSelectItem(item.id)}
            className={cn(
              "grid gap-2 rounded-lg border px-3 py-2 text-left transition",
              activeItemId === item.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={cn("text-xs", activeItemId === item.id ? "text-slate-200" : "text-slate-500")}>{formatDateTime(item.createdAt)}</span>
              <Button
                size="xs"
                variant={activeItemId === item.id ? "secondary" : "outline"}
                onClick={(event) => {
                  event.stopPropagation();
                  void onCopyPrompt(item.optimizedPrompt);
                }}
              >
                <Copy className="size-3" />
                复制
              </Button>
            </div>
            <p className={cn("line-clamp-2 text-sm leading-5", activeItemId === item.id ? "text-white" : "text-slate-700")}>{createSnippet(item.optimizedPrompt, 120)}</p>
          </button>
        ))}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          disabled={nextCursor === null || loadingMore || initialLoading}
          onClick={() => {
            void onLoadMore();
          }}
        >
          {loadingMore && <Loader2 className="mr-1 size-4 animate-spin" />}
          {nextCursor !== null ? "加载更多" : "没有更多记录"}
        </Button>
      </CardFooter>
    </Card>
  );
}
