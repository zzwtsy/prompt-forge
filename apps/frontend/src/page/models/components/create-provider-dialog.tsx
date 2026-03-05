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

interface CreateProviderDialogProps {
  open: boolean;
  name: string;
  baseUrl: string;
  apiKey: string;
  adding: boolean;
  nameInvalid: boolean;
  baseUrlInvalid: boolean;
  onOpenChange: (open: boolean) => void;
  onNameChange: (value: string) => void;
  onBaseUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onCreate: () => Promise<void>;
}

export function CreateProviderDialog(props: CreateProviderDialogProps) {
  const {
    open,
    name,
    baseUrl,
    apiKey,
    adding,
    nameInvalid,
    baseUrlInvalid,
    onOpenChange,
    onNameChange,
    onBaseUrlChange,
    onApiKeyChange,
    onCreate,
  } = props;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>添加自定义服务商</AlertDialogTitle>
          <AlertDialogDescription>创建新的 OpenAI-Compatible 服务商配置。</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>服务商名称</Label>
            <Input
              value={name}
              aria-invalid={nameInvalid ? "true" : "false"}
              onChange={(event) => {
                onNameChange(event.target.value);
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>BaseURL</Label>
            <Input
              value={baseUrl}
              aria-invalid={baseUrlInvalid ? "true" : "false"}
              onChange={(event) => {
                onBaseUrlChange(event.target.value);
              }}
              placeholder="https://api.example.com/v1"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>API Key（可选）</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={event => onApiKeyChange(event.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={adding}>取消</AlertDialogCancel>
          <Button
            disabled={adding}
            onClick={() => {
              void onCreate();
            }}
          >
            {adding && <Loader2 className="mr-1 size-4 animate-spin" />}
            创建服务商
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
