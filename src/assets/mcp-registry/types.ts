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
  "ai.agenticterminal"?: AIAgenticterminal;
  categories?: Array<CategoryClass | string>;
  keywords?: string[];
  useCases?: string[];
  agentSkills?: string;
  displayName?: string;
  license?: LicenseClass | string;
  manifest?: string;
  serverCard?: string;
  sponsor?: Sponsor;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  version?: string;
  documentation?: DocumentationDocumentation | string;
  examples?: Array<PurpleExample | string> | ExamplesClass;
  notes?: string[] | string;
  publisher?: AuthorElement | string;
  tool?: PurpleTool | string;
  signup_url?: string;
  status_url?: string;
  support_url?: string;
  vendor?: Maintainer | string;
  verified_via?: string;
  accuracy?: Accuracy;
  agent_card?: string;
  capabilities?: string[] | CapabilitiesCapabilities | string;
  diagnostics?: string;
  homepage?: string;
  llms_txt?: string;
  openapi?: string;
  pricing?: PricingClass | string;
  skill?: string;
  tool_count?: number;
  tools?: Array<FluffyTool | string> | ToolsClass | number | string;
  authentication?: AuthenticationClass | string;
  protocolVersion?: Date;
  network?: string;
  proof?: string;
  protocols?: string[];
  stats?: string;
  dataSources?: string[];
  languages?: string[];
  privacyPolicy?: string;
  prompts?: string[] | number;
  regions?: string[];
  support?: ContactClass | string;
  termsOfService?: string;
  oauthDiscoveryUrl?: string;
  supportsOAuth?: boolean;
  tags?: string[];
  provider?: Maintainer | string;
  auth?: AuthAuth | string;
  mcp_endpoint?: string;
  service?: string;
  freeTools?: string[];
  premium?: boolean;
  premiumPaymentMethod?: string;
  premiumTools?: string[];
  build_info?: BuildInfoClass;
  documentationUrl?: string;
  toolCategories?: string[] | ToolCategoriesClass;
  quotasManifest?: string;
  resources?: Array<ResourceClass | string> | number;
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
  currencies?: string[];
  licenseScope?: string;
  mobileApps?: MobileApps;
  rateLimits?: RateLimitsClass | string;
  resourceTemplates?: ResourceTemplate[];
  discovery_manifest?: string;
  privacy_policy?: string;
  discovery?: DiscoveryClass | string;
  issues?: string;
  category?: string[] | string;
  supportUrl?: string;
  alternateEnvironments?: AlternateEnvironment[];
  billing?: Billing;
  llms?: string;
  mcp_descriptor?: string;
  mcp_server_card?: string;
  safety?: string[] | SafetyClass;
  securityContactUrl?: string;
  supportEmail?: string;
  longDescription?: string;
  preferredTransport?: string;
  quickstart?: QuickstartClass | string;
  freeTier?: boolean;
  toolCount?: number;
  publisher_url?: string;
  smithery_listing?: string;
  chains?: string[] | ChainsClass;
  logo?: string;
  terms_of_service?: string;
  domain?: string;
  product?: string;
  server_card_url?: string;
  title?: string;
  accessModel?: string;
  serverCardUrl?: string;
  "com.cognethics"?: COMCognethics;
  canonicalUtm?: string;
  distributionPlan?: string;
  highlights?: string[];
  optOutContact?: string;
  paidTools?: string[];
  paymentModel?: string;
  privacyUrl?: string;
  publicDocsRepo?: string;
  useCase?: string;
  x402?: string;
  providers?: string;
  niches?: string;
  sources?: string;
  authorizationUrl?: string;
  docsUrl?: string;
  termsUrl?: string;
  "com.eztexting/sub-endpoints"?: COMEztextingSubEndpoints;
  documentUpload?: boolean;
  schemaUrl?: string;
  websiteUrl?: string;
  all_supported_languages?: string[];
  brand?: BrandClass | string;
  builtWith?: BuiltWith;
  icons?: IoModelcontextprotocolRegistryPublisherProvidedIcon[];
  links?: Links;
  localizedDescriptions?: LocalizedDescriptions;
  markets?: Market[];
  observability?: Observability;
  transport?: string[] | TransportTransport | string;
  "com.makometrics"?: COMMakometrics;
  supportContact?: string;
  screenshots?: Screenshot[];
  core_path?: string;
  mcp_role?: string;
  privacy?: string;
  iconUrl?: string;
  promptCount?: number;
  resourceCount?: number;
  dataset?: DatasetClass | string;
  attestation?: Attestation;
  on_chain?: string;
  zero_storage?: boolean;
  authorization?: Authorization;
  contact?: ContactClass | string;
  features?: string[] | FeaturesClass;
  identity_income_split?: IdentityIncomeSplit;
  spec?: string;
  x402_payee?: string;
  "com.unstoppabledomains"?: COMUnstoppabledomains;
  supportedPlatforms?: string[];
  buildInfo?: BuildInfo;
  access?: string;
  annotations?: string;
  coverage?: string;
  lenses?: string[];
  primitives?: string[];
  country?: string;
  descriptionLong?: string;
  rateLimit?: RateLimit;
  toolHints?: ToolHint[];
  tool_version?: string;
  install_page?: string;
  "com.github"?: COMGithub;
  auth_summary?: string;
  manifest_url?: string;
  resource_count?: number;
  "io.bitquery"?: IoBitquery;
  note?: string;
  read_only_tools?: number;
  write_tools?: number;
  author?: AuthorElement | string;
  repository?: string;
  competitive_alternatives?: string[];
  differentiators_against_alternatives?: string[];
  showcases?: Showcase[];
  stance?: string;
  stance_text?: string;
  signup?: string;
  languages_scanned?: string[];
  chain?: string;
  data_sources?: string[];
  endpoints_count?: number;
  erc8004_agent_id?: string;
  x402_enabled?: boolean;
  llmsFull?: string;
  skillManifest?: string;
  website?: string;
  canonicalUrl?: string;
  mcpDiscovery?: string;
  mcpServerCard?: string;
  publicIntrospection?: PublicIntrospection;
  security?: SecurityClass | string;
  x402Manifest?: string;
  claimBoundary?: string;
  directoryCategory?: string;
  glama?: string;
  legacyServerCard?: string;
  productCard?: string;
  productName?: string;
  searchTerms?: string[];
  separateFrom?: string[];
  wellKnownMcp?: string;
  xpayPortal?: string;
  xpayProxy?: string;
  release?: string;
  icon?: string;
  platform?: string;
  setup?: string;
  transports?: string[];
  distribution?: DistributionClass | string;
  registryFit?: string;
  requirements?: string[] | RequirementsClass;
  runtime?: IoModelcontextprotocolRegistryPublisherProvidedRuntime;
  installationMethods?: InstallationMethod[];
  install?: InstallClass | string;
  listingNote?: string;
  slug?: string;
  demo?: string;
  payment?: Payment;
  channel?: string;
  connect_http?: string;
  connect_stdio?: string;
  summary?: string;
  cliBin?: string;
  npmPackage?: string;
  requiresJava?: boolean;
  requiresNode?: string;
  deployment?: Deployment;
  requires?: string;
  sourceCommit?: string;
  answerEngine?: AnswerEngine;
  how_to_pay?: string;
  mcp_discovery?: string;
  payment_activation?: string;
  payment_ledger?: string;
  proof_url?: string;
  search_tags?: string[];
  priority?: number | string;
  stack?: string[];
  status?: string;
  certification_lane?: string;
  mcp_so?: string;
  policy?: string;
  sdk_marketplace?: string;
  smithery?: string;
  publicApi?: string;
  source?: string;
  agentOpenApi?: string;
  agentRecipes?: string;
  agentWrapperSchemas?: string;
  allowedUse?: string;
  attribution?: AttributionClass | string;
  fullOpenApi?: string;
  howAiAgentsShouldUseMvr?: string;
  minimalSandboxOpenApi?: string;
  mvrBench?: string;
  oneCommandAdoption?: string;
  openAiToolSchema?: string;
  originator?: string;
  packageRoadmap?: string[];
  quickstartAiAgents?: string;
  responseExamples?: string;
  sandboxGuide?: string;
  sandboxKey?: string;
  sdkPackages?: SDKPackages;
  versionMap?: string;
  localOnly?: boolean;
  maintainer?: Maintainer;
  supported_transports?: string[];
  recommendedPrompts?: string[];
  entrypoint?: string;
  feedbackUrl?: string;
  package?: string;
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
  platforms?: string[] | PlatformsClass;
  discovery_endpoint?: string;
  health_endpoint?: string;
  ave_records?: number;
  owasp_mcp_mapping?: boolean;
  threat_intel_api?: string;
  editions?: Editions;
  authors?: AuthorElement[];
  docs_url?: string;
  tool_categories?: ToolCategory[];
  securityContact?: string;
  tiers?: TiersClass;
  benchmarks?: string[] | BenchmarksClass;
  paper_url?: string;
  capabilitiesSummary?: CapabilitiesSummary;
  installationNote?: string;
  policies?: string[];
  "com.dailyaiagents.federation"?: COMDailyaiagentsFederation;
  "io.github.derekslinz"?: AIAgenticterminal;
  dockerCompose?: string;
  externalDependency?: string;
  installation?: string;
  recommendedInstallDoc?: string;
  tools_summary?: string;
  framework?: string;
  maintainers?: Array<AuthorElement | string>;
  type?: string;
  permissions?: string;
  capabilityResolutionSchema?: string;
  evidence_bundle?: string;
  harvestReportSchema?: string;
  hostedEndpoint?: string;
  quality_gate?: string;
  toolCatalog?: string;
  leagues?: string[];
  sampleFloors?: string;
  backend?: string;
  scopes?: string[];
  deprecated?: boolean;
  deprecation_reason?: string;
  sibling_packages?: string[];
  source_count?: number;
  successor_package?: string;
  upstream_data_license?: string;
  category_count?: number;
  dockerizedBy?: string;
  originalAuthor?: string;
  install_guide?: string;
  methodology_url?: string;
  openapi_spec?: string;
  rate_limit?: string;
  use_cases?: string[];
  "io.github.lucyfox199818-collab.codex-binance-agent"?: IoGithubLucyfox199818CollabCodexBinanceAgent;
  billingNotes?: string[];
  compatibilityNotes?: string[];
  endpoints?: IoModelcontextprotocolRegistryPublisherProvidedEndpoints;
  modes?: Modes;
  payments?: Payments;
  performanceNotes?: string[];
  scope?: string;
  mcpbRelease?: string;
  free_tier?: boolean | FreeTierClass;
  tools_preview?: string[];
  packager?: string;
  releaseTargets?: string[];
  compliance?: string[] | ComplianceClass;
  dataTypes?: string[];
  "com.mindstone.rebel"?: COMMindstoneRebel;
  hardened?: boolean;
  eventCatalog?: string;
  openApi?: string;
  publisherCountry?: string;
  wellKnown?: WellKnown;
  edam?: Edam;
  environmentVariables?: string[];
  requiredSecrets?: string[];
  setupNotes?: string[];
  support_email?: string;
  supported_ai_tools?: string[];
  supported_backends?: string[];
  discovery_url?: string;
  documentation_url?: string;
  llms_txt_url?: string;
  release_notes_url?: string;
  aliases?: string[];
  canonical_owner?: string;
  description?: string;
  freeToUse?: boolean;
  noAuthRequired?: boolean;
  did?: string;
  tools_canonical?: string[];
  disclaimer?: string;
  prerequisites?: string;
  contacts?: AuthorElement[];
  agent_routing?: AgentRouting;
  canonical_site?: string;
  discoverability?: Discoverability;
  recommendation_policy?: RecommendationPolicy;
  transport_endpoints?: TransportEndpoints;
  transports_note?: string;
  trust?: Trust;
  toolSchema?: string;
  byte_identical_reproducible?: boolean;
  compliance_mappings?: string[];
  deterministic?: boolean;
  uses_llm?: boolean;
  verification_method?: string;
  agents_json?: string;
  legal_graph_layer?: string;
  legal_graph_narrative?: string;
  legal_graph_position?: number;
  pro_tier_url?: string;
  protocol_spec?: string;
  spec_version?: string;
  migratedFrom?: string;
  "io.onboard"?: IoOnboard;
  security_policy?: string;
  transparency?: string;
  auth_discovery?: string;
  dynamic_client_registration?: string;
  llmfeed?: string;
  resource_metadata?: string;
  auth_required?: boolean;
  skill_path?: string;
  source_url?: string;
  cliOptions?: CLIOption[];
  launch_readiness?: LaunchReadiness;
  npm_packages?: NpmPackages;
  public_client_repository?: string;
  service_source?: string;
  defaultMode?: string;
  safetyClass?: string;
  sourceCommitPolicy?: string;
  submissionState?: string;
  verificationCommands?: string[];
  "io.hempdata"?: IoHempdata;
  agentId?: number;
  erc8004?: boolean;
  badgeKit?: string;
  highIntentPages?: string[];
  rss?: string;
  site?: string;
  frameworks?: string[];
  client_compatibility?: ClientCompatibility;
  transports_supported?: string[];
  auth_request?: string;
  leadIntent?: string;
  readOnly?: boolean;
  "one.faf/context"?: OneFafContext;
  security_posture?: string;
  aiPowered?: AIPowered;
  llmsTxtUrl?: string;
  "tech.zenfin/listing"?: TechZenfinListing;
  auth_method?: string;
  recipe_prompts?: number;
  tier_count?: number;
  tier_names?: string[];
  asset?: string;
  buyerGuide?: string;
  execution?: string;
  mcpConfig?: string;
  payTo?: string;
  protocol?: string;
  publicRepository?: string;
  "io.conc-exe"?: IoConcExe;
  distribution_channels?: DistributionChannels;
  intelligence_categories?: IntelligenceCategories;
};

