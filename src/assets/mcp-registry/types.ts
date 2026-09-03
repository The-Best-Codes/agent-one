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
  canonical?: string;
  title?: string;
  metered?: boolean;
  readOnly?: boolean;
  answers?: string;
  annotations?: Annotations;
  auth?: string;
  summary?: string;
  search?: string;
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
  package?: string;
  script?: string;
  subfolder?: string;
  toolPrefix?: string;
  transport?: string;
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
  purpose?: string;
  usd_per_month?: number | string;
  credits?: number;
  price?: number;
  level?: string;
  organization?: string;
  url?: string;
  install?: string;
  required?: boolean;
  config?: CodeixClass;
};

export type TentacledIoModelcontextprotocolRegistryPublisherProvided = {
  listChanged?: boolean;
  check?: string[];
  file?: string[];
  flag?: string[];
  forward?: string[];
  read?: string[];
  reply?: string[];
  send?: string[] | string;
  actionSafety?: string;
  authorizationQuorum?: string;
  compensation?: string;
  contextRights?: string;
  contextStatus?: string;
  contextualQuality?: string;
  disclosureBudget?: string;
  documentSafety?: string;
  durableDeadline?: string;
  humanApproval?: string;
  integrationReadiness?: string;
  operatorEscalation?: string;
  policyMatch?: string;
  reviewCapacity?: string;
  reworkMyText?: string;
  termsEvidence?: string;
  textSafety?: string;
  vetoWindow?: string;
  webhookInbox?: string;
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
  barrier_create?: string;
  barrier_signal?: string;
  barrier_status?: string;
  budget_check?: string;
  budget_record?: string;
  checkpoint_get?: string;
  checkpoint_put?: string;
  claim?: string;
  complete?: string;
  heartbeat?: string;
  inbox_ack?: string;
  inbox_nack?: string;
  inbox_poll?: string;
  inbox_schedule?: string;
  job_cancel?: string;
  lease?: string;
  lease_release?: string;
  lease_renew?: string;
  register?: string;
  resume_packet?: string;
  retry_state?: string;
  seen_add?: string;
  seen_check?: string;
  should_continue?: string;
  watermark_get?: string;
  watermark_set?: string;
  whoami?: string;
  work_done?: string;
  work_fail?: string;
  work_push?: string;
  work_status?: string;
  work_take?: string;
  mcpfax_endpoint_credit_score?: string;
  mcpfax_endpoint_revenue_estimate?: string;
  mcpfax_integration_drift?: string;
  mcpfax_payer_wallet_profile?: string;
  mcpfax_payto_change_feed?: string;
  mcpfax_preflight_check?: string;
  mcpfax_wallet_authenticity?: string;
  cheapest_basket?: string;
  find_product?: string;
  price_basket?: string;
  package_audit?: string;
  package_info?: string;
  package_vulnerabilities?: string;
  discover_feeds?: string;
  read_feed?: string;
  food_by_barcode?: string;
  base_gas_price?: string;
  crypto_spot_prices?: string;
  defi_chains?: string;
  defi_protocol?: string;
  defi_protocols?: string;
  defi_token_prices?: string;
  defi_yields?: string;
  fx_reference_rates?: string;
  manifold_markets?: string;
  polymarket_events?: string;
  polymarket_leaderboard?: string;
  polymarket_market?: string;
  polymarket_markets?: string;
  polymarket_trades?: string;
  prediction_market_search?: string;
  stablecoin_peg_deviation?: string;
  us_macro_indicators?: string;
  us_treasury_yields?: string;
  address_info?: string;
  gas_now?: string;
  token_info?: string;
  tx_status?: string;
  resolve_url?: string;
  site_pages?: string;
  url_headers?: string;
  dtc_lookup?: string;
  vehicle_recalls?: string;
  vehicle_tsbs?: string;
  vin_decode?: string;
  page_links?: string;
  read_page?: string;
  x402_category_demand?: string;
  x402_market_report?: string;
  x402_new_entrants?: string;
  x402_seller_rank?: string;
  x402_top_movers?: string;
  x402_trending_services?: string;
  billing?: string;
  limit?: number;
  period?: string;
  scope?: string;
  api_key_env?: string;
  api_key_header?: string;
  requires_api_key?: boolean;
  channels?: Channels;
  endpoints?: string[] | EndpointsClass;
  errorCode?: number;
  keyFormat?: string;
  modes?: string[];
  noRecovery?: boolean;
  "exchange:attempt"?: string;
  "exchange:propose"?: string;
  "exchange:read"?: string;
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
  addressScoping?: boolean;
  audience?: string;
  issuance?: string;
  scheme?: string;
  discovery?: string;
  dynamicClientRegistration?: boolean;
  pkce?: string;
  changelog?: string;
  health?: string;
  metadata?: string;
  codingAgentSetup?: string;
  llmsTxt?: string;
  wellKnownIssuer?: string;
  docsUrl?: string;
  oauthDiscoveryUrl?: string;
  id?: number;
  jsonrpc?: string;
  method?: string;
  params?: Params;
  "invoke-human-tasks"?: InvokeHumanTasks;
  nervapack?: Nervapack;
  "nervapack-memory"?: Nervapack;
  mcpServers?: IoModelcontextprotocolRegistryPublisherProvidedMCPServers;
  protocol?: string;
  resources?: string[] | boolean;
  auth?: string;
  homepage?: string;
  quickstart?: string;
  recipes?: string;
  reference?: string;
  developers?: string;
  guide?: string;
  openapi?: string;
  partners?: string;
  agentCard?: string[] | string;
  examples?: string;
  githubExamples?: string;
  llms?: string;
  enabled?: boolean;
  note?: string;
  dedicatedRestPrefix?: string;
  initialPriceUsd?: number;
  supportedOnSelectedStatelessTextTools?: boolean;
  admin?: string;
  contacts?: string;
  messaging?: string;
  workflows?: string;
  github?: string;
  name?: string;
  url?: string;
  documentation?: string;
  howItWorks?: string;
  pricing?: string;
  privacyPolicy?: string;
  security?: string;
  setupGuides?: string;
  supportedProviders?: string;
  toolReference?: string;
  whatItCanDo?: string;
  faq?: string;
  pypi?: string[] | string;
  graph?: string;
  labsOpenApi?: string;
  llmsFullTxt?: string;
  types?: string[];
  sources?: string[];
  analyst?: number;
  enterprise?: string;
  free?: number;
  team?: number;
  args?: unknown[];
  hkRegistry?: string[];
  node?: string;
  monthly?: number;
  yearly?: number;
  default?: string;
  environmentVariable?: string;
  values?: Values;
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
  commitlore?: Commitlore;
  "logic-pro"?: Nervapack;
};

