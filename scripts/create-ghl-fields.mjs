#!/usr/bin/env node

/**
 * Creates Gym Republik custom contact fields in GHL via API v2.
 * Skips fields that already exist (matched by name).
 * Outputs a table and saves the field map to ghl-fields.json.
 *
 * Usage: node scripts/create-ghl-fields.mjs
 * Requires: .env with GHL_TOKEN and GHL_LOCATION_ID
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------
const envPath = resolve(ROOT, ".env");
let envText;
try {
  envText = readFileSync(envPath, "utf-8");
} catch {
  console.error("Missing .env file. Copy .env and set GHL_TOKEN + GHL_LOCATION_ID.");
  process.exit(1);
}

const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const GHL_TOKEN = env.GHL_TOKEN;
const GHL_LOCATION_ID = env.GHL_LOCATION_ID;

if (!GHL_TOKEN || GHL_TOKEN === "YOUR_TOKEN_HERE") {
  console.error("Set GHL_TOKEN in .env");
  process.exit(1);
}
if (!GHL_LOCATION_ID || GHL_LOCATION_ID === "YOUR_LOCATION_ID_HERE") {
  console.error("Set GHL_LOCATION_ID in .env");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// GHL helpers
// ---------------------------------------------------------------------------
const BASE = "https://services.leadconnectorhq.com";
const HEADERS = {
  Authorization: `Bearer ${GHL_TOKEN}`,
  Version: "2021-07-28",
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function ghlGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

async function ghlPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Field definitions (from the integration brief, section 1)
// ---------------------------------------------------------------------------
const FIELDS = [
  {
    name: "gym_space",
    dataType: "SINGLE_OPTIONS",
    options: ["Single garage", "Double garage", "Garden room", "Spare room"],
  },
  {
    name: "gym_users",
    dataType: "SINGLE_OPTIONS",
    options: ["Just me", "The family"],
  },
  {
    name: "gym_scope",
    dataType: "CHECKBOX",
    options: ["Equipment", "Flooring", "Mirrors"],
  },
  {
    name: "gym_equipment_focus",
    dataType: "SINGLE_OPTIONS",
    options: ["Resistance", "Cardio", "Both"],
  },
  {
    name: "gym_flooring",
    dataType: "SINGLE_OPTIONS",
    options: ["Standard padding", "Extra padding"],
  },
  {
    name: "gym_mirrors",
    dataType: "SINGLE_OPTIONS",
    options: ["Standard (1m × 1.8m)", "Floor to ceiling", "Bespoke"],
  },
  {
    name: "gym_start",
    dataType: "SINGLE_OPTIONS",
    options: ["ASAP", "Next month", "Next 3 months", "Next 6–12 months"],
  },
  {
    name: "gym_budget",
    dataType: "SINGLE_OPTIONS",
    options: ["Up to £7.5k", "£7.5k to £15k", "£15k to £25k", "£25k and above"],
  },
  { name: "utm_source", dataType: "TEXT" },
  { name: "utm_medium", dataType: "TEXT" },
  { name: "utm_campaign", dataType: "TEXT" },
  // gclid is a standard GHL contact field — no custom field needed
  { name: "landing_page", dataType: "TEXT" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`Location: ${GHL_LOCATION_ID}\n`);

  // 1. Fetch existing custom fields
  console.log("Fetching existing custom fields...");
  const data = await ghlGet(`/locations/${GHL_LOCATION_ID}/customFields`);
  const existing = data.customFields || [];
  const existingByName = new Map(existing.map((f) => [f.name, f]));

  console.log(`Found ${existing.length} existing field(s).\n`);

  // 2. Create or skip each field
  const results = [];

  for (const def of FIELDS) {
    const match = existingByName.get(def.name);
    if (match) {
      console.log(`SKIP  ${def.name} (already exists: ${match.id})`);
      results.push({ name: def.name, id: match.id, fieldKey: match.fieldKey });
      continue;
    }

    const body = {
      name: def.name,
      dataType: def.dataType,
    };
    if (def.options) {
      body.options = def.options;
    }

    console.log(`CREATE ${def.name} (${def.dataType})...`);
    const created = await ghlPost(
      `/locations/${GHL_LOCATION_ID}/customFields`,
      body
    );

    const field = created.customField || created;
    results.push({
      name: field.name || def.name,
      id: field.id,
      fieldKey: field.fieldKey,
    });
    console.log(`       → ${field.id}`);
  }

  // 3. Print table
  console.log("\n" + "-".repeat(70));
  console.log(
    "Name".padEnd(25) + "ID".padEnd(30) + "Field Key"
  );
  console.log("-".repeat(70));
  for (const r of results) {
    console.log(
      (r.name || "").padEnd(25) +
        (r.id || "").padEnd(30) +
        (r.fieldKey || "")
    );
  }
  console.log("-".repeat(70));

  // 4. Save to ghl-fields.json
  const outPath = resolve(ROOT, "ghl-fields.json");
  const map = Object.fromEntries(results.map((r) => [r.name, { id: r.id, fieldKey: r.fieldKey }]));
  writeFileSync(outPath, JSON.stringify(map, null, 2) + "\n");
  console.log(`\nSaved to ${outPath}`);
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
