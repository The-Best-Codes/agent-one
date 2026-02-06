#!/usr/bin/env node
/* eslint-disable no-undef */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(
  __dirname,
  "../src/assets/mcp-registry/mcp-registry.json",
);

const BASE_URL = "https://registry.modelcontextprotocol.io/v0.1/servers";
const PAGE_LIMIT = 100;

async function fetchAllServers() {
  const allServers = [];
  let cursor = undefined;
  let page = 1;

  while (true) {
    const url = new URL(BASE_URL);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    url.searchParams.set("version", "latest");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    console.log(`Fetching page ${page}...`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const servers = data.servers || [];
    allServers.push(...servers);

    console.log(`Got ${servers.length} servers (total: ${allServers.length})`);

    const nextCursor = data.metadata?.nextCursor;
    if (!nextCursor || servers.length === 0) {
      break;
    }

    cursor = nextCursor;
    page++;
  }

  return allServers;
}

console.log("Fetching MCP server registry...");
const servers = await fetchAllServers();

fs.writeFileSync(outputFile, JSON.stringify(servers, null, 2));

console.log(
  `Successfully wrote ${servers.length} servers to mcp-registry.json`,
);
