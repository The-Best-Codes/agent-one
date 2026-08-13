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
  title?: string;
  version: string;
  remotes?: Remote[];
  repository?: Repository;
  websiteUrl?: string;
  packages?: Package[];
  _meta?: ServerMeta;
  icons?: Icon[];
};

export type ServerMeta = {
  "io.modelcontextprotocol.registry/publisher-provided"?: {
    [key: string]:
      | Array<PurpleIoModelcontextprotocolRegistryPublisherProvided | number | string>
      | boolean
      | number
      | {
          [key: string]:
            | Array<FluffyIoModelcontextprotocolRegistryPublisherProvided | string>
            | boolean
            | TentacledIoModelcontextprotocolRegistryPublisherProvided
            | number
            | string;
        }
      | string;
  };
};

export type PurpleIoModelcontextprotocolRegistryPublisherProvided = {
  count?: number;
  description?: string;
  name?: string;
  config?: ConfigConfig | string;
  note?: string;
  command?: string;
  example?: Example;
  title?: string;
  answers?: string;
  annotations?: Annotations;
  readOnly?: boolean;
  auth?: string;
  summary?: string;
  price_usd?: number;
  price?: string;
  returns?: string;
  task?: string;
  type?: string;
  upgrade?: string;
  args?: string[];
  side_effect?: string;
  id?: string;
  url?: string;
  canonical?: string;
  uriTemplate?: string;
  label?: string;
  network?: string;
  mimeType?: string;
  purpose?: string;
  sizes?: string;
  src?: string;
  code?: string;
  role?: string;
  exampleQuery?: string;
  priceUsd?: string;
  requirements?: string;
  email?: string;
  examples?: string[];
  default?: boolean;
  flag?: string;
};

export type Annotations = {
  destructiveHint: boolean;
  openWorldHint: boolean;
  readOnlyHint: boolean;
};

export type ConfigConfig = {
  mcpServers: ConfigMCPServers;
};

export type ConfigMCPServers = {
  codeix: CodeixClass;
};

export type CodeixClass = {
  args: string[];
  command: string;
};

export type Example = {
  parameters: Parameters;
  tool: string;
};

export type Parameters = {
  limit: number;
  q: string;
};

export type FluffyIoModelcontextprotocolRegistryPublisherProvided = {
  description?: string;
  name?: string;
  usd_per_month?: number | string;
  level?: string;
  organization?: string;
  url?: string;
  install?: string;
  required?: boolean;
  config?: CodeixClass;
};

