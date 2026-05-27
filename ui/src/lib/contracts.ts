import { createPublicClient, http, defineChain } from "viem";

// Arbitrum Sepolia
export const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arbitrum-sepolia-rpc.publicnode.com"] },
    public: { http: ["https://arbitrum-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" },
  },
});

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

// Deployed contract addresses
export const CONTRACTS = {
  sbt: "0xc76cfa277463a50d3d3af933f40da9da43940aba",
  registry: "0x1cd0c9d8023c8f58c634ee38874fd083c8e7f0bb",
  factory: "0x6b26b48a013eb5fa161aebdcb1ee6031935ef505",
  recordMinter: "0x9a284cc21afd3319012c4e0e338d68dc79e13d7e",
  stationSource: "0x0724aef72348691f2f8924c0ebc5f83200902f1a",
  stationManuf: "0xec9e0cfcf53dae6c2b99974e77339ee638aff302",
  stationWarehouse: "0x15fbfaa6cc28e09bff0e2c26711327deda5dcf5c",
  stationDist: "0x18bea1f70086ba884747753399fa6f57e8c13b44",
} as const;

// Contract ABIs (imported from JSON)
import sbtAbi from "./abi/ToroSBT.json";
import registryAbi from "./abi/ToroRegistry.json";
import factoryAbi from "./abi/ToroFactory.json";
import recordMinterAbi from "./abi/ToroRecordMinter.json";
import stationAbi from "./abi/ToroStation.json";

export const ABIS = {
  sbt: sbtAbi,
  registry: registryAbi,
  factory: factoryAbi,
  recordMinter: recordMinterAbi,
  station: stationAbi,
} as const;
