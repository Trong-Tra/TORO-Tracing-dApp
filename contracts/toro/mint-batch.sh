#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Config ──────────────────────────────────────
ADDR_JSON="${ADDR_JSON:-deploy-out/addresses.json}"
SKEY="${SKEY:-./payment.skey}"
BLOCKFrost_KEY="${BLOCKFROST_KEY:-}"
NETWORK_MAGIC="${NETWORK_MAGIC:-2}"

if [ ! -f "$ADDR_JSON" ]; then
  echo "Error: $ADDR_JSON not found. Run ./deploy.sh first."
  exit 1
fi

if [ ! -f "$SKEY" ]; then
  echo "Error: $SKEY not found. Generate keys with cardano-cli address key-gen."
  exit 1
fi

if [ -z "$BLOCKFROST_KEY" ]; then
  read -rp "Blockfrost API Key: " BLOCKFROST_KEY
fi

# ── Load deployed addresses ─────────────────────
FACTORY_POLICY=$(jq -r '.factoryPolicyId' "$ADDR_JSON")
STATION_A=$(jq -r '.stationA' "$ADDR_JSON")
WALLET_ADDR=$(jq -r '.wallet' "$ADDR_JSON")
PKH=$(jq -r '.pkh' "$ADDR_JSON")

# ── Inputs ──────────────────────────────────────
BATCH_ID="${1:-BATCH-001}"
PRODUCT_NAME="${2:-Bluefin Tuna}"
STATION_ID="${3:-STATION-A}"

echo "╔══════════════════════════════════════════════╗"
echo "║     TORO Mint — First Batch                  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Batch ID:    $BATCH_ID"
echo "Product:     $PRODUCT_NAME"
echo "Station:     $STATION_ID"
echo "Policy ID:   $FACTORY_POLICY"
echo ""

# ── Helpers ─────────────────────────────────────
to_hex() {
  python3 -c "import sys; print(sys.argv[1].encode().hex())" "$1"
}

# ── Generate factory script file if missing ─────
if [ ! -f "/tmp/toro_scripts/factory.plutus" ]; then
  echo "→ Generating parameterized script..."
  PARAM="581c$PKH"
  aiken blueprint apply --validator toro_batch_record_factory "$PARAM" -o /tmp/toro_factory.json >/dev/null 2>&1
  CBOR=$(jq -r '.validators[0].compiledCode' /tmp/toro_factory.json)
  mkdir -p /tmp/toro_scripts
  cat > /tmp/toro_scripts/factory.plutus <<EOF
{
  "type": "PlutusScriptV3",
  "description": "TORO Factory",
  "cborHex": "$CBOR"
}
EOF
fi

# ── Build Plutus Data JSON files ────────────────
REDEEMER_FILE="/tmp/toro_mint_redeemer.json"
DATUM_FILE="/tmp/toro_mint_datum.json"
TIMESTAMP=$(date +%s)

cat > "$REDEEMER_FILE" <<EOF
{
  "constructor": 0,
  "fields": [
    {"bytes": "$(to_hex "$BATCH_ID")"}
  ]
}
EOF

cat > "$DATUM_FILE" <<EOF
{
  "constructor": 0,
  "fields": [
    {"bytes": "$(to_hex "$BATCH_ID")"},
    {"bytes": "$(to_hex "$PRODUCT_NAME")"},
    {"bytes": "$(to_hex "eggs")"},
    {"bytes": "$(to_hex "$STATION_ID")"},
    {"int": $TIMESTAMP},
    {"bytes": "$PKH"}
  ]
}
EOF

# ── CIP-68 ref token asset name ─────────────────
REF_PREFIX="000643b0"
BATCH_HEX=$(to_hex "$BATCH_ID")
ASSET_NAME="${REF_PREFIX}${BATCH_HEX}"

echo "→ CIP-68 ref token: $FACTORY_POLICY.$ASSET_NAME"
echo ""

# ── Query UTxOs via Blockfrost ──────────────────
echo "→ Querying wallet UTxOs..."
UTXO_JSON=$(curl -s -H "project_id: $BLOCKFROST_KEY" \
  "https://cardano-preview.blockfrost.io/api/v0/addresses/$WALLET_ADDR/utxos")

