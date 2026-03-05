import { Search } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface HistoryToolbarCardProps {
  searchKeyword: string;
  onSearchKeywordChange: (value: string) => void;
}

export function HistoryToolbarCard(props: HistoryToolbarCardProps) {
  const {
    searchKeyword,
    onSearchKeywordChange,
  } = props;

  return (
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
            onChange={event => onSearchKeywordChange(event.target.value)}
            className="pl-8"
            placeholder="搜索优化提示词（仅已加载数据）"
          />
        </div>
      </CardHeader>
    </Card>
  );
}
