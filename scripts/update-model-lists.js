#!/usr/bin/env node
/* eslint-disable no-undef */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(__dirname, "../src/assets/model-lists/model-directory.json");
const SOURCE_URL =
  "https://raw.githubusercontent.com/The-Best-Codes/ai-model-directory/main/data/all.min.json";

console.log(`Fetching ${SOURCE_URL}...`);
const response = await fetch(SOURCE_URL);
const data = await response.json();

console.log("Filtering data...");
const agentOneProvider = {
  id: "agent-one",
  name: "AgentOne",
  models: {
    lite: {
      id: "agent-one-lite",
      name: "Lite",
      features: { tool_call: true },
      modalities: { output: ["text"] },
    },
    auto: {
      id: "agent-one-auto",
      name: "Auto",
      features: { tool_call: true },
      modalities: { output: ["text"] },
    },
    smart: {
      id: "agent-one-smart",
      name: "Smart",
      features: { tool_call: true },
      modalities: { output: ["text"] },
    },
  },
};

const filteredData = {
  "agent-one": agentOneProvider,
};

function pickDefined(obj) {
  if (!obj || typeof obj !== "object") return undefined;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

for (const [providerId, provider] of Object.entries(data)) {
  if (providerId === "agent-one" || providerId === "agentone") {
    continue;
  }

  const filteredModels = {};

  for (const [modelId, model] of Object.entries(provider.models)) {
    const entry = {
      id: model.id,
    };
    if (model.name !== undefined) entry.name = model.name;

    const features = pickDefined({
      attachment: model.features?.attachment,
      reasoning: model.features?.reasoning,
      tool_call: model.features?.tool_call,
      structured_output: model.features?.structured_output,
      temperature: model.features?.temperature,
    });
    if (features) entry.features = features;

    const pricing = pickDefined({
      input: model.pricing?.input,
      output: model.pricing?.output,
      reasoning: model.pricing?.reasoning,
      cache_read: model.pricing?.cache_read,
      cache_write: model.pricing?.cache_write,
      input_audio: model.pricing?.input_audio,
      output_audio: model.pricing?.output_audio,
    });
    if (pricing) entry.pricing = pricing;

    const limit = pickDefined({
      context: model.limit?.context,
      input: model.limit?.input,
      output: model.limit?.output,
    });
    if (limit) entry.limit = limit;

    const modalities = pickDefined({
      input: model.modalities?.input,
      output: model.modalities?.output,
    });
    if (modalities) entry.modalities = modalities;

    filteredModels[modelId] = entry;
  }

  filteredData[providerId] = {
    id: providerId,
    name: provider.name,
    models: filteredModels,
  };
}

fs.writeFileSync(outputFile, JSON.stringify(filteredData));

console.log("Successfully updated model-directory.json with filtered data.");