export type Commitlore = {
  args: string[];
  command: string;
  cwd: string;
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

export type Params = {
  arguments: Arguments;
  name: string;
};

export type Arguments = {};

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
  environmentVariables?: EnvironmentVariable[];
  registryBaseUrl?: string;
  runtimeHint?: string;
  packageArguments?: PackageArgument[];
  runtimeArguments?: RuntimeArgument[];
  fileSha256?: string;
};

export type EnvironmentVariable = {
  description?: string;
  isRequired?: boolean;
  format?: string;
  isSecret?: boolean;
  name: string;
  default?: string;
  placeholder?: string;
  choices?: string[];
  value?: string;
  variables?: EnvironmentVariableVariables;
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
  name?: string;
  isRequired?: boolean;
  format?: string;
  valueHint?: string;
  default?: string;
  isRepeated?: boolean;
  placeholder?: string;
  variables?: PackageArgumentVariables;
  choices?: string[];
  isSecret?: boolean;
};

export type PackageArgumentVariables = {
  region?: ApifyAPIToken;
  store_path?: ApifyAPIToken;
  user_id?: APIKey;
  config_path?: APIKey;
  workflow_dir?: ApifyAPIToken;
  workingDirectory?: APIKey;
  toolFilter?: ToolFilter;
};

export type APIKey = {
  description: string;
  isRequired?: boolean;
  format?: string;
  placeholder?: string;
  isSecret?: boolean;
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
  variables?: RuntimeArgumentVariables;
  choices?: string[];
  placeholder?: string;
  isSecret?: boolean;
};

