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
      | null
      | string;
  };
};

export type PurpleIoModelcontextprotocolRegistryPublisherProvided = {
  count?: number;
  description?: string;
  name?: string;
  plan?: string;
  title?: string;
  metered?: boolean;
  readOnly?: boolean;
  capability_level?: string;
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
  endpoint?: string;
  upgrade?: string;
  args?: string[];
  side_effect?: string;
  inputSchema?: InputSchema;
  config?: ConfigConfig | string;
  note?: string;
  command?: string;
  example?: Example;
  canonical?: string;
  id?: string;
  method?: string;
  paid?: boolean;
  path?: string;
  price_usdc?: string;
  registry_label?: string;
  url?: string;
  uriTemplate?: string;
  label?: string;
  network?: string;
  report_version?: string;
  version?: string;
  scenario?: Scenario;
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

export type InputSchema = {
  properties: Properties;
  type: string;
  required?: string[];
};

export type Properties = {
  category?: Category;
  search?: Category;
  serviceId?: Category;
  name?: Category;
  signature?: Category;
  wallet?: Category;
  params?: Category;
  url?: Category;
};

export type Category = {
  description: string;
  type: string;
};

export type Scenario = {
  action_call_limit?: number;
  budget_credits?: number;
  cost_per_independent_attempt?: number;
  independent_attempts_before_success?: number;
  variant: string;
  expected_record_count?: number;
  page_size?: number;
};

export type FluffyIoModelcontextprotocolRegistryPublisherProvided = {
  description?: string;
  name?: string;
  free_item_limit?: number | null;
  pricing?: string;
  tool?: string;
  meter?: Meter;
  price?: PriceClass | number;
  pricing_version?: string;
  purpose?: string;
  usd_per_month?: number | string;
  credits?: number;
  config?: CodeixClass;
  level?: string;
  organization?: string;
  url?: string;
  install?: string;
  required?: boolean;
  repository?: string;
  command?: string;
  distribution?: string;
  installation?: string;
  pypi?: string;
  pythonImport?: string;
  equivalentCommand?: string;
  remoteCommands?: string[];
};

export type Meter = {
  items_per_charge_unit: number;
  unit: string;
};

export type PriceClass = {
  base_micro_usd: number;
  per_unit_micro_usd: number;
  source: string;
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
  api_key_env?: string;
  api_key_header?: string;
  requires_api_key?: boolean;
  auth?: string;
  limits?: string;
  tools?: string[] | number;
  url?: string;
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
  api?: string;
  discovery?: string;
  docs?: string;
  registration?: string;
  reviewedAt?: Date;
  specification?: string;
  status?: string;
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
  lobeHub?: string;
  pulseMCP?: string;
  formula?: string;
  install?: string[];
  tap?: string;
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
  authorizationUrl?: string;
  clientId?: string;
  scopes?: Array<ScopeClass | string>;
  tokenUrl?: TokenURLClass | string;
  protected_resource_metadata?: string;
  downloads?: string;
  enterprise?: EnterpriseClass | string;
  hosted_discovery?: string;
  hosted_execution?: string;
  micro_usd_per_credit?: number;
  statement?: string;
  usd_per_credit?: number;
  compute_cost_role?: string;
  rule?: string;
  substitution_value_role?: string;
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
  codingAgentSetup?: string;
  llmsTxt?: string;
  addressScoping?: boolean;
  audience?: string;
  issuance?: string;
  scheme?: string;
  dynamicClientRegistration?: boolean;
  pkce?: string;
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
  enabled?: boolean;
  note?: string;
  dedicatedRestPrefix?: string;
  initialPriceUsd?: number;
  supportedOnSelectedStatelessTextTools?: boolean;
  changelog?: string;
  health?: string;
  metadata?: string;
  discoverable?: boolean;
  label?: string;
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
  balanceRequiresAuthentication?: boolean;
  commerceEvidencePreviews?: CommerceEvidencePreviews;
  currency?: string;
  freeHelpers?: string[];
  freePreviewLimits?: FreePreviewLimits;
  fundingPackOptionsCents?: number[];
  maximumMicroUsd?: number;
  minimumFundingCents?: number;
  minimumMicroUsd?: number;
  offerPreviewLimits?: OfferPreviewLimits;
  paidTools?: number;
  paymentOptions?: PaymentOptions;
  protocol?: string;
  resources?: string[] | boolean | number;
  homepage?: string;
  quickstart?: string;
  recipes?: string;
  reference?: string;
  demo?: string;
  demoApi?: string;
  openapi?: string;
  developers?: string;
  guide?: string;
  partners?: string;
  agentCard?: string[] | string;
  examples?: string;
  githubExamples?: string;
  llms?: string;
  admin?: string;
  contacts?: string;
  messaging?: string;
  workflows?: string;
  get_ptc_rates?: string[];
  get_utility_by_zip?: string[];
  search_plans?: string[];
  github?: string;
  name?: string;
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
  existing_mailbox_required?: boolean;
  format?: string;
  runtime?: string;
  sdk?: string;
  source_bundle_url?: string;
  version?: number | string;
  archive_sha256?: string;
  bundle_digest_scope?: string;
  bundle_sha256?: string;
  python_requires?: string;
  setup_guide?: string;
  supported_host?: string;
  prompts?: boolean | number;
  resourceTemplates?: number;
  clients?: string[];
  guideUrl?: string;
  indexUrl?: string;
  verification?: string;
  credential?: string;
  obtainKey?: string;
  analyst?: number;
  free?: number;
  team?: number;
  args?: string[];
  hkRegistry?: string[];
  node?: string;
  monthly?: number;
  yearly?: number;
  default?: string;
  environmentVariable?: string;
  values?: Values;
  input?: string;
  requires?: string;
  submitsPayment?: boolean;
  tool?: string;
  consentUrl?: string;
  grantTypes?: string[];
  notes?: string;
  revocationUrl?: string;
  sessionManagementUrl?: string;
  credentials?: string[];
  transport?: string;
  levels?: string[];
  presets?: Preset[];
  npm?: string[];
  tags?: string[];
  tier?: string;
  company_baseline?: string;
  evidence_packet?: string;
  program_search?: string;
  quota_before_batch?: string;
  campaign?: string;
  source?: string;
  hosted?: Hosted;
  localDaemon?: LocalDaemon;
  deferred_chains?: string[];
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

export type CommerceEvidencePreviews = {
  htmlBodyBytes: number;
  packBodyBytes: number;
  packQuantities: number;
};

export type EndpointsClass = {
  lock: string;
  unlock: string;
  verify: string;
};

export type EnterpriseClass = {
  contact: string;
  mode: string;
};

export type FreePreviewLimits = {
  maxInputBytes: number;
  maxOffers: number;
  maxPacksPerOffer: number;
  maxRequiredUnits: number;
  maxUnitsPerPack: number;
};

export type Hosted = {
  reason: string;
  status: string;
};

export type InvokeHumanTasks = {
  type: string;
  url: string;
};

export type LocalDaemon = {
  authorization: string;
  browser: string;
  command: string;
  status: string;
  writes: string;
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

export type OfferPreviewLimits = {
  maxInputBytes: number;
  maxOffers: number;
};

export type Params = {
  arguments: Arguments;
  name: string;
};

export type Arguments = {};

export type PaymentOptions = {
  arguments: Arguments;
  authenticationRequired: boolean;
  automaticallyFunds: boolean;
  createsAccount: boolean;
  createsCheckout: boolean;
  tool: string;
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
  tenant?: AgentAtlasHost;
  license_key?: ApifyAPIToken;
  server?: ApifyAPIToken;
  database?: Account;
  password?: ApifyAPIToken;
  port?: ApifyAPIToken;
  user?: ApifyAPIToken;
  service_name?: Account;
  sandbox?: ApifyAPIToken;
  host?: ApifyAPIToken;
  client_id?: Account;
  client_secret?: ApifyAPIToken;
  refresh_token?: ApifyAPIToken;
  subdomain?: Account;
  domain?: ApifyAPIToken;
  data_center?: ApifyAPIToken;
  weather_choices?: Account;
  comfyui_base_url?: AimarketHost;
  connection_string?: ApifyAPIToken;
  default_top?: AimarketHost;
  max_top?: AimarketHost;
  essentials_search_engine?: ApifyAPIToken;
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
  metered_public_key?: ProjectRef;
  metered_private_key?: SgpDirectoryAPIKey;
  ls_appkey?: ApifyAPIToken;
  ls_appsecretkey?: ApifyAPIToken;
  ls_market?: ApifyAPIToken;
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

export type Account = {
  description: string;
  isRequired?: boolean;
};

export type ApifyAPIToken = {
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  format?: string;
  default?: string;
  placeholder?: string;
  choices?: string[];
};

export type AimarketHost = {
  description: string;
  default: string;
};

export type ProjectRef = {
  description: string;
};

export type AgentAtlasHost = {
  description: string;
  isRequired?: boolean;
  format?: string;
  placeholder?: string;
  isSecret?: boolean;
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
  project_path?: Account;
  workspace?: AgentAtlasHost;
  user_id?: AgentAtlasHost;
  repo_path?: Account;
  api_url?: ApifyAPIToken;
  config_path?: AgentAtlasHost;
  workflow_dir?: ApifyAPIToken;
  workingDirectory?: AgentAtlasHost;
  toolFilter?: ToolFilter;
  project_root?: AgentAtlasHost;
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
  config_file?: AgentAtlasHost;
  workspace?: ApifyAPIToken;
  host_port?: AimarketHost;
  network?: AimarketHost;
  files_dir?: Account;
  adapter_jar_host_path?: AgentAtlasHost;
  adapter_jar_name?: Account;
  config_host_path?: AgentAtlasHost;
  version?: VersionClass;
  container_user?: ApifyAPIToken;
  input_directory?: Account;
  output_directory?: Account;
  MCP_SERVER_PORT?: AimarketHost;
  HOST_CONTROL_PANEL?: ProjectRef;
  PORT_CONTROL_PANEL?: AimarketHost;
  DASHBOARD_API_KEY?: SgpDirectoryAPIKey;
  SERVICE_HOST?: ProjectRef;
  project?: AgentAtlasHost;
  config_dir?: ApifyAPIToken;
  kubeconfig_path?: ApifyAPIToken;
  workbook_dir?: AgentAtlasHost;
  api_key?: ApifyAPIToken;
  models_path?: ApifyAPIToken;
  encoder_file?: ApifyAPIToken;
  decoder_file?: ApifyAPIToken;
  tokens_file?: ApifyAPIToken;
  port?: ApifyAPIToken;
  library?: AgentAtlasHost;
  configDir?: AgentAtlasHost;
  contentDir?: AgentAtlasHost;
  dataDir?: AgentAtlasHost;
  token?: ApifyAPIToken;
  VAULT_PATH?: AgentAtlasHost;
  config_path?: AgentAtlasHost;
  data_path?: AgentAtlasHost;
  workspace_path?: ApifyAPIToken;
  ssh_private_key_path?: AgentAtlasHost;
  ssh_known_hosts_path?: AgentAtlasHost;
  gid?: ApifyAPIToken;
  uid?: ApifyAPIToken;
  xdg_runtime_dir?: AgentAtlasHost;
  source_path?: ApifyAPIToken;
  exports_dir?: ExportsDir;
  ssh_key?: Account;
  logs_dir?: ProjectRef;
  host?: ApifyAPIToken;
  host_workspace?: AgentAtlasHost;
  address?: Address;
  enabled?: Address;
  data_dir?: AgentAtlasHost;
  kubeconfig_dir?: Account;
  inventory_path?: AgentAtlasHost;
  key_path?: ApifyAPIToken;
  host_dir?: AgentAtlasHost;
  host_user?: AgentAtlasHost;
  repository?: AgentAtlasHost;
  audio_directory?: AgentAtlasHost;
  data_volume?: ApifyAPIToken;
  uid_gid?: AgentAtlasHost;
  documents_dir?: AgentAtlasHost;
  password?: ApifyAPIToken;
  rpc_url?: AgentAtlasHost;
  vault_path?: AgentAtlasHost;
  kube_config?: ApifyAPIToken;
  sas_token_dir?: AgentAtlasHost;
  knowledge_path?: ApifyAPIToken;
  project_dir?: AgentAtlasHost;
  keepassxc_dir?: AgentAtlasHost;
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

export type ExportsDir = {
  description: string;
  format: string;
};

export type VersionClass = {
  value: string;
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
  token?: AgentAtlasHost;
  mcp_token?: ApifyAPIToken;
  MCP_AUTH_TOKEN?: ApifyAPIToken;
  OT_SECURITY__BEARER_TOKEN?: ApifyAPIToken;
  api_token?: ApifyAPIToken;
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
  token?: ApifyAPIToken;
  postfleet_api_key?: ApifyAPIToken;
  PRIMATE_API_KEY?: ApifyAPIToken;
  seaotter_api_key?: ApifyAPIToken;
  mcp_token?: ApifyAPIToken;
  typesearch_api_key?: ApifyAPIToken;
  ACTIONDOCK_API_KEY?: ApifyAPIToken;
  FOXNFE_API_KEY?: ApifyAPIToken;
  FOXNFE_TENANT_ID?: Account;
  MUMO_API_KEY?: ApifyAPIToken;
  TRILO_PAT?: ApifyAPIToken;
  smolabot_api_key?: ApifyAPIToken;
  bernuvia_token?: ApifyAPIToken;
  CAMBER_API_KEY?: ApifyAPIToken;
  chad_mcp_token?: ApifyAPIToken;
  agent_token?: AgentAtlasHost;
  INFOBIP_API_KEY?: ApifyAPIToken;
  LADDRO_API_KEY?: ApifyAPIToken;
  agentfarm_token?: ApifyAPIToken;
  NEURA_RELAY_MCP_TOKEN?: ApifyAPIToken;
  partglyph_api_key?: ApifyAPIToken;
  rankcusp_api_key?: ApifyAPIToken;
  access_key?: ApifyAPIToken;
  SCRIPTHAUL_API_KEY?: ApifyAPIToken;
  scriptivox_api_key?: ApifyAPIToken;
  IFR_COWORKER_TOKEN?: ApifyAPIToken;
  SWAMIX_API_KEY?: ApifyAPIToken;
  holon_agent_key?: ApifyAPIToken;
  access_token?: ProjectRef;
  zetto_api_key?: ApifyAPIToken;
  bot_token?: ApifyAPIToken;
  cernion_token?: ApifyAPIToken;
  e2a_api_key?: ApifyAPIToken;
  robase_api_key?: ApifyAPIToken;
  agent_key?: ApifyAPIToken;
  calmloop_mcp_token?: ApifyAPIToken;
  NINELAYER_API_KEY?: ApifyAPIToken;
  adtao_api_key?: ApifyAPIToken;
  project_token?: ApifyAPIToken;
  CATHEDRAL_API_KEY?: ApifyAPIToken;
  UPTOCODE_API_KEY?: ApifyAPIToken;
  platform_token?: ApifyAPIToken;
  LTD_API_TOKEN?: ApifyAPIToken;
  imagcon_api_key?: ApifyAPIToken;
  hosttracker_api_token?: ApifyAPIToken;
  agent_push_kit_token?: ApifyAPIToken;
  AUTH_TOKEN?: ApifyAPIToken;
  YUOR_MCP_TOKEN?: ApifyAPIToken;
  BRIGHTSEC_API_KEY?: ApifyAPIToken;
  normi_api_key?: ApifyAPIToken;
  EVERALICE_API_KEY?: ApifyAPIToken;
  revinho_token?: ApifyAPIToken;
  FIRSTDATA_API_KEY?: ApifyAPIToken;
  YO_API_KEY?: ApifyAPIToken;
  agent_name?: AgentAtlasHost;
  BAIZHI_API_KEY?: ApifyAPIToken;
  apiKey?: ApifyAPIToken;
  ray_api_key?: ApifyAPIToken;
  indicate_api_key?: ApifyAPIToken;
  ipinfo_token?: ApifyAPIToken;
  NETDATA_CLOUD_API_TOKEN?: SgpDirectoryAPIKey;
  mcp_access_token?: SgpDirectoryAPIKey;
  pixelvault_api_key?: ApifyAPIToken;
  rendley_api_key?: ApifyAPIToken;
  SERPAPI_API_KEY?: ApifyAPIToken;
  signaliz_api_key?: ApifyAPIToken;
  credentials?: ApifyAPIToken;
  TOOLTRACE_API_KEY?: ApifyAPIToken;
  patsol_api_key?: ApifyAPIToken;
  private_key?: ApifyAPIToken;
  public_key?: Account;
  agent_pass?: ApifyAPIToken;
  RUNLOG_API_KEY?: ApifyAPIToken;
  hilos_token?: ApifyAPIToken;
  systra_mcp_key?: ApifyAPIToken;
};

export type RemoteVariables = {
  api_host?: ApifyAPIToken;
  project_slug?: Account;
  domain?: Account;
  HAPI_FQDN?: ApifyAPIToken;
  HAPI_PORT?: ApifyAPIToken;
  core?: AimarketHost;
  user?: AimarketHost;
  memory?: Account;
  host?: ApifyAPIToken;
  hub?: AgentAtlasHost;
  workspaceSlug?: Account;
  api_key?: ApifyAPIToken;
  roster_host?: AgentAtlasHost;
  ATLAS_MCP_URL?: ApifyAPIToken;
  token?: ApifyAPIToken;
  workspace?: ApifyAPIToken;
  mcp_token?: ApifyAPIToken;
  tenant_domain?: Account;
  storefront?: AimarketHost;
  sysname?: ProjectRef;
  shop_id?: AimarketHost;
  API_KEY?: ApifyAPIToken;
  publisher?: ApifyAPIToken;
  connector_token?: ApifyAPIToken;
  channel_key?: ApifyAPIToken;
  instance?: ApifyAPIToken;
  subdomain?: ApifyAPIToken;
  account_id?: ApifyAPIToken;
  region?: ApifyAPIToken;
  cxone_base_url?: Account;
  tenant_id?: Account;
  site_domain?: ApifyAPIToken;
  tenant?: ApifyAPIToken;
  bucket_slug?: Account;
  user_id?: ApifyAPIToken;
  baseUrl?: ApifyAPIToken;
  "server-name"?: Account;
  tenantId?: ProjectRef;
  business?: Account;
  property_slug?: Account;
  portal_host?: Account;
  env?: ApifyAPIToken;
  apify_token?: ApifyAPIToken;
  agent_id?: Account;
  apiKey?: ApifyAPIToken;
  x_playcaller_key?: ApifyAPIToken;
  instance_host?: ApifyAPIToken;
  qovery_token?: ApifyAPIToken;
  key?: AgentAtlasHost;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  cle?: ApifyAPIToken;
  server_name?: Account;
  perfex_host?: Account;
  group?: ApifyAPIToken;
  deployment_domain?: Account;
  tenant_name?: Account;
  team_id?: Account;
  projectId?: Account;
  site_host?: ApifyAPIToken;
  AUTH_TOKEN?: ApifyAPIToken;
  owner?: Account;
  repo?: Account;
  api_id?: ApifyAPIToken;
  shop?: AgentAtlasHost;
  allow_secrets?: ApifyAPIToken;
  read_only?: ApifyAPIToken;
  services_scope?: ApifyAPIToken;
  prior_api_key?: ApifyAPIToken;
  organizationId?: Account;
  tenant_slug?: Account;
  game?: Account;
  studio?: Account;
  namespace?: Account;
  private_cloud_url?: Account;
  language?: ApifyAPIToken;
  arquestra_token?: ApifyAPIToken;
  network?: ApifyAPIToken;
  supabase_project_ref?: Account;
  project_id?: Account;
  environment_id?: AgentAtlasHost;
  easy8_host?: Account;
  label?: AimarketHost;
  APIFY_API_TOKEN?: ApifyAPIToken;
  installation_domain?: AgentAtlasHost;
  hybridlog_host?: Account;
  server_host?: Account;
  mailfathom_host?: AgentAtlasHost;
  AGENT_ATLAS_HOST?: AgentAtlasHost;
  AGENT_IRIS_HOST?: AgentAtlasHost;
  SELLING_PARTNER_HOST?: AgentAtlasHost;
  VENDOR_CENTRAL_HOST?: AgentAtlasHost;
  HOSTNAME?: AgentAtlasHost;
  authorization?: ApifyAPIToken;
  artel_host?: ApifyAPIToken;
  orgSlug?: Account;
  secret?: ApifyAPIToken;
  hitkeep_host?: Account;
  apifyToken?: ApifyAPIToken;
  slug?: Account;
  SKYVERN_API_KEY?: ApifyAPIToken;
  env_id?: AgentAtlasHost;
  mcp_key?: AgentAtlasHost;
  session_id?: ApifyAPIToken;
  PROJECT_REF?: ProjectRef;
  vaultgate_host?: Account;
  ibkr_mcp_host?: Account;
  company_code?: ProjectRef;
  aimarket_host?: AimarketHost;
  AVA_API_KEY?: ApifyAPIToken;
  oauth_token?: ApifyAPIToken;
  atisbo_mcp_key?: ApifyAPIToken;
  BILT_API_KEY?: ApifyAPIToken;
  site_key?: Account;
  coder_hostname?: AgentAtlasHost;
  workspaceId?: Account;
  builder_id?: AgentAtlasHost;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: ApifyAPIToken;
  swarm_host?: Account;
  hostname?: Account;
  atlas_api_key?: ApifyAPIToken;
  APIFY_TOKEN?: ApifyAPIToken;
  runtime_host?: AgentAtlasHost;
  workspace_id?: Account;
  dateStyle?: ApifyAPIToken;
  includeCoordinates?: ApifyAPIToken;
  mapLanguage?: ApifyAPIToken;
  temperatureUnit?: ApifyAPIToken;
  companyId?: Account;
  account?: Account;
  helpdesk_host?: Account;
  organization?: Account;
  site?: ApifyAPIToken;
  fanout_host?: AgentAtlasHost;
  worker_host?: Account;
  oauth_mcp_endpoint?: AgentAtlasHost;
  api_key_mcp_endpoint?: AgentAtlasHost;
  marmot_host?: Account;
  metabase_host?: Account;
  worker_domain?: AgentAtlasHost;
  openmetadata_host?: Account;
  plexus_host?: ProjectRef;
  notifyd_host?: Account;
  your_mcp_server_host?: Account;
  sourcegraph_hostname?: Account;
  lobster_id?: Account;
  mcpPath?: MCPPath;
  remoteHost?: AgentAtlasHost;
  endpoint?: Account;
  key_id?: ApifyAPIToken;
  key_secret?: ApifyAPIToken;
  appId?: Account;
  connect_token?: ApifyAPIToken;
  mcpHost?: ApifyAPIToken;
  api_token?: ApifyAPIToken;
  endpoint_code?: Account;
  locale?: ApifyAPIToken;
  cashtag?: AgentAtlasHost;
  publish_token?: ApifyAPIToken;
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
