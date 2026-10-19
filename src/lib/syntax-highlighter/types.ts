export type HighlightTheme = "dark-plus" | "light-plus";

export interface HighlightToken {
  content: string;
  color?: string;
  fontStyle?: number;
}

export type HighlightLine = HighlightToken[];

export interface HighlightRequest {
  type: "highlight";
  id: string;
  sessionId: string;
  reset: boolean;
  code: string;
  language: string;
  theme: HighlightTheme;
}

export interface DisposeRequest {
  type: "dispose";
  sessionId: string;
}

export interface InitRequest {
  type: "init";
}

export type WorkerRequest = HighlightRequest | DisposeRequest | InitRequest;

export interface HighlightResponse {
  id: string;
  startLine?: number;
  lines?: HighlightLine[];
  partial?: HighlightLine | null;
  fg?: string;
  error?: string;
}
