#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PRODUCTION_URL="https://liquid-client-portal.vercel.app"
DEPRECATED_URL="client-portal-one-tan.vercel.app"

OUTPUT="$(vercel --prod --yes 2>&1)"
printf '%s\n' "$OUTPUT"

DEPLOY_URL="$(printf '%s\n' "$OUTPUT" | grep -oE 'https://liquid-client-portal-[a-z0-9]+\.vercel\.app' | tail -1)"
if [[ -z "$DEPLOY_URL" ]]; then
  echo "Could not detect deployment URL from Vercel output." >&2
  exit 1
fi

vercel alias set "$DEPLOY_URL" liquid-client-portal.vercel.app
vercel alias remove "$DEPRECATED_URL" --yes 2>/dev/null || true

echo ""
echo "Production live at $PRODUCTION_URL"
