#!/bin/sh
# Resolve the app hostname to an IP so Playwright's sandboxed
# browsers (which use a separate network namespace) can reach it.

APP_IP=$(dig +short app 2>/dev/null | head -1)
if [ -z "$APP_IP" ]; then
  APP_IP=$(python3 -c "import socket; print(socket.gethostbyname('app'))" 2>/dev/null)
fi

if [ -z "$APP_IP" ]; then
  echo "ERROR: could not resolve 'app' hostname"
  exit 1
fi

echo "Resolved app -> $APP_IP"
export PLAYWRIGHT_BASE_URL="http://${APP_IP}:8081"
exec npx playwright test --config=playwright.integration.config.ts
