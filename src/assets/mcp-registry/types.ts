export type MCPRegistryEntry = {
  server: Server;
  _meta: MCPRegistryEntryMeta;
};

export type MCPRegistryEntryMeta = {
  "io.modelcontextprotocol.registry/official": IoModelcontextprotocolRegistryOfficial;
};

export type IoModelcontextprotocolRegistryOfficial = {
  status: string;
  statusChangedAt: Date;
  publishedAt: Date;
  updatedAt: Date;
  isLatest: boolean;
  statusMessage?: string;
};

export type Server = {
  $schema: string;
  name: string;
  description: string;
  repository?: Repository;
  version: string;
  websiteUrl?: string;
  remotes?: Remote[];
  title?: string;
  icons?: Icon[];
  packages?: Package[];
  _meta?: ServerMeta;
};

export type ServerMeta = {
  "io.modelcontextprotocol.registry/publisher-provided"?: IoModelcontextprotocolRegistryPublisherProvided;
};

export type IoModelcontextprotocolRegistryPublisherProvided = {
  documentation?: string;
  examples?: ExampleElement[];
  keywords?: string[];
  license?: string;
  notes?: string[] | string;
  publisher?: string;
  auth?: Auth;
  mcp_endpoint?: string;
  service?: string;
  tool?: string;
  version?: string;
  authorizationUrl?: string;
  documentationUrl?: string;
  all_supported_languages?: string[];
  build_info?: BuildInfoClass;
  capabilities?: string[] | CapabilitiesClass | string;
  tags?: string[];
  authentication?: AuthenticationClass | string;
  categories?: string[];
  promptCount?: number;
  resourceCount?: number;
  toolCount?: number;
  tools?: Array<ToolClass | string> | number;
  homepage?: string;
  features?: string[] | FeaturesClass;
  pricing?: Pricing;
  contactEmail?: string;
  author?: string;
  issues?: string;
  repository?: string;
  manifest?: string;
  provider?: string;
  quickstart?: string;
  signup?: string;
  installationMethods?: InstallationMethod[];
  toolCategories?: ToolCategories;
  priority?: string;
  stack?: string[];
  status?: string;
  buildInfo?: BuildInfo;
  contact?: string;
  rateLimit?: RateLimit;
  github?: Github;
  variants?: Variants;
  architectures?: string[];
  platforms?: string[];
  useCases?: string[];
  icon?: string;
  framework?: string;
  maintainers?: Array<Vendor | string>;
  transport?: string[];
  type?: string;
  language?: string;
  dockerizedBy?: string;
  originalAuthor?: string;
  billingNotes?: string[];
  category?: string[] | string;
  compatibilityNotes?: string[];
  endpoints?: Endpoints;
  highlights?: string[];
  modes?: Modes;
  payments?: Payments;
  performanceNotes?: string[];
  product?: string;
  compliance?: string[];
  dataTypes?: string[];
  contacts?: Contact[];
  free_tier?: boolean;
  tool_count?: number;
  migratedFrom?: string;
  discovery?: Discovery;
  source?: string;
  auth_required?: boolean;
  skill_path?: string;
  source_url?: string;
  cliOptions?: CLIOption[];
  platform?: string;
  vendor?: Vendor;
  privacyPolicyUrl?: string;
};

export type Auth = {
  header?: string;
  type: string;
  via?: string;
  authorization_endpoint?: string;
  scopes?: string[];
  token_endpoint?: string;
};

export type AuthenticationClass = {
  description: string;
  type: string;
};

export type BuildInfo = {
  imageSha256: string;
};

export type BuildInfoClass = {
  framework?: string;
  package_manager?: string;
  python_version?: string;
  commit?: string;
  deployment_id?: string;
  region?: string;
  timestamp?: Date;
  release?: string;
};

export type CapabilitiesClass = {
  chunking_strategies?: string[];
  embedding_providers?: string[];
  languages_supported?: number;
  reranking_providers?: string[];
  search_types?: string[];
  sparse_embedding_providers?: string[];
  vector_store_providers?: string[];
  tools?: ToolClass[];
};