export type TentacledIoModelcontextprotocolRegistryPublisherProvided = {
  listChanged?: boolean;
  aml_screen?: string;
  kyc_check?: string;
  risk_report?: string;
  "/assess_opportunity"?: string;
  "/check_entry_viability"?: string;
  "/check_pool_viability"?: string;
  "/estimate_net_position"?: string;
  "/gas_timing"?: string;
  "/market_snapshot"?: string;
  "/profitlens/ranking"?: string;
  "/profitlens/returns"?: string;
  "/verify_claim"?: string;
  formula?: string;
  install?: string[];
  tap?: string;
  channels?: Channels;
  endpoints?: string[] | EndpointsClass;
  errorCode?: number;
  keyFormat?: string;
  modes?: string[];
  noRecovery?: boolean;
  grant_types?: string[];
  metadata_endpoint?: string;
  token_endpoint?: string;
  type?: string;
  description?: string;
  image?: string;
  env_var?: string;
  command?: string;
  install_url?: string;
  status?: string;
  authorizationUrl?: string;
  clientId?: string;
  scopes?: Array<ScopeClass | string>;
  tokenUrl?: TokenURLClass | string;
  billingBasis?: string;
  deepUsdPerHandle?: string;
  internalActorFailoverHasNoExtraCharge?: boolean;
  livePreflightAnd402AreAuthoritative?: boolean;
  minimumTaskUsd?: string;
  normalProgressiveTiers?: string[];
  pricingVersion?: string;
  deep?: string;
  normal?: string;
  alsoSupported?: string[];
  primary?: string;
  billing?: string;
  limit?: number;
  period?: string;
  scope?: string;
  api_key_env?: string;
  api_key_header?: string;
  requires_api_key?: boolean;
  changelog?: string;
  health?: string;
  metadata?: string;
  dynamicClientRegistration?: boolean;
  pkce?: string;
  wellKnownIssuer?: string;
  docsUrl?: string;
  oauthDiscoveryUrl?: string;
  "invoke-human-tasks"?: InvokeHumanTasks;
  nervapack?: Nervapack;
  "nervapack-memory"?: Nervapack;
  mcpServers?: IoModelcontextprotocolRegistryPublisherProvidedMCPServers;
  codingAgentSetup?: string;
  llmsTxt?: string;
  protocol?: string;
  resources?: string[] | boolean;
  auth?: string;
  homepage?: string;
  quickstart?: string;
  recipes?: string;
  reference?: string;
  agentCard?: string;
  examples?: string;
  githubExamples?: string;
  llms?: string;
  openapi?: string;
  enabled?: boolean;
  note?: string;
  admin?: string;
  contacts?: string;
  messaging?: string;
  workflows?: string;
  github?: string;
  name?: string;
  url?: string;
  graph?: string;
  llmsFullTxt?: string;
  types?: string[];
  sources?: string[];
  analyst?: number;
  enterprise?: string;
  free?: number;
  team?: number;
  args?: unknown[];
  node?: string;
  monthly?: number;
  yearly?: number;
  default?: string;
  environmentVariable?: string;
  values?: Values;
  faq?: string;
  pypi?: string[] | string;
  consentUrl?: string;
  grantTypes?: string[];
  notes?: string;
  revocationUrl?: string;
  sessionManagementUrl?: string;
  credentials?: string[];
  transport?: string;
  levels?: string[];
  presets?: Preset[];
  version?: number;
  npm?: string[];
  company_baseline?: string;
  evidence_packet?: string;
  program_search?: string;
  quota_before_batch?: string;
  method?: string;
  prompts?: boolean;
  tools?: string[] | number;
  campaign?: string;
  source?: string;
  tags?: string[];
  tier?: string;
  deferred_chains?: string[];
  label?: string;
  live_chains?: string[];
  planned_chains?: string[];
  protocol_coverage?: ProtocolCoverage;
  structural_risk_carrier_tools?: string[];
  structural_risk_fields?: string[];
};

export type Channels = {
  argument: string;
  header: string;
};

export type EndpointsClass = {
  lock: string;
  unlock: string;
  verify: string;
};

export type InvokeHumanTasks = {
  type: string;
  url: string;
};

export type IoModelcontextprotocolRegistryPublisherProvidedMCPServers = {
  lumen?: Lumen;
  "logic-pro"?: Nervapack;
};

export type Nervapack = {
  command: string;
};

export type Lumen = {
  args: string[];
  command: string;
  env: Env;
};

export type Env = {
  DATABASE_URL: string;
  LUMEN_MCP_AUTH_TOKEN: string;
};

export type Preset = {
  id: string;
  scopes: string[];
  title: string;
};

export type ProtocolCoverage = {
  live: string[];
  planned_2026_q2_q3: string[];
};

export type ScopeClass = {
  description: string;
  id: string;
  maxLevel: string;
  title: string;
};

export type TokenURLClass = {
  eu: string;
  us: string;
};

export type Values = {
  dual: Date[];
  legacy: Date[];
  modern: Date[];
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
  registryBaseUrl?: string;
  runtimeHint?: string;
  environmentVariables?: EnvironmentVariable[];
  packageArguments?: PackageArgument[];
  runtimeArguments?: RuntimeArgument[];
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
  weather_choices?: Account;
  comfyui_base_url?: AimarketHost;
  connection_string?: ApifyAPIToken;
  default_top?: AimarketHost;
  max_top?: AimarketHost;
  essentials_search_engine?: AllowSecrets;
  essentials_search_api_key?: SgpDirectoryAPIKey;
  serper_api_key?: SgpDirectoryAPIKey;
  serpapi_api_key?: SgpDirectoryAPIKey;
  tavily_api_key?: SgpDirectoryAPIKey;
  wolfram_appid?: SgpDirectoryAPIKey;
  essentials_memory_path?: ProjectRef;
  essentials_download_directory?: ProjectRef;
  essentials_settings_path?: ProjectRef;
  data_go_kr_api_key?: SgpDirectoryAPIKey;
  publicdata_timeout_seconds?: AimarketHost;
  publicdata_max_response_length?: AimarketHost;
  openai_api_key?: SgpDirectoryAPIKey;
  anthropic_api_key?: SgpDirectoryAPIKey;
  gemini_api_key?: SgpDirectoryAPIKey;
  voyage_api_key?: SgpDirectoryAPIKey;
  groq_api_key?: SgpDirectoryAPIKey;
  storage_path?: ProjectRef;
  output_path?: ProjectRef;
  license_path?: ProjectRef;
  ls_appkey?: ApifyAPIToken;
  ls_appsecretkey?: ApifyAPIToken;
  ls_market?: AllowSecrets;
  garnet_host?: ProjectRef;
  garnet_port?: ProjectRef;
  embeddings_provider?: ProjectRef;
  embeddings_endpoint?: ProjectRef;
  embeddings_deployment?: ProjectRef;
  embeddings_dimensions?: ProjectRef;
  sipnav_username?: ProjectRef;
  sipnav_password?: SgpDirectoryAPIKey;
  sipnav_api_url?: ProjectRef;
};

