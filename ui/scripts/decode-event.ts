/**
 * TORO event decoder — local demo tool.
 *
 * Decodes a `Program data:` log line from any TORO program transaction
 * into human-readable form.
 *
 * Usage:
 *   npx tsx scripts/decode-event.ts '<base64-payload>'
 *   npx tsx scripts/decode-event.ts 'Program data: <base64-payload>'
 *
 * Get the payload from Solscan: open a tx → Instruction Details → Program Logs,
 * copy the string after "Program data: ".
 */

import * as anchor from "@anchor-lang/core";
import { decodeAbiParameters, parseAbiParameters } from "viem";
import * as fs from "fs";
import * as path from "path";

// ───────── Code registry (mirrors contracts/evm/data/CODE_REGISTRY.md) ─────────

const LOOKUPS: Record<number, Record<number, string>> = {
  0x100: { 1: "Vessel", 2: "Farm" },
  0x101: { 1: "Yellowfin", 2: "Skipjack", 3: "Bigeye" },
  0x104: { 1: "Longline", 2: "Purse Seine", 3: "Handline", 4: "Pole & Line", 5: "Aquaculture" },
  0x105: { 1: "Pacific Ocean", 2: "Indian Ocean", 3: "South China Sea" },
  0x111: { 1: "Port Cold Storage", 2: "Farm Holding Tank" },
};

const LABELS: Record<number, string> = {
  0x100: "Source Type", 0x101: "Fish Species", 0x102: "Region", 0x103: "Catch Date",
  0x104: "Fishing Method", 0x105: "Catch Area", 0x106: "Catch Weight (kg)",
  0x110: "Inventory Received", 0x111: "Inventory Location",
  0x200: "Factory Name", 0x204: "Production Date", 0x205: "Packaging Date",
  0x208: "Input Weight (kg)", 0x209: "Output Cans", 0x20a: "Wastage (kg)",
  0x300: "Warehouse Name", 0x304: "Storage Start", 0x305: "Storage End", 0x306: "Storage Temp (°C)",
  0x400: "Shipment Code", 0x404: "Departure Date", 0x405: "Arrival Date",
  0x501: "Product Label", 0x504: "Packaging Date", 0x600: "HACCP Certified",
};

const STRING_CODES = [0x102, 0x200, 0x300, 0x400, 0x501];
const DATE_CODES = [0x103, 0x110, 0x204, 0x205, 0x304, 0x305, 0x404, 0x405, 0x504];

const STAGES: Record<number, string> = {
  1: "Source", 2: "Inventory", 3: "Manufacturing", 4: "Warehouse", 5: "Distribution",
};

// ───────── Decoding ─────────

function decodeValue(code: number, hex: string): string {
  const lookup = LOOKUPS[code];
  if (lookup) return lookup[Number(BigInt(hex))] ?? String(Number(BigInt(hex)));
  if (code === 0x600) return "✓ Certified";
  if (STRING_CODES.includes(code)) {
    const s = Buffer.from(hex.slice(2), "hex").toString("utf-8").replace(/\0/g, "");
    if (s) return s;
  }
  if (DATE_CODES.includes(code)) {
    return new Date(Number(BigInt(hex)) * 1000).toLocaleDateString("vi-VN");
  }
  if (code === 0x306) {
    const n = BigInt(hex);
    const MAX = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    return String(Number(n > MAX ? n - (MAX * 2n + 2n) : n));
  }
  return Number(BigInt(hex)).toLocaleString("en-US");
}

function decodeDataBlob(bytes: Uint8Array): [string, string][] {
  const hex = ("0x" + Buffer.from(bytes).toString("hex")) as `0x${string}`;
  const [codes, values] = decodeAbiParameters(
    parseAbiParameters("uint256[] codes, bytes32[] values"),
    hex
  );
  return (codes as bigint[]).map((c, i) => {
    const code = Number(c);
    const label = LABELS[code] ?? `Code_0x${code.toString(16)}`;
    return [label, decodeValue(code, (values as string[])[i])];
  });
}

// ───────── Main ─────────

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: npx tsx scripts/decode-event.ts '<base64-payload>'");
    process.exit(1);
  }
  const b64 = input.replace(/^Program data:\s*/, "").trim();

  const idl = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../contracts/solana/target/idl/toro.json"), "utf-8")
  );
  const coder = new anchor.BorshEventCoder(idl);

  let event: any;
  try {
    event = coder.decode(b64);
  } catch {
    console.error("Could not decode: not a valid TORO event payload.");
    process.exit(1);
  }
  if (!event) {
    console.error("Payload decoded to nothing — check the input.");
    process.exit(1);
  }

  const d = event.data;
  const utf8 = (b: number[] | Uint8Array) => Buffer.from(b).toString("utf-8").replace(/\0/g, "");
  const ts = Number(d.timestamp);

  console.log("────────────────────────────────────────────");
  console.log(`Event:     ${event.name}`);

  if (event.name === "BatchMinted") {
    console.log(`Batch:     ${utf8(d.batch_id)}`);
  } else if (event.name === "TraceRecorded") {
    console.log(`Entity:    ${utf8(d.id)}`);
    console.log(`Stage:     ${d.stage} (${STAGES[Number(d.stage)] ?? "?"})`);
  } else if (event.name === "LotCreated") {
    console.log(`Lot:       ${utf8(d.lot_code)}`);
    console.log(`Inputs:    ${(d.input_batch_ids as number[][]).map(utf8).join(", ")}`);
    console.log(`Cans:      ${Number(d.total_cans).toLocaleString("en-US")}`);
  }

  console.log(`Timestamp: ${ts} (${new Date(ts * 1000).toISOString()})`);
  console.log(`Recorder:  ${new anchor.web3.PublicKey(d.recorder).toBase58()}`);

  if (d.data && d.data.length > 0) {
    console.log("────────────────────────────────────────────");
    console.log("Trace data:");
    for (const [label, value] of decodeDataBlob(d.data)) {
      console.log(`  ${label.padEnd(22)} ${value}`);
    }
  }
  console.log("────────────────────────────────────────────");
}

main();
