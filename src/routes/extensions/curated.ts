import {
  IconBriefcase,
  IconCode,
  IconDatabase,
  IconPalette,
  IconSearch,
  IconSparkles,
  type Icon,
} from "@tabler/icons-react";

export interface ExtensionCategory {
  id: string;
  label: string;
  description: string;
  icon: Icon;
  extensionIds: string[];
}

const VERIFIED_NAMES: Record<string, string> = {
  "io.github.github/github-mcp-server": "GitHub",
  "com.gitlab/mcp": "GitLab",
  "io.github.getsentry/sentry-mcp": "Sentry",
  "io.github.upstash/context7": "Context7",
  "io.github.microsoft/playwright-mcp": "Playwright",
  "com.vercel/vercel-mcp": "Vercel",
  "com.cloudflare.mcp/mcp": "Cloudflare",
  "com.postman/postman-mcp-server": "Postman",
  "com.microsoft/microsoft-learn-mcp": "Microsoft Learn",
  "com.circleci/mcp": "CircleCI",
  "com.notion/mcp": "Notion",
  "app.linear/linear": "Linear",
  "com.atlassian/atlassian-mcp-server": "Atlassian",
  "com.airtable/mcp": "Airtable",
  "com.monday/monday.com": "monday.com",
  "com.zapier/mcp": "Zapier",
  "com.make/mcp-server": "Make",
  "com.stripe/mcp": "Stripe",
  "com.paypal.mcp/mcp": "PayPal",
  "com.jotform/mcp": "Jotform",
  "ai.exa/exa": "Exa",
  "io.github.brave/brave-search-mcp-server": "Brave Search",
  "io.github.tavily-ai/tavily-mcp": "Tavily",
  "ai.perplexity/mcp-server": "Perplexity",
  "io.github.firecrawl/firecrawl-mcp-server": "Firecrawl",
  "co.huggingface/hf-mcp-server": "Hugging Face",
  "com.googleapis.mapstools/mcp": "Google Maps",
  "com.apify/apify-mcp-server": "Apify",
  "com.supabase/mcp": "Supabase",
  "com.neon/mcp": "Neon",
  "io.prisma/mcp": "Prisma Postgres",
  "io.github.mongodb-js/mongodb-mcp-server": "MongoDB",
  "io.github.redis/mcp-redis": "Redis",
  "io.github.grafana/mcp-grafana": "Grafana",
  "com.figma.mcp/mcp": "Figma",
  "com.canva.mcp/mcp": "Canva",
  "com.webflow/mcp": "Webflow",
  "com.wix/mcp": "Wix",
  "com.mermaidchart/mermaid-mcp": "Mermaid Chart",
  "io.github.cloudinary/asset-management-mcp": "Cloudinary",
};

export const FEATURED_EXTENSION_IDS = [
  "io.github.github/github-mcp-server",
  "com.notion/mcp",
  "app.linear/linear",
  "com.figma.mcp/mcp",
  "io.github.upstash/context7",
  "com.zapier/mcp",
];

export const EXTENSION_CATEGORIES: ExtensionCategory[] = [
  {
    id: "productivity",
    label: "Productivity",
    description: "Notes, tasks, and projects",
    icon: IconSparkles,
    extensionIds: [
      "com.notion/mcp",
      "app.linear/linear",
      "com.atlassian/atlassian-mcp-server",
      "com.airtable/mcp",
      "com.monday/monday.com",
    ],
  },
  {
    id: "developer-tools",
    label: "Developer Tools",
    description: "Code, docs, and deployments",
    icon: IconCode,
    extensionIds: [
      "io.github.github/github-mcp-server",
      "io.github.upstash/context7",
      "io.github.getsentry/sentry-mcp",
      "io.github.microsoft/playwright-mcp",
      "com.gitlab/mcp",
      "com.vercel/vercel-mcp",
      "com.cloudflare.mcp/mcp",
      "com.postman/postman-mcp-server",
      "com.microsoft/microsoft-learn-mcp",
      "com.circleci/mcp",
    ],
  },
  {
    id: "search",
    label: "Search & Research",
    description: "Find answers across the web",
    icon: IconSearch,
    extensionIds: [
      "ai.exa/exa",
      "io.github.brave/brave-search-mcp-server",
      "ai.perplexity/mcp-server",
      "io.github.tavily-ai/tavily-mcp",
      "io.github.firecrawl/firecrawl-mcp-server",
      "co.huggingface/hf-mcp-server",
      "com.googleapis.mapstools/mcp",
      "com.apify/apify-mcp-server",
    ],
  },
  {
    id: "data",
    label: "Data",
    description: "Databases and dashboards",
    icon: IconDatabase,
    extensionIds: [
      "com.supabase/mcp",
      "com.neon/mcp",
      "io.prisma/mcp",
      "io.github.mongodb-js/mongodb-mcp-server",
      "io.github.redis/mcp-redis",
      "io.github.grafana/mcp-grafana",
    ],
  },
  {
    id: "design",
    label: "Design",
    description: "Designs, sites, and media",
    icon: IconPalette,
    extensionIds: [
      "com.figma.mcp/mcp",
      "com.canva.mcp/mcp",
      "com.webflow/mcp",
      "com.wix/mcp",
      "com.mermaidchart/mermaid-mcp",
      "io.github.cloudinary/asset-management-mcp",
    ],
  },
  {
    id: "business",
    label: "Business",
    description: "Payments, forms, and automation",
    icon: IconBriefcase,
    extensionIds: [
      "com.zapier/mcp",
      "com.make/mcp-server",
      "com.stripe/mcp",
      "com.paypal.mcp/mcp",
      "com.jotform/mcp",
    ],
  },
];

export const CURATED_EXTENSION_IDS = Object.keys(VERIFIED_NAMES);

export function isVerifiedExtension(id: string): boolean {
  return id in VERIFIED_NAMES;
}

export function getExtensionDisplayName(id: string, title?: string): string {
  if (VERIFIED_NAMES[id]) return VERIFIED_NAMES[id];
  if (title && title !== id) return title;
  return id.split("/").pop() || id;
}

export function getExtensionPublisher(id: string): string | undefined {
  const [namespace] = id.split("/");
  if (!namespace || namespace === id) return undefined;
  if (namespace.startsWith("io.github.")) return namespace.slice("io.github.".length);
  return namespace.split(".").reverse().join(".");
}