export type SgpDirectoryAPIKey = {
  description: string;
  isSecret: boolean;
};

export type AimarketHost = {
  description: string;
  default: string;
};

export type ApifyAPIToken = {
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  format?: string;
  default?: string;
  placeholder?: string;
};

export type ProjectRef = {
  description: string;
};

export type AllowSecrets = {
  description: string;
  default: string;
  choices: string[];
};

export type Account = {
  description: string;
  isRequired?: boolean;
};

export type PackageArgument = {
  value?: string;
  type: string;
  description?: string;
  isRequired?: boolean;
  format?: string;
  valueHint?: string;
  default?: string;
  name?: string;
  isRepeated?: boolean;
  variables?: PackageArgumentVariables;
  choices?: string[];
  isSecret?: boolean;
  placeholder?: string;
};

export type PackageArgumentVariables = {
  region?: ApifyAPIToken;
  store_path?: ApifyAPIToken;
  host?: ApifyAPIToken;
  port?: ApifyAPIToken;
  user_id?: ApifyAPIToken;
  workingDirectory?: ApifyAPIToken;
  toolFilter?: ToolFilter;
};

export type ToolFilter = {
  description: string;
  placeholder: string;
  choices: string[];
};

export type RuntimeArgument = {
  value?: string;
  type: string;
  description?: string;
  name?: string;
  valueHint?: string;
  isRequired?: boolean;
  format?: string;
  default?: string;
  isRepeated?: boolean;
  choices?: string[];
  variables?: RuntimeArgumentVariables;
  placeholder?: string;
  isSecret?: boolean;
};

export type RuntimeArgumentVariables = {
  workspace?: Account;
  host_port?: AimarketHost;
  network?: AimarketHost;
  MCP_SERVER_PORT?: AimarketHost;
  HOST_CONTROL_PANEL?: ProjectRef;
  PORT_CONTROL_PANEL?: AimarketHost;
  DASHBOARD_API_KEY?: SgpDirectoryAPIKey;
  SERVICE_HOST?: ProjectRef;
  project?: ApifyAPIToken;
  config_dir?: ApifyAPIToken;
  workbook_dir?: ApifyAPIToken;
  api_key?: ApifyAPIToken;
  models_path?: ApifyAPIToken;
  encoder_file?: ApifyAPIToken;
  decoder_file?: ApifyAPIToken;
  tokens_file?: ApifyAPIToken;
  data_dir?: ApifyAPIToken;
  token?: ApifyAPIToken;
  VAULT_PATH?: ApifyAPIToken;
  config_path?: ApifyAPIToken;
  data_path?: ApifyAPIToken;
  workspace_path?: ApifyAPIToken;
  ssh_private_key_path?: ApifyAPIToken;
  ssh_known_hosts_path?: ApifyAPIToken;
  gid?: ApifyAPIToken;
  uid?: ApifyAPIToken;
  xdg_runtime_dir?: ApifyAPIToken;
  host?: ApifyAPIToken;
  port?: ApifyAPIToken;
  address?: Address;
  enabled?: Address;
  kubeconfig_dir?: Account;
  inventory_path?: ApifyAPIToken;
  key_path?: ApifyAPIToken;
  host_user?: ApifyAPIToken;
  repository?: ApifyAPIToken;
  audio_directory?: ApifyAPIToken;
  data_volume?: ApifyAPIToken;
  uid_gid?: ApifyAPIToken;
  password?: ApifyAPIToken;
  rpc_url?: ApifyAPIToken;
  vault_path?: ApifyAPIToken;
  kube_config?: ApifyAPIToken;
  sas_token_dir?: ApifyAPIToken;
  kubeconfig_path?: ApifyAPIToken;
  source_path?: ApifyAPIToken;
  project_dir?: ApifyAPIToken;
  keepassxc_dir?: ApifyAPIToken;
  client_id?: ApifyAPIToken;
  client_secret?: ApifyAPIToken;
  customer_id?: CustomerID;
  vanity_domain?: CustomerID;
};

