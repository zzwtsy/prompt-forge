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
  open: boolean;
  modelName: string;
  displayName: string;
  adding: boolean;
  modelNameInvalid: boolean;
  providerAvailable: boolean;
  onOpenChange: (open: boolean) => void;
  onModelNameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onCreate: () => Promise<void>;
}

export function CreateModelDialog(props: CreateModelDialogProps) {
  const {
    open,
    modelName,
    displayName,
    adding,
    modelNameInvalid,
    providerAvailable,
    onOpenChange,
    onModelNameChange,
    onDisplayNameChange,
    onCreate,
  } = props;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>手动添加模型</AlertDialogTitle>
          <AlertDialogDescription>向当前服务商追加一个模型标识。</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>模型名称</Label>
            <Input
              value={modelName}
              aria-invalid={modelNameInvalid ? "true" : "false"}
              onChange={(event) => {
                onModelNameChange(event.target.value);
              }}
              placeholder="例如: gpt-4.1-mini"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>显示名（可选）</Label>
            <Input
              value={displayName}
              onChange={event => onDisplayNameChange(event.target.value)}
              placeholder="例如: GPT-4.1 Mini"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={adding}>取消</AlertDialogCancel>
          <Button
            disabled={adding || !providerAvailable}
            onClick={() => {
              void onCreate();
            }}
          >
            {adding && <Loader2 className="mr-1 size-4 animate-spin" />}
            创建模型
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
