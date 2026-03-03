export type WorkbenchTab = "optimize" | "models" | "history";

export interface GlobalNotice {
  id: number;
  tone: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export type NoticeInput = Omit<GlobalNotice, "id">;

export interface RequestErrorOptions {
  fallbackTitle: string;
  onValidationError?: (fieldPaths: Set<string>) => void;
}
