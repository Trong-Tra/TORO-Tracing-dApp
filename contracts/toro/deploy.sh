#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════════════╗"
echo "║     TORO Deploy — Aiken + cardano-cli        ║"
echo "║  CIP-68 Tuna Supply Chain                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Auto-detect payment.vkey ────────────────────
VKEY="${1:-./payment.vkey}"
if [ ! -f "$VKEY" ]; then
  echo "Error: $VKEY not found."
  echo "Generate keys first:"
  echo "  cardano-cli address key-gen --verification-key-file payment.vkey --signing-key-file payment.skey"
  exit 1
fi

PKH="$(cardano-cli address key-hash --payment-verification-key-file "$VKEY")"
ADDR="$(cardano-cli address build --payment-verification-key-file "$VKEY" --testnet-magic 2)"

echo "Wallet: $ADDR"
echo "PKH:    $PKH"
echo ""

# ── Parameter CBOR ──────────────────────────────
# 28-byte bytestring in CBOR: 0x58 = 1-byte length prefix, 0x1c = 28
PARAM="581c$PKH"

echo "Parameter CBOR: $PARAM"
echo ""

# ── Apply parameters: Factory ───────────────────
echo "→ ToroBatchRecordFactory..."
aiken blueprint apply --validator toro_batch_record_factory "$PARAM" -o /tmp/toro_factory.json >/dev/null 2>&1
FACTORY_POLICY="$(aiken blueprint policy -i /tmp/toro_factory.json --validator toro_batch_record_factory 2>/dev/null)"
echo "  Policy ID: $FACTORY_POLICY"

# ── Apply parameters: Station A ─────────────────
echo "→ ToroStationSigner (Station A)..."
aiken blueprint apply --validator toro_station_signer "$PARAM" -o /tmp/toro_station_a_step1.json >/dev/null 2>&1
aiken blueprint apply -i /tmp/toro_station_a_step1.json --validator toro_station_signer "$PARAM" -o /tmp/toro_station_a.json >/dev/null 2>&1
STATION_A_ADDR="$(aiken blueprint address -i /tmp/toro_station_a.json --validator toro_station_signer 2>/dev/null)"
echo "  Address:   $STATION_A_ADDR"

# ── Apply parameters: Station B ─────────────────
echo "→ ToroStationSigner (Station B)..."
aiken blueprint apply --validator toro_station_signer "$PARAM" -o /tmp/toro_station_b_step1.json >/dev/null 2>&1
aiken blueprint apply -i /tmp/toro_station_b_step1.json --validator toro_station_signer "$PARAM" -o /tmp/toro_station_b.json >/dev/null 2>&1
STATION_B_ADDR="$(aiken blueprint address -i /tmp/toro_station_b.json --validator toro_station_signer 2>/dev/null)"
echo "  Address:   $STATION_B_ADDR"

# ── Apply parameters: Merger ────────────────────
echo "→ ToroPublicRecordDeployer..."
aiken blueprint apply --validator toro_public_record_deployer "$PARAM" -o /tmp/toro_merger_step1.json >/dev/null 2>&1
aiken blueprint apply -i /tmp/toro_merger_step1.json --validator toro_public_record_deployer "$PARAM" -o /tmp/toro_merger.json >/dev/null 2>&1
MERGER_ADDR="$(aiken blueprint address -i /tmp/toro_merger.json --validator toro_public_record_deployer 2>/dev/null)"
echo "  Address:   $MERGER_ADDR"

echo ""
echo "┌─ Deployment Summary ─────────────────────────┐"
printf "│ Factory Policy ID:  %-26s │\n" "${FACTORY_POLICY:0:26}"
printf "│ Station A:          %-26s │\n" "${STATION_A_ADDR:0:26}"
printf "│ Station B:          %-26s │\n" "${STATION_B_ADDR:0:26}"
printf "│ Merger:             %-26s │\n" "${MERGER_ADDR:0:26}"
echo "└──────────────────────────────────────────────┘"
echo ""

# ── Save to project ─────────────────────────────
mkdir -p deploy-out
cat > deploy-out/addresses.json <<EOF
{
  "factoryPolicyId": "$FACTORY_POLICY",
  "stationA": "$STATION_A_ADDR",
  "stationB": "$STATION_B_ADDR",
  "merger": "$MERGER_ADDR",
  "wallet": "$ADDR",
  "pkh": "$PKH"
}
EOF

echo "Saved to deploy-out/addresses.json"
echo ""
echo "You can now start using these addresses. No on-chain 'deployment' is required"
echo "for Cardano spending validators — just send UTxOs to the computed addresses."
echo ""
echo "Reference scripts (optional, for cheaper future txs) can be posted later"
echo "when you have more tADA."