export type Address = {
  format: string;
  default: string;
};

export type CustomerID = {
  isRequired: boolean;
  format: string;
};

export type Transport = {
  type: string;
  url?: string;
  headers?: TransportHeader[];
  variables?: TransportVariables;
};

export type TransportHeader = {
  description?: string;
  format?: string;
  isSecret?: boolean;
  name: string;
  isRequired?: boolean;
  value?: string;
  variables?: PurpleVariables;
  default?: string;
  choices?: string[];
};

export type PurpleVariables = {
  token?: ApifyAPIToken;
  MCP_AUTH_TOKEN?: ApifyAPIToken;
};

export type TransportVariables = {
  HOST_CONTROL_PANEL: Account;
  PORT_CONTROL_PANEL: AimarketHost;
};

export type Remote = {
  type: string;
  url: string;
  headers?: RemoteHeader[];
  variables?: RemoteVariables;
};

export type RemoteHeader = {
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  name: string;
  placeholder?: string;
  format?: string;
  value?: string;
  variables?: FluffyVariables;
  choices?: string[];
  default?: string;
};

export type FluffyVariables = {
  api_key?: ApifyAPIToken;
  mcp_client_secret?: ApifyAPIToken;
  PRIMATE_API_KEY?: ApifyAPIToken;
  mcp_token?: ApifyAPIToken;
  TRILO_PAT?: ApifyAPIToken;
  CAMBER_API_KEY?: ApifyAPIToken;
  chad_mcp_token?: ApifyAPIToken;
  token?: ApifyAPIToken;
  INFOBIP_API_KEY?: ApifyAPIToken;
  LADDRO_API_KEY?: ApifyAPIToken;
  agentfarm_token?: ApifyAPIToken;
  NEURA_RELAY_MCP_TOKEN?: ApifyAPIToken;
  partglyph_api_key?: ApifyAPIToken;
  access_key?: ApifyAPIToken;
  IFR_COWORKER_TOKEN?: ApifyAPIToken;
  cernion_token?: ApifyAPIToken;
  e2a_api_key?: ApifyAPIToken;
  calmloop_mcp_token?: ApifyAPIToken;
  NINELAYER_API_KEY?: ApifyAPIToken;
  adtao_api_key?: ApifyAPIToken;
  project_token?: ApifyAPIToken;
  CATHEDRAL_API_KEY?: ApifyAPIToken;
  UPTOCODE_API_KEY?: ApifyAPIToken;
  LTD_API_TOKEN?: ApifyAPIToken;
  imagcon_api_key?: ApifyAPIToken;
  AUTH_TOKEN?: ApifyAPIToken;
  YUOR_MCP_TOKEN?: ApifyAPIToken;
  BRIGHTSEC_API_KEY?: ApifyAPIToken;
  EVERALICE_API_KEY?: ApifyAPIToken;
  FIRSTDATA_API_KEY?: ApifyAPIToken;
  YO_API_KEY?: ApifyAPIToken;
  agent_name?: ApifyAPIToken;
  apiKey?: ApifyAPIToken;
  indicate_api_key?: ApifyAPIToken;
  NETDATA_CLOUD_API_TOKEN?: SgpDirectoryAPIKey;
  mcp_access_token?: SgpDirectoryAPIKey;
  pixelvault_api_key?: ApifyAPIToken;
  rendley_api_key?: ApifyAPIToken;
  signaliz_api_key?: ApifyAPIToken;
  credentials?: ApifyAPIToken;
  patsol_api_key?: ApifyAPIToken;
  RUNLOG_API_KEY?: ApifyAPIToken;
};

