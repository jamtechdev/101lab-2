#!/bin/bash
set -e

PROJECT_DIR="/www/wwwroot/101lab-2"
cd "$PROJECT_DIR"

echo "[deploy] Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "[deploy] Installing dependencies..."
npm install --legacy-peer-deps

echo "[deploy] Building..."
npm run build

echo "[deploy] Done. Build deployed to dist/"

