# TORO — Tuna Supply Chain Tracer

Minimal Aiken smart contract for tracing tuna from catch to can on Cardano.
Uses a **minting policy + always-true script** architecture for the investor demo.

Two independent trace chains converge at final product:
- **Station A (Farm)**: Hatchery → Nursery → Growout → HarvestTransport → FarmProcessing
- **Station B (Catch)**: CatchIce → PortLanding → TransportPlant → CatchProcessing
- **Final**: Product merge of both chains

## Build

```bash
./build.sh
# or
aiken build
```

## Run Mock Flow (Local Emulator)

```bash
npm run mock
# or directly
npx tsx scripts/mock-flow.ts
```

Executes the full trace on a local Lucid emulator (9 transactions):

| # | Stage | Datum | Weight |
|---|-------|-------|--------|
| 1 | **Factory** | Hatchery + CatchIce | 500 kg eggs + 800 kg catch |
| 2 | A2 Nursery | fry 450 kg, 90% survival | — |
| 3 | A3 Growout | fish 2,000 kg, density 25/m³ | — |
| 4 | A4 Harvest+Transport | shipped 1,950 kg, 0°C | — |
| 5 | A5 Farm Processing | 3,900 cans | — |
| 6 | B2 Port Landing | landed 780 kg, Songkhla | — |
| 7 | B3 Transport to Plant | 770 kg, 12h transit | — |
| 8 | B4 Catch Processing | 1,540 cans | — |
| 9 | **Final** | 5,440 cans total product | farm 3,900 + catch 1,540 |

Each ref-token UTxO carries a typed `TraceDatum` as inline datum, linking back to the previous transaction hash.

## Deploy to Preview Testnet

### 1. Get a Blockfrost API Key

1. Go to [blockfrost.io](https://blockfrost.io)
2. Sign up (free tier is fine)
3. Create a new project → select **Cardano Preview**
4. Copy the API key (starts with `preview`)

### 2. Get Your Lace Seed Phrase

1. Open Lace wallet
2. Go to **Settings → Show Recovery Phrase**
3. Enter your password
4. Copy the 24 words

### 3. Set Environment Variables

```bash
cp .env.example .env
# Edit .env and paste your seed phrase + Blockfrost key
```

Or export directly:

```bash
export LACE_SEED="word1 word2 ... word24"
export BLOCKFROST_KEY="previewxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 4. Run Deploy

```bash
npm run deploy
# or directly
npx tsx scripts/deploy-testnet.ts
```

This submits 9 real transactions to Preview testnet (~7–12 min depending on confirmation times). Each transaction waits for on-chain confirmation before proceeding.

### 5. View on Explorer

After deploy, check:

- **Policy**: `https://preview.cardanoscan.io/tokenPolicy/<policyId>`
- **Farm Token**: `https://preview.cardanoscan.io/token/<farmUsr>`
- **Catch Token**: `https://preview.cardanoscan.io/token/<catchUsr>`
- **Product Token**: `https://preview.cardanoscan.io/token/<productUsr>`
- **Script Address**: `https://preview.cardanoscan.io/address/<traceAddr>`

A `deploy-manifest.json` is generated with all addresses and tx hashes.

## Architecture

### Minting Policy (`validators/toro.ak`)

Permissive minting policy for the demo. Mints CIP-68 pairs:
- `000643b0` prefix = reference token (locked at script address)
- `000de140` prefix = user token (tradeable NFT in wallet)

In production, constrain by authorized signers and batch IDs.

### Trace Script (always-true PlutusV2)

A minimal CBOR script (`4e4d01000033222220051200120011`) that:
- Holds CIP-68 ref tokens throughout the supply chain
- Accepts any spend (no on-chain signer check — see limitations below)
- Carries inline `TraceDatum` at each stage

### Datum (`lib/toro/types.ak`)

Union type with 10 constructors, one per stage:

| Index | Constructor | Station | Fields |
|-------|-------------|---------|--------|
| 0 | `Hatchery` | A | `batch_id`, `egg_weight_kg`, `hatchery_location`, `spawn_date`, `supplier_profile_hash` |
| 1 | `Nursery` | A | `prev_tx`, `fry_weight_kg`, `survival_rate_pct`, `pond_id`, `feed_type_hash` |
| 2 | `Growout` | A | `prev_tx`, `fish_weight_kg`, `density_per_m3`, `harvest_date`, `antibiotic_free_cert_hash` |
| 3 | `HarvestTransport` | A | `prev_tx`, `shipped_weight_kg`, `ice_temp_c`, `truck_id`, `arrival_time` |
| 4 | `FarmProcessing` | A | `prev_tx`, `input_weight_kg`, `output_cans`, `wastage_kg`, `supervisor_id` |
| 5 | `CatchIce` | B | `batch_id`, `catch_weight_kg`, `catch_location_latlon_hash`, `fishing_method`, `vessel_id`, `catch_date` |
| 6 | `PortLanding` | B | `prev_tx`, `landed_weight_kg`, `port_name`, `cold_storage_temp`, `quality_cert_hash` |
| 7 | `TransportPlant` | B | `prev_tx`, `shipped_weight_kg`, `container_id`, `transit_time_hours`, `storage_condition_hash` |
| 8 | `CatchProcessing` | B | `prev_tx`, `input_weight_kg`, `output_cans`, `wastage_kg`, `supervisor_id` |
| 9 | `FinalProduct` | Final | `prev_tx_a`, `prev_tx_b`, `total_cans`, `farm_cans`, `catch_cans`, `batch_label`, `packaging_date`, `distribution_center` |

## Known Limitations (Aiken v1.1.21)

1. **`self.extra_signatories` runtime crash** — Any validator that reads `self.extra_signatories` crashes with `"validator crashed / exited prematurely"`. This blocks on-chain signer verification.
2. **`Address` / `Credential` comparison runtime crash** — Cannot compare addresses or credentials with `==`.
3. **Single-constructor enum `when` crash** — Pattern matching on enums with one variant crashes the compiler.

**Workaround**: The investor demo uses:
- Aiken **only** for the minting policy (no `extra_signatories` usage)
- A hardcoded **always-true PlutusV2 script** for spending/datums
- Signer enforcement is **off-chain** in the deploy script

In a production version (with a fixed Aiken compiler), each station would have its own parameterized validator checking `list.has(self.extra_signatories, authorized_signer)`.
