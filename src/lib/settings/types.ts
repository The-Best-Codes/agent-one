export type ChatBackgroundPresetOption =
  | "none"
  | "custom"
  | "abstract"
  | "aurora"
  | "mist"
  | "forest"
  | "valley"
  | "ocean"
  | "mountain"
  | "sunset"
  | "night"
  | "island";
export type TtsProviderId = "openai" | "elevenlabs" | "hume" | "google";

export interface ChatBackgroundSettings {
  preset: ChatBackgroundPresetOption;
  customUrl: string;
  customUrls: string[];
  customThumbnails: Record<string, string>;
  tint: number;
  blur: number;
  dim: number;
  x: number;
  y: number;
  zoom: number;
  backgroundShade: number;
}

export interface TtsOpenAISettings {
  model: string;
  voice: string;
  speed: number;
  instructions: string;
}

export interface TtsElevenLabsSettings {
  model: string;
  voice: string;
  speed: number;
  languageCode: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
  applyTextNormalization: "auto" | "on" | "off";
}

export interface TtsHumeSettings {
  model: string;
  voice: string;
  speed: number;
  instructions: string;
}

export interface TtsGoogleSettings {
  model: string;
  voice: string;
  speed: number;
  instructions: string;
}

export interface TtsSettings {
  provider: TtsProviderId | "";
  openai: TtsOpenAISettings;
  elevenlabs: TtsElevenLabsSettings;
  hume: TtsHumeSettings;
  google: TtsGoogleSettings;
}

export type TitleGenerationMethodOption =
  | "ai"
  | "first-user-message"
  | "first-assistant-message"
  | "custom";

export interface TitleGenerationSettings {
  method: TitleGenerationMethodOption;
  fallbackMethod?: Exclude<TitleGenerationMethodOption, "ai">;
  characterLimit: number;
  maxOutputTokens: number | "none";
  customPhrase: string;
  fallbackPhrase: string;
}

export type McpServerType = "stdio" | "http";

export interface McpRegistryMetadata {
  displayName: string;
  description: string;
  version: string;
  websiteUrl?: string;
  iconUrl?: string;
  badges: string[];
  searchText: string;
  transportTypes: McpServerType[];
  registryEntry?: unknown;
}

export interface McpServerConfigBase {
  id: string;
  name: string;
  enabled: boolean;
  timeoutMs: number;
  requiresApproval: boolean;
  toolApprovalOverrides?: Record<string, boolean>;
  registryMetadata?: McpRegistryMetadata;
}

export interface McpStdioServerConfig extends McpServerConfigBase {
  type: "stdio";
  command: string;
  env: Record<string, string>;
}

export interface McpHttpServerConfig extends McpServerConfigBase {
  type: "http";
  url: string;
  headers: Record<string, string>;
}

export type McpServerConfig = McpStdioServerConfig | McpHttpServerConfig;

export type ToolId =
  | "dateTime"
  | "waitNumberMilliseconds"
  | "getUrlContent"
  | "webSearch"
  | "wikipedia"
  | "memory"
  | "editFile"
  | "createFile"
  | "deleteFile"
  | "viewFile"
  | "executeCommand"
  | "subAgent"
  | "listSettings"
  | "getSetting"
  | "updateSetting"
  | "listScheduledAgents"
  | "createScheduledAgent"
  | "updateScheduledAgent"
  | "deleteScheduledAgent"
  | "searchChats"
  | "readChat"
  | "computerUseObserve"
  | "computerUseAct";

export interface DateTimeToolConfig {
  requiresApproval: boolean;
  useUtc: boolean;
}

export interface WaitToolConfig {
  requiresApproval: boolean;
  maxMs: number;
  minMs: number;
}

export interface GetUrlContentToolConfig {
  requiresApproval: boolean;
  maxUrls: number;
  minUrls: number;
  defaultMaxLength: number;
}

export interface WebSearchToolConfig {
  requiresApproval: boolean;
  maxConcurrent: number;
  defaultMaxResults: number;
  defaultMaxPages: number;
}

export interface MemoryToolConfig {
  requiresApproval: boolean;
}

export interface EditFileToolConfig {
  requiresApproval: boolean;
}

export interface CreateFileToolConfig {
  requiresApproval: boolean;
}

export interface DeleteFileToolConfig {
  requiresApproval: boolean;
}

export interface ViewFileToolConfig {
  requiresApproval: boolean;
  defaultMaxChars: number;
}

export interface ExecuteCommandToolConfig {
  requiresApproval: boolean;
  defaultTimeoutMs: number;
  maxScrollbackChars: number;
}

export interface WikipediaToolConfig {
  requiresApproval: boolean;
  defaultMaxResults: number;
}

export interface SubAgentToolConfig {
  requiresApproval: boolean;
}

export interface ListSettingsToolConfig {
  requiresApproval: boolean;
}

export interface GetSettingToolConfig {
  requiresApproval: boolean;
}

export interface UpdateSettingToolConfig {
  requiresApproval: boolean;
}

export interface ScheduledAgentToolConfig {
  requiresApproval: boolean;
}

export interface SearchChatsToolConfig {
  requiresApproval: boolean;
  defaultMaxResults: number;
}

export interface ReadChatToolConfig {
  requiresApproval: boolean;
  defaultMaxChars: number;
  maxChars: number;
}

export interface ComputerUseObserveToolConfig {
  requiresApproval: boolean;
  includeScreenshots: boolean;
}

export interface ComputerUseActToolConfig {
  requiresApproval: boolean;
}

export interface ToolConfigs {
  dateTime: DateTimeToolConfig;
  waitNumberMilliseconds: WaitToolConfig;
  getUrlContent: GetUrlContentToolConfig;
  webSearch: WebSearchToolConfig;
  wikipedia: WikipediaToolConfig;
  memory: MemoryToolConfig;
  editFile: EditFileToolConfig;
  createFile: CreateFileToolConfig;
  deleteFile: DeleteFileToolConfig;
  viewFile: ViewFileToolConfig;
  executeCommand: ExecuteCommandToolConfig;
  subAgent: SubAgentToolConfig;
  listSettings: ListSettingsToolConfig;
  getSetting: GetSettingToolConfig;
  updateSetting: UpdateSettingToolConfig;
  listScheduledAgents: ScheduledAgentToolConfig;
  createScheduledAgent: ScheduledAgentToolConfig;
  updateScheduledAgent: ScheduledAgentToolConfig;
  deleteScheduledAgent: ScheduledAgentToolConfig;
  searchChats: SearchChatsToolConfig;
  readChat: ReadChatToolConfig;
  computerUseObserve: ComputerUseObserveToolConfig;
  computerUseAct: ComputerUseActToolConfig;
}
