import type { CreateModelDialogSection } from "../types";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateModelDialogProps {
  section: CreateModelDialogSection;
}

export function CreateModelDialog(props: CreateModelDialogProps) {
  const { section } = props;

  return (
    <AlertDialog open={section.state.open} onOpenChange={section.actions.setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>手动添加模型</AlertDialogTitle>
          <AlertDialogDescription>向当前服务商追加一个模型标识。</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>模型名称</Label>
            <Input
              value={section.state.modelName}
              aria-invalid={section.state.validationErrors.addModelName ? "true" : "false"}
              onChange={(event) => {
                section.actions.setModelName(event.target.value);
              }}
              placeholder="例如: gpt-4.1-mini"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>显示名（可选）</Label>
            <Input
              value={section.state.displayName}
              onChange={event => section.actions.setDisplayName(event.target.value)}
              placeholder="例如: GPT-4.1 Mini"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={section.state.addingModel}>取消</AlertDialogCancel>
          <Button
            disabled={section.state.addingModel || !section.state.providerAvailable}
            onClick={() => {
              void section.actions.createModel();
            }}
          >
            {section.state.addingModel && <Loader2 className="mr-1 size-4 animate-spin" />}
            创建模型
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