export type RuntimeArgumentVariables = {
  config_file?: APIKey;
  workspace?: Account;
  host_port?: AimarketHost;
  network?: AimarketHost;
  MCP_SERVER_PORT?: AimarketHost;
  HOST_CONTROL_PANEL?: ProjectRef;
  PORT_CONTROL_PANEL?: AimarketHost;
  DASHBOARD_API_KEY?: SgpDirectoryAPIKey;
  SERVICE_HOST?: ProjectRef;
  project?: APIKey;
  config_dir?: ApifyAPIToken;
  kubeconfig_path?: ApifyAPIToken;
  workbook_dir?: APIKey;
  api_key?: ApifyAPIToken;
  models_path?: ApifyAPIToken;
  encoder_file?: ApifyAPIToken;
  decoder_file?: ApifyAPIToken;
  tokens_file?: ApifyAPIToken;
  port?: ApifyAPIToken;
  configDir?: APIKey;
  contentDir?: APIKey;
  dataDir?: APIKey;
  token?: ApifyAPIToken;
  VAULT_PATH?: APIKey;
  config_path?: APIKey;
  data_path?: APIKey;
  workspace_path?: ApifyAPIToken;
  ssh_private_key_path?: APIKey;
  ssh_known_hosts_path?: APIKey;
  gid?: ApifyAPIToken;
  uid?: ApifyAPIToken;
  xdg_runtime_dir?: APIKey;
  source_path?: ApifyAPIToken;
  ssh_key?: Account;
  logs_dir?: ProjectRef;
  host?: ApifyAPIToken;
  address?: Address;
  enabled?: Address;
  kubeconfig_dir?: Account;
  inventory_path?: APIKey;
  key_path?: ApifyAPIToken;
  host_dir?: APIKey;
  host_user?: APIKey;
  repository?: APIKey;
  audio_directory?: APIKey;
  data_volume?: ApifyAPIToken;
  uid_gid?: APIKey;
  documents_dir?: APIKey;
  password?: ApifyAPIToken;
  rpc_url?: APIKey;
  vault_path?: APIKey;
  kube_config?: ApifyAPIToken;
  sas_token_dir?: APIKey;
  knowledge_path?: ApifyAPIToken;
  project_dir?: APIKey;
  keepassxc_dir?: APIKey;
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
  placeholder?: string;
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
  api_key?: APIKey;
  mcp_client_secret?: ApifyAPIToken;
  token?: ApifyAPIToken;
  postfleet_api_key?: ApifyAPIToken;
  PRIMATE_API_KEY?: ApifyAPIToken;
  seaotter_api_key?: APIKey;
  mcp_token?: APIKey;
  TRILO_PAT?: ApifyAPIToken;
  CAMBER_API_KEY?: ApifyAPIToken;
  chad_mcp_token?: APIKey;
  agent_token?: ApifyAPIToken;
  INFOBIP_API_KEY?: ApifyAPIToken;
  LADDRO_API_KEY?: APIKey;
  agentfarm_token?: ApifyAPIToken;
  NEURA_RELAY_MCP_TOKEN?: ApifyAPIToken;
  partglyph_api_key?: APIKey;
  rankcusp_api_key?: ApifyAPIToken;
  access_key?: ApifyAPIToken;
  scriptivox_api_key?: ApifyAPIToken;
  IFR_COWORKER_TOKEN?: ApifyAPIToken;
  access_token?: ProjectRef;
  bot_token?: APIKey;
  cernion_token?: ApifyAPIToken;
  e2a_api_key?: APIKey;
  agent_key?: ApifyAPIToken;
  calmloop_mcp_token?: ApifyAPIToken;
  NINELAYER_API_KEY?: ApifyAPIToken;
  adtao_api_key?: APIKey;
  project_token?: ApifyAPIToken;
  CATHEDRAL_API_KEY?: ApifyAPIToken;
  UPTOCODE_API_KEY?: ApifyAPIToken;
  platform_token?: ApifyAPIToken;
  LTD_API_TOKEN?: ApifyAPIToken;
  imagcon_api_key?: ApifyAPIToken;
  hosttracker_api_token?: ApifyAPIToken;
  agent_push_kit_token?: APIKey;
  AUTH_TOKEN?: ApifyAPIToken;
  YUOR_MCP_TOKEN?: ApifyAPIToken;
  BRIGHTSEC_API_KEY?: ApifyAPIToken;
  normi_api_key?: ApifyAPIToken;
  EVERALICE_API_KEY?: APIKey;
  revinho_token?: APIKey;
  FIRSTDATA_API_KEY?: ApifyAPIToken;
  YO_API_KEY?: ApifyAPIToken;
  agent_name?: APIKey;
  apiKey?: ApifyAPIToken;
  indicate_api_key?: ApifyAPIToken;
  NETDATA_CLOUD_API_TOKEN?: SgpDirectoryAPIKey;
  mcp_access_token?: SgpDirectoryAPIKey;
  pixelvault_api_key?: ApifyAPIToken;
  rendley_api_key?: ApifyAPIToken;
  signaliz_api_key?: APIKey;
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
  core?: AimarketHost;
  user?: AimarketHost;
  hub?: APIKey;
  workspaceSlug?: Account;
  api_key?: APIKey;
  roster_host?: APIKey;
  ATLAS_MCP_URL?: ApifyAPIToken;
  workspace?: APIHost;
  mcp_token?: ApifyAPIToken;
  tenant_domain?: Account;
  storefront?: AimarketHost;
  sysname?: ProjectRef;
  token?: APIHost;
  shop_id?: AimarketHost;
  API_KEY?: APIKey;
  connector_token?: ApifyAPIToken;
  channel_key?: ApifyAPIToken;
  instance?: ApifyAPIToken;
  subdomain?: APIHost;
  account_id?: Account;
  region?: APIHost;
  cxone_base_url?: Account;
  tenant_id?: Account;
  site_domain?: APIHost;
  tenant?: ApifyAPIToken;
  bucket_slug?: Account;
  baseUrl?: APIHost;
  "server-name"?: Account;
  tenantId?: ProjectRef;
  property_slug?: Account;
  portal_host?: Account;
  env?: APIHost;
  apify_token?: ApifyAPIToken;
  agent_id?: Account;
  host?: APIHost;
  apiKey?: APIKey;
  x_playcaller_key?: ApifyAPIToken;
  instance_host?: Account;
  qovery_token?: ApifyAPIToken;
  key?: ApifyAPIToken;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  cle?: ApifyAPIToken;
  server_name?: Account;
  perfex_host?: Account;
  group?: APIHost;
  deployment_domain?: Account;
  tenant_name?: Account;
  team_id?: Account;
  projectId?: Account;
  AUTH_TOKEN?: ApifyAPIToken;
  owner?: Account;
  repo?: Account;
  api_id?: ApifyAPIToken;
  shop?: APIKey;
  allow_secrets?: AllowSecrets;
  read_only?: AllowSecrets;
  services_scope?: AllowSecrets;
  prior_api_key?: ApifyAPIToken;
  organizationId?: Account;
  tenant_slug?: Account;
  mcp_gsc_worker_domain?: APIKey;
  game?: Account;
  studio?: Account;
  namespace?: Account;
  private_cloud_url?: Account;
  language?: APIHost;
  arquestra_token?: ApifyAPIToken;
  network?: APIHost;
  supabase_project_ref?: Account;
  project_id?: Account;
  environment_id?: APIKey;
  easy8_host?: Account;
  label?: AimarketHost;
  APIFY_API_TOKEN?: ApifyAPIToken;
  installation_domain?: APIKey;
  hybridlog_host?: Account;
  server_host?: Account;
  mailfathom_host?: APIKey;
  HOSTNAME?: APIKey;
  artel_host?: ApifyAPIToken;
  orgSlug?: Account;
  hitkeep_host?: Account;
  apifyToken?: ApifyAPIToken;
  slug?: Account;
  SKYVERN_API_KEY?: ApifyAPIToken;
  env_id?: APIKey;
  session_id?: ApifyAPIToken;
  PROJECT_REF?: ProjectRef;
  ibkr_mcp_host?: Account;
  company_code?: ProjectRef;
  aimarket_host?: AimarketHost;
  AVA_API_KEY?: ApifyAPIToken;
  oauth_token?: ApifyAPIToken;
  atisbo_mcp_key?: ApifyAPIToken;
  BILT_API_KEY?: ApifyAPIToken;
  site_key?: Account;
  coder_hostname?: APIKey;
  builder_id?: APIKey;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: APIKey;
  swarm_host?: Account;
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
  worker_domain?: APIKey;
  openmetadata_host?: Account;
  plexus_host?: ProjectRef;
  your_mcp_server_host?: Account;
  SERPAPI_API_KEY?: APIKey;
  sourcegraph_hostname?: Account;
  lobster_id?: Account;
  mcpPath?: MCPPath;
  remoteHost?: APIKey;
  endpoint?: Account;
  key_id?: ApifyAPIToken;
  key_secret?: ApifyAPIToken;
  appId?: Account;
  mcpHost?: APIHost;
  api_token?: ApifyAPIToken;
  endpoint_code?: Account;
  locale?: APIHost;
  cashtag?: APIKey;
  publish_token?: ApifyAPIToken;
  site?: APIKey;
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
