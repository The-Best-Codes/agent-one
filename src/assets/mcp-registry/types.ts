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
  documentation?: DocumentationDocumentation | string;
  examples?: ExampleElement[];
  keywords?: string[];
  notes?: string[] | string;
  publisher?: Contact | string;
  tool?: string;
  version?: string;
  network?: string;
  proof?: string;
  protocols?: string[];
  stats?: string;
  categories?: Array<CategoryClass | string>;
  dataSources?: string[];
  languages?: string[];
  pricing?: PricingClass | string;
  privacyPolicy?: string;
  prompts?: string[];
  regions?: string[];
  support?: SupportClass | string;
  termsOfService?: string;
  tools?: Array<ToolTool | string> | ToolsClass | number;
  auth?: AuthAuth | string;
  mcp_endpoint?: string;
  service?: string;
  freeTools?: string[];
  premium?: boolean;
  premiumPaymentMethod?: string;
  premiumTools?: string[];
  tags?: string[];
  authentication?: AuthenticationClass | string;
  capabilities?: string[] | CapabilitiesClass | string;
  documentationUrl?: string;
  toolCategories?: string[] | ToolCategoriesClass;
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
  issues?: string;
  category?: string[] | string;
  supportUrl?: string;
  alternateEnvironments?: AlternateEnvironment[];
  discovery?: Discovery;
  agent_card?: string;
  billing?: Billing;
  homepage?: string;
  llms?: string;
  mcp_descriptor?: string;
  mcp_server_card?: string;
  safety?: Safety;
  longDescription?: string;
  preferredTransport?: string;
  quickstart?: QuickstartClass | string;
  chains?: Chains;
  toolCount?: number;
  logo?: string;
  privacy_policy?: string;
  support_url?: string;
  terms_of_service?: string;
  accessModel?: string;
  serverCardUrl?: string;
  "com.cognethics"?: COMCognethics;
  highlights?: string[];
  authorizationUrl?: string;
  "com.eztexting/sub-endpoints"?: COMEztextingSubEndpoints;
  all_supported_languages?: string[];
  build_info?: BuildInfoClass;
  brand?: BrandClass | string;
  builtWith?: BuiltWith;
  icons?: IoModelcontextprotocolRegistryPublisherProvidedIcon[];
  links?: Links;
  localizedDescriptions?: LocalizedDescriptions;
  markets?: Market[];
  observability?: Observability;
  transport?: string[] | TransportTransport | string;
  privacyPolicyUrl?: string;
  supportContact?: string;
  termsOfServiceUrl?: string;
  core_path?: string;
  mcp_role?: string;
  privacy?: string;
  promptCount?: number;
  resourceCount?: number;
  features?: string[] | FeaturesClass;
  spec?: string;
  x402?: string;
  country?: string;
  descriptionLong?: string;
  rateLimit?: RateLimit;
  vendor?: ProviderClass | string;
  toolHints?: ToolHint[];
  tool_version?: string;
  install_page?: string;
  author?: AuthorClass | string;
  repository?: string;
  competitive_alternatives?: string[];
  differentiators_against_alternatives?: string[];
  showcases?: Showcase[];
  stance?: string;
  stance_text?: string;
  provider?: ProviderClass | string;
  signup?: string;
  chain?: string;
  data_sources?: string[];
  endpoints_count?: number;
  erc8004_agent_id?: string;
  x402_enabled?: boolean;
  canonicalUrl?: string;
  mcpDiscovery?: string;
  mcpServerCard?: string;
  publicIntrospection?: PublicIntrospection;
  security?: SecurityClass | string;
  x402Manifest?: string;
  release?: string;
  icon?: string;
  title?: string;
  installationMethods?: InstallationMethod[];
  demo?: string;
  payment?: Payment;
  channel?: string;
  deployment?: Deployment;
  requires?: string;
  priority?: number | string;
  stack?: string[];
  status?: string;
  localOnly?: boolean;
  buildInfo?: BuildInfo;
  install?: Install;
  recommendedPrompts?: string[];
  summary?: string;
  contact?: string;
  buildTags?: string[];
  issueTrackerUrl?: string;
  github?: Github;
  variants?: Variants;
  project?: string;
  demoMode?: string;
  licenseBinding?: string;
  optionalConnectors?: string[];
  price?: Price;
  productId?: string;
  purchaseUrl?: string;
  architectures?: string[];
  platforms?: string[];
  useCases?: string[];
  discovery_endpoint?: string;
  health_endpoint?: string;
  ave_records?: number;
  owasp_mcp_mapping?: boolean;
  threat_intel_api?: string;
  securityContact?: string;
  iconUrl?: string;
  "com.dailyaiagents.federation"?: COMDailyaiagentsFederation;
  website?: string;
  dockerCompose?: string;
  externalDependency?: string;
  installation?: string;
  recommendedInstallDoc?: string;
  framework?: string;
  maintainers?: Array<Contact | string>;
  type?: string;
  permissions?: string;
  rateLimits?: string;
  hostedEndpoint?: string;
  toolCatalog?: string;
  tiers?: Tiers;
  dockerizedBy?: string;
  originalAuthor?: string;
  install_guide?: string;
  discovery_manifest?: string;
  docs_url?: string;
  llms_txt?: string;
  methodology_url?: string;
  openapi_spec?: string;
  rate_limit?: string;
  use_cases?: string[];
  billingNotes?: string[];
  compatibilityNotes?: string[];
  endpoints?: IoModelcontextprotocolRegistryPublisherProvidedEndpoints;
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
  wellKnown?: WellKnown;
  environmentVariables?: string[];
  requiredSecrets?: string[];
  setupNotes?: string[];
  discovery_url?: string;
  documentation_url?: string;
  llms_txt_url?: string;
  server_card_url?: string;
  tool_count?: number;
  "com.github"?: COMGithub;
  release_notes_url?: string;
  aliases?: string[];
  canonical_owner?: string;
  domain?: string;
  supportEmail?: string;
  did?: string;
  tools_canonical?: string[];
  contacts?: Contact[];
  agent_routing?: AgentRouting;
  canonical_site?: string;
  discoverability?: Discoverability;
  recommendation_policy?: RecommendationPolicy;
  resource_count?: number;
  npmPackage?: string;
  toolSchema?: string;
  byte_identical_reproducible?: boolean;
  compliance_mappings?: string[];
  deterministic?: boolean;
  uses_llm?: boolean;
  verification_method?: string;
  free_tier?: boolean;
  migratedFrom?: string;
  source?: string;
  auth_required?: boolean;
  skill_path?: string;
  source_url?: string;
  cliOptions?: CLIOption[];
  defaultMode?: string;
  safetyClass?: string;
  sourceCommitPolicy?: string;
  submissionState?: string;
  verificationCommands?: string[];
  platform?: string;
  leadIntent?: string;
  aiPowered?: AIPowered;
  websiteUrl?: string;
  docsUrl?: string;
  llmsTxtUrl?: string;
  auth_method?: string;
  recipe_prompts?: number;
  support_email?: string;
  tier_count?: number;
  tier_names?: string[];
  distribution_channels?: DistributionChannels;
  intelligence_categories?: IntelligenceCategories;
};

