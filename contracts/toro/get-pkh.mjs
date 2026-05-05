#!/usr/bin/env node
import { Lucid } from 'lucid-cardano';

const addr = process.argv[2];
if (!addr) {
  console.error('Usage: node get-pkh.mjs <cardano_address>');
  process.exit(1);
}

try {
  const lucid = await Lucid.new(undefined, 'Preview');
  const details = lucid.utils.getAddressDetails(addr);
  console.log(details.paymentCredential?.hash || 'No payment credential found');
} catch (e) {
  console.error('Invalid address:', e.message);
  process.exit(1);
}
