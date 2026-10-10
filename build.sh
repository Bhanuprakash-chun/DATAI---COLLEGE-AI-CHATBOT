#!/usr/bin/env bash
# ==============================================================================
# Unified Build Script for DatAI on Render (Single Web Service Mode)
# ==============================================================================
set -e

echo "==> [1/3] Installing Python backend dependencies..."
pip install -r server/requirements.txt

echo "==> [2/3] Installing client dependencies..."
npm --prefix client install

echo "==> [3/3] Compiling React Vite client..."
npm --prefix client run build

echo "==> Build finished successfully! Assets ready in client/dist"
