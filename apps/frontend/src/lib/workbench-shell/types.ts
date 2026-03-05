export type WorkbenchTab = "optimize" | "models" | "history";

export interface RequestErrorOptions {
  fallbackTitle: string;
  onValidationError?: (fieldPaths: Set<string>) => void;
}
