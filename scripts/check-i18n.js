#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const i18nDir = join(__dirname, "..", "src", "lib", "i18n");

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/check-i18n.js [en.json] [es.json] ...");
  process.exit(1);
}

function resolve(name) {
  return existsSync(name) ? name : join(i18nDir, name);
}

function load(name) {
  return JSON.parse(readFileSync(resolve(name), "utf8"));
}

function* walk(obj, path = []) {
  for (const [key, value] of Object.entries(obj)) {
    const keyPath = [...path, key];
    if (value && typeof value === "object") {
      yield* walk(value, keyPath);
    } else {
      yield { keyPath, value: String(value) };
    }
  }
}

function extractVars(str) {
  const vars = new Set();
  for (const match of str.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
    vars.add(match[1]);
  }
  return vars;
}

const ref = load(files[0]);
const refEntries = [...walk(ref)];

let failed = false;

for (const targetFile of files.slice(1)) {
  const target = load(targetFile);
  const targetMap = new Map(
    [...walk(target)].map(({ keyPath, value }) => [keyPath.join("."), value]),
  );
  const targetVarMap = new Map();
  for (const { keyPath, value } of walk(target)) {
    targetVarMap.set(keyPath.join("."), extractVars(value));
  }

  for (const { keyPath, value } of refEntries) {
    const path = keyPath.join(".");
    const targetValue = targetMap.get(path);

    if (targetValue === undefined) {
      console.error(`[missing] ${targetFile}: ${path}`);
      failed = true;
      continue;
    }

    const refVars = extractVars(value);
    const targetVars = targetVarMap.get(path) ?? new Set();

    for (const v of refVars) {
      if (!targetVars.has(v)) {
        console.error(`[missing-var] ${targetFile}: ${path} lacks var "{{${v}}}"`);
        failed = true;
      }
    }
    for (const v of targetVars) {
      if (!refVars.has(v)) {
        console.error(`[extra-var] ${targetFile}: ${path} has var "{{${v}}}" not in source`);
        failed = true;
      }
    }
  }

  const targetKeys = new Set(targetMap.keys());
  for (const key of targetKeys) {
    if (!refEntries.some(({ keyPath }) => keyPath.join(".") === key)) {
      console.error(`[extra-key] ${targetFile}: ${key}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("i18n check failed");
  process.exit(1);
}

console.log(`OK: ${files.slice(1).join(", ")} match ${files[0]}`);
