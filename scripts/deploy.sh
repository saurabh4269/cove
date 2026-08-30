#!/usr/bin/env bash
# Host Cove on Cloud Run using a public Node image + GCS bundle (no Cloud Build).
# Same pattern as product-os package-host / northstar deploy.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${HOME}/google-cloud-sdk/bin:${PATH}"
PROJECT="${GOOGLE_CLOUD_PROJECT:-mystical-timing-442601-q8}"
REGION="${GOOGLE_CLOUD_REGION:-us-central1}"
SERVICE="${COVE_CLOUD_RUN_SERVICE:-cove}"
BUCKET="${LOOP_BUNDLE_BUCKET:-${PROJECT}-loop-host}"
OBJECT="cove-host.tgz"

echo "deploy-cove: project=${PROJECT} region=${REGION} service=${SERVICE}"

cd "$ROOT"
echo "==> npm ci + build (standalone)"
npm ci --silent
npm run build

DIST="$ROOT/dist/host"
rm -rf "$DIST"
mkdir -p "$DIST"
# Next standalone layout
cp -a "$ROOT/.next/standalone/." "$DIST/"
mkdir -p "$DIST/.next"
cp -a "$ROOT/.next/static" "$DIST/.next/static"
cp -a "$ROOT/public" "$DIST/public"
cp -a "$ROOT/config" "$DIST/config"

mkdir -p "$ROOT/dist"
tar -C "$DIST" -czf "$ROOT/dist/cove-host.tgz" .
echo "wrote $ROOT/dist/cove-host.tgz ($(du -h "$ROOT/dist/cove-host.tgz" | cut -f1))"

gcloud storage buckets describe "gs://${BUCKET}" --project="$PROJECT" >/dev/null 2>&1 \
  || gcloud storage buckets create "gs://${BUCKET}" --location="$REGION" --project="$PROJECT"

gcloud storage cp "$ROOT/dist/cove-host.tgz" "gs://${BUCKET}/${OBJECT}" --project="$PROJECT"
gcloud storage objects update "gs://${BUCKET}/${OBJECT}" --add-acl-grant=entity=allUsers,role=READER --project="$PROJECT" \
  || true

BUNDLE_URL="https://storage.googleapis.com/${BUCKET}/${OBJECT}"
OS_URL="${LOOP_OS_URL:-https://loop-5uy6fkd7bq-uc.a.run.app}"
TENANT_ID="${LOOP_TENANT_ID:-acme}"
TOKEN="${LOOP_TENANT_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  TOKEN="$(gcloud run services describe northstar --project "${PROJECT}" --region "${REGION}" --format=json 2>/dev/null \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); env=d["spec"]["template"]["spec"]["containers"][0].get("env") or []; print(next((e.get("value") or "") for e in env if e.get("name")=="LOOP_TENANT_TOKEN"), "")' \
    || true)"
fi
if [[ -z "$TOKEN" ]]; then
  echo "Set LOOP_TENANT_TOKEN (same secret as Connect)." >&2
  exit 1
fi

ENV_VARS="GOOGLE_CLOUD_PROJECT=${PROJECT},LOOP_OS_URL=${OS_URL},LOOP_TENANT_ID=${TENANT_ID},LOOP_TENANT_TOKEN=${TOKEN},NODE_ENV=production,PORT=8080,HOSTNAME=0.0.0.0"

gcloud run deploy "${SERVICE}" \
  --image node:22-bookworm-slim \
  --project "${PROJECT}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 3 \
  --timeout 300 \
  --cpu-boost \
  --port 8080 \
  --command bash \
  --args="-c,apt-get update -qq && apt-get install -y -qq curl ca-certificates && curl -fsSL ${BUNDLE_URL} -o /tmp/cove.tgz && mkdir -p /app && tar -xzf /tmp/cove.tgz -C /app && cd /app && exec node server.js" \
  --set-env-vars "${ENV_VARS}" \
  --quiet

URL=$(gcloud run services describe "${SERVICE}" --project "${PROJECT}" --region "${REGION}" --format='value(status.url)')
echo ""
echo "Cove live: $URL"
echo "Checkout:  $URL/checkout"
echo "Feedback:  $URL/feedback"
echo "Flags:     $URL/api/loop/flags"
echo ""
echo "Retarget Product OS:"
echo "  LOOP_TENANT_REPO=saurabh4269/cove"
echo "  LOOP_TENANT_DEPLOY_URL=$URL"