export type RemoteVariables = {
  api_host?: APIHost;
  project_slug?: Account;
  domain?: Account;
  HAPI_FQDN?: ApifyAPIToken;
  HAPI_PORT?: ApifyAPIToken;
  workspaceSlug?: Account;
  api_key?: ApifyAPIToken;
  roster_host?: ApifyAPIToken;
  ATLAS_MCP_URL?: ApifyAPIToken;
  workspace?: ApifyAPIToken;
  storefront?: AimarketHost;
  sysname?: ProjectRef;
  shop_id?: AimarketHost;
  API_KEY?: ApifyAPIToken;
  connector_token?: ApifyAPIToken;
  token?: APIHost;
  channel_key?: ApifyAPIToken;
  instance?: ApifyAPIToken;
  cxone_base_url?: Account;
  tenant_id?: Account;
  site_domain?: APIHost;
  tenant?: ApifyAPIToken;
  bucket_slug?: Account;
  baseUrl?: APIHost;
  "server-name"?: Account;
  tenantId?: ProjectRef;
  property_slug?: Account;
  subdomain?: Account;
  portal_host?: Account;
  env?: APIHost;
  apify_token?: ApifyAPIToken;
  agent_id?: Account;
  apiKey?: ApifyAPIToken;
  region?: APIHost;
  x_playcaller_key?: ApifyAPIToken;
  qovery_token?: ApifyAPIToken;
  host?: APIHost;
  key?: ApifyAPIToken;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  cle?: ApifyAPIToken;
  server_name?: Account;
  perfex_host?: Account;
  group?: APIHost;
  tenant_name?: Account;
  team_id?: Account;
  AUTH_TOKEN?: ApifyAPIToken;
  owner?: Account;
  repo?: Account;
  api_id?: ApifyAPIToken;
  shop?: ApifyAPIToken;
  allow_secrets?: AllowSecrets;
  read_only?: AllowSecrets;
  services_scope?: AllowSecrets;
  prior_api_key?: ApifyAPIToken;
  organizationId?: Account;
  tenant_slug?: Account;
  mcp_gsc_worker_domain?: ApifyAPIToken;
  game?: Account;
  studio?: Account;
  namespace?: Account;
  private_cloud_url?: Account;
  language?: APIHost;
  arquestra_token?: ApifyAPIToken;
  network?: APIHost;
  supabase_project_ref?: Account;
  project_id?: Account;
  easy8_host?: Account;
  APIFY_API_TOKEN?: ApifyAPIToken;
  server_host?: Account;
  HOSTNAME?: ApifyAPIToken;
  artel_host?: ApifyAPIToken;
  hitkeep_host?: Account;
  apifyToken?: ApifyAPIToken;
  slug?: Account;
  SKYVERN_API_KEY?: ApifyAPIToken;
  session_id?: ApifyAPIToken;
  PROJECT_REF?: ProjectRef;
  ibkr_mcp_host?: Account;
  company_code?: ProjectRef;
  aimarket_host?: AimarketHost;
  AVA_API_KEY?: ApifyAPIToken;
  oauth_token?: ApifyAPIToken;
  BILT_API_KEY?: ApifyAPIToken;
  site_key?: Account;
  coder_hostname?: ApifyAPIToken;
  builder_id?: ApifyAPIToken;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: ApifyAPIToken;
  hostname?: Account;
  atlas_api_key?: ApifyAPIToken;
  APIFY_TOKEN?: ApifyAPIToken;
  dateStyle?: AllowSecrets;
  includeCoordinates?: ApifyAPIToken;
  mapLanguage?: AllowSecrets;
  temperatureUnit?: AllowSecrets;
  companyId?: Account;
  account?: Account;
  helpdesk_host?: Account;
  organization?: Account;
  worker_host?: Account;
  marmot_host?: Account;
  metabase_host?: Account;
  worker_domain?: ApifyAPIToken;
  openmetadata_host?: Account;
  plexus_host?: ProjectRef;
  your_mcp_server_host?: Account;
  sourcegraph_hostname?: Account;
  lobster_id?: Account;
  mcpPath?: MCPPath;
  remoteHost?: ApifyAPIToken;
  endpoint?: Account;
  key_id?: ApifyAPIToken;
  key_secret?: ApifyAPIToken;
  appId?: Account;
  mcpHost?: APIHost;
  api_token?: ApifyAPIToken;
  endpoint_code?: Account;
  locale?: APIHost;
  cashtag?: ApifyAPIToken;
};

export type APIHost = {
  description: string;
  isRequired?: boolean;
  choices?: string[];
  placeholder?: string;
  default?: string;
  format?: string;
  isSecret?: boolean;
};

export type MCPPath = {
  description: string;
  default: string;
  placeholder: string;
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
