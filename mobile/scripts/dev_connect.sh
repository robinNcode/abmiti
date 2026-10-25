#!/usr/bin/env bash
# =============================================================================
# Abmiti Flutter Physical Device Development Helper
# =============================================================================
# Solves cross-router and physical device connectivity:
# - Sets up 'adb reverse tcp:5000 tcp:5000' so physical device reaches Ubuntu PC
#   regardless of what Wi-Fi router or cellular network it is connected to.
# - Displays local LAN IP for same-router mode.
# - Provides quick launch commands for each environment.
# =============================================================================

set -eo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# Find adb
ADB_BIN="$(which adb 2>/dev/null || true)"
if [[ -z "$ADB_BIN" && -x "$HOME/Android/Sdk/platform-tools/adb" ]]; then
  ADB_BIN="$HOME/Android/Sdk/platform-tools/adb"
fi

if [[ -z "$ADB_BIN" ]]; then
  echo -e "${RED}[ERROR]${NC} adb not found. Ensure Android SDK platform-tools is installed."
  exit 1
fi

# Find flutter
FLUTTER_BIN="$(which flutter 2>/dev/null || true)"
if [[ -z "$FLUTTER_BIN" && -x "$HOME/develop/flutter/bin/flutter" ]]; then
  FLUTTER_BIN="$HOME/develop/flutter/bin/flutter"
fi

echo -e "${BOLD}${CYAN}=== Abmiti Physical Device Network Setup ===${NC}\n"

# 1. Check connected devices
echo -e "${YELLOW}[1/3] Checking connected Android devices via ADB...${NC}"
DEVICES=$("$ADB_BIN" devices | grep -v "List" | grep "device$" || true)

if [[ -z "$DEVICES" ]]; then
  echo -e "${RED}[WARN] No authorized Android device detected.${NC}"
  echo -e "  - Plug your phone into Ubuntu with a USB cable."
  echo -e "  - Ensure 'USB Debugging' is enabled in Developer Options."
  echo -e "  - Accept the 'Allow USB debugging' prompt on your phone screen."
  echo ""
else
  echo -e "${GREEN}Detected device(s):${NC}"
  echo "$DEVICES"
  echo ""

  # 2. Setup ADB reverse port forwarding
  echo -e "${YELLOW}[2/3] Setting up ADB Reverse Port Forwarding (Different Router Mode)...${NC}"
  "$ADB_BIN" reverse tcp:5000 tcp:5000
  echo -e "${GREEN}✅ Successfully forwarded: phone localhost:5000 -> Ubuntu PC:5000${NC}"
  echo -e "   Requests to http://127.0.0.1:5000/api/v1 from your phone will now route"
  echo -e "   directly to your backend over USB even when on different routers!\n"
fi

# 3. Detect PC local LAN IPs
echo -e "${YELLOW}[3/3] Detecting Ubuntu PC LAN IP addresses (Same Router Mode)...${NC}"
LAN_IPS=$(ip -4 addr show scope global | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '172\.' || true)

echo -e "${GREEN}Available LAN IP(s):${NC}"
for ip in $LAN_IPS; do
  echo -e "  • ${BOLD}http://${ip}:5000/api/v1${NC}"
done
echo ""

# Summary of Launch Options
echo -e "${BOLD}${CYAN}=== How to run the Flutter App ===${NC}"
echo ""
echo -e "  ${BOLD}1. Different Router (USB / ADB Reverse) — RECOMMENDED:${NC}"
echo -e "     ${GREEN}$FLUTTER_BIN run --dart-define=API_ENV=different_router${NC}"
echo -e "     (Works on any Wi-Fi router, hotspot, or mobile data via USB)\n"

echo -e "  ${BOLD}2. Same Router (Local Wi-Fi / Ethernet):${NC}"
FIRST_IP=$(echo "$LAN_IPS" | head -n 1)
echo -e "     ${GREEN}$FLUTTER_BIN run --dart-define=API_ENV=same_router --dart-define=LAN_IP=${FIRST_IP:-192.168.26.65}${NC}\n"

echo -e "  ${BOLD}3. Live Production Server:${NC}"
echo -e "     ${GREEN}$FLUTTER_BIN run --dart-define=API_ENV=production${NC}\n"

echo -e "  ${BOLD}4. Custom Tunnel / URL (Cloudflare / Localtunnel / Ngrok):${NC}"
echo -e "     ${GREEN}$FLUTTER_BIN run --dart-define=API_BASE_URL=https://your-tunnel-url/api/v1${NC}\n"

echo -e "${CYAN}Tip: You can also tap the API Chip on the app's login screen or in the drawer${NC}"
echo -e "${CYAN}     to switch and test any URL live directly from your phone!${NC}\n"
