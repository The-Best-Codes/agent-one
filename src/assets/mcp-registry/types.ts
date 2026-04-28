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
  icons?: ServerIcon[];
  packages?: Package[];
};

export type ServerMeta = {
  "io.modelcontextprotocol.registry/publisher-provided"?: IoModelcontextprotocolRegistryPublisherProvided;
};

export type IoModelcontextprotocolRegistryPublisherProvided = {
  connect?: string;
  docs?: string;
  agentSkills?: string;
  displayName?: string;
  license?: LicenseClass | string;
  manifest?: string;
  serverCard?: string;
  sponsor?: Sponsor;
  documentation?: DocumentationClass | string;
  examples?: ExampleElement[];
  keywords?: string[];
  notes?: string[] | string;
  publisher?: string;
  tool?: string;
  version?: string;
  categories?: string[];
  dataSources?: string[];
  languages?: string[];
  pricing?: Pricing;
  privacyPolicy?: string;
  prompts?: string[];
  regions?: string[];
  support?: Support;
  termsOfService?: string;
  tools?: Array<ToolClass | string> | number;
  auth?: AuthClass | string;
  mcp_endpoint?: string;
  service?: string;
  authentication?: AuthenticationClass | string;
  openapi?: string;
  protocolVersion?: Date;
  quotasManifest?: string;
  resources?: Array<ResourceClass | string>;
  skills?: Skill[];
  subscribe?: boolean;
  free_tier_credits?: number;
  pricing_model?: string;
  tools_exposed?: string[];
  contactEmail?: string;
  geography?: string;
  language?: string;
  logoUrl?: string;
  rateLimitNote?: string;
  tagline?: string;
  alternateEnvironments?: AlternateEnvironment[];
  category?: string[] | string;
  discovery?: Discovery;
  tags?: string[];
  longDescription?: string;
  preferredTransport?: string;
  quickstart?: QuickstartClass | string;
  logo?: string;
  privacy_policy?: string;
  support_url?: string;
  terms_of_service?: string;
  highlights?: string[];
  authorizationUrl?: string;
  documentationUrl?: string;
  all_supported_languages?: string[];
  build_info?: BuildInfoClass;
  capabilities?: string[] | CapabilitiesClass | string;
  brand?: Brand;
  builtWith?: BuiltWith;
  icons?: IoModelcontextprotocolRegistryPublisherProvidedIcon[];
  links?: Links;
  localizedDescriptions?: LocalizedDescriptions;
  markets?: Market[];
  observability?: Observability;
  toolCategories?: ToolCategories;
  toolCount?: number;
  transport?: string[] | TransportTransport | string;
  promptCount?: number;
  resourceCount?: number;
  homepage?: string;
  features?: string[] | FeaturesClass;
  spec?: string;
  x402?: string;
  toolHints?: ToolHint[];
  author?: string;
  issues?: string;
  repository?: string;
  competitive_alternatives?: string[];
  differentiators_against_alternatives?: string[];
  showcases?: Showcase[];
  stance?: string;
  stance_text?: string;
  provider?: string;
  signup?: string;
  chain?: string;
  data_sources?: string[];
  endpoints_count?: number;
  erc8004_agent_id?: string;
  x402_enabled?: boolean;
  installationMethods?: InstallationMethod[];
  channel?: string;
  deployment?: Deployment;
  requires?: string;
  priority?: number | string;
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
  discovery_endpoint?: string;
  health_endpoint?: string;
  securityContact?: string;
  supportUrl?: string;
  icon?: string;
  iconUrl?: string;
  framework?: string;
  maintainers?: Array<VendorClass | string>;
  type?: string;
  permissions?: string;
  rateLimits?: string;
  vendor?: VendorClass | string;
  dockerizedBy?: string;
  originalAuthor?: string;
  install_guide?: string;
  billingNotes?: string[];
  compatibilityNotes?: string[];
  endpoints?: Endpoints;
  modes?: Modes;
  payments?: Payments;
  performanceNotes?: string[];
  product?: string;
  compliance?: string[] | ComplianceClass;
  dataTypes?: string[];
  hardened?: boolean;
  coverage?: string;
  eventCatalog?: string;
  openApi?: string;
  publisherCountry?: string;
  security?: string;
  toolCatalog?: string;
  wellKnown?: WellKnown;
  discovery_url?: string;
  documentation_url?: string;
  llms_txt_url?: string;
  server_card_url?: string;
  tool_count?: number;
  aliases?: string[];
  canonical_owner?: string;
  domain?: string;
  did?: string;
  tools_canonical?: string[];
  contacts?: Contact[];
  free_tier?: boolean;
  migratedFrom?: string;
  source?: string;
  auth_required?: boolean;
  skill_path?: string;
  source_url?: string;
  cliOptions?: CLIOption[];
  platform?: string;
  privacyPolicyUrl?: string;
  leadIntent?: string;
  distribution_channels?: DistributionChannels;
  payment?: Payment;
};

