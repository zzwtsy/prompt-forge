import type { NoticeInput, RequestErrorOptions, SavedPromptItem } from "../types";
import { Copy, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HISTORY_PAGE_LIMIT } from "../constants";
import { fetchSavedPrompts } from "../services/saved-prompts.service";
import {
  createSnippet,
  dedupeSavedPromptItems,
  formatDateTime,
  writeClipboardText,
} from "../utils";

interface HistoryTabProps {
  refreshToken: number;
  onRequestError: (error: unknown, options: RequestErrorOptions) => void;
  onShowNotice: (notice: NoticeInput) => void;
}

export function HistoryTab(props: HistoryTabProps) {
  const {
    refreshToken,
    onRequestError,
    onShowNotice,
  } = props;

  const [items, setItems] = useState<SavedPromptItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadHistory = useCallback(async (reset: boolean) => {
    const cursor = reset ? undefined : nextCursor ?? undefined;

    try {
      if (reset) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      const data = await fetchSavedPrompts({
        limit: HISTORY_PAGE_LIMIT,
        cursor,
      });

      if (reset) {
        setItems(data.items);
        setSelectedItemId(data.items[0]?.id ?? null);
      } else {
        setItems(previous => dedupeSavedPromptItems([...previous, ...data.items]));
      }

      setNextCursor(data.nextCursor);
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "加载历史记录失败",
      });
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  }, [nextCursor, onRequestError]);

  useEffect(() => {
    void loadHistory(true);
  }, [loadHistory, refreshToken]);

  const filteredItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return items;
    }

    return items.filter(item => item.optimizedPrompt.toLowerCase().includes(keyword));
  }, [items, searchKeyword]);

  const selectedItem = useMemo(() => {
    if (filteredItems.length === 0) {
      return null;
    }

    if (selectedItemId === null) {
      return filteredItems[0];
    }

    return filteredItems.find(item => item.id === selectedItemId) ?? filteredItems[0];
  }, [filteredItems, selectedItemId]);

  useEffect(() => {
    if (!selectedItem && filteredItems.length > 0) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItem]);

  const copyHistoryPrompt = async (text: string) => {
    try {
      await writeClipboardText(text);
      onShowNotice({
        tone: "success",
        title: "复制成功",
        message: "历史提示词已复制到剪贴板。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "复制失败",
      });
    }
  };

  return (
    <div className="grid gap-4">
      <Card className="border-slate-200/90 bg-white/85 shadow-sm backdrop-blur">
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="text-base">历史记录</CardTitle>
            <CardDescription>当前为本地筛选模式，结果仅覆盖已加载数据。</CardDescription>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchKeyword}
              onChange={event => setSearchKeyword(event.target.value)}
              className="pl-8"
              placeholder="搜索优化提示词（仅已加载数据）"
            />
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
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
                onClick={() => setSelectedItemId(item.id)}
                className={cn(
                  "grid gap-2 rounded-lg border px-3 py-2 text-left transition",
                  selectedItem?.id === item.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-xs", selectedItem?.id === item.id ? "text-slate-200" : "text-slate-500")}>{formatDateTime(item.createdAt)}</span>
                  <Button
                    size="xs"
                    variant={selectedItem?.id === item.id ? "secondary" : "outline"}
                    onClick={(event) => {
                      event.stopPropagation();
                      void copyHistoryPrompt(item.optimizedPrompt);
                    }}
                  >
                    <Copy className="size-3" />
                    复制
                  </Button>
                </div>
                <p className={cn("line-clamp-2 text-sm leading-5", selectedItem?.id === item.id ? "text-white" : "text-slate-700")}>{createSnippet(item.optimizedPrompt, 120)}</p>
              </button>
            ))}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              disabled={nextCursor === null || loadingMore || initialLoading}
              onClick={() => {
                void loadHistory(false);
              }}
            >
              {loadingMore && <Loader2 className="mr-1 size-4 animate-spin" />}
              {nextCursor !== null ? "加载更多" : "没有更多记录"}
            </Button>
          </CardFooter>
        </Card>

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
                void copyHistoryPrompt(selectedItem.optimizedPrompt);
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
      </div>
    </div>
  );
}
