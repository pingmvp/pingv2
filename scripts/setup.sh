#!/usr/bin/env bash
# setup.sh — first-time local setup for Ping (run from web/)
# Usage: bash scripts/setup.sh
set -e

# ── Colors ────────────────────────────────────────────────────────────────────
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[2m'
RESET='\033[0m'

step() { echo -e "\n${CYAN}${BOLD}▸ $1${RESET}"; }
ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
fail() { echo -e "  ${RED}✗${RESET}  $1"; }
info() { echo -e "  ${DIM}$1${RESET}"; }

# ── Guard: must run from web/ ─────────────────────────────────────────────────
if [ ! -f "package.json" ] || ! grep -q '"name": "togly"' package.json 2>/dev/null; then
  fail "Run this script from the web/ directory: bash scripts/setup.sh"
  exit 1
fi

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Ping — Local Setup${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

# ── 1. Node.js version ────────────────────────────────────────────────────────
step "Node.js version"

REQUIRED_NODE=22

if ! command -v node &>/dev/null; then
  fail "Node.js not found."
  echo ""
  echo "     Install options:"
  echo "       • nvm (recommended): https://github.com/nvm-sh/nvm"
  echo "         Then: nvm install $REQUIRED_NODE && nvm use"
  echo "       • Direct download:   https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE" ]; then
  fail "Node v$NODE_VERSION detected — v$REQUIRED_NODE+ required."
  echo ""
  if command -v nvm &>/dev/null; then
    echo "     You have nvm. Fix with:"
    echo -e "       ${CYAN}nvm install $REQUIRED_NODE && nvm use${RESET}"
  else
    echo "     Install nvm to manage Node versions:"
    echo "       https://github.com/nvm-sh/nvm"
  fi
  exit 1
fi

ok "Node v$NODE_VERSION"
info "nvm users: run 'nvm use' to auto-switch to v$REQUIRED_NODE (pinned in .nvmrc)"

# ── 2. npm ────────────────────────────────────────────────────────────────────
step "npm"

if ! command -v npm &>/dev/null; then
  fail "npm not found — reinstall Node.js from https://nodejs.org"
  exit 1
fi

ok "npm $(npm -v)"

# ── 3. Install dependencies ───────────────────────────────────────────────────
step "Installing dependencies"

npm install

ok "node_modules installed ($(ls node_modules | wc -l | tr -d ' ') packages)"

# ── 4. TypeScript check (quick, no emit) ──────────────────────────────────────
step "TypeScript"

if npx tsc --noEmit 2>/dev/null; then
  ok "No type errors"
else
  warn "Type errors detected — run 'npx tsc --noEmit' to see them"
  info "This won't block dev, but worth fixing before committing"
fi

# ── 5. Environment variables ──────────────────────────────────────────────────
step "Environment variables (.env.local)"

ENV_EXAMPLE=".env.example"
ENV_LOCAL=".env.local"

PLACEHOLDER_PATTERN="your-project-ref\|your-anon-key\|your-service-role-key\|your-password"

if [ ! -f "$ENV_LOCAL" ]; then
  cp "$ENV_EXAMPLE" "$ENV_LOCAL"
  echo ""
  warn ".env.local created from .env.example"
  echo ""
  echo -e "  ${BOLD}Fill in all four values before continuing:${RESET}"
  echo ""
  echo "    NEXT_PUBLIC_SUPABASE_URL       → supabase.com → project → Settings → API"
  echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY  → same page, anon/public key"
  echo "    SUPABASE_SERVICE_ROLE_KEY      → same page, service_role key (keep secret)"
  echo "    DATABASE_URL                   → Settings → Database → Connection string"
  echo "                                     Use the Transaction pooler URI (port 6543)"
  echo ""
  echo -e "  ${YELLOW}Re-run this script once .env.local is filled in.${RESET}"
  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  exit 0
fi

if grep -q "$PLACEHOLDER_PATTERN" "$ENV_LOCAL" 2>/dev/null; then
  warn ".env.local has placeholder values — not all vars are filled in"
  echo ""
  echo "     Required vars with missing values:"
  grep "$PLACEHOLDER_PATTERN" "$ENV_LOCAL" | sed 's/=.*//' | while read -r line; do
    echo "       • $line"
  done
  echo ""
  echo -e "  ${YELLOW}Fill them in, then re-run this script.${RESET}"
  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  exit 0
fi

ok ".env.local is present and looks populated"

# Warn if DATABASE_URL still points at port 5432 (direct connection, not pooler)
if grep -q "DATABASE_URL" "$ENV_LOCAL" && grep "DATABASE_URL" "$ENV_LOCAL" | grep -q ":5432"; then
  warn "DATABASE_URL looks like a direct connection (port 5432)"
  info "Use the Transaction pooler URI (port 6543) from Supabase → Database → Connection string"
fi

# ── 6. Push DB schema ─────────────────────────────────────────────────────────
step "Database schema (db:push)"

echo "  Pushing Drizzle schema to Supabase..."

if npm run db:push --silent 2>&1; then
  ok "Schema is up to date"
else
  fail "db:push failed."
  echo ""
  echo "     Common causes:"
  echo "       • DATABASE_URL is wrong or unreachable"
  echo "       • Supabase project is paused (free tier auto-pauses)"
  echo "       • VPN or firewall blocking the connection"
  echo ""
  echo "     Try: npm run db:studio to test the connection interactively"
  exit 1
fi

# ── 7. Done ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  Setup complete.${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  Start dev server    ${CYAN}npm run dev${RESET}"
echo -e "  Triage dashboard    ${CYAN}http://localhost:3000/dev/triage${RESET}"
echo -e "  DB browser          ${CYAN}npm run db:studio${RESET}"
echo ""
echo -e "  ${DIM}Optional: seed sample data${RESET}"
echo -e "  ${DIM}Sign up at /login first, then:${RESET}"
echo -e "  ${DIM}npm run db:seed -- your@email.com${RESET}"
echo ""
