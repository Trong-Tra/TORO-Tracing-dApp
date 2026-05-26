# TORO EVM Contracts

Solidity-based supply chain tracer for tuna — from catch to can.

## Architecture

- `ToroTypes.sol` — Shared data structures for all 10 supply chain stages.
- `ToroRegistry.sol` — On-chain registry enforcing sequential stage recording for two converging chains:
  - **Farm Chain (A)**: Hatchery → Nursery → Growout → HarvestTransport → FarmProcessing
  - **Catch Chain (B)**: CatchIce → PortLanding → TransportPlant → CatchProcessing
  - **Final**: Product merge of both chains

## Build

```bash
forge build
```

## Test

```bash
forge test
```

## Deploy (local fork)

```bash
forge script script/DeployToro.s.sol --rpc-url <RPC_URL> --broadcast
```

## Status

Active development. Cardano/Aiken code is preserved in `../cardano/` for reference but is no longer maintained.
