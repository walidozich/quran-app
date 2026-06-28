#!/usr/bin/env bash
# Launch Expo for this project.
#
# On this Linux machine, direct LAN connection to the dev server is BLOCKED:
# the phone cannot reach the PC's Wi-Fi IP (phone browser times out), even though
# the dev server, firewall, and routing are all fine. The most likely culprit is
# the Docker nftables rules silently dropping inbound packets. Tunnel mode routes
# through Expo's relay and bypasses the LAN entirely, so it works reliably here.
#
#   ./dev.sh           → tunnel mode (default, works on this machine)
#   ./dev.sh --lan     → direct LAN (forces the real Wi-Fi IP; only if LAN is fixed)
#
# Any extra args are passed through to `expo start`.
set -e

if [ "$1" = "--lan" ]; then
  shift
  # Source IP of the default route = the real Wi-Fi/LAN IP (ignores Docker/Tailscale).
  LAN_IP="$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K[0-9.]+' | head -1)"
  if [ -z "$LAN_IP" ]; then
    echo "Could not auto-detect a LAN IP. Are you on Wi-Fi?" >&2
    exit 1
  fi
  echo "→ LAN mode. Forcing host IP: $LAN_IP   (manual URL: exp://$LAN_IP:8081)"
  export REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP"
  exec npx expo start "$@"
fi

echo "→ Tunnel mode (LAN is blocked on this machine). Needs internet on phone + PC."
echo "  First run may install @expo/ngrok — accept it."
exec npx expo start --tunnel "$@"
