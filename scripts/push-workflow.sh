#!/usr/bin/env bash
# ==============================================================
# push-workflow.sh — Push CI workflow to GitHub
# 
# Why this exists: The gh OAuth token lacks 'workflow' scope,
# so standard git push of .github/ files is rejected. This
# script provides alternative methods.
#
# Usage: bash scripts/push-workflow.sh
# ==============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
REPO="xi-kki/veridd"
FILE=".github/workflows/ci.yml"
LOCAL_FILE="$(git rev-parse --show-toplevel 2>/dev/null)/$FILE"

echo -e "${CYAN}━━━ Push CI Workflow to GitHub ━━━${NC}"
echo ""

if [ ! -f "$LOCAL_FILE" ]; then
  echo -e "${RED}✗ Workflow file not found at $LOCAL_FILE${NC}"
  exit 1
fi

# ── Method 1: GitHub web UI ──
echo -e "${GREEN}Method 1: One-click web URL${NC}"
CONTENT=$(base64 -w0 < "$LOCAL_FILE" 2>/dev/null || base64 < "$LOCAL_FILE")
URL="https://github.com/$REPO/new/main?filename=$FILE"
echo -e "  Open this URL in your browser, paste the content below, and commit:"
echo -e "  ${CYAN}$URL${NC}"
echo ""

# ── Method 2: gh with new token ──
echo -e "${GREEN}Method 2: Refresh gh token with workflow scope${NC}"
echo "  Run these commands one at a time:"
echo -e "  ${CYAN}gh auth refresh -h github.com -s workflow${NC}"
echo "  (A browser will open — authorize the workflow scope)"
echo -e "  Then: ${CYAN}cd $(git rev-parse --show-toplevel 2>/dev/null) && git push origin main${NC}"
echo ""

# ── Method 3: Create a classic PAT ──
echo -e "${GREEN}Method 3: Personal Access Token (classic)${NC}"
echo "  1. Go to https://github.com/settings/tokens"
echo "  2. Generate a classic token with 'repo' and 'workflow' scopes"
echo "  3. Run:"
echo -e "  ${CYAN}git push https://xi-kki:YOUR_NEW_TOKEN@github.com/$REPO.git main${NC}"
echo ""
echo -e "${GREEN}All code changes are already pushed!${NC}"
echo "The workflow file is committed locally — just one of the methods above to push it."
