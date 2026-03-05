import type { CreateProviderDialogSection } from "../types";
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
  section: CreateProviderDialogSection;
}

export function CreateProviderDialog(props: CreateProviderDialogProps) {
  const { section } = props;

  return (
    <AlertDialog open={section.state.open} onOpenChange={section.actions.setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>添加自定义服务商</AlertDialogTitle>
          <AlertDialogDescription>创建新的 OpenAI-Compatible 服务商配置。</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>服务商名称</Label>
            <Input
              value={section.state.name}
              aria-invalid={section.state.validationErrors.addProviderName ? "true" : "false"}
              onChange={(event) => {
                section.actions.setName(event.target.value);
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>BaseURL</Label>
            <Input
              value={section.state.baseUrl}
              aria-invalid={section.state.validationErrors.addProviderBaseUrl ? "true" : "false"}
              onChange={(event) => {
                section.actions.setBaseUrl(event.target.value);
              }}
              placeholder="https://api.example.com/v1"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>API Key（可选）</Label>
            <Input
              type="password"
              value={section.state.apiKey}
              onChange={event => section.actions.setApiKey(event.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={section.state.addingProvider}>取消</AlertDialogCancel>
          <Button
            disabled={section.state.addingProvider}
            onClick={() => {
              void section.actions.createProvider();
            }}
          >
            {section.state.addingProvider && <Loader2 className="mr-1 size-4 animate-spin" />}
            创建服务商
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
