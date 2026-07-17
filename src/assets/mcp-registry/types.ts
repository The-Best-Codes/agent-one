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
  _meta?: ServerMeta;
  icons?: Icon[];
  packages?: Package[];
};

export type ServerMeta = {
  "io.modelcontextprotocol.registry/publisher-provided"?: {
    [key: string]:
      | Array<PurpleIoModelcontextprotocolRegistryPublisherProvided | string>
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
  config?: ConfigClass | string;
  note?: string;
  command?: string;
  example?: Example;
  title?: string;
  readOnly?: boolean;
  summary?: string;
  price_usd?: number;
  price?: string;
  auth?: string;
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

export type ConfigClass = {
  mcpServers: ConfigMCPServers;
};

export type ConfigMCPServers = {
  codeix: Codeix;
};

export type Codeix = {
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
  asset?: string;
  label?: string;
  network?: string;
  proof?: string;
};

export type TentacledIoModelcontextprotocolRegistryPublisherProvided = {
  listChanged?: boolean;
  formula?: string;
  install?: string[];
  tap?: string;
  alsoSupported?: string[];
  primary?: string;
  billing?: string;
  limit?: number;
  period?: string;
  scope?: string;
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
  scopes?: string[];
  tokenUrl?: TokenURL;
  api_key_env?: string;
  api_key_header?: string;
  requires_api_key?: boolean;
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
  dynamicClientRegistration?: boolean;
  pkce?: string;
  wellKnownIssuer?: string;
  docsUrl?: string;
  oauthDiscoveryUrl?: string;
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
  admin?: string;
  contacts?: string;
  messaging?: string;
  workflows?: string;
  github?: string;
  name?: string;
  url?: string;
  enabled?: boolean;
  types?: string[];
  sources?: string[];
  best_agent?: number;
  evidence?: number;
  fraud_check?: number;
  reputation?: number;
  risk_score?: number;
  mcpServers?: IoModelcontextprotocolRegistryPublisherProvidedMCPServers;
  args?: any[];
  node?: string;
  monthly?: number;
  yearly?: number;
  faq?: string;
  pypi?: string;
  nervapack?: Nervapack;
  "nervapack-memory"?: Nervapack;
  company_baseline?: string;
  evidence_packet?: string;
  program_search?: string;
  quota_before_batch?: string;
  method?: string;
  protocol?: string;
  prompts?: boolean;
  resources?: boolean;
  tools?: string[] | number;
  campaign?: string;
  source?: string;
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

export type IoModelcontextprotocolRegistryPublisherProvidedMCPServers = {
  "logic-pro"?: Nervapack;
  lumen?: Lumen;
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

export type ProtocolCoverage = {
  live: string[];
  planned_2026_q2_q3: string[];
};

export type TokenURL = {
  eu: string;
  us: string;
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
  environmentVariables?: EnvironmentVariable[];
  packageArguments?: PackageArgument[];
  runtimeHint?: string;
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
  sipnav_username?: ProjectRef;
  sipnav_password?: SgpDirectoryAPIKey;
  sipnav_api_url?: ProjectRef;
};

export type SgpDirectoryAPIKey = {
  description: string;
  isSecret: boolean;
};

export type ApifyAPIToken = {
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  format?: string;
  default?: string;
  placeholder?: string;
};

export type AimarketHost = {
  description: string;
  default: string;
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
  default?: string;
  name?: string;
  valueHint?: string;
  isRepeated?: boolean;
  variables?: PackageArgumentVariables;
  choices?: string[];
  isSecret?: boolean;
  placeholder?: string;
};

export type PackageArgumentVariables = {
  region?: HapiFQDN;
  store_path?: HapiFQDN;
  user_id?: HapiFQDN;
  workingDirectory?: HapiFQDN;
  toolFilter?: ToolFilter;
};

export type HapiFQDN = {
  description: string;
  isRequired?: boolean;
  default?: string;
  format?: string;
  placeholder?: string;
  isSecret?: boolean;
  choices?: string[];
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
  config_dir?: ApifyAPIToken;
  workbook_dir?: HapiFQDN;
  api_key?: ApifyAPIToken;
  models_path?: HapiFQDN;
  encoder_file?: HapiFQDN;
  decoder_file?: HapiFQDN;
  tokens_file?: HapiFQDN;
  token?: ApifyAPIToken;
  VAULT_PATH?: HapiFQDN;
  config_path?: HapiFQDN;
  data_path?: HapiFQDN;
  workspace_path?: ApifyAPIToken;
  ssh_private_key_path?: HapiFQDN;
  ssh_known_hosts_path?: HapiFQDN;
  gid?: HapiFQDN;
  uid?: HapiFQDN;
  xdg_runtime_dir?: HapiFQDN;
  host?: HapiFQDN;
  port?: HapiFQDN;
  address?: Address;
  enabled?: Address;
  inventory_path?: HapiFQDN;
  key_path?: ApifyAPIToken;
  password?: ApifyAPIToken;
  rpc_url?: HapiFQDN;
  vault_path?: HapiFQDN;
  kube_config?: HapiFQDN;
  source_path?: HapiFQDN;
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
  api_key?: HapiFQDN;
  mcp_client_secret?: ApifyAPIToken;
  mcp_token?: HapiFQDN;
  TRILO_PAT?: ApifyAPIToken;
  CAMBER_API_KEY?: ApifyAPIToken;
  token?: HapiFQDN;
  INFOBIP_API_KEY?: ApifyAPIToken;
  agentfarm_token?: ApifyAPIToken;
  NEURA_RELAY_MCP_TOKEN?: ApifyAPIToken;
  partglyph_api_key?: HapiFQDN;
  IFR_COWORKER_TOKEN?: ApifyAPIToken;
  NINELAYER_API_KEY?: ApifyAPIToken;
  CATHEDRAL_API_KEY?: ApifyAPIToken;
  YUOR_MCP_TOKEN?: ApifyAPIToken;
  e2a_api_key?: ApifyAPIToken;
  BRIGHTSEC_API_KEY?: ApifyAPIToken;
  EVERALICE_API_KEY?: HapiFQDN;
  FIRSTDATA_API_KEY?: ApifyAPIToken;
  agent_name?: HapiFQDN;
  indicate_api_key?: ApifyAPIToken;
  NETDATA_CLOUD_API_TOKEN?: SgpDirectoryAPIKey;
  mcp_access_token?: SgpDirectoryAPIKey;
  pixelvault_api_key?: ApifyAPIToken;
  rendley_api_key?: ApifyAPIToken;
  signaliz_api_key?: HapiFQDN;
  RUNLOG_API_KEY?: ApifyAPIToken;
};

export type RemoteVariables = {
  api_host?: APIHost;
  project_slug?: Account;
  domain?: Account;
  HAPI_FQDN?: HapiFQDN;
  HAPI_PORT?: ApifyAPIToken;
  workspaceSlug?: Account;
  api_key?: HapiFQDN;
  roster_host?: APIHost;
  ATLAS_MCP_URL?: ApifyAPIToken;
  sysname?: ProjectRef;
  shop_id?: AimarketHost;
  API_KEY?: ApifyAPIToken;
  connector_token?: ApifyAPIToken;
  token?: HapiFQDN;
  channel_key?: ApifyAPIToken;
  instance?: ApifyAPIToken;
  site_domain?: APIHost;
  tenant?: ApifyAPIToken;
  baseUrl?: APIHost;
  "server-name"?: Account;
  tenantId?: ProjectRef;
  property_slug?: Account;
  subdomain?: Account;
  env?: APIHost;
  tenant_id?: Account;
  apify_token?: ApifyAPIToken;
  agent_id?: Account;
  apiKey?: HapiFQDN;
  region?: HapiFQDN;
  x_playcaller_key?: ApifyAPIToken;
  qovery_token?: ApifyAPIToken;
  host?: APIHost;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  server_name?: Account;
  tenant_name?: Account;
  team_id?: Account;
  AUTH_TOKEN?: ApifyAPIToken;
  owner?: Account;
  repo?: Account;
  api_id?: ApifyAPIToken;
  allow_secrets?: AllowSecrets;
  read_only?: AllowSecrets;
  services_scope?: AllowSecrets;
  prior_api_key?: ApifyAPIToken;
  tenant_slug?: Account;
  mcp_gsc_worker_domain?: APIHost;
  game?: Account;
  studio?: Account;
  namespace?: Account;
  private_cloud_url?: Account;
  language?: APIHost;
  arquestra_token?: ApifyAPIToken;
  supabase_project_ref?: Account;
  project_id?: Account;
  easy8_host?: Account;
  APIFY_API_TOKEN?: ApifyAPIToken;
  server_host?: Account;
  artel_host?: HapiFQDN;
  hitkeep_host?: Account;
  apifyToken?: ApifyAPIToken;
  slug?: Account;
  SKYVERN_API_KEY?: ApifyAPIToken;
  PROJECT_REF?: ProjectRef;
  ibkr_mcp_host?: Account;
  company_code?: ProjectRef;
  aimarket_host?: AimarketHost;
  AVA_API_KEY?: ApifyAPIToken;
  oauth_token?: ApifyAPIToken;
  BILT_API_KEY?: ApifyAPIToken;
  site_key?: Account;
  coder_hostname?: HapiFQDN;
  builder_id?: HapiFQDN;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: HapiFQDN;
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
  port?: MCPPath;
  marmot_host?: Account;
  metabase_host?: Account;
  worker_domain?: APIHost;
  openmetadata_host?: Account;
  plexus_host?: ProjectRef;
  your_mcp_server_host?: Account;
  sourcegraph_hostname?: Account;
  lobster_id?: Account;
  mcpPath?: MCPPath;
  remoteHost?: APIHost;
  endpoint?: Account;
  key_id?: ApifyAPIToken;
  key_secret?: ApifyAPIToken;
  api_token?: ApifyAPIToken;
  endpoint_code?: Account;
};

export type APIHost = {
  description: string;
  isRequired?: boolean;
  choices?: string[];
  placeholder?: string;
  default?: string;
  format?: string;
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