export type ToolClass = {
  description: string;
  name: string;
};

export type CLIOption = {
  default: boolean;
  description: string;
  flag: string;
};

export type Contact = {
  email: string;
  name: string;
  url: string;
};

export type Discovery = {
  agent_card: string;
  mcp_card: string;
  openapi: string;
};

export type Endpoints = {
  docs: string;
  taskDownload: string;
};

export type ExampleElement = {
  config?: ConfigClass | string;
  description: string;
  name: string;
  note?: string;
  command?: string;
  example?: ExampleExample;
};

export type ConfigClass = {
  mcpServers: MCPServers;
};

export type MCPServers = {
  codeix: Codeix;
};

export type Codeix = {
  args: string[];
  command: string;
};

export type ExampleExample = {
  parameters: Parameters;
  tool: string;
};

export type Parameters = {
  limit: number;
  q: string;
};

export type FeaturesClass = {
  auto_version_detection?: boolean;
  multi_version_support?: string;
  security_focused?: boolean;
  transport_modes?: string[];
  dynamic_api_discovery?: boolean;
  elastic_stack_integration?: boolean;
  openapi_based?: boolean;
  diagram_types?: DiagramTypes;
  input_sources?: InputSources;
  mcp_apps_ui?: MCPAppsUI;
};

export type DiagramTypes = {
  enabled: boolean;
  types: string[];
};

export type InputSources = {
  enabled: boolean;
  sources: string[];
};

export type MCPAppsUI = {
  description: string;
  enabled: boolean;
};

export type Github = {
  author: string;
  authorEmail: string;
  bugsUrl: string;
  defaultBranch: string;
  displayName: string;
  homepageUrl: string;
  isInOrganization: boolean;
  legacyId: string;
  license: string;
  name: string;
  nameWithOwner: string;
  opengraphImageUrl: string;
  ownerAvatarUrl: string;
  preferredImage: string;
  primaryLanguage: string;
  primaryLanguageColor: string;
  pushedAt: Date;
  readme: string;
  readmeUpdatedAt: Date;
  readmeVersion: string;
  stargazerCount: number;
  topics: string[];
  usesCustomOpenGraphImage: boolean;
};

export type InstallationMethod = {
  command?: string;
  description: string;
  requirements?: string;
  type: string;
  url?: string;
};

export type Vendor = {
  name: string;
  url: string;
};

export type Modes = {
  deep: string;
  normal: string;
};

export type Payments = {
  mcpTool: string;
  model: string;
  options: Option[];
  quoteEndpoint: string;
  topupEndpoint: string;
  topupRequiredHeader: string;
};

export type Option = {
  asset: string;
  label: string;
  network: string;
  proof: string;
};

export type Pricing = {
  api: string;
  free: string;
  pilot: string;
  pro: string;
};

export type RateLimit = {
  note: string;
  requests: number;
  windowSeconds: number;
};

export type ToolCategories = {
  containers: string[];
  data: string[];
  diff: string[];
  filesystem: string[];
  "git-forges": string[];
  kubernetes: string[];
  network: string[];
  search: string[];
  system: string[];
  utilities: string[];
};

export type Variants = {
  http: HTTP;
  noc7: HTTP;
};

export type HTTP = {
  description: string;
  image: string;
};

export type Icon = {
  src: string;
  mimeType?: string;
  sizes?: string[];
  theme?: string;
};

export type Package = {
  registryType: string;
  identifier: string;
  version?: string;
  transport: Transport;
  environmentVariables?: EnvironmentVariable[];
  runtimeHint?: string;
  runtimeArguments?: RuntimeArgument[];
  packageArguments?: PackageArgument[];
  registryBaseUrl?: string;
  fileSha256?: string;
};

export type EnvironmentVariable = {
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  name: string;
  format?: string;
  default?: string;
  placeholder?: string;
  value?: string;
  variables?: EnvironmentVariableVariables;
  choices?: string[];
};