export type AlternateEnvironment = {
  label: string;
  network: string;
  url: string;
};

export type AuthClass = {
  header?: string;
  type?: string;
  via?: string;
  currency?: string;
  network?: string;
  payTo?: string;
  pricingPerCall?: string;
  authorizationServerMetadata?: string;
  protectedResourceMetadata?: string;
  authorization_endpoint?: string;
  scopes?: string[];
  token_endpoint?: string;
  authorizationEndpoint?: string;
  dynamicClientRegistration?: boolean;
  metadataEndpoint?: string;
  registrationEndpoint?: string;
  tokenEndpoint?: string;
};

export type AuthenticationClass = {
  discoveryUrl?: string;
  docs?: string;
  flow?: string;
  resourceMetadataUrl?: string;
  type: string;
  description?: string;
};

export type Brand = {
  developerPortal: string;
  displayName: string;
  documentation: string;
  legalName: string;
  publisher: Publisher;
  tagline: string;
  website: string;
};

export type Publisher = {
  github: string;
  name: string;
  url: string;
};

export type BuildInfo = {
  imageSha256?: string;
  release?: string;
  timestamp?: Date;
};

export type BuildInfoClass = {
  framework?: string;
  package_manager?: string;
  python_version?: string;
  commit?: string;
  deployment_id?: string;
  region?: string;
  timestamp?: Date;
};

export type BuiltWith = {
  edition: string;
  framework: string;
  language: string;
  sdk: string;
};

