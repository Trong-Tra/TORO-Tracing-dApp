# TORO On-Chain Code Registry

> Mapping of compact codes → human-readable fields for the TORO traceability system.
> Each code is a `uint256` stored on-chain. The UI decodes these codes into labels.

---

## Source / Vessel / Farm — `0x1xx`

| Code | Field | Value Type | Example |
|------|-------|------------|---------|
| `0x100` | Source Type | `uint8` enum | `1` = Vessel, `2` = Farm |
| `0x101` | Fish Species | `uint8` enum | `1` = Yellowfin, `2` = Skipjack, `3` = Bigeye, `4` = Albacore |
| `0x102` | Country of Origin | `uint16` country code | `704` = Vietnam, `764` = Thailand, `360` = Indonesia |
| `0x103` | Catch Date | `uint48` timestamp | `1715731200` |
| `0x104` | Fishing Method | `uint8` enum | `1` = Longline, `2` = Purse Seine, `3` = Pole & Line, `4` = Gillnet, `5` = Aquaculture |
| `0x105` | Catch Area / FAO Zone | `uint8` enum | `1` = Pacific Ocean, `2` = Indian Ocean, `3` = Atlantic Ocean |
| `0x106` | Catch Weight (kg) | `uint32` | `800` |
| `0x107` | Vessel ID / Farm ID | `bytes32` | `keccak256("FV-Pacific-07")` |
| `0x108` | Supplier Name | `bytes32` | `keccak256("Pacific Tuna Co.")` |

---

## Manufacturing / Factory — `0x2xx`

| Code | Field | Value Type | Example |
|------|-------|------------|---------|
| `0x200` | Factory Name | `bytes32` | `keccak256("TORO Seafood Factory")` |
| `0x201` | Factory Country | `uint16` country code | `704` = Vietnam |
| `0x202` | Factory Latitude | `int32` (scaled × 1e6) | `10800000` = 10.8°N |
| `0x203` | Factory Longitude | `int32` (scaled × 1e6) | `106700000` = 106.7°E |
| `0x204` | Production Date | `uint48` timestamp | `1717200000` |
| `0x205` | Packaging Date | `uint48` timestamp | `1718400000` |
| `0x206` | Batch Code | `bytes32` | `keccak256("B-20260615-A")` |
| `0x207` | Product Lot Code | `bytes32` | `keccak256("TORO-LOT-001")` |
| `0x208` | Input Weight (kg) | `uint32` | `1950` |
| `0x209` | Output Cans | `uint32` | `3900` |
| `0x20A` | Wastage (kg) | `uint32` | `50` |

---

## Warehouse / Cold Storage — `0x3xx`

| Code | Field | Value Type | Example |
|------|-------|------------|---------|
| `0x300` | Warehouse Name | `bytes32` | `keccak256("Singapore Cold Storage")` |
| `0x301` | Warehouse Country | `uint16` country code | `702` = Singapore |
| `0x302` | Warehouse Latitude | `int32` (scaled × 1e6) | `1290000` = 1.29°N |
| `0x303` | Warehouse Longitude | `int32` (scaled × 1e6) | `103850000` = 103.85°E |
| `0x304` | Storage Date | `uint48` timestamp | `1719000000` |
| `0x305` | Storage Temperature (°C) | `int8` | `2` |
| `0x306` | Storage Duration (hours) | `uint16` | `72` |

---

## Distribution / Shipping — `0x4xx`

| Code | Field | Value Type | Example |
|------|-------|------------|---------|
| `0x400` | Shipment Code | `bytes32` | `keccak256("SHP-2026-0892")` |
| `0x401` | Container ID | `bytes32` | `keccak256("CONT-B-99")` |
| `0x402` | Shipping From Country | `uint16` country code | `704` = Vietnam |
| `0x403` | Shipping To Country | `uint16` country code | `392` = Japan |
| `0x404` | Departure Date | `uint48` timestamp | `1719500000` |
| `0x405` | Arrival Date | `uint48` timestamp | `1719700000` |
| `0x406` | Transit Duration (hours) | `uint16` | `48` |
| `0x407` | Checkpoint Location | `uint8` enum | `1` = Singapore, `2` = Hong Kong, `3` = Busan |
| `0x408` | Checkpoint Time | `uint48` timestamp | `1719600000` |
| `0x409` | Transit Temperature (°C) | `int8` | `0` |

---

## Final Product — `0x5xx`

| Code | Field | Value Type | Example |
|------|-------|------------|---------|
| `0x500` | Final Lot Code | `bytes32` | `keccak256("TORO-LOT-001")` |
| `0x501` | Product Label | `bytes32` | `keccak256("TORO Premium Tuna")` |
| `0x502` | Total Cans | `uint32` | `5440` |
| `0x503` | Total Batches Merged | `uint8` | `2` |
| `0x504` | Final Packaging Date | `uint48` timestamp | `1719800000` |
| `0x505` | Distribution Center | `bytes32` | `keccak256("Tokyo Retail Hub")` |

---

## Certifications (Boolean Flags) — `0x6xx`

> Actual PDFs served by backend API. On-chain only stores boolean flags.

| Code | Field | Value Type | Example |
|------|-------|------------|---------|
| `0x600` | HACCP Certified | `uint8` | `1` = true |
| `0x601` | FDA Approved | `uint8` | `1` = true |
| `0x602` | Lab Test Passed | `uint8` | `1` = true |
| `0x603` | MSC Certified | `uint8` | `1` = true |
| `0x604` | ASC Certified | `uint8` | `1` = true |
| `0x605` | Friend of the Sea | `uint8` | `1` = true |
| `0x606` | ISO 22000 | `uint8` | `1` = true |

---

## System / Metadata — `0x7xx`

| Code | Field | Value Type | Example |
|------|-------|------------|---------|
| `0x700` | Stage Index | `uint8` | `0` = Source, `1` = Manuf, `2` = Warehouse, `3` = Dist, `4` = Final |
| `0x701` | Recorder Type | `uint8` | `1` = Factory, `2` = Station, `3` = RecordMinter |
| `0x702` | Token ID | `uint256` | `1` |
| `0x703` | Batch ID | `bytes32` | `keccak256("WILD-001")` |

---

## ABI Encoding Format

On-chain, each trace point stores `bytes data` which is:

```solidity
abi.encode(
    uint256[] codes,    // [0x101, 0x102, 0x103, ...]
    bytes32[] values    // [bytes32(uint256(1)), bytes32(uint256(704)), ...]
)
```

**Values packing rules:**
- Numbers (`uint8`, `uint16`, `uint32`, `uint48`) → cast to `uint256` → `bytes32(uint256(x))`
- Strings / names → `keccak256(string)` → `bytes32`
- Booleans → `1` or `0` → `bytes32(uint256(1))`

**UI decoding:**
```typescript
const [codes, values] = abi.decode(["uint256[]", "bytes32[]"], traceData);
for (let i = 0; i < codes.length; i++) {
    const label = CODE_LABELS[codes[i]];  // "Fish Species"
    const value = decodeValue(codes[i], values[i]);  // "Yellowfin Tuna"
}
```
