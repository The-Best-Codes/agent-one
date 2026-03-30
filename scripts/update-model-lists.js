#!/usr/bin/env node
/* eslint-disable no-undef */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(__dirname, "../src/assets/model-lists/models-dev.json");

console.log("Fetching models.dev API...");
const response = await fetch("https://models.dev/api.json");
const data = await response.json();

console.log("Filtering data...");
const agentOneProvider = {
  id: "agent-one",
  name: "AgentOne",
  models: {
    lite: {
      id: "agent-one-lite",
      name: "Lite",
      tool_call: true,
      modalities: {
        output: ["text"],
      },
    },
    auto: {
      id: "agent-one-auto",
      name: "Auto",
      tool_call: true,
      modalities: {
        output: ["text"],
      },
    },
    smart: {
      id: "smart",
      name: "Smart",
      tool_call: true,
      modalities: {
        output: ["text"],
      },
    },
  },
};

const filteredData = {
  "agent-one": agentOneProvider,
};

for (const [providerId, provider] of Object.entries(data)) {
  if (providerId === "agent-one" || providerId === "agentone") {
    continue;
  }

  const filteredModels = {};

  for (const [modelId, model] of Object.entries(provider.models)) {
    filteredModels[modelId] = {
      id: model.id,
      name: model.name,
      tool_call: model.tool_call,
      modalities: {
        output: model.modalities?.output,
      },
      cost: model.cost,
      limit: model.limit,
    };
  }

  filteredData[providerId] = {
    id: provider.id,
    name: provider.name,
    models: filteredModels,
  };
}

fs.writeFileSync(outputFile, JSON.stringify(filteredData, null, 2));

console.log("Successfully updated models.dev.json with filtered data.");