export type CapabilitiesClass = {
  chunking_strategies?: string[];
  embedding_providers?: string[];
  languages_supported?: number;
  reranking_providers?: string[];
  search_types?: string[];
  sparse_embedding_providers?: string[];
  vector_store_providers?: string[];
  backtesting?: boolean;
  optionsGreeks?: boolean;
  orderPlacement?: boolean;
  orderPlacementSelfHostedOnly?: boolean;
  paperTrading?: boolean;
  riskGuardChecks?: number;
  telegramAlerts?: boolean;
  tools?: ToolClass[] | number;
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

export type ComplianceClass = {
  acp: string;
  ap2: string;
  pci: string;
  pipa: string;
  ucp: string;
};

export type Contact = {
  email: string;
  name: string;
  url: string;
};

export type Deployment = {
  egressIp: string;
  region: string;
};

export type Discovery = {
  openApi?: string;
  wellKnownMcpPricing?: string;
  wellKnownX402?: string;
  initializeMethod?: string;
  toolsCallMethod?: string;
  toolsListMethod?: string;
  agent_card?: string;
  mcp_card?: string;
  openapi?: string;
};

export type DistributionChannels = {
  clawhub: string;
  mcp_registry: string;
  mpp_gateway: string;
  rest_api: string;
};

export type DocumentationClass = {
  setup: string;
  support: string;
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

export type IoModelcontextprotocolRegistryPublisherProvidedIcon = {
  mimeType: string;
  purpose: string;
  sizes: string;
  src: string;
};

export type InstallationMethod = {
  command?: string;
  description: string;
  requirements?: string;
  type: string;
  url?: string;
};

export type LicenseClass = {
  spdxId: string;
  url: string;
};

export type Links = {
  changelog: string;
  developerPortal: string;
  documentation: string;
  homepage: string;
  issues: string;
  source: string;
};

export type LocalizedDescriptions = {
  en: string;
  "zh-CN": string;
  "zh-HK": string;
};

export type VendorClass = {
  name: string;
  url: string;
};

export type Market = {
  code: string;
  name: string;
};

export type Modes = {
  deep: string;
  normal: string;
};

export type Observability = {
  metrics: string[];
  prometheusMetricsEndpoint: string;
};

export type Payment = {
  available: boolean;
  chain_id: number;
  currency: string;
  currency_address: string;
  discovery_url: string;
  gateway_url: string;
  network: string;
  note: string;
  pricing_usd: PricingUsd;
  protocol: string;
};

export type PricingUsd = {
  "/assess_opportunity": string;
  "/check_entry_viability": string;
  "/check_pool_viability": string;
  "/estimate_net_position": string;
  "/gas_timing": string;
  "/market_snapshot": string;
  "/profitlens/ranking": string;
  "/profitlens/returns": string;
  "/verify_claim": string;
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
  freeTier?: boolean;
  model?: string;
  url?: string;
  base_price_usd?: number;
  base_rows_included?: number;
  currency?: string;
  max_price_usd?: number;
  network?: string;
  payment_protocol?: string;
  per_row_usd?: number;
  notes?: string;
  api?: string;
  free?: string;
  pilot?: string;
  pro?: string;
};

export type QuickstartClass = {
  a2aAgentCard: string;
  capabilityGraph: string;
  description: string;
  openapiSpec: string;
  sdkPackage: string;
  selfRegisterEndpoint: string;
  supportContact: string;
  workspaceDirectory: string;
};

export type RateLimit = {
  note: string;
  requests: number;
  windowSeconds: number;
};

export type ResourceClass = {
  description: string;
  id: string;
  title: string;
  url: string;
};

export type Showcase = {
  title: string;
  url: string;
};

export type Skill = {
  canonical: string;
  description: string;
  name: string;
};

export type Sponsor = {
  homepage: string;
  name: string;
  relationship: string;
};

export type Support = {
  email: string;
  url: string;
};

export type ToolCategories = {
  alert?: number;
  calendar?: number;
  content?: number;
  dca?: number;
  fundamental?: number;
  market?: number;
  portfolio?: number;
  quote?: number;
  sharelist?: number;
  statement?: number;
  trade?: number;
  utility?: number;
  containers?: string[];
  data?: string[];
  diff?: string[];
  filesystem?: string[];
  "git-forges"?: string[];
  kubernetes?: string[];
  network?: string[];
  search?: string[];
  system?: string[];
  utilities?: string[];
};

export type ToolHint = {
  description: string;
  exampleQuery: string;
  name: string;
};

export type TransportTransport = {
  rfc9728Compliant: boolean;
  stateless: boolean;
};

export type Variants = {
  http: HTTP;
  noc7: HTTP;
};

export type HTTP = {
  description: string;
  image: string;
};

export type WellKnown = {
  authorizationServer: string;
  jwks: string;
  protectedResource: string;
};

export type ServerIcon = {
  src: string;
  mimeType?: string;
  sizes?: string[];
  theme?: string;
};

export type Package = {
  registryType: string;
  identifier: string;
  version?: string;
  transport: PackageTransport;
  environmentVariables?: EnvironmentVariable[];
  registryBaseUrl?: string;
  runtimeHint?: string;
  runtimeArguments?: RuntimeArgument[];
  packageArguments?: PackageArgument[];
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
  storage_path?: APIKey;
  output_path?: APIKey;
  license_path?: APIKey;
  api_key?: ApifyAPIToken;
  TRILO_PAT?: ApifyAPIToken;
  token?: ApifyAPIToken;
  INFOBIP_API_KEY?: ApifyAPIToken;
  CATHEDRAL_API_KEY?: ApifyAPIToken;
  YUOR_MCP_TOKEN?: ApifyAPIToken;
  BRIGHTSEC_API_KEY?: ApifyAPIToken;
  FIRSTDATA_API_KEY?: ApifyAPIToken;
  indicate_api_key?: ApifyAPIToken;
  NETDATA_CLOUD_API_TOKEN?: SgpDirectoryAPIKey;
  mcp_access_token?: ApifyAPIToken;
};

export type ApifyAPIToken = {
  description?: string;
  isRequired?: boolean;
  format?: string;
  placeholder?: string;
  isSecret?: boolean;
};

export type SgpDirectoryAPIKey = {
  description: string;
  isSecret: boolean;
};

export type APIKey = {
  description: string;
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
  isRepeated?: boolean;
  variables?: PackageArgumentVariables;
  choices?: string[];
  isSecret?: boolean;
  placeholder?: string;
};

export type PackageArgumentVariables = {
  region?: HapiFQDN;
  workingDirectory?: ApifyAPIToken;
  toolFilter?: ToolFilter;
};

export type HapiFQDN = {
  description: string;
  isRequired?: boolean;
  default?: string;
  format?: string;
  isSecret?: boolean;
  placeholder?: string;
};

export type ToolFilter = {
  description: string;
  placeholder: string;
  choices: string[];
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
  placeholder?: string;
  choices?: string[];
  isSecret?: boolean;
};

export type RuntimeArgumentVariables = {
  workspace?: AgentID;
  host_port?: HostPort;
  network?: HostPort;
  api_key?: ApifyAPIToken;
  models_path?: HapiFQDN;
  encoder_file?: HapiFQDN;
  decoder_file?: HapiFQDN;
  tokens_file?: HapiFQDN;
  token?: ApifyAPIToken;
  config_path?: ApifyAPIToken;
  data_path?: ApifyAPIToken;
  workspace_path?: ApifyAPIToken;
  gid?: HapiFQDN;
  uid?: HapiFQDN;
  xdg_runtime_dir?: ApifyAPIToken;
  group?: APIKey;
  user?: APIKey;
  hostPath?: APIKey;
  host?: HapiFQDN;
  port?: HapiFQDN;
  address?: Address;
  enabled?: Address;
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

export type HostPort = {
  description: string;
  default: string;
};

export type PackageTransport = {
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
  HAPI_FQDN?: HapiFQDN;
  HAPI_PORT?: HapiFQDN;
  api_key?: ApifyAPIToken;
  project_slug?: AgentID;
  instance?: HapiFQDN;
  DOOMSCROLLR_API_KEY?: ApifyAPIToken;
  baseUrl?: ApifyAPIToken;
  "server-name"?: AgentID;
  env?: DateStyle;
  tenant_id?: AgentID;
  agent_id?: AgentID;
  apiKey?: HapiFQDN;
  region?: DateStyle;
  qovery_token?: ApifyAPIToken;
  host?: HapiFQDN;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  token?: ApifyAPIToken;
  AUTH_TOKEN?: ApifyAPIToken;
  prior_api_key?: ApifyAPIToken;
  arquestra_token?: ApifyAPIToken;
  supabase_project_ref?: AgentID;
  APIFY_API_TOKEN?: ApifyAPIToken;
  server_host?: AgentID;
  apifyToken?: ApifyAPIToken;
  API_KEY?: APIKey;
  SKYVERN_API_KEY?: ApifyAPIToken;
  PROJECT_REF?: APIKey;
  company_code?: APIKey;
  BILT_API_KEY?: ApifyAPIToken;
  site_key?: AgentID;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: ApifyAPIToken;
  APIFY_TOKEN?: ApifyAPIToken;
  dateStyle?: DateStyle;
  includeCoordinates?: HapiFQDN;
  mapLanguage?: DateStyle;
  temperatureUnit?: DateStyle;
  port?: Port;
  marmot_host?: AgentID;
  plexus_host?: APIKey;
  your_mcp_server_host?: AgentID;
  sourcegraph_hostname?: AgentID;
  lobster_id?: AgentID;
  endpoint?: AgentID;
  key_id?: ApifyAPIToken;
  key_secret?: ApifyAPIToken;
  api_token?: ApifyAPIToken;
};

export type DateStyle = {
  description: string;
  default: string;
  choices: string[];
  isRequired?: boolean;
};

export type OauthClientID = {
  description: string;
  value: string;
};

export type Port = {
  description: string;
  default: string;
  placeholder: string;
};

export type Repository = {
  url?: string;
  source?: string;
  id?: string;
  subfolder?: string;
};
