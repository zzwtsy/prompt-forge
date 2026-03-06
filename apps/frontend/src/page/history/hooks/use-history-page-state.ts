import type {
  HistoryPageActions,
  HistoryPageDeps,
  HistoryPageState,
} from "../types";
import type { SavedPromptItem } from "@/lib/workbench-api";
import { useRequest } from "alova/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { savedPromptsMethods } from "@/lib/workbench-api";
import {
  HISTORY_PAGE_LIMIT,
  unwrapResponseData,
  useWorkbenchToast,
  writeClipboardText,
} from "@/lib/workbench-shell";
import { dedupeSavedPromptItems } from "../utils";

interface SavedPromptsPageData {
  items: SavedPromptItem[];
  nextCursor: string | null;
}

export function useHistoryPageState(deps: HistoryPageDeps): {
  state: HistoryPageState;
  actions: HistoryPageActions;
} {
  const {
    refreshToken,
    onRequestError,
  } = deps;
  const notice = useWorkbenchToast();

  const {
    send: sendQuerySavedPrompts,
  } = useRequest(savedPromptsMethods.querySavedPrompts, {
    immediate: false,
    force: true,
  });

  const sendQuerySavedPromptsRef = useRef(sendQuerySavedPrompts);
  useEffect(() => {
    sendQuerySavedPromptsRef.current = sendQuerySavedPrompts;
  }, [sendQuerySavedPrompts]);

  const [items, setItems] = useState<SavedPromptItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadHistory = useCallback(async (options: {
    reset: boolean;
    cursor?: string;
  }) => {
    const { reset, cursor } = options;

    try {
      if (reset) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await sendQuerySavedPromptsRef.current({
        limit: HISTORY_PAGE_LIMIT,
        cursor,
      });
      const data = unwrapResponseData<SavedPromptsPageData>(response);

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
  }, [onRequestError]);

  useEffect(() => {
    void loadHistory({ reset: true });
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

  const copyPrompt = useCallback(async (text: string) => {
    try {
      await writeClipboardText(text);
      notice.success({
        title: "复制成功",
        message: "历史提示词已复制到剪贴板。",
      });
    } catch (error) {
      onRequestError(error, {
        fallbackTitle: "复制失败",
      });
    }
  }, [notice, onRequestError]);

  const loadMore = useCallback(async () => {
    if (nextCursor === null || initialLoading || loadingMore) {
      return;
    }

    await loadHistory({
      reset: false,
      cursor: nextCursor,
    });
  }, [initialLoading, loadHistory, loadingMore, nextCursor]);

  return {
    state: {
      items,
      filteredItems,
      selectedItem,
      activeItemId: selectedItem?.id ?? null,
      searchKeyword,
      nextCursor,
      initialLoading,
      loadingMore,
    },
    actions: {
      setSearchKeyword,
      selectItem: setSelectedItemId,
      loadMore,
      copyPrompt,
    },
  };
}
