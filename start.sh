#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# RALLY — One-Command Local Development Environment Launcher
#
# Starts:
#   1. FastAPI Backend (:8000)
#   2. MCP Streamable HTTP Server (:8001)
#   3. React / Vite Frontend (:5173)
#
# Usage:
#   ./start.sh
#   bash start.sh
# ─────────────────────────────────────────────────────────────────────────────

set -eo pipefail

# ── 1. Resolve Project Root ──────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

PYTHON_BIN="${SCRIPT_DIR}/apps/api/.venv/bin/python"
WEB_DIR="${SCRIPT_DIR}/apps/web"
TMP_DIR="${SCRIPT_DIR}/.tmp"

# Terminal formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
RED="\033[0;31m"
AMBER="\033[0;33m"
RESET="\033[0m"

# PIDs tracked for graceful shutdown
API_PID=""
MCP_PID=""
WEB_PID=""

# ── 2. Graceful Shutdown Trap Handler ─────────────────────────────────────────
cleanup() {
  echo ""
  echo -e "${AMBER}[RALLY] Shutting down services...${RESET}"

  if [ -n "${WEB_PID}" ] && kill -0 "${WEB_PID}" 2>/dev/null; then
    kill -SIGTERM "${WEB_PID}" 2>/dev/null || true
    echo -e "  [${GREEN}✓${RESET}] Frontend stopped"
  fi

  if [ -n "${MCP_PID}" ] && kill -0 "${MCP_PID}" 2>/dev/null; then
    kill -SIGTERM "${MCP_PID}" 2>/dev/null || true
    echo -e "  [${GREEN}✓${RESET}] MCP server stopped"
  fi

  if [ -n "${API_PID}" ] && kill -0 "${API_PID}" 2>/dev/null; then
    kill -SIGTERM "${API_PID}" 2>/dev/null || true
    echo -e "  [${GREEN}✓${RESET}] FastAPI stopped"
  fi

  # Double-check cleanup of any immediate child background jobs
  kill $(jobs -p) 2>/dev/null || true

  echo -e "${GREEN}[RALLY] All services stopped cleanly.${RESET}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ── 3. Banner ─────────────────────────────────────────────────────────────────
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║                            RALLY                             ║${RESET}"
echo -e "${CYAN}║            Reliability & Response Orchestration              ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${BOLD}[RALLY] Environment: LOCAL SIMULATOR${RESET}"
echo ""

# ── 4. Dependency Validation ──────────────────────────────────────────────────
if [ ! -x "${PYTHON_BIN}" ]; then
  echo -e "${RED}[ERROR] Python virtual environment not found.${RESET}"
  echo ""
  echo "Expected:"
  echo "  ${PYTHON_BIN}"
  echo ""
  echo "Please set up the Python virtual environment first:"
  echo "  cd apps/api && python3 -m venv .venv && source .venv/bin/activate && pip install -e ."
  exit 1
fi

if [ ! -f "${WEB_DIR}/package.json" ]; then
  echo -e "${RED}[ERROR] Frontend package.json not found in apps/web.${RESET}"
  exit 1
fi

# Ensure Node modules are installed
if [ ! -d "${WEB_DIR}/node_modules" ]; then
  echo -e "${AMBER}[RALLY] node_modules not found in apps/web. Installing dependencies...${RESET}"
  (cd "${WEB_DIR}" && npm install)
fi

# Create scratch directory for service logs
mkdir -p "${TMP_DIR}"

# ── 5. Port Collision Checks ──────────────────────────────────────────────────
check_port() {
  local port="$1"
  local svc_name="$2"
  if lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    local proc_info
    proc_info="$(lsof -nP -iTCP:"${port}" -sTCP:LISTEN | tail -n +2 | awk '{print $1 " (PID " $2 ")"}' | head -n 1)"
    echo -e "${RED}[ERROR] Port ${port} is already in use by ${proc_info}.${RESET}"
    echo -e "        ${svc_name} cannot start."
    echo -e "        Stop the existing process and run ./start.sh again."
    exit 1
  fi
}

check_port 8000 "FastAPI API"
check_port 8001 "RALLY MCP Server"
check_port 5173 "RALLY Frontend (Vite)"

# ── 6. Step 1: Start FastAPI Backend (:8000) ──────────────────────────────────
echo -e "${BOLD}[1/3] Starting FastAPI Backend...${RESET}"
echo "      http://localhost:8000"

(
  export PYTHONPATH="${SCRIPT_DIR}:${SCRIPT_DIR}/apps/api:${PYTHONPATH:-}"
  exec "${PYTHON_BIN}" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
) > "${TMP_DIR}/rally-api.log" 2>&1 &
API_PID=$!

# Wait for FastAPI /health probe
echo -n "      Waiting for API health..."
API_HEALTHY=false
for i in {1..30}; do
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    echo ""
    echo -e "${RED}[RALLY] ✗ FastAPI process exited unexpectedly.${RESET}"
    cat "${TMP_DIR}/rally-api.log" | tail -n 20
    exit 1
  fi

  if curl -s -f "http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    API_HEALTHY=true
    break
  fi
  sleep 0.5
  echo -n "."
done
echo ""

if [ "${API_HEALTHY}" != "true" ]; then
  echo -e "${RED}[RALLY] ✗ FastAPI failed health check on :8000 within 15 seconds.${RESET}"
  cat "${TMP_DIR}/rally-api.log" | tail -n 20
  exit 1
fi
echo -e "      ${GREEN}✓ API HEALTHY (:8000)${RESET}"
echo ""

# ── 7. Step 2: Start MCP Streamable HTTP Server (:8001) ──────────────────────
echo -e "${BOLD}[2/3] Starting MCP Streamable HTTP Server...${RESET}"
echo "      http://127.0.0.1:8001/mcp"

(
  export PYTHONPATH="${SCRIPT_DIR}:${SCRIPT_DIR}/apps/api:${PYTHONPATH:-}"
  exec "${PYTHON_BIN}" -m rally_mcp.server
) > "${TMP_DIR}/rally-mcp.log" 2>&1 &
MCP_PID=$!

# Wait for MCP port to accept connections
echo -n "      Waiting for MCP server availability..."
MCP_READY=false
for i in {1..30}; do
  if ! kill -0 "${MCP_PID}" 2>/dev/null; then
    echo ""
    echo -e "${RED}[RALLY] ✗ MCP server process exited unexpectedly.${RESET}"
    cat "${TMP_DIR}/rally-mcp.log" | tail -n 20
    exit 1
  fi

  # Streamable HTTP MCP returns HTTP 400 on bare GET (Missing session ID), confirming HTTP listener is active
  if curl -s "http://127.0.0.1:8001/mcp" 2>&1 | grep -q "Missing session ID"; then
    MCP_READY=true
    break
  fi
  sleep 0.5
  echo -n "."
done
echo ""

if [ "${MCP_READY}" != "true" ]; then
  echo -e "${RED}[RALLY] ✗ MCP server failed to respond on :8001 within 15 seconds.${RESET}"
  cat "${TMP_DIR}/rally-mcp.log" | tail -n 20
  exit 1
fi
echo -e "      ${GREEN}✓ MCP SERVER READY (:8001/mcp)${RESET}"
echo ""

# ── 8. Step 3: Start React / Vite Frontend (:5173) ───────────────────────────
echo -e "${BOLD}[3/3] Starting React Web Frontend...${RESET}"
echo "      http://localhost:5173"

(cd "${WEB_DIR}" && exec npm run dev) > "${TMP_DIR}/rally-web.log" 2>&1 &
WEB_PID=$!

# Wait for Vite dev server availability
echo -n "      Waiting for Vite frontend..."
WEB_READY=false
for i in {1..30}; do
  if ! kill -0 "${WEB_PID}" 2>/dev/null; then
    echo ""
    echo -e "${RED}[RALLY] ✗ Frontend dev server exited unexpectedly.${RESET}"
    cat "${TMP_DIR}/rally-web.log" | tail -n 20
    exit 1
  fi

  if lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
    WEB_READY=true
    break
  fi
  sleep 0.5
  echo -n "."
done
echo ""

if [ "${WEB_READY}" != "true" ]; then
  echo -e "${RED}[RALLY] ✗ Frontend failed to bind to :5173 within 15 seconds.${RESET}"
  cat "${TMP_DIR}/rally-web.log" | tail -n 20
  exit 1
fi
echo -e "      ${GREEN}✓ FRONTEND READY (:5173)${RESET}"
echo ""

# ── 9. Operational Summary Banner ─────────────────────────────────────────────
echo -e "${CYAN}──────────────────────────────────────────────────────────────${RESET}"
echo -e "${BOLD}${GREEN}RALLY IS READY${RESET}"
echo ""
echo -e "  Web (Command Center)  → ${CYAN}http://localhost:5173${RESET}"
echo -e "  API Gateway           → ${CYAN}http://localhost:8000${RESET}"
echo -e "  API Docs (Swagger)    → ${CYAN}http://localhost:8000/docs${RESET}"
echo -e "  MCP Endpoint          → ${CYAN}http://127.0.0.1:8001/mcp${RESET}"
echo ""
echo -e "  Runtime Logs:"
echo -e "    ${TMP_DIR}/rally-web.log"
echo -e "    ${TMP_DIR}/rally-api.log"
echo -e "    ${TMP_DIR}/rally-mcp.log"
echo -e "${CYAN}──────────────────────────────────────────────────────────────${RESET}"
echo -e "Press ${BOLD}Ctrl+C${RESET} to stop all RALLY services."
echo ""

# ── 10. Keep foreground alive while monitoring child processes ────────────────
while true; do
  if ! kill -0 "${API_PID}" 2>/dev/null; then
    echo -e "${RED}[RALLY] ✗ FastAPI process terminated unexpectedly.${RESET}"
    cat "${TMP_DIR}/rally-api.log" | tail -n 20
    exit 1
  fi
  if ! kill -0 "${MCP_PID}" 2>/dev/null; then
    echo -e "${RED}[RALLY] ✗ MCP server process terminated unexpectedly.${RESET}"
    cat "${TMP_DIR}/rally-mcp.log" | tail -n 20
    exit 1
  fi
  if ! kill -0 "${WEB_PID}" 2>/dev/null; then
    echo -e "${RED}[RALLY] ✗ Frontend dev server terminated unexpectedly.${RESET}"
    cat "${TMP_DIR}/rally-web.log" | tail -n 20
    exit 1
  fi
  sleep 2
done
