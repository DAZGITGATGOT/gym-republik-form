# Gym Republik — "Design Your Gym" Form

Multi-step qualifying form embedded on Webflow, backed by a Cloudflare Worker that submits to GoHighLevel (GHL) CRM.

## Architecture

```
embed/gym-form.js    Webflow embed — multi-step form UI + client-side validation
worker/src/index.ts  Cloudflare Worker — POST /submit → GHL contact upsert + opportunity
scripts/             GHL custom field provisioning
```

## Worker endpoint

**POST** `https://gym-republik-submit.matt-572.workers.dev/submit`

Accepts JSON with contact details + form answers. Validates, translates option labels to GHL picklist values, upserts a contact, and creates an opportunity.

## Setup

1. Copy `.env.example` to `.env` and fill in credentials.
2. `cd worker && npm install && npx wrangler dev` for local development.
3. `npx wrangler deploy` to publish.

Worker secrets (set via `npx wrangler secret put <NAME>`):
- `GHL_TOKEN` — GHL Private Integration token
- `GHL_LOCATION_ID` — GHL sub-account ID
- `GHL_PIPELINE_ID` — Opportunity pipeline ID
- `GHL_STAGE_ID` — Pipeline stage ID
- `GHL_CF_IDS` — JSON map of custom field name to `{ id, fieldKey }`

## Embed

Load on Webflow via jsDelivr CDN (pinned to a tag):

```html
<script src="https://cdn.jsdelivr.net/gh/DAZGITGATGOT/gym-republik-form@v1.0.0/embed/gym-form.js"></script>
```

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml` which deploys the Worker via Wrangler.