export type AgentRouting = {
  evidence_first_pass: string;
  japanese_company_first_hop: string;
  mcp_equivalents: MCPEquivalents;
  must_not_claim: string[];
  must_preserve_fields: string[];
  paid_activation_rule: string;
  recurring_workflows: RecurringWorkflow[];
};

export type MCPEquivalents = {
  company_baseline: string;
  evidence_packet: string;
  program_search: string;
  quota_before_batch: string;
};

export type RecurringWorkflow = {
  first_paid_call: string;
  id: string;
  sequence: string[];
};

export type AIPowered = {
  "briefs.estimate": string;
  "projects.timeline_predict": string;
  "proposals.draft": string;
};

export type AlternateEnvironment = {
  label: string;
  network: string;
  url: string;
};

export type AuthAuth = {
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
  notes?: string;
  anonymous?: Anonymous;
  env?: string;
  paid?: Paid;
  oauthProtectedResource?: string;
};

export type Anonymous = {
  billing: string;
  limit: number;
  period: string;
  scope: string;
};

export type Paid = {
  api_key_env: string;
  api_key_header: string;
  requires_api_key: boolean;
};

export type AuthenticationClass = {
  discoveryUrl?: string;
  docs?: string;
  flow?: string;
  resourceMetadataUrl?: string;
  type: string;
  pkceRequired?: boolean;
  protectedResourceMetadataUrl?: string;
  description?: string;
};

