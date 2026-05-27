# TORO Data Layer

This directory contains the code registry and mock data for the TORO EVM supply chain system.

## Files

| File | Purpose |
|------|---------|
| `CODE_REGISTRY.md` | Complete mapping of on-chain compact codes → human-readable fields |
| `MOCK_DATA.json` | Full mock trace for 2 batches (wild catch + farm) merged into 1 final product |

---

## Code Ranges

| Range | Category |
|-------|----------|
| `0x1xx` | Source / Vessel / Farm |
| `0x2xx` | Manufacturing / Factory |
| `0x3xx` | Warehouse / Cold Storage |
| `0x4xx` | Distribution / Shipping |
| `0x5xx` | Final Product |
| `0x6xx` | Certifications (boolean flags) |
| `0x7xx` | System / Metadata |

---

## On-Chain Data Format

Each trace point stores:
```solidity
abi.encode(
    uint256[] codes,    // e.g., [0x101, 0x102, 0x103]
    bytes32[] values    // e.g., [bytes32(uint256(1)), bytes32(uint256(704)), ...]
)
```

---

## Customer QR Flow

```
Scan QR → lotCode "TORO-LOT-001"
    ↓
recordMinter.getFinalRecord("TORO-LOT-001")
    → { tokenIds: [1, 2], totalCans: 5440, ... }
    ↓
For each tokenId (1 and 2):
    registry.getTokenHistory(tokenId)
        → [5 trace hashes per batch]
    ↓
For each trace hash:
    registry.getTrace(hash)
        → { stage, codes, values, timestamp, recorder }
    ↓
UI decodes codes using CODE_REGISTRY.md
    → "Fish Species: Yellowfin Tuna"
    → "Factory: TORO Seafood Factory"
    → ...
    ↓
Backend API serves PDFs keyed by txHash
    → Customer views certificates
```

---

## Certifications

On-chain: only boolean flags (`0x600` = HACCP, `0x601` = FDA, etc.)

Actual PDFs: served by internal backend API, fetched by frontend using the trace txHash as the lookup key.