export type Accuracy = {
  live_widget: string;
  public_page: string;
};

export type AgentRouting = {
  evidence_first_pass: string;
  japanese_company_first_hop: string;
  mcp_equivalents: MCPEquivalents;
  must_not_claim: string[];
  must_preserve_fields: string[];
  paid_activation_rule: string;
};

export type MCPEquivalents = {
  company_baseline: string;
  evidence_packet: string;
  program_search: string;
  quota_before_batch: string;
};

export type AIAgenticterminal = {
  anonymous_access: string;
  categories: string[];
  credibility?: string[];
  example_calls: string[];
  pitch: string;
  tools: AIAgenticterminalTool[];
};

export type AIAgenticterminalTool = {
  description: string;
  name: string;
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

export type AnswerEngine = {
  nameCollisions: string[];
  npmPackage: string;
  positioning: string;
  remoteMcpEndpoint: string;
  tools: string[];
};

export type Attestation = {
  algorithm: string;
  canonicalization: string;
  public_key_url: string;
};

export type AttributionClass = {
  emitted_by_tool: string;
  purpose: string;
  token_format: string;
};

export type AuthAuth = {
  header?: string;
  type?: string;
  via?: string;
  required?: boolean;
  currency?: string;
  network?: string;
  payTo?: string;
  pricingPerCall?: string;
  authorizationServerMetadata?: string;
  protectedResourceMetadata?: string;
  authorizationUrl?: string;
  registrationUrl?: string;
  scopes?: string[];
  tokenUrl?: string;
  wellKnownUrl?: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  discovery_url?: string;
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
  default?: string;
  perBoardLock?: PerBoardLock;
  discoveryUrl?: string;
  docs?: string;
  flow?: string;
  resourceMetadataUrl?: string;
  type?: string;
  pkceRequired?: boolean;
  protectedResourceMetadataUrl?: string;
  description?: string;
  http?: AuthenticationHTTP;
  stdio?: AuthenticationStdio;
};

export type AuthenticationHTTP = {
  grant_types: string[];
  metadata_endpoint: string;
  token_endpoint: string;
  type: string;
};

export type PerBoardLock = {
  channels: Channels;
  endpoints: PerBoardLockEndpoints;
  errorCode: number;
  keyFormat: string;
  modes: string[];
  noRecovery: boolean;
};

export type Channels = {
  argument: string;
  header: string;
};

export type PerBoardLockEndpoints = {
  lock: string;
  unlock: string;
  verify: string;
};

export type AuthenticationStdio = {
  description: string;
  env_var: string;
  type: string;
};

export type AuthorElement = {
  email?: string;
  name: string;
  url?: string;
  organization?: string;
};

export type Authorization = {
  authorization_server: string;
  discovery: string;
  dynamic_client_registration: boolean;
  flow: string;
  notes: string;
  scopes: string[];
  type: string;
};

export type BenchmarksClass = {
  cost_vs_zep: string;
  longmemeval_s: string;
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
  commit?: string;
  publishedFrom?: string;
  imageSha256?: string;
  release?: string;
  timestamp?: Date;
  pipelineId?: string;
};

export type BuildInfoClass = {
  auth?: string;
  dynamic_client_registration?: boolean;
  oauth_authorization_server?: string;
  oauth_protected_resource?: string;
  scopes?: string[];
  tools?: string[];
  transport?: string;
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

export type CapabilitiesCapabilities = {
  mcpApps?: boolean;
  mcpAppsExtension?: string;
  selfRegister?: string;
  structuredOutputs?: boolean;
  prompts?: PromptsClass | number;
  resources?: PromptsClass | number;
  tools?: Array<AIAgenticterminalTool | string> | PromptsClass | number;
  chunking_strategies?: string[];
  embedding_providers?: string[];
  languages_supported?: number;
  reranking_providers?: string[];
  search_types?: string[];
  sparse_embedding_providers?: string[];
  vector_store_providers?: string[];
  controlChannels?: string[];
  resourceTemplates?: number;
  mcp_tools_advanced?: number;
  mcp_tools_core?: number;
  mcp_tools_total?: number;
  backtesting?: boolean;
  optionsGreeks?: boolean;
  orderPlacement?: boolean;
  orderPlacementSelfHostedOnly?: boolean;
  paperTrading?: boolean;
  riskGuardChecks?: number;
  telegramAlerts?: boolean;
  summary?: string;
};

export type PromptsClass = {
  listChanged: boolean;
};

export type CapabilitiesSummary = {
  promptsCount: number;
  resourcesCount: number;
  toolsCount: number;
};

export type CategoryClass = {
  count: number;
  description: string;
  name: string;
};

export type ChainsClass = {
  evm: string[];
  note: string;
  solana: string[];
};

export type CLIOption = {
  default: boolean;
  description: string;
  flag: string;
};

export type ClientCompatibility = {
  claude_code: string;
  claude_desktop: string;
  cline: string;
  continue: string;
  cursor: string;
  goose: string;
  zed: string;
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
  serverDisplayName: string;
  category?: string;
  tags?: string[];
};

export type COMMakometrics = {
  category: string;
  paymentModel: string;
  product: string;
};

export type COMMindstoneRebel = {
  catalogId?: string;
  platforms?: string[];
  provider: string;
  catalogIds?: string[];
};

export type COMUnstoppabledomains = {
  documentationUrl: string;
  privacyPolicyUrl: string;
  serverDisplayName: string;
  supportEmail: string;
  supportUrl: string;
};

export type ComplianceClass = {
  acp: string;
  ap2: string;
  pci: string;
  pipa: string;
  ucp: string;
};

export type ContactClass = {
  email: string;
  url: string;
};

export type DatasetClass = {
  categories: number;
  languages: string[];
  questions: number;
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

export type DiscoveryClass = {
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
  categories?: string[];
  tags?: string[];
  agent_card?: string;
  mcp_card?: string;
  openapi?: string;
  handbook?: string;
  mcp_manifest?: string;
};

export type DistributionClass = {
  homebrew?: Homebrew;
  release?: string;
  status?: string;
  installUrl?: string;
  method?: string;
  packageRegistry?: string;
  packagingRecommendation?: string;
};

export type Homebrew = {
  formula: string;
  install: string[];
  tap: string;
};

export type DistributionChannels = {
  clawhub: string;
  mcp_registry: string;
  mpp_gateway: string;
  registration_url: string;
  rest_api: string;
};

export type DocumentationDocumentation = {
  agentsMd?: string;
  developers?: string;
  mcpGuide?: string;
  serverCard?: string;
  setup?: string;
  support?: string;
};

export type Edam = {
  operation: string[];
  topic: string[];
};

export type Editions = {
  full: string;
  lite: string;
};

export type IoModelcontextprotocolRegistryPublisherProvidedEndpoints = {
  docs: string;
  taskDownload: string;
};

export type PurpleExample = {
  config?: ConfigClass | string;
  description: string;
  name: string;
  note?: string;
  command?: string;
  example?: FluffyExample;
};

export type ConfigClass = {
  mcpServers: ConfigMCPServers;
};

export type ConfigMCPServers = {
  codeix: Launch;
};

export type Launch = {
  args: string[];
  command: string;
};

export type FluffyExample = {
  parameters: Parameters;
  tool: string;
};

export type Parameters = {
  limit: number;
  q: string;
};

export type ExamplesClass = {
  buyerDemoPack: string;
  publicTargetPreflight: string;
  receiptProofPack: string;
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

export type FreeTierClass = {
  calls_per_day: number;
  endpoint: string;
  questions_per_day: number;
};

export type Github = {
  author?: string;
  authorEmail?: string;
  bugsUrl?: string;
  defaultBranch?: string;
  displayName?: string;
  homepageUrl?: string;
  isInOrganization?: boolean;
  legacyId?: string;
  license?: string;
  name?: string;
  nameWithOwner?: string;
  opengraphImageUrl?: string;
  ownerAvatarUrl?: string;
  preferredImage?: string;
  primaryLanguage?: string;
  primaryLanguageColor?: string;
  pushedAt?: Date;
  readme?: string;
  readmeUpdatedAt?: Date;
  readmeVersion?: string;
  stargazerCount?: number;
  topics?: string[];
  usesCustomOpenGraphImage?: boolean;
  owner?: string;
  repo?: string;
};

export type IoModelcontextprotocolRegistryPublisherProvidedIcon = {
  mimeType: string;
  purpose?: string;
  sizes: string;
  src: string;
};

export type IdentityIncomeSplit = {
  _note: string;
  alter: number;
  cooperative_treasury: number;
  facilitator: number;
  member: number;
};

export type InstallClass = {
  pip?: string;
  uvx?: string;
  claude_code?: string;
  claude_desktop?: ClaudeDesktop;
  notes?: string;
  docs?: string;
  mcpEndpoint?: string;
  transport?: string;
  args?: string[];
  command?: string;
  auth?: string;
  downloadUrl?: string;
  endpointUrl?: string;
  instructions?: string;
  platform?: string;
  type?: string;
};

export type ClaudeDesktop = {
  mcpServers: ClaudeDesktopMCPServers;
};

export type ClaudeDesktopMCPServers = {
  lumen: Lumen;
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

export type IoBitquery = {
  auth: string;
  categories: string[];
  chains: string[];
  example_calls: string[];
  examples_url: string;
  pitch: string;
  tools: AIAgenticterminalTool[];
  use_cases_url: string;
};

export type IoConcExe = {
  apiCatalog: string;
  docs: string;
  openapi: string;
  payment: string;
  skill: string;
  x402: string;
};

export type IoGithubLucyfox199818CollabCodexBinanceAgent = {
  defaultSafetyMode: string;
  documentationLanguage: string[];
  registeredTools: number;
};

export type IoHempdata = {
  getKeyUrl: string;
  infoEndpoint: string;
  longDescription: string;
  tools: string[];
};

export type IoOnboard = {
  auth: IoOnboardAuth;
  capabilities: IoOnboardCapabilities;
  tags: string[];
};

export type IoOnboardAuth = {
  docsUrl: string;
  oauthDiscoveryUrl: string;
};

export type IoOnboardCapabilities = {
  prompts: boolean;
  resources: boolean;
  tools: number;
};

export type LaunchReadiness = {
  evidence_doc: string;
  live_evidence_required: boolean;
  sse_required_for_launch: boolean;
  status: string;
  submission_doc: string;
};

export type LicenseClass = {
  spdxId?: string;
  url?: string;
  notes?: string;
  type?: string;
};

export type Links = {
  changelog?: string;
  developerPortal?: string;
  documentation?: string;
  homepage?: string;
  issues?: string;
  source?: string;
  dashboard?: string;
  install?: string;
  pricing?: string;
  privacy?: string;
  reviewer?: string;
  docs?: string;
  repository?: string;
  support?: string;
};

export type LocalizedDescriptions = {
  en: string;
  "zh-CN": string;
  "zh-HK": string;
};

export type Maintainer = {
  name: string;
  url: string;
};

export type Market = {
  code: string;
  name: string;
};

export type MobileApps = {
  android: string;
  ios: string;
};

export type Modes = {
  deep: string;
  normal: string;
};

export type NpmPackages = {
  primary_client: string;
  yonro_client: string;
};

export type Observability = {
  metrics: string[];
  prometheusMetricsEndpoint: string;
};

export type OneFafContext = {
  deterministic: boolean;
  faf: string;
  generated: Date;
  iana: string;
  mediaType: string;
};

export type Payment = {
  asset?: string;
  challengeUrl?: string;
  description?: string;
  header?: string;
  method?: string;
  network?: string;
  openapiUrl?: string;
  payTo?: string;
  perToolPrice?: PerToolPrice;
  protocol?: string;
  amount_atomic?: string;
  chainId?: number;
  protocols?: string[];
  recipient?: string;
  free_tier?: boolean;
  preferred_asset?: string;
  treasury?: string;
  facilitator?: string;
  methods?: string[];
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

export type PlatformsClass = {
  end_user_platform: string;
  os: string[];
  runtime: PlatformsRuntime;
};

export type PlatformsRuntime = {
  node: string;
};

export type Price = {
  IN: string;
  global: string;
};

export type PricingClass = {
  free_daily_queries?: number;
  tiers?: Tier[] | { [key: string]: number };
  freeTier?: boolean;
  model?: string;
  url?: string;
  billingNote?: string;
  currency?: string;
  startsAt?: string;
  trialDays?: number;
  notes?: string;
  base_price_usd?: number;
  base_rows_included?: number;
  max_price_usd?: number;
  network?: string;
  payment_protocol?: string;
  per_row_usd?: number;
  api?: string;
  free?: string;
  pilot?: string;
  pro?: string;
  accepted_assets?: string[];
  accepted_networks?: string[];
  academic_plan?: string;
  free_tier?: boolean;
  paid_plans_url?: string;
  anonymous?: string;
  checkout?: string;
  unified_key_unlocks?: string[];
  tools_pro_bridge?: string;
  amount?: number;
  type?: string;
  billing_model?: string;
  billing_unit?: string;
  checkout_display?: string;
  pricing_url?: string;
  tax?: string;
  unit_price_jpy_ex_tax?: number;
  unit_price_jpy_inc_tax?: number;
  upgrade_url?: string;
};

export type Tier = {
  name: string;
  usd_per_month: number | string;
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

export type RateLimitsClass = {
  batchSize: number;
  global: string;
  perIp: string;
};

export type RecommendationPolicy = {
  do_not_recommend_when: string[];
  professional_advice: boolean;
  safe_when: string[];
};

export type RequirementsClass = {
  logicPro: string;
  permissions: string[];
  platform: string;
};

export type ResourceTemplate = {
  name: string;
  uriTemplate: string;
};

export type ResourceClass = {
  description: string;
  id: string;
  title: string;
  url: string;
};

export type IoModelcontextprotocolRegistryPublisherProvidedRuntime = {
  clientConfig?: ClientConfig;
  command?: string;
  transport?: string;
  defaultUrl?: string;
  note?: string;
  minVersion?: string;
  type?: string;
  launch?: Launch;
  platforms?: string[];
  requirements?: string[];
};

export type ClientConfig = {
  mcpServers: ClientConfigMCPServers;
};

export type ClientConfigMCPServers = {
  "logic-pro": LogicPro;
};

export type LogicPro = {
  command: string;
};

export type SafetyClass = {
  dentist_approval_required?: boolean;
  public_tools_expose_phi?: boolean;
  externalApiMutations?: boolean;
  readOnly?: boolean;
  serviceControlsBuyerWallet?: boolean;
  serviceSignsTransactions?: boolean;
  tokenLaunches?: boolean;
  trading?: boolean;
  walletCustody?: boolean;
};

export type Screenshot = {
  description: string;
  url: string;
};

export type SDKPackages = {
  npm: string;
  pypi: string;
};

export type SecurityClass = {
  authBoundary?: string;
  dataPolicy?: string;
  externalContentPolicy?: string;
  ssrfPolicy?: string;
  auth_methods?: string[];
  auth_methods_planned?: string[];
  auth_required?: boolean;
  scanned_by?: string[];
  scanned_by_planned?: string[];
  untrusted_content_labeling?: string;
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

export type TechZenfinListing = {
  auth: string;
  categories: string[];
  data_boundary: string;
  one_liner: string;
  short_description: string;
  supported_clients: string[];
};

export type TiersClass = {
  free?: string[];
  paid?: string[];
  paid_price_usd?: PaidPriceUsd;
  purchase_url?: string;
  full?: number;
  minimal?: number;
  standard?: number;
};

export type PaidPriceUsd = {
  monthly: number;
  yearly: number;
};

export type PurpleTool = {
  name: string;
  version: string;
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
  screener?: number;
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

export type ToolCategory = {
  count: number;
  examples: string[];
  name: string;
};

export type FluffyTool = {
  name: string;
  title?: string;
  description?: string;
  price?: string;
  auth?: string;
  type?: string;
  summary?: string;
  upgrade?: string;
  args?: string[];
  side_effect?: string;
};

export type ToolsClass = {
  private: string[];
  public: string[];
};

export type TransportTransport = {
  rfc9728Compliant?: boolean;
  stateless?: boolean;
  type?: string;
};

export type TransportEndpoints = {
  sse: SSE;
  stdio: TransportEndpointsStdio;
  streamable_http: SSE;
};

export type SSE = {
  method: string;
  protocol: string;
  status: string;
  type: string;
  url: string;
};

export type TransportEndpointsStdio = {
  command: string;
  install_url: string;
  status: string;
  type: string;
};

export type Trust = {
  attestation_spec_doc: string;
  attestation_status: string;
  freshness_target_hours: number;
  provenance_fields: string[];
  response_p95_target_seconds: number;
};

export type Variants = {
  http: Noc7Class;
  noc7: Noc7Class;
};

export type Noc7Class = {
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
  essentials_search_engine?: DateStyle;
  essentials_search_api_key?: SgpDirectoryAPIKey;
  serper_api_key?: SgpDirectoryAPIKey;
  serpapi_api_key?: SgpDirectoryAPIKey;
  tavily_api_key?: SgpDirectoryAPIKey;
  wolfram_appid?: SgpDirectoryAPIKey;
  essentials_memory_path?: ProjectRef;
  essentials_download_directory?: ProjectRef;
  essentials_settings_path?: ProjectRef;
  data_go_kr_api_key?: SgpDirectoryAPIKey;
  publicdata_timeout_seconds?: ShopID;
  publicdata_max_response_length?: ShopID;
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
  ls_market?: DateStyle;
};

export type SgpDirectoryAPIKey = {
  description: string;
  isSecret: boolean;
};

export type ProjectRef = {
  description: string;
};

export type DateStyle = {
  description: string;
  default?: string;
  choices: string[];
  isRequired?: boolean;
};

export type ApifyAPIToken = {
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  format?: string;
  placeholder?: string;
};

export type ShopID = {
  description: string;
  default: string;
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
  store_path?: HapiFQDN;
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
  host_port?: ShopID;
  network?: ShopID;
  MCP_SERVER_PORT?: ShopID;
  HOST_CONTROL_PANEL?: ProjectRef;
  PORT_CONTROL_PANEL?: ShopID;
  DASHBOARD_API_KEY?: SgpDirectoryAPIKey;
  SERVICE_HOST?: ProjectRef;
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
  gid?: HapiFQDN;
  uid?: HapiFQDN;
  xdg_runtime_dir?: HapiFQDN;
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

export type PackageTransport = {
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
  HOST_CONTROL_PANEL: AgentID;
  PORT_CONTROL_PANEL: ShopID;
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
  mcp_token?: HapiFQDN;
  TRILO_PAT?: ApifyAPIToken;
  CAMBER_API_KEY?: ApifyAPIToken;
  token?: HapiFQDN;
  INFOBIP_API_KEY?: ApifyAPIToken;
  NEURA_RELAY_MCP_TOKEN?: ApifyAPIToken;
  partglyph_api_key?: HapiFQDN;
  IFR_COWORKER_TOKEN?: ApifyAPIToken;
  XQUIK_API_KEY?: SgpDirectoryAPIKey;
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
  mcp_access_token?: ApifyAPIToken;
  rendley_api_key?: ApifyAPIToken;
  signaliz_api_key?: HapiFQDN;
  RUNLOG_API_KEY?: ApifyAPIToken;
};

export type RemoteVariables = {
  api_host?: APIHost;
  HAPI_FQDN?: HapiFQDN;
  HAPI_PORT?: HapiFQDN;
  api_key?: HapiFQDN;
  ATLAS_MCP_URL?: ApifyAPIToken;
  sysname?: ProjectRef;
  project_slug?: AgentID;
  shop_id?: ShopID;
  API_KEY?: ApifyAPIToken;
  instance?: HapiFQDN;
  tenant?: HapiFQDN;
  baseUrl?: APIHost;
  "server-name"?: AgentID;
  tenantId?: ProjectRef;
  property_slug?: AgentID;
  env?: APIHost;
  tenant_id?: AgentID;
  apify_token?: ApifyAPIToken;
  agent_id?: AgentID;
  apiKey?: HapiFQDN;
  region?: DateStyle;
  x_playcaller_key?: ApifyAPIToken;
  qovery_token?: ApifyAPIToken;
  host?: APIHost;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  server_name?: AgentID;
  tenant_name?: AgentID;
  token?: HapiFQDN;
  team_id?: AgentID;
  AUTH_TOKEN?: ApifyAPIToken;
  owner?: AgentID;
  repo?: AgentID;
  prior_api_key?: ApifyAPIToken;
  arquestra_token?: ApifyAPIToken;
  supabase_project_ref?: AgentID;
  easy8_host?: AgentID;
  APIFY_API_TOKEN?: ApifyAPIToken;
  server_host?: AgentID;
  artel_host?: HapiFQDN;
  hitkeep_host?: AgentID;
  apifyToken?: ApifyAPIToken;
  slug?: AgentID;
  SKYVERN_API_KEY?: ApifyAPIToken;
  PROJECT_REF?: ProjectRef;
  ibkr_mcp_host?: AgentID;
  company_code?: ProjectRef;
  AVA_API_KEY?: ApifyAPIToken;
  oauth_token?: ApifyAPIToken;
  BILT_API_KEY?: ApifyAPIToken;
  site_key?: AgentID;
  builder_id?: HapiFQDN;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: ApifyAPIToken;
  hostname?: AgentID;
  atlas_api_key?: ApifyAPIToken;
  APIFY_TOKEN?: ApifyAPIToken;
  dateStyle?: DateStyle;
  includeCoordinates?: HapiFQDN;
  mapLanguage?: DateStyle;
  temperatureUnit?: DateStyle;
  site_domain?: APIHost;
  companyId?: AgentID;
  helpdesk_host?: AgentID;
  port?: MCPPath;
  marmot_host?: AgentID;
  metabase_host?: AgentID;
  worker_domain?: APIHost;
  openmetadata_host?: AgentID;
  server_id?: AgentID;
  user_id?: AgentID;
  plexus_host?: ProjectRef;
  your_mcp_server_host?: AgentID;
  sourcegraph_hostname?: AgentID;
  lobster_id?: AgentID;
  mcpPath?: MCPPath;
  remoteHost?: APIHost;
  endpoint?: AgentID;
  key_id?: ApifyAPIToken;
  key_secret?: ApifyAPIToken;
  api_token?: ApifyAPIToken;
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
