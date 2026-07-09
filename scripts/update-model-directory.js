#!/usr/bin/env node
/* eslint-disable no-undef */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  MODEL_DIRECTORY_SOURCE_URL,
  normalizeModelDirectory,
} from "../src/assets/model-lists/shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputFile = path.join(__dirname, "../src/assets/model-lists/model-directory.json");

console.log(`Fetching ${MODEL_DIRECTORY_SOURCE_URL}...`);
const response = await fetch(MODEL_DIRECTORY_SOURCE_URL);
const data = await response.json();

console.log("Filtering data...");
const filteredData = normalizeModelDirectory(data);

fs.writeFileSync(outputFile, JSON.stringify(filteredData));

console.log("Successfully updated model-directory.json with filtered data.");
