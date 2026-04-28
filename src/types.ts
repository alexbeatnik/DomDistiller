export interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

export interface DistilledNode {
  role: string;
  tag: string;
  text: string;
  locator: string;
  locatorFallback: string[];
  interactable: boolean;
  visible: boolean;
  editable: boolean;
  checked?: boolean;
  disabled?: boolean;
  attributes: Record<string, string>;
  rect: Rect;
  children: DistilledNode[];
}

export interface DistillOptions {
  maxTextLength?: number;
  includeHidden?: boolean;
  checkObscured?: boolean;
}

/** Query for finding controls in the AST */
export interface ControlQuery {
  text?: string;
  role?: string;
  tag?: string;
  locator?: string;
}

/** Options for astToMarkdown */
export interface MarkdownOptions {
  columns?: string[];
  maxRows?: number;
}
