#!/usr/bin/env bash
# NOTE: Cardano/Aiken development is paused. This script is kept for reference only.
# Active development has moved to EVM/Solidity in the ../evm/ directory.

set -e
echo "Building TORO Aiken contracts..."
aiken build
echo "✓ Build complete. Blueprint written to plutus.json"
