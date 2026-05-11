#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, "../.agents/docs");

async function downloadFile(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  const text = await response.text();
  fs.writeFileSync(outputPath, text);
}

async function updateDoc(docDir) {
  const name = path.basename(docDir);
  const metadataPath = path.join(docDir, "metadata.json");

  if (!fs.existsSync(metadataPath)) {
    console.log(`[${name}] no metadata.json, skipping`);
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

  if (metadata.update) {
    console.log(`[${name}] running update command`);
    execSync(metadata.update, { cwd: docDir, stdio: "inherit" });
    return;
  }

  for (const key of ["llms", "llms-full"]) {
    if (!metadata[key]) continue;
    const outputPath = path.join(docDir, `${key}.txt`);
    console.log(`[${name}] downloading ${key}.txt`);
    await downloadFile(metadata[key], outputPath);
  }
}

const entries = fs
  .readdirSync(docsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(docsDir, entry.name));

for (const docDir of entries) {
  await updateDoc(docDir);
}

console.log("Done.");
