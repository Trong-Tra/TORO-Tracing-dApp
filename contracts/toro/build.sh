#!/usr/bin/env bash
set -e
echo "Building TORO Aiken contracts..."
aiken build
echo "✓ Build complete. Blueprint written to plutus.json"
