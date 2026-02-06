export type MCPRegistryEntry = {
  server: Server;
  _meta: MCPRegistryEntryMeta;
};

export type MCPRegistryEntryMeta = {
  "io.modelcontextprotocol.registry/official": IoModelcontextprotocolRegistryOfficial;
};

export type IoModelcontextprotocolRegistryOfficial = {
  status: string;
  publishedAt: Date;
  updatedAt: Date;
  isLatest: boolean;
};

export type Server = {
  $schema: string;
  name: string;
  description: string;
  repository?: Repository;
  version: string;
  packages?: Package[];
  remotes?: Remote[];
  title?: string;
  icons?: Icon[];
  _meta?: ServerMeta;
  websiteUrl?: string;
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
  capabilities?: string[] | CapabilitiesClass;
  tags?: string[];
  homepage?: string;
  categories?: string[];
  author?: string;
  issues?: string;
  repository?: string;
  features?: string[] | FeaturesClass;
  installationMethods?: InstallationMethod[];
  toolCategories?: ToolCategories;
  tools?: Tool[];
  buildInfo?: BuildInfo;
  variants?: Variants;
  architectures?: string[];
  platforms?: string[];
  useCases?: string[];
  icon?: string;
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
  migratedFrom?: string;
  cliOptions?: CLIOption[];
  platform?: string;
  vendor?: Vendor;
  maintainers?: Vendor[];
};

export type Auth = {
  header?: string;
  type: string;
  via?: string;
  authorization_endpoint?: string;
  scopes?: string[];
  token_endpoint?: string;
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
};

export type CapabilitiesClass = {
  chunking_strategies?: string[];
  embedding_providers?: string[];
  languages_supported?: number;
  reranking_providers?: string[];
  search_types?: string[];
  sparse_embedding_providers?: string[];
  vector_store_providers?: string[];
  tools?: Tool[];
};

export type Tool = {
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

export type Endpoints = {
  docs: string;
  taskDownload: string;
};

export type ExampleElement = {
  config?: string;
  description: string;
  name: string;
  note?: string;
  command?: string;
  example?: ExampleExample;
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
  transport_modes: string[];
  dynamic_api_discovery?: boolean;
  elastic_stack_integration?: boolean;
  openapi_based?: boolean;
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
  theme?: string;
  sizes?: string[];
};

export type Package = {
  registryType: string;
  identifier: string;
  transport: Transport;
  environmentVariables?: EnvironmentVariable[];
  version?: string;
  runtimeHint?: string;
  runtimeArguments?: RuntimeArgument[];
  packageArguments?: PackageArgument[];
  registryBaseUrl?: string;
  fileSha256?: string;
};

export type EnvironmentVariable = {
  description?: string;
  format?: string;
  isSecret?: boolean;
  name: string;
  default?: string;
  isRequired?: boolean;
  value?: string;
  variables?: EnvironmentVariableVariables;
  choices?: string[];
  placeholder?: string;
};

export type EnvironmentVariableVariables = {
  weather_choices: Endpoint;
};

export type Endpoint = {
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
  isRepeated?: boolean;
};

export type PackageArgumentVariables = {
  region: TenantID;
};

export type TenantID = {
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
  source_path?: HapiFQDN;
  workspace?: Endpoint;
  host_port?: HostPort;
  network?: HostPort;
  api_key?: HapiFQDN;
  models_path?: HapiFQDN;
  encoder_file?: HapiFQDN;
  decoder_file?: HapiFQDN;
  tokens_file?: HapiFQDN;
  config_path?: HapiFQDN;
  data_path?: HapiFQDN;
  workspace_path?: HapiFQDN;
  group?: CompanyCode;
  user?: CompanyCode;
  hostPath?: CompanyCode;
  token?: HapiFQDN;
  host?: TenantID;
  port?: HapiFQDN;
};

export type HapiFQDN = {
  description?: string;
  isRequired?: boolean;
  format?: string;
  isSecret?: boolean;
  default?: string;
  placeholder?: string;
  choices?: string[];
};

export type CompanyCode = {
  description: string;
};

export type HostPort = {
  description: string;
  default: string;
};

export type Transport = {
  type: string;
  url?: string;
  headers?: TransportHeader[];
};

export type TransportHeader = {
  description: string;
  format?: string;
  isSecret?: boolean;
  name: string;
  default?: string;
  choices?: string[];
  isRequired?: boolean;
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
  format?: string;
  isSecret?: boolean;
  name: string;
  value?: string;
  placeholder?: string;
  variables?: HeaderVariables;
  default?: string;
  choices?: string[];
};

export type HeaderVariables = {
  INFOBIP_API_KEY?: HapiFQDN;
  YUOR_MCP_TOKEN?: HapiFQDN;
  api_key?: HapiFQDN;
};

export type RemoteVariables = {
  HAPI_FQDN?: HapiFQDN;
  HAPI_PORT?: HapiFQDN;
  instance?: HapiFQDN;
  "server-name"?: Endpoint;
  region?: HapiFQDN;
  token?: HapiFQDN;
  tenant_id?: TenantID;
  company_code?: CompanyCode;
  your_mcp_server_host?: Endpoint;
  endpoint?: Endpoint;
  api_token?: HapiFQDN;
};

export type Repository = {
  url?: string;
  source?: string;
  subfolder?: string;
  id?: string;
};
