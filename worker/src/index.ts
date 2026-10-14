/**
 * Gym Republik — /submit Worker (Phase 1, no OTP)
 *
 * POST /submit → validate → GHL contact upsert + opportunity → { ok: true }
 */

export interface Env {
  GHL_TOKEN: string;
  GHL_LOCATION_ID: string;
  GHL_PIPELINE_ID: string;
  GHL_STAGE_ID: string;
  GHL_CF_IDS: string; // JSON: { field_name: { id, fieldKey } }
  ALLOWED_ORIGINS: string; // comma-separated
}

// ---------------------------------------------------------------------------
// Allowed option values (from the brief, section 1)
// ---------------------------------------------------------------------------
const VALID = {
  gym_space: ["Single garage", "Double garage", "Garden room", "Spare room"],
  gym_users: ["Just me", "The family"],
  gym_scope: ["Equipment", "Flooring", "Mirrors"],
  gym_equipment_focus: ["Resistance", "Cardio", "Both"],
  gym_flooring: ["Standard padding", "Extra padding"],
  gym_mirrors: ["Standard (1m \u00d7 1.8m)", "Floor to ceiling", "Bespoke"],
  gym_start: ["ASAP", "Next month", "Next 3 months", "Next 6\u201312 months"],
  gym_budget: [
    "Up to \u00a37.5k",
    "\u00a37.5k to \u00a315k",
    "\u00a315k to \u00a325k",
    "\u00a325k and above",
  ],
} as const;