export type EnvironmentVariableVariables = {
  weather_choices?: AgentID;
  TRILO_PAT?: ApifyToken;
  INFOBIP_API_KEY?: ApifyToken;
  YUOR_MCP_TOKEN?: ApifyToken;
  BRIGHTSEC_API_KEY?: ApifyToken;
  api_key?: ApifyToken;
  FIRSTDATA_API_KEY?: ApifyToken;
  indicate_api_key?: ApifyToken;
  NETDATA_CLOUD_API_TOKEN?: SgpDirectoryAPIKey;
};

export type ApifyToken = {
  description?: string;
  isRequired?: boolean;
  format?: string;
  isSecret?: boolean;
  default?: string;
  placeholder?: string;
  choices?: string[];
};

export type SgpDirectoryAPIKey = {
  description: string;
  isSecret: boolean;
};

export type AgentID = {
  description: string;
  isRequired?: boolean;
};

export type PackageArgument = {
  description?: string;
  isRequired?: boolean;
  format?: string;
  default?: string;
  type: string;
  name?: string;
  valueHint?: string;
  value?: string;
  variables?: PackageArgumentVariables;
  choices?: string[];
  isSecret?: boolean;
  placeholder?: string;
  isRepeated?: boolean;
};

export type PackageArgumentVariables = {
  region: Instance;
};

export type Instance = {
  description: string;
  isRequired?: boolean;
  default: string;
};

export type RuntimeArgument = {
  description?: string;
  isRequired?: boolean;
  format?: string;
  default?: string;
  type: string;
  name?: string;
  valueHint?: string;
  isRepeated?: boolean;
  value?: string;
  variables?: RuntimeArgumentVariables;
  choices?: string[];
};

export type RuntimeArgumentVariables = {
  workspace?: AgentID;
  host_port?: HostPort;
  network?: HostPort;
  api_key?: ApifyToken;
  models_path?: ApifyToken;
  encoder_file?: ApifyToken;
  decoder_file?: ApifyToken;
  tokens_file?: ApifyToken;
  token?: ApifyToken;
  config_path?: ApifyToken;
  data_path?: ApifyToken;
  workspace_path?: ApifyToken;
  gid?: ApifyToken;
  uid?: ApifyToken;
  xdg_runtime_dir?: ApifyToken;
  group?: APIKey;
  user?: APIKey;
  hostPath?: APIKey;
  host?: Instance;
  port?: ApifyToken;
  source_path?: ApifyToken;
};

export type APIKey = {
  description: string;
};

export type HostPort = {
  description: string;
  default: string;
};

export type Transport = {
  type: string;
  url?: string;
  headers?: EnvironmentVariable[];
};

export type Remote = {
  type: string;
  url: string;
  headers?: EnvironmentVariable[];
  variables?: RemoteVariables;
};

export type RemoteVariables = {
  HAPI_FQDN?: ApifyToken;
  HAPI_PORT?: ApifyToken;
  api_key?: ApifyToken;
  instance?: Instance;
  baseUrl?: ApifyToken;
  "server-name"?: AgentID;
  env?: ApifyToken;
  tenant_id?: AgentID;
  agent_id?: AgentID;
  region?: ApifyToken;
  qovery_token?: ApifyToken;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  token?: ApifyToken;
  AUTH_TOKEN?: ApifyToken;
  prior_api_key?: ApifyToken;
  server_host?: AgentID;
  API_KEY?: APIKey;
  SKYVERN_API_KEY?: ApifyToken;
  PROJECT_REF?: APIKey;
  apiKey?: ApifyToken;
  company_code?: APIKey;
  BILT_API_KEY?: ApifyToken;
  site_key?: AgentID;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: ApifyToken;
  APIFY_TOKEN?: ApifyToken;
  host?: AgentID;
  marmot_host?: AgentID;
  your_mcp_server_host?: AgentID;
  sourcegraph_hostname?: AgentID;
  lobster_id?: AgentID;
  endpoint?: AgentID;
  api_token?: ApifyToken;
};

export type OauthClientID = {
  description: string;
  value: string;
};

export type Repository = {
  url?: string;
  source?: string;
  id?: string;
  subfolder?: string;
};
