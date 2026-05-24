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
  icons?: ServerIcon[];
  _meta?: ServerMeta;
  packages?: Package[];
};

export type ServerMeta = {
  "io.modelcontextprotocol.registry/publisher-provided"?: IoModelcontextprotocolRegistryPublisherProvided;
};

export type IoModelcontextprotocolRegistryPublisherProvided = {
  connect?: string;
  docs?: string;
  "ai.agenticterminal"?: AIAgenticterminal;
  agentSkills?: string;
  displayName?: string;
  license?: LicenseClass | string;
  manifest?: string;
  serverCard?: string;
  sponsor?: Sponsor;
  documentation?: DocumentationDocumentation | string;
  examples?: ExampleElement[] | ExamplesClass;
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
  tools?: Array<PurpleTool | string> | ToolsClass | number;
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
  privacyPolicyUrl?: string;
  securityContactUrl?: string;
  supportEmail?: string;
  termsOfServiceUrl?: string;
  longDescription?: string;
  preferredTransport?: string;
  quickstart?: QuickstartClass | string;
  chains?: Chains;
  toolCount?: number;
  logo?: string;
  privacy_policy?: string;
  support_url?: string;
  terms_of_service?: string;
  server_card_url?: string;
  title?: string;
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
  "com.makometrics"?: COMMakometrics;
  supportContact?: string;
  core_path?: string;
  mcp_role?: string;
  privacy?: string;
  promptCount?: number;
  resourceCount?: number;
  dataset?: Dataset;
  features?: string[] | FeaturesClass;
  spec?: string;
  x402?: string;
  country?: string;
  descriptionLong?: string;
  rateLimit?: RateLimit;
  vendor?: ProviderClass | string;
  contact?: string;
  toolHints?: ToolHint[];
  tool_version?: string;
  install_page?: string;
  "com.github"?: COMGithub;
  auth_summary?: string;
  manifest_url?: string;
  resource_count?: number;
  tool_count?: number;
  "io.bitquery"?: IoBitquery;
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
  marketplaces?: string;
  productCard?: string;
  productName?: string;
  scorecard?: string;
  searchTerms?: string[];
  separateFrom?: string[];
  wellKnownMcp?: string;
  glama?: string;
  release?: string;
  icon?: string;
  installationMethods?: InstallationMethod[];
  demo?: string;
  payment?: Payment;
  channel?: string;
  cliBin?: string;
  npmPackage?: string;
  requiresJava?: boolean;
  requiresNode?: string;
  deployment?: Deployment;
  requires?: string;
  priority?: number | string;
  stack?: string[];
  status?: string;
  agentOpenApi?: string;
  allowedUse?: string;
  attribution?: string;
  fullOpenApi?: string;
  originator?: string;
  sandboxGuide?: string;
  sandboxKey?: string;
  localOnly?: boolean;
  buildInfo?: BuildInfo;
  install?: Install;
  recommendedPrompts?: string[];
  summary?: string;
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
  benchmarks?: Benchmarks;
  paper_url?: string;
  capabilitiesSummary?: CapabilitiesSummary;
  installationNote?: string;
  runtime?: Runtime;
  iconUrl?: string;
  "com.dailyaiagents.federation"?: COMDailyaiagentsFederation;
  "io.github.derekslinz"?: AIAgenticterminal;
  dockerCompose?: string;
  externalDependency?: string;
  installation?: string;
  recommendedInstallDoc?: string;
  tools_summary?: string;
  framework?: string;
  maintainers?: Array<Contact | string>;
  type?: string;
  permissions?: string;
  rateLimits?: string;
  capabilityResolutionSchema?: string;
  evidence_bundle?: string;
  harvestReportSchema?: string;
  hostedEndpoint?: string;
  quality_gate?: string;
  toolCatalog?: string;
  tiers?: Tiers;
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
  "com.mindstone.rebel"?: COMMindstoneRebel;
  hardened?: boolean;
  coverage?: string;
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
  domain?: string;
  did?: string;
  tools_canonical?: string[];
  contacts?: Contact[];
  agent_routing?: AgentRouting;
  canonical_site?: string;
  discoverability?: Discoverability;
  recommendation_policy?: RecommendationPolicy;
  toolSchema?: string;
  byte_identical_reproducible?: boolean;
  compliance_mappings?: string[];
  deterministic?: boolean;
  uses_llm?: boolean;
  verification_method?: string;
  free_tier?: boolean;
  migratedFrom?: string;
  distribution?: Distribution;
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
  badgeKit?: string;
  highIntentPages?: string[];
  rss?: string;
  site?: string;
  frameworks?: string[];
  leadIntent?: string;
  aiPowered?: AIPowered;
  websiteUrl?: string;
  docsUrl?: string;
  llmsTxtUrl?: string;
  auth_method?: string;
  recipe_prompts?: number;
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

export type Benchmarks = {
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
  prompts?: number;
  resources?: number;
  tools?: Array<AIAgenticterminalTool | string> | number;
  backtesting?: boolean;
  optionsGreeks?: boolean;
  orderPlacement?: boolean;
  orderPlacementSelfHostedOnly?: boolean;
  paperTrading?: boolean;
  riskGuardChecks?: number;
  telegramAlerts?: boolean;
  summary?: string;
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

export type Dataset = {
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

export type Distribution = {
  installUrl: string;
  method: string;
  packageRegistry: string;
  packagingRecommendation: string;
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
  codeix: Launch;
};

export type Launch = {
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

export type LicenseClass = {
  spdxId?: string;
  url?: string;
  notes?: string;
  type?: string;
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
  protocol?: string;
  amount_atomic?: string;
  chainId?: number;
  protocols?: string[];
  recipient?: string;
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

export type Runtime = {
  minVersion?: string;
  type?: string;
  launch?: Launch;
  platforms?: string[];
  requirements?: string[];
  transport?: string;
};

export type Safety = {
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

export type PurpleTool = {
  description: string;
  name: string;
  price?: string;
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
  ls_appkey?: ApifyAPIToken;
  ls_appsecretkey?: ApifyAPIToken;
  ls_market?: DateStyle;
};

export type ProjectRef = {
  description: string;
};

export type ApifyAPIToken = {
  description?: string;
  isRequired?: boolean;
  isSecret?: boolean;
  format?: string;
  placeholder?: string;
};

export type DateStyle = {
  description: string;
  default?: string;
  choices: string[];
  isRequired?: boolean;
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
  region?: APIKey;
  workingDirectory?: ApifyAPIToken;
  toolFilter?: ToolFilter;
};

export type APIKey = {
  description: string;
  isRequired?: boolean;
  default?: string;
  format?: string;
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
  workbook_dir?: ApifyAPIToken;
  api_key?: ApifyAPIToken;
  models_path?: APIKey;
  encoder_file?: APIKey;
  decoder_file?: APIKey;
  tokens_file?: APIKey;
  token?: ApifyAPIToken;
  VAULT_PATH?: ApifyAPIToken;
  config_path?: ApifyAPIToken;
  data_path?: ApifyAPIToken;
  workspace_path?: ApifyAPIToken;
  gid?: APIKey;
  uid?: APIKey;
  xdg_runtime_dir?: ApifyAPIToken;
  host?: APIKey;
  port?: APIKey;
  address?: Address;
  enabled?: Address;
  source_path?: APIKey;
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

export type ShopID = {
  description: string;
  default: string;
};

export type PackageTransport = {
  type: string;
  url?: string;
  headers?: TransportHeader[];
};

export type TransportHeader = {
  description?: string;
  format?: string;
  isSecret?: boolean;
  name: string;
  isRequired?: boolean;
  default?: string;
  choices?: string[];
  value?: string;
  variables?: PurpleVariables;
};

export type PurpleVariables = {
  MCP_AUTH_TOKEN: ApifyAPIToken;
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
  format?: string;
  value?: string;
  variables?: FluffyVariables;
  placeholder?: string;
  choices?: string[];
  default?: string;
};

export type FluffyVariables = {
  api_key?: ApifyAPIToken;
  TRILO_PAT?: ApifyAPIToken;
  token?: ApifyAPIToken;
  INFOBIP_API_KEY?: ApifyAPIToken;
  NEURA_RELAY_MCP_TOKEN?: ApifyAPIToken;
  IFR_COWORKER_TOKEN?: ApifyAPIToken;
  XQUIK_API_KEY?: SgpDirectoryAPIKey;
  CATHEDRAL_API_KEY?: ApifyAPIToken;
  YUOR_MCP_TOKEN?: ApifyAPIToken;
  e2a_api_key?: ApifyAPIToken;
  BRIGHTSEC_API_KEY?: ApifyAPIToken;
  FIRSTDATA_API_KEY?: ApifyAPIToken;
  indicate_api_key?: ApifyAPIToken;
  NETDATA_CLOUD_API_TOKEN?: SgpDirectoryAPIKey;
  mcp_access_token?: ApifyAPIToken;
  signaliz_api_key?: ApifyAPIToken;
  RUNLOG_API_KEY?: ApifyAPIToken;
};

export type SgpDirectoryAPIKey = {
  description: string;
  isSecret: boolean;
};

export type RemoteVariables = {
  api_host?: APIHost;
  HAPI_FQDN?: APIKey;
  HAPI_PORT?: APIKey;
  api_key?: ApifyAPIToken;
  project_slug?: AgentID;
  shop_id?: ShopID;
  API_KEY?: APIKey;
  instance?: APIKey;
  tenant?: AgentID;
  baseUrl?: ApifyAPIToken;
  "server-name"?: AgentID;
  env?: DateStyle;
  tenant_id?: AgentID;
  agent_id?: AgentID;
  apiKey?: ApifyAPIToken;
  region?: DateStyle;
  qovery_token?: ApifyAPIToken;
  host?: ApifyAPIToken;
  SGP_DIRECTORY_API_KEY?: SgpDirectoryAPIKey;
  tenant_name?: AgentID;
  token?: ApifyAPIToken;
  AUTH_TOKEN?: ApifyAPIToken;
  prior_api_key?: ApifyAPIToken;
  arquestra_token?: ApifyAPIToken;
  supabase_project_ref?: AgentID;
  easy8_host?: AgentID;
  APIFY_API_TOKEN?: ApifyAPIToken;
  server_host?: AgentID;
  artel_host?: APIKey;
  apifyToken?: ApifyAPIToken;
  SKYVERN_API_KEY?: ApifyAPIToken;
  PROJECT_REF?: ProjectRef;
  company_code?: ProjectRef;
  AVA_API_KEY?: ApifyAPIToken;
  oauth_token?: ApifyAPIToken;
  BILT_API_KEY?: ApifyAPIToken;
  site_key?: AgentID;
  builder_id?: ApifyAPIToken;
  oauth_client_id?: OauthClientID;
  oauth_client_secret?: ApifyAPIToken;
  atlas_api_key?: ApifyAPIToken;
  APIFY_TOKEN?: ApifyAPIToken;
  dateStyle?: DateStyle;
  includeCoordinates?: APIKey;
  mapLanguage?: DateStyle;
  temperatureUnit?: DateStyle;
  site_domain?: APIHost;
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
  isRequired: boolean;
  choices: string[];
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
