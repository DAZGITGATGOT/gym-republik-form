/**
 * Gym Republik — Worker
 *
 * POST /submit  → multi-step form → GHL contact + opportunity → { ok: true }
 * POST /webflow → Webflow Contact form webhook → GHL contact + note + opportunity
 * Budget is optional unless Equipment is in gym_scope.
 */

export interface Env {
  GHL_TOKEN: string;
  GHL_LOCATION_ID: string;
  GHL_PIPELINE_ID: string;
  GHL_STAGE_ID: string;
  GHL_CF_IDS: string; // JSON: { field_name: { id, fieldKey } }
  ALLOWED_ORIGINS: string; // comma-separated
  WEBFLOW_WEBHOOK_KEY: string;
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
  gym_mirrors: ["Standard", "Floor to ceiling", "Bespoke"],
  gym_start: ["ASAP", "Next month", "Next 3 months", "Next 6\u201312 months"],
} as const;

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

async function ghlRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<{ status: number; data: any }> {
  const opts: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${GHL_BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function ghlPost(path: string, token: string, body: unknown) {
  return ghlRequest("POST", path, token, body);
}

async function ghlGet(path: string, token: string) {
  return ghlRequest("GET", path, token);
}

async function ghlPut(path: string, token: string, body: unknown) {
  return ghlRequest("PUT", path, token, body);
}

function jsonPlain(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Shared: search-or-create opportunity
// ---------------------------------------------------------------------------
async function upsertOpportunity(
  env: Env,
  contactId: string,
  oppName: string,
  monetaryValue: number,
): Promise<void> {
  const searchPath = `/opportunities/search?location_id=${env.GHL_LOCATION_ID}&contact_id=${contactId}&pipeline_id=${env.GHL_PIPELINE_ID}&status=open`;
  const searchRes = await ghlGet(searchPath, env.GHL_TOKEN);
  const existing =
    searchRes.status < 400 && Array.isArray(searchRes.data?.opportunities)
      ? searchRes.data.opportunities[0]
      : null;

  if (existing) {
    const updateRes = await ghlPut(`/opportunities/${existing.id}`, env.GHL_TOKEN, {
      pipelineStageId: env.GHL_STAGE_ID,
      name: oppName,
      monetaryValue,
    });
    if (updateRes.status >= 400) {
      console.error("GHL opportunity update failed:", updateRes.status, JSON.stringify(updateRes.data));
    }
  } else {
    const oppRes = await ghlPost("/opportunities/", env.GHL_TOKEN, {
      pipelineId: env.GHL_PIPELINE_ID,
      pipelineStageId: env.GHL_STAGE_ID,
      locationId: env.GHL_LOCATION_ID,
      contactId,
      name: oppName,
      status: "open",
      monetaryValue,
    });
    if (oppRes.status >= 400) {
      console.error("GHL opportunity creation failed:", oppRes.status, JSON.stringify(oppRes.data));
    }
  }
}

// ---------------------------------------------------------------------------
// POST /webflow — Webflow Contact form webhook → GHL
// ---------------------------------------------------------------------------
async function handleWebflow(request: Request, url: URL, env: Env): Promise<Response> {
  // Authenticate via secret URL key
  if (url.searchParams.get("key") !== env.WEBFLOW_WEBHOOK_KEY) {
    return jsonPlain({ ok: false, error: "unauthorized" }, 401);
  }

  let webhook: any;
  try {
    webhook = await request.json();
  } catch {
    return jsonPlain({ ok: false, error: "invalid_json" }, 400);
  }

  // Only handle form submissions; ack everything else
  if (webhook.triggerType !== "form_submission") {
    return jsonPlain({ ok: true }, 200);
  }

  const data = webhook.payload?.data;
  if (!data) {
    return jsonPlain({ ok: false, error: "missing_payload_data" }, 400);
  }

  // -- Parse fields --
  const fullName = (data.Name || "").trim();
  const spaceIdx = fullName.indexOf(" ");
  const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
  const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1).trim() : "";

  const email = (data.Email || "").trim();
  if (!email) {
    return jsonPlain({ ok: false, error: "missing_email" }, 400);
  }

  const phoneRaw = (data.Phone || "").trim();
  const phone = phoneRaw ? normaliseUKPhone(phoneRaw) : null;

  const space = (data.Space || data["Field 2"] || "").trim();
  const message = (data.Message || "").trim();

  // -- Custom field IDs --
  let cfIds: Record<string, { id: string; fieldKey: string }>;
  try {
    cfIds = JSON.parse(env.GHL_CF_IDS);
  } catch {
    console.error("GHL_CF_IDS parse error");
    return jsonPlain({ ok: false, error: "server_config_error" }, 500);
  }

  const SPACE_MAP: Record<string, string> = {
    "Single garage": "Single Garage",
    "Double garage": "Double Garage",
    "Garden room": "Garden Room",
    "Spare room": "Spare Room",
  };

  const customFields: { id: string; field_value: string }[] = [];
  if (space) {
    customFields.push({ id: "yKUrUo3I3NpPKgFKEJS3", field_value: SPACE_MAP[space] || space });
  }
  if (message && cfIds.contact_message) {
    customFields.push({ id: cfIds.contact_message.id, field_value: message });
  }

  // -- Tags --
  const tags: string[] = ["contact-form"];
  if (space) tags.push(`space-${slugify(space)}`);

  // -- 1. Upsert contact --
  const contactBody: Record<string, unknown> = {
    locationId: env.GHL_LOCATION_ID,
    firstName,
    email,
    source: "Website \u2013 Contact Form",
    tags,
  };
  if (lastName) contactBody.lastName = lastName;
  if (phone) contactBody.phone = phone;
  if (customFields.length) contactBody.customFields = customFields;

  const contactRes = await ghlPost("/contacts/upsert", env.GHL_TOKEN, contactBody);
  if (contactRes.status >= 400) {
    console.error("Webflow→GHL contact upsert failed:", contactRes.status, JSON.stringify(contactRes.data));
    return jsonPlain({ ok: false, error: `ghl_contact_${contactRes.status}` }, 500);
  }

  const contactId = contactRes.data?.contact?.id;
  if (!contactId) {
    console.error("Webflow→GHL contact upsert: no contactId", JSON.stringify(contactRes.data));
    return jsonPlain({ ok: false, error: "ghl_contact_no_id" }, 500);
  }

  // -- 2. Add contact note for the message --
  if (message) {
    const noteRes = await ghlPost(`/contacts/${contactId}/notes`, env.GHL_TOKEN, {
      body: message,
    });
    if (noteRes.status >= 400) {
      console.error("Webflow→GHL note failed:", noteRes.status, JSON.stringify(noteRes.data));
    }
  }

  // -- 3. Create or update opportunity --
  const oppName = `${firstName}${lastName ? " " + lastName : ""} \u2013 Contact form`;
  await upsertOpportunity(env, contactId, oppName, 0);

  return jsonPlain({ ok: true }, 200);
}

// ---------------------------------------------------------------------------
// POST /submit — multi-step form → GHL
// ---------------------------------------------------------------------------
async function handleSubmit(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {

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

    // Validate option values
    if (!VALID.gym_space.includes(gymSpace as any))
      return json({ ok: false, error: "invalid_gym_space" }, 422, cors);
    if (!VALID.gym_users.includes(gymUsers as any))
      return json({ ok: false, error: "invalid_gym_users" }, 422, cors);
    if (gymScope.length === 0 || !gymScope.every((s) => VALID.gym_scope.includes(s as any)))
      return json({ ok: false, error: "invalid_gym_scope" }, 422, cors);
    if (!VALID.gym_start.includes(gymStart as any))
      return json({ ok: false, error: "invalid_gym_start" }, 422, cors);

    // Scope-dependent fields: required only when their scope is selected
    const hasEquipment = gymScope.includes("Equipment");
    const hasFlooring = gymScope.includes("Flooring");
    const hasMirrors = gymScope.includes("Mirrors");

    if (hasEquipment && !VALID.gym_equipment_focus.includes(gymEquipFocus as any))
      return json({ ok: false, error: "invalid_gym_equipment_focus" }, 422, cors);
    if (hasFlooring && !VALID.gym_flooring.includes(gymFlooring as any))
      return json({ ok: false, error: "invalid_gym_flooring" }, 422, cors);
    if (hasMirrors && !VALID.gym_mirrors.includes(gymMirrors as any))
      return json({ ok: false, error: "invalid_gym_mirrors" }, 422, cors);

    // -- Custom field IDs (existing GHL fields) --
    // Existing fields — hardcoded IDs, with value translation
    const EXISTING_CF: Record<string, string> = {
      gym_location:       "yKUrUo3I3NpPKgFKEJS3",
      whos_it_for:        "UJqRWkpmxkK0EY4lNACt",
      required_services:  "daLxTnrUuLGzv1tfrpwd",
      focus:              "3jCboCU8X6sqftFNf8Po",
      flooring_thickness: "w0RbpJzZBFqJoT4hAKDo",
      mirrors:            "qEHyPHMNoqv9lntxLNmR",
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
      "Standard": "Standard",
      "Floor to ceiling": "Floor to Ceiling",
      "Bespoke": "Bespoke",
    };

    const customFields: { id: string; field_value: string | string[] }[] = [];
    const addCF = (id: string, value: string | string[]) => {
      // Never send empty values to GHL
      if (value === "" || value == null) return;
      if (Array.isArray(value) && value.length === 0) return;
      customFields.push({ id, field_value: value });
    };

    // Existing fields with translation
    addCF(EXISTING_CF.gym_location, SPACE_MAP[gymSpace] || gymSpace);
    addCF(EXISTING_CF.whos_it_for, USERS_MAP[gymUsers] || gymUsers);
    addCF(EXISTING_CF.required_services, gymScope); // labels match
    if (hasEquipment) addCF(EXISTING_CF.focus, gymEquipFocus);
    if (hasFlooring) addCF(EXISTING_CF.flooring_thickness, FLOORING_MAP[gymFlooring] || gymFlooring);
    if (hasMirrors) addCF(EXISTING_CF.mirrors, MIRRORS_MAP[gymMirrors] || gymMirrors);
    addCF(EXISTING_CF.timeframe, gymStart);
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
      console.error("GHL contact upsert failed:", contactRes.status, JSON.stringify(contactRes.data));
      return json({ ok: false, error: `ghl_contact_${contactRes.status}` }, 502, cors);
    }

    const contactId = contactRes.data?.contact?.id;
    if (!contactId) {
      console.error("GHL contact upsert: no contactId", JSON.stringify(contactRes.data));
      return json({ ok: false, error: "ghl_contact_no_id" }, 502, cors);
    }

    // -- 2. Create or update opportunity --
    const oppName = `${firstName} ${lastName} \u2013 ${gymSpace}`;
    await upsertOpportunity(env, contactId, oppName, 0);

    return json({ ok: true }, 200, cors);
}

// ---------------------------------------------------------------------------
// Main handler — route dispatcher
// ---------------------------------------------------------------------------
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // POST /webflow — server-to-server, no CORS needed
    if (url.pathname === "/webflow" && request.method === "POST") {
      return handleWebflow(request, url, env);
    }

    // Everything else uses CORS
    const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, allowedOrigins);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/submit" && request.method === "POST") {
      return handleSubmit(request, env, cors);
    }

    return json({ ok: false, error: "Not found" }, 404, cors);
  },
};
