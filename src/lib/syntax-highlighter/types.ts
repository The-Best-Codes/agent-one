export interface HighlightRequest {
  id: string;
  code: string;
  language: string;
  theme: "dark-plus" | "light-plus";
}

export interface HighlightResponse {
  id: string;
  html?: string;
  error?: string;
}