const BUDGET_MIDPOINTS: Record<string, number> = {
  "Up to \u00a37.5k": 3750,
  "\u00a37.5k to \u00a315k": 11250,
  "\u00a315k to \u00a325k": 20000,
  "\u00a325k and above": 30000,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

/** Normalise a UK phone string → E.164 (+44…) or null */
function normaliseUKPhone(raw: string): string | null {
  const stripped = raw.replace(/[\s\-().]+/g, "");
  let digits: string;
  if (stripped.startsWith("+44")) digits = "0" + stripped.slice(3);
  else if (stripped.startsWith("0044")) digits = "0" + stripped.slice(4);
  else digits = stripped;
  if (/^0[1237]\d{9}$/.test(digits)) {
    return "+44" + digits.slice(1);
  }
  return null;
}

function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

// ---------------------------------------------------------------------------
// GHL API
// ---------------------------------------------------------------------------
const GHL_BASE = "https://services.leadconnectorhq.com";

async function ghlPost(path: string, token: string, body: unknown): Promise<{ status: number; data: any }> {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, allowedOrigins);

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Only POST /submit
    const url = new URL(request.url);
    if (url.pathname !== "/submit" || request.method !== "POST") {
      return json({ ok: false, error: "Not found" }, 404, cors);
    }

    // Rate limiting note: Cloudflare's free tier doesn't include KV-based
    // rate limiting. For production, add rate limiting via Cloudflare WAF rules
    // or upgrade to Workers Paid with a rate-limit binding.

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400, cors);
    }

    // -- Bot protection --
    if (body.hp) {
      return json({ ok: false, error: "Rejected" }, 422, cors);
    }
    if (typeof body.t === "number" && body.t < 4000) {
      return json({ ok: false, error: "Rejected" }, 422, cors);
    }

    // -- Required string fields --
    const str = (k: string): string => (typeof body[k] === "string" ? body[k].trim() : "");

    const firstName = str("first_name");
    const lastName = str("last_name");
    const email = str("email");
    const phoneRaw = str("phone");
    const postcode = str("postcode").toUpperCase();

    if (!firstName) return json({ ok: false, error: "First name is required" }, 422, cors);
    if (!lastName) return json({ ok: false, error: "Last name is required" }, 422, cors);
    if (!isValidEmail(email)) return json({ ok: false, error: "Valid email is required" }, 422, cors);

    const phone = normaliseUKPhone(phoneRaw);
    if (!phone) return json({ ok: false, error: "Valid UK phone number is required" }, 422, cors);

    if (!postcode) return json({ ok: false, error: "Postcode is required" }, 422, cors);

    // -- Option fields --
    const gymSpace = str("gym_space");
    const gymUsers = str("gym_users");
    const gymScope = Array.isArray(body.gym_scope) ? (body.gym_scope as string[]) : [];
    const gymEquipFocus = str("gym_equipment_focus");
    const gymFlooring = str("gym_flooring");
    const gymMirrors = str("gym_mirrors");
    const gymStart = str("gym_start");
    const gymBudget = str("gym_budget");

    // Validate option values
    if (!VALID.gym_space.includes(gymSpace as any))
      return json({ ok: false, error: "Invalid gym_space" }, 422, cors);
    if (!VALID.gym_users.includes(gymUsers as any))
      return json({ ok: false, error: "Invalid gym_users" }, 422, cors);
    if (gymScope.length === 0 || !gymScope.every((s) => VALID.gym_scope.includes(s as any)))
      return json({ ok: false, error: "Invalid gym_scope" }, 422, cors);
    if (gymScope.includes("Equipment") && !VALID.gym_equipment_focus.includes(gymEquipFocus as any))
      return json({ ok: false, error: "Invalid gym_equipment_focus" }, 422, cors);
    if (gymScope.includes("Flooring") && !VALID.gym_flooring.includes(gymFlooring as any))
      return json({ ok: false, error: "Invalid gym_flooring" }, 422, cors);
    if (gymScope.includes("Mirrors") && !VALID.gym_mirrors.includes(gymMirrors as any))
      return json({ ok: false, error: "Invalid gym_mirrors" }, 422, cors);
    if (!VALID.gym_start.includes(gymStart as any))
      return json({ ok: false, error: "Invalid gym_start" }, 422, cors);
    if (!VALID.gym_budget.includes(gymBudget as any))
      return json({ ok: false, error: "Invalid gym_budget" }, 422, cors);

    // -- Custom field IDs (existing GHL fields) --
    // Existing fields — hardcoded IDs, with value translation
    const EXISTING_CF: Record<string, string> = {
      gym_location:       "yKUrUo3I3NpPKgFKEJS3",
      whos_it_for:        "UJqRWkpmxkK0EY4lNACt",
      required_services:  "daLxTnrUuLGzv1tfrpwd",
      focus:              "3jCboCU8X6sqftFNf8Po",
      flooring_thickness: "w0RbpJzZBFqJoT4hAKDo",
      mirrors:            "qEHyPHMNoqv9lntxLNmR",
      budget:             "ApS74uW5yIwJMr6u5744",
      timeframe:          "AxjlhCV3r3I1ZN5q7MLE",
      postcode:           "3wqPN9TWzzgFIC5t1Lr6",
    };

    // New fields we created (UTM/attribution) — from GHL_CF_IDS env
    let cfIds: Record<string, { id: string; fieldKey: string }>;
    try {
      cfIds = JSON.parse(env.GHL_CF_IDS);
    } catch {
      return json({ ok: false, error: "Server config error: GHL_CF_IDS" }, 500, cors);
    }

    // Value translations: form label → existing GHL picklist label
    const SPACE_MAP: Record<string, string> = {
      "Single garage": "Single Garage",
      "Double garage": "Double Garage",
      "Garden room": "Garden Room",
      "Spare room": "Spare Room",
    };
    const USERS_MAP: Record<string, string> = {
      "Just me": "Individual",
      "The family": "Family",
    };
    const FLOORING_MAP: Record<string, string> = {
      "Standard padding": "Standard",
      "Extra padding": "Extra",
    };
    const MIRRORS_MAP: Record<string, string> = {
      "Standard (1m \u00d7 1.8m)": "Standard",
      "Floor to ceiling": "Floor to Ceiling",
      "Bespoke": "Bespoke",
    };

    const customFields: { id: string; field_value: string | string[] }[] = [];
    const addCF = (id: string, value: string | string[]) => {
      customFields.push({ id, field_value: value });
    };

    // Existing fields with translation
    addCF(EXISTING_CF.gym_location, SPACE_MAP[gymSpace] || gymSpace);
    addCF(EXISTING_CF.whos_it_for, USERS_MAP[gymUsers] || gymUsers);
    addCF(EXISTING_CF.required_services, gymScope); // labels match
    if (gymScope.includes("Equipment")) addCF(EXISTING_CF.focus, gymEquipFocus);
    if (gymScope.includes("Flooring")) addCF(EXISTING_CF.flooring_thickness, FLOORING_MAP[gymFlooring] || gymFlooring);
    if (gymScope.includes("Mirrors")) addCF(EXISTING_CF.mirrors, MIRRORS_MAP[gymMirrors] || gymMirrors);
    addCF(EXISTING_CF.budget, gymBudget); // TEXT field, no translation
    addCF(EXISTING_CF.timeframe, gymStart); // TEXT field, no translation
    addCF(EXISTING_CF.postcode, postcode);

    // Attribution (new fields, from GHL_CF_IDS env)
    const addNewCF = (key: string, value: string) => {
      const cf = cfIds[key];
      if (cf && value) customFields.push({ id: cf.id, field_value: value });
    };
    addNewCF("utm_source", str("utm_source"));
    addNewCF("utm_medium", str("utm_medium"));
    addNewCF("utm_campaign", str("utm_campaign"));
    addNewCF("landing_page", str("landing_page"));

    // Tags
    const tags = [
      "Multi-Step",
      "web-design-your-gym",
      `space-${slugify(gymSpace)}`,
      `budget-${slugify(gymBudget)}`,
    ];

    // -- 1. Upsert contact --
    const contactBody = {
      locationId: env.GHL_LOCATION_ID,
      firstName,
      lastName,
      email,
      phone,
      postalCode: postcode,
      source: "Website \u2013 Design Your Gym",
      customFields,
      tags,
    };

    // gclid goes as a standard field (not custom)
    const gclid = str("gclid");
    if (gclid) (contactBody as any).gclid = gclid;

    const contactRes = await ghlPost("/contacts/upsert", env.GHL_TOKEN, contactBody);
    if (contactRes.status >= 400) {
      console.error("GHL contact upsert failed:", JSON.stringify(contactRes.data));
      return json({ ok: false, error: "Failed to save contact" }, 502, cors);
    }

    const contactId = contactRes.data?.contact?.id;
    if (!contactId) {
      console.error("GHL contact upsert: no contactId", JSON.stringify(contactRes.data));
      return json({ ok: false, error: "Failed to save contact" }, 502, cors);
    }

    // -- 2. Create opportunity --
    const monetaryValue = BUDGET_MIDPOINTS[gymBudget] || 0;
    const oppBody = {
      pipelineId: env.GHL_PIPELINE_ID,
      pipelineStageId: env.GHL_STAGE_ID,
      locationId: env.GHL_LOCATION_ID,
      contactId,
      name: `${firstName} ${lastName} \u2013 ${gymSpace}`,
      status: "open",
      monetaryValue,
    };

    const oppRes = await ghlPost("/opportunities/", env.GHL_TOKEN, oppBody);
    if (oppRes.status >= 400) {
      // Contact was saved — log but don't fail the user
      console.error("GHL opportunity creation failed:", JSON.stringify(oppRes.data));
    }

    return json({ ok: true }, 200, cors);
  },
};
