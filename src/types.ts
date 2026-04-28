export interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

export interface LocatorStrategy {
  primary: string;
  fallbacks: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface NodeRelation {
  type: 'label-for' | 'aria-controls' | 'aria-describedby' | 'aria-labelledby' | 'spatial-near' | 'ancestor' | 'sibling';
  targetLocator: string;
  targetText?: string;
  description: string;
}

export interface SemanticContext {
  type: 'form' | 'fieldset' | 'dialog' | 'generic';
  intent?: string;
  label: string;
  fields?: string[];
  submitTarget?: string;
}

export interface SuggestedAction {
  type: 'fill' | 'click' | 'select' | 'check' | 'uncheck';
  targetAlias: string;
  value?: string;
}

export interface DistilledNode {
  role: string;
  tag: string;
  text: string;
  locator: string;
  locatorFallback: string[];
  locatorStrategy: LocatorStrategy;
  interactable: boolean;
  visible: boolean;
  editable: boolean;
  checked?: boolean;
  disabled?: boolean;
  attributes: Record<string, string>;
  rect: Rect;
  children: DistilledNode[];
  relations: NodeRelation[];
  alias?: string;
  semanticContext?: SemanticContext;
  groupId?: string;
  suggestedActions?: SuggestedAction[];
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