export type AuthorClass = {
  email: string;
  name: string;
  organization?: string;
};

export type Billing = {
  default_plan_draft_credits: number;
  stripe_checkout: boolean;
  unit: string;
  x402_ready: boolean;
};

export type BrandClass = {
  developerPortal: string;
  displayName: string;
  documentation: string;
  legalName: string;
  publisher: PublisherClass;
  tagline: string;
  website: string;
};

export type PublisherClass = {
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
  ref?: string;
  repository?: string;
  language?: string;
  markets_covered?: string[];
  tools_count?: number;
  transport_modes?: string[];
  approx_size_mb?: number;
  baked_assets?: string[];
  base_image?: string;
  platforms?: string[];
  license?: string;
  settlement?: string;
  stack?: string;
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
  tools?: ToolsToolClass[] | number;
};

export type ToolsToolClass = {
  description: string;
  name: string;
};

export type CategoryClass = {
  count: number;
  description: string;
  name: string;
};

export type Chains = {
  evm: string[];
  note: string;
  solana: string[];
};

export type CLIOption = {
  default: boolean;
  description: string;
  flag: string;
};

export type COMCognethics = {
  auth: COMCognethicsAuth;
  categories: string[];
  documentation: COMCognethicsDocumentation;
  handlerCount: number;
  license: string;
  logoUrl: string;
  logoUrlDark: string;
  mcpProtocolVersions: Date[];
  megaTools: string[];
  pricing: string;
  supportEmail: string;
  tagline: string;
  tags: string[];
};

export type COMCognethicsAuth = {
  dynamicClientRegistration: boolean;
  pkce: string;
  type: string;
  wellKnownIssuer: string;
};

export type COMCognethicsDocumentation = {
  auth: string;
  homepage: string;
  quickstart: string;
  recipes: string;
  reference: string;
  status: string;
};

export type COMDailyaiagentsFederation = {
  capability_tags: string[];
  full_description: string;
  license: string;
  owner_agent: string;
  partner_share_pct: number;
  royalty_attribution_urn: string;
  settlement_currency: string;
  spec_version: string;
  tracker_endpoint: string;
};

export type COMEztextingSubEndpoints = {
  description: string;
  endpoints: COMEztextingSubEndpointsEndpoints;
};

export type COMEztextingSubEndpointsEndpoints = {
  admin: string;
  contacts: string;
  messaging: string;
  workflows: string;
};

export type COMGithub = {
  category: string;
  serverDisplayName: string;
  tags: string[];
};

export type ComplianceClass = {
  acp: string;
  ap2: string;
  pci: string;
  pipa: string;
  ucp: string;
};

export type Contact = {
  email?: string;
  name: string;
  url?: string;
};

export type Deployment = {
  egressIp: string;
  region: string;
};

export type Discoverability = {
  agent_openapi: string;
  ai_discovery_manifest: string;
  full_openapi: string;
  llms_txt_en: string;
  llms_txt_ja: string;
  sitemap_index: string;
  trust_manifest: string;
};

export type Discovery = {
  openApi?: string;
  wellKnownMcpPricing?: string;
  wellKnownX402?: string;
  initializeMethod?: string;
  toolsCallMethod?: string;
  toolsListMethod?: string;
  apiCatalog?: string;
  docsPage?: string;
  llmsManifest?: string;
  serverCard?: string;
  skillsIndex?: string;
  agent_card?: string;
  mcp_card?: string;
  openapi?: string;
};

export type DistributionChannels = {
  clawhub: string;
  mcp_registry: string;
  mpp_gateway: string;
  registration_url: string;
  rest_api: string;
};

