#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════════════╗"
echo "║     TORO Deploy — Aiken + cardano-cli        ║"
echo "║  CIP-68 Tuna Supply Chain                    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Inputs ──────────────────────────────────────
if [ -z "$1" ]; then
  read -rp "Enter your wallet address or PKH: " INPUT
else
  INPUT="$1"
fi

INPUT="$(echo "$INPUT" | tr -d '[:space:]')"

# Detect if input is an address (starts with addr) or a PKH (56 hex chars)
if [[ "$INPUT" == addr* ]]; then
  echo "Deriving PKH from address..."
  PKH="$(node "$(dirname "$0")/get-pkh.mjs" "$INPUT" 2>/dev/null)"
  if [ -z "$PKH" ] || [ "${#PKH}" -ne 56 ]; then
    echo "Error: Could not derive PKH from address. Make sure it's a valid Cardano address."
    exit 1
  fi
elif [ "${#INPUT}" -eq 56 ]; then
  PKH="$INPUT"
else
  echo "Error: Input must be a Cardano address (starts with 'addr') or a 56-char PKH."
  exit 1
fi

NETWORK="${2:-testnet}"
MAGIC="${3:-2}"  # 2 = Preview, 1 = Preprod

echo ""
echo "PKH:    $PKH"
echo "Network: $NETWORK (magic $MAGIC)"
echo ""

# ── Parameter CBOR ──────────────────────────────
# A 28-byte bytestring in CBOR: 0x58 = bytes with 1-byte length prefix, 0x1c = 28
PARAM="581c$PKH"

echo "Parameter CBOR: $PARAM"
echo ""

# ── Apply parameters: Factory ───────────────────
echo "→ Applying parameters to ToroBatchRecordFactory..."
aiken blueprint apply --validator toro_batch_record_factory "$PARAM" -o /tmp/toro_factory.json >/dev/null 2>&1
FACTORY_POLICY="$(aiken blueprint policy -i /tmp/toro_factory.json --validator toro_batch_record_factory 2>/dev/null)"
echo "  Policy ID: $FACTORY_POLICY"

# ── Apply parameters: Station A ─────────────────
echo "→ Applying parameters to ToroStationSigner (Station A)..."
aiken blueprint apply --validator toro_station_signer "$PARAM" -o /tmp/toro_station_a_step1.json >/dev/null 2>&1
aiken blueprint apply -i /tmp/toro_station_a_step1.json --validator toro_station_signer "$PARAM" -o /tmp/toro_station_a.json >/dev/null 2>&1
STATION_A_ADDR="$(aiken blueprint address -i /tmp/toro_station_a.json --validator toro_station_signer 2>/dev/null)"
echo "  Address:   $STATION_A_ADDR"

# ── Apply parameters: Station B ─────────────────
echo "→ Applying parameters to ToroStationSigner (Station B)..."
aiken blueprint apply --validator toro_station_signer "$PARAM" -o /tmp/toro_station_b_step1.json >/dev/null 2>&1
aiken blueprint apply -i /tmp/toro_station_b_step1.json --validator toro_station_signer "$PARAM" -o /tmp/toro_station_b.json >/dev/null 2>&1
STATION_B_ADDR="$(aiken blueprint address -i /tmp/toro_station_b.json --validator toro_station_signer 2>/dev/null)"
echo "  Address:   $STATION_B_ADDR"

# ── Apply parameters: Merger ────────────────────
echo "→ Applying parameters to ToroPublicRecordDeployer..."
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

# ── Generate cardano-cli script files ───────────
mkdir -p /tmp/toro_scripts

for role in factory station_a station_b merger; do
  IN_FILE="/tmp/toro_${role}.json"
  if [ "$role" = "station_a" ] || [ "$role" = "station_b" ]; then
    IN_FILE="/tmp/toro_${role}.json"
  fi
  CBOR="$(jq -r '.validators[0].compiledCode' "$IN_FILE")"
  cat > "/tmp/toro_scripts/${role}.plutus" <<EOF
{
  "type": "PlutusScriptV3",
  "description": "TORO ${role}",
  "cborHex": "$CBOR"
}
EOF
done

echo "→ Script files written to /tmp/toro_scripts/"
echo ""

# ── cardano-cli reference script command ────────
echo "┌─ cardano-cli command (save this) ────────────┐"
echo "│"
echo "│ cardano-cli transaction build \\"
echo "│   --${NETWORK}-magic ${MAGIC} \\"
echo "│   --tx-in <YOUR_UTXO> \\"
echo "│   --tx-out ${STATION_A_ADDR}+2000000 \\"
echo "│   --tx-out-reference-script-file /tmp/toro_scripts/station_a.plutus \\"
echo "│   --tx-out ${STATION_B_ADDR}+2000000 \\"
echo "│   --tx-out-reference-script-file /tmp/toro_scripts/station_b.plutus \\"
echo "│   --tx-out ${MERGER_ADDR}+2000000 \\"
echo "│   --tx-out-reference-script-file /tmp/toro_scripts/merger.plutus \\"
echo "│   --tx-out <YOUR_CHANGE_ADDR>+CHANGE \\"
echo "│   --change-address <YOUR_CHANGE_ADDR> \\"
echo "│   --out-file /tmp/toro_deploy.txbody"
echo "│"
echo "│ cardano-cli transaction sign \\"
echo "│   --tx-body-file /tmp/toro_deploy.txbody \\"
echo "│   --signing-key-file <YOUR_SKEY> \\"
echo "│   --out-file /tmp/toro_deploy.txsigned"
echo "│"
echo "│ cardano-cli transaction submit \\"
echo "│   --${NETWORK}-magic ${MAGIC} \\"
echo "│   --tx-file /tmp/toro_deploy.txsigned"
echo "│"
echo "└──────────────────────────────────────────────┘"
echo ""
echo "Or use the Node.js script for automatic submission:"
echo "  node deploy.mjs"