TX_HASH=$(echo "$UTXO_JSON" | jq -r '.[0].tx_hash')
TX_IDX=$(echo "$UTXO_JSON" | jq -r '.[0].output_index')
BALANCE=$(echo "$UTXO_JSON" | jq -r '.[0].amount[0].quantity')

if [ "$TX_HASH" = "null" ] || [ -z "$TX_HASH" ]; then
  echo "❌ No UTxOs found. Fund your address first:"
  echo "   $WALLET_ADDR"
  exit 1
fi

echo "  UTxO: $TX_HASH#$TX_IDX ($BALANCE lovelace)"
echo ""

# ── Get protocol params ─────────────────────────
echo "→ Fetching protocol parameters..."
curl -s -H "project_id: $BLOCKFROST_KEY" \
  "https://cardano-preview.blockfrost.io/api/v0/epochs/latest/parameters" \
  > /tmp/toro_protocol.json

# ── Build draft transaction ─────────────────────
echo "→ Building draft transaction..."
cardano-cli transaction build-raw \
  --tx-in "$TX_HASH#$TX_IDX" \
  --tx-out "$STATION_A+2000000+1 $FACTORY_POLICY.$ASSET_NAME" \
  --tx-out-inline-datum-file "$DATUM_FILE" \
  --mint "1 $FACTORY_POLICY.$ASSET_NAME" \
  --mint-script-file /tmp/toro_scripts/factory.plutus \
  --mint-redeemer-file "$REDEEMER_FILE" \
  --tx-out "$WALLET_ADDR+0" \
  --fee 0 \
  --out-file /tmp/toro_mint_draft.txbody

# ── Calculate fee ───────────────────────────────
echo "→ Calculating fee..."
FEE=$(cardano-cli transaction calculate-min-fee \
  --tx-body-file /tmp/toro_mint_draft.txbody \
  --tx-in-count 1 \
  --tx-out-count 2 \
  --witness-count 1 \
  --protocol-params-file /tmp/toro_protocol.json \
  | awk '{print $1}')

echo "  Fee: $FEE lovelace"

# ── Calculate change ────────────────────────────
MIN_UTXO=2000000
CHANGE=$((BALANCE - MIN_UTXO - FEE))

if [ "$CHANGE" -lt 0 ]; then
  echo "❌ Insufficient funds. Need ~$((MIN_UTXO + FEE)) lovelace, have $BALANCE."
  exit 1
fi

echo "  Change: $CHANGE lovelace"
echo ""

# ── Build final transaction ─────────────────────
echo "→ Building final transaction..."
cardano-cli transaction build-raw \
  --tx-in "$TX_HASH#$TX_IDX" \
  --tx-out "$STATION_A+$MIN_UTXO+1 $FACTORY_POLICY.$ASSET_NAME" \
  --tx-out-inline-datum-file "$DATUM_FILE" \
  --mint "1 $FACTORY_POLICY.$ASSET_NAME" \
  --mint-script-file /tmp/toro_scripts/factory.plutus \
  --mint-redeemer-file "$REDEEMER_FILE" \
  --tx-out "$WALLET_ADDR+$CHANGE" \
  --fee "$FEE" \
  --out-file /tmp/toro_mint_final.txbody

# ── Sign ────────────────────────────────────────
echo "→ Signing..."
cardano-cli transaction sign \
  --tx-body-file /tmp/toro_mint_final.txbody \
  --signing-key-file "$SKEY" \
  --out-file /tmp/toro_mint_signed.tx

# ── Submit ──────────────────────────────────────
echo "→ Submitting via Blockfrost..."
TX_CBOR=$(xxd -p /tmp/toro_mint_signed.tx | tr -d '\n')
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/cbor" \
  -H "project_id: $BLOCKFROST_KEY" \
  --data-binary @/tmp/toro_mint_signed.tx \
  "https://cardano-preview.blockfrost.io/api/v0/tx/submit")

if echo "$RESPONSE" | grep -q '"error"'; then
  echo "❌ Submission failed:"
  echo "$RESPONSE" | jq .
  exit 1
fi

TX_HASH=$(echo "$RESPONSE" | jq -r '.')
echo ""
echo "✅ Minted!"
echo "Tx Hash: $TX_HASH"
echo "Explorer: https://preview.cexplorer.io/tx/$TX_HASH"