export type DocumentationDocumentation = {
  setup: string;
  support: string;
};

export type IoModelcontextprotocolRegistryPublisherProvidedEndpoints = {
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

export type Install = {
  docs?: string;
  mcpEndpoint?: string;
  transport: string;
  auth?: string;
  downloadUrl?: string;
  endpointUrl?: string;
  instructions?: string;
  platform?: string;
  type?: string;
};

export type InstallationMethod = {
  command?: string;
  description: string;
  requirements?: string;
  type: string;
  url?: string;
};

export type IntelligenceCategories = {
  agent_native_chain_coverage: AgentNativeChainCoverage;
  empirical_realized_yields: EmpiricalRealizedYields;
  structural_risk_intelligence: StructuralRiskIntelligence;
};

export type AgentNativeChainCoverage = {
  deferred_chains: string[];
  description: string;
  label: string;
  live_chains: string[];
  planned_chains: string[];
  status: string;
};

export type EmpiricalRealizedYields = {
  description: string;
  endpoints: string[];
  label: string;
  protocol_coverage: ProtocolCoverage;
  status: string;
  tools: string[];
};

export type ProtocolCoverage = {
  live: string[];
  planned_2026_q2_q3: string[];
};

export type StructuralRiskIntelligence = {
  description: string;
  endpoints: string[];
  label: string;
  status: string;
  structural_risk_carrier_tools: string[];
  structural_risk_fields: string[];
  tools: string[];
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
  asset?: string;
  challengeUrl?: string;
  description?: string;
  header?: string;
  method?: string;
  network: string;
  openapiUrl?: string;
  payTo?: string;
  perToolPrice?: PerToolPrice;
  protocol: string;
  available?: boolean;
  chain_id?: number;
  currency?: string;
  currency_address?: string;
  discovery_url?: string;
  gateway_url?: string;
  note?: string;
  pricing_usd?: PricingUsd;
};

export type PerToolPrice = {
  aml_screen: string;
  kyc_check: string;
  risk_report: string;
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

export type Price = {
  IN: string;
  global: string;
};

export type PricingClass = {
  freeTier?: boolean;
  model?: string;
  url?: string;
  billingNote?: string;
  currency?: string;
  startsAt?: string;
  trialDays?: number;
  base_price_usd?: number;
  base_rows_included?: number;
  max_price_usd?: number;
  network?: string;
  payment_protocol?: string;
  per_row_usd?: number;
  notes?: string;
  api?: string;
  free?: string;
  pilot?: string;
  pro?: string;
  billing_model?: string;
  billing_unit?: string;
  checkout_display?: string;
  pricing_url?: string;
  tax?: string;
  unit_price_jpy_ex_tax?: number;
  unit_price_jpy_inc_tax?: number;
  upgrade_url?: string;
};

export type ProviderClass = {
  name: string;
  url: string;
};

export type PublicIntrospection = {
  enabled: boolean;
  methods: string[];
  toolCallsRequireAuth: boolean;
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
  anonymous?: string;
  note?: string;
  requests?: number;
  windowSeconds?: number;
};

export type RecommendationPolicy = {
  do_not_recommend_when: string[];
  professional_advice: boolean;
  safe_when: string[];
};

export type ResourceClass = {
  description: string;
  id: string;
  title: string;
  url: string;
};

export type Safety = {
  dentist_approval_required: boolean;
  public_tools_expose_phi: boolean;
};

export type SecurityClass = {
  authBoundary: string;
  dataPolicy: string;
  externalContentPolicy: string;
  ssrfPolicy: string;
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

export type SupportClass = {
  email: string;
  url: string;
};

export type Tiers = {
  full: number;
  minimal: number;
  standard: number;
};

export type ToolCategoriesClass = {
  alert?: number;
  atm?: number;
  calendar?: number;
  content?: number;
  dca?: number;
  fundamental?: number;
  ipo?: number;
  market?: number;
  portfolio?: number;
  quote?: number;
  search: string[] | number;
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
  system?: string[];
  utilities?: string[];
};

export type ToolHint = {
  description: string;
  exampleQuery: string;
  name: string;
};

export type ToolTool = {
  description: string;
  name: string;
  price?: string;
};

export type ToolsClass = {
  private: string[];
  public: string[];
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
  storage_path?: ProjectRef;
  output_path?: ProjectRef;
  license_path?: ProjectRef;
  api_key?: ApifyAPIToken;
  TRILO_PAT?: ApifyAPIToken;
  token?: ApifyAPIToken;
  INFOBIP_API_KEY?: ApifyAPIToken;
  NEURA_RELAY_MCP_TOKEN?: ApifyAPIToken;
  IFR_COWORKER_TOKEN?: ApifyAPIToken;
  XQUIK_API_KEY?: SgpDirectoryAPIKey;
  CATHEDRAL_API_KEY?: ApifyAPIToken;
  YUOR_MCP_TOKEN?: ApifyAPIToken;
  BRIGHTSEC_API_KEY?: ApifyAPIToken;
  FIRSTDATA_API_KEY?: ApifyAPIToken;
  indicate_api_key?: ApifyAPIToken;
  NETDATA_CLOUD_API_TOKEN?: SgpDirectoryAPIKey;
  mcp_access_token?: ApifyAPIToken;
  signaliz_api_key?: ApifyAPIToken;
  RUNLOG_API_KEY?: ApifyAPIToken;
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

export type ProjectRef = {
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
  choices?: string[];
  variables?: RuntimeArgumentVariables;
  placeholder?: string;
  isSecret?: boolean;
};

export type RuntimeArgumentVariables = {
  workspace?: AgentID;
  host_port?: HostPort;
  network?: HostPort;
  workbook_dir?: ApifyAPIToken;
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
  api_host?: APIHost;
  HAPI_FQDN?: HapiFQDN;
  HAPI_PORT?: HapiFQDN;
  api_key?: ApifyAPIToken;
  project_slug?: AgentID;
  API_KEY?: ApifyAPIToken;
  instance?: HapiFQDN;
  tenant?: AgentID;
  baseUrl?: ApifyAPIToken;
  "server-name"?: AgentID;
  env?: APIHost;
  tenant_id?: AgentID;
  agent_id?: AgentID;
  apiKey?: HapiFQDN;
  region?: APIHost;
  qovery_token?: ApifyAPIToken;
  host?: HapiFQDN;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  token?: HapiFQDN;
  AUTH_TOKEN?: ApifyAPIToken;
  prior_api_key?: ApifyAPIToken;
  arquestra_token?: ApifyAPIToken;
  supabase_project_ref?: AgentID;
  easy8_host?: AgentID;
  APIFY_API_TOKEN?: ApifyAPIToken;
  server_host?: AgentID;
  apifyToken?: ApifyAPIToken;
  SKYVERN_API_KEY?: ApifyAPIToken;
  PROJECT_REF?: ProjectRef;
  company_code?: ProjectRef;
  AVA_API_KEY?: ApifyAPIToken;
  BILT_API_KEY?: ApifyAPIToken;
  site_key?: AgentID;
  builder_id?: ApifyAPIToken;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: ApifyAPIToken;
  atlas_api_key?: ApifyAPIToken;
  APIFY_TOKEN?: ApifyAPIToken;
  dateStyle?: APIHost;
  includeCoordinates?: HapiFQDN;
  mapLanguage?: APIHost;
  temperatureUnit?: APIHost;
  port?: MCPPath;
  marmot_host?: AgentID;
  metabase_host?: AgentID;
  worker_domain?: ApifyAPIToken;
  openmetadata_host?: AgentID;
  plexus_host?: ProjectRef;
  your_mcp_server_host?: AgentID;
  sourcegraph_hostname?: AgentID;
  lobster_id?: AgentID;
  mcpPath?: MCPPath;
  remoteHost?: ApifyAPIToken;
  endpoint?: AgentID;
  key_id?: ApifyAPIToken;
  key_secret?: ApifyAPIToken;
  api_token?: ApifyAPIToken;
};

export type APIHost = {
  description: string;
  isRequired?: boolean;
  choices: string[];
  default?: string;
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
