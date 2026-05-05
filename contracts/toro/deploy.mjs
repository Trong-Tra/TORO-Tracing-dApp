#!/usr/bin/env node
import { Lucid, fromText } from 'lucid-cardano';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hidden input for private key (masks with *)
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let input = '';
    stdin.on('data', (ch) => {
      ch = ch + '';
      switch (ch) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(input);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          input += ch;
          stdout.write('*');
          break;
      }
    });
  });
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function getValidatorCbor(blueprint, title) {
  const v = blueprint.validators.find((v) => v.title === title);
  return v ? v.compiledCode : null;
}

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║     TORO Contract Deployer           ║');
  console.log('║  CIP-68 Tuna Supply Chain            ║');
  console.log('╚══════════════════════════════════════╝\n');

  const network = (await ask('Network (Preview/Preprod) [Preview]: ')) || 'Preview';
  const blockfrostKey = await ask('Blockfrost API Key: ');
  if (!blockfrostKey) {
    console.error('Blockfrost API key required.');
    process.exit(1);
  }

  const keyInput = await askHidden('Path to .skey file OR paste private key (CBOR hex): ');
  if (!keyInput) {
    console.error('Private key required.');
    process.exit(1);
  }

  let privateKey;
  if (fs.existsSync(keyInput)) {
    const skey = JSON.parse(fs.readFileSync(keyInput, 'utf8'));
    privateKey = skey.cborHex;
    console.log(`Loaded key from ${keyInput}`);
  } else {
    privateKey = keyInput.trim();
    console.log('Using pasted private key.');
  }

  console.log('\nInitializing Lucid...');
  const lucid = await Lucid.new(
    new Lucid.Blockfrost(
      `https://cardano-${network.toLowerCase()}.blockfrost.io/api/v0`,
      blockfrostKey
    ),
    network
  );

  lucid.selectWalletFromPrivateKey(privateKey);

  const walletAddr = await lucid.wallet.address();
  const walletPkh = lucid.utils.getAddressDetails(walletAddr).paymentCredential?.hash;

  console.log(`\n✓ Connected: ${walletAddr}`);
  console.log(`✓ PKH: ${walletPkh}\n`);

  // Load blueprint
  const blueprintPath = path.join(__dirname, 'plutus.json');
  const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

  // Apply parameters — all roles use the same wallet PKH
  const pkhBytes = Buffer.from(walletPkh, 'hex');

  const factoryCbor = getValidatorCbor(blueprint, 'toro_batch_record_factory.toro_batch_record_factory.mint');
  const factoryScript = lucid.utils.applyParamsToScript(factoryCbor, [pkhBytes]);
  const factoryPolicyId = lucid.utils.validatorToScriptHash({ type: 'PlutusV3', script: factoryScript });

  const stationCbor = getValidatorCbor(blueprint, 'toro_station_signer.toro_station_signer.spend');
  const stationAScript = lucid.utils.applyParamsToScript(stationCbor, [pkhBytes, pkhBytes]);
  const stationAAddress = lucid.utils.validatorToAddress({ type: 'PlutusV3', script: stationAScript });

  const stationBScript = lucid.utils.applyParamsToScript(stationCbor, [pkhBytes, pkhBytes]);
  const stationBAddress = lucid.utils.validatorToAddress({ type: 'PlutusV3', script: stationBScript });

  const mergerCbor = getValidatorCbor(blueprint, 'toro_public_record_deployer.toro_public_record_deployer.spend');
  const mergerScript = lucid.utils.applyParamsToScript(mergerCbor, [pkhBytes, pkhBytes]);
  const mergerAddress = lucid.utils.validatorToAddress({ type: 'PlutusV3', script: mergerScript });

  console.log('┌─ Computed Script Addresses ─────────────────┐');
  console.log(`│ Factory Policy ID: ${factoryPolicyId} │`);
  console.log(`│ Station A: ${stationAAddress} │`);
  console.log(`│ Station B: ${stationBAddress} │`);
  console.log(`│ Merger:    ${mergerAddress} │`);
  console.log('└─────────────────────────────────────────────┘\n');

  const shouldDeploy = (await ask('Deploy reference scripts on-chain? (y/N): ')).toLowerCase() === 'y';
  if (!shouldDeploy) {
    console.log('Skipping on-chain deployment. Save these addresses for later use.');
    process.exit(0);
  }

  console.log('Building reference script transaction...');
  const tx = await lucid
    .newTx()
    .payToAddress(walletAddr, { lovelace: 2000000n }, { scriptRef: { type: 'PlutusV3', script: factoryScript } })
    .payToAddress(walletAddr, { lovelace: 2000000n }, { scriptRef: { type: 'PlutusV3', script: stationAScript } })
    .payToAddress(walletAddr, { lovelace: 2000000n }, { scriptRef: { type: 'PlutusV3', script: stationBScript } })
    .payToAddress(walletAddr, { lovelace: 2000000n }, { scriptRef: { type: 'PlutusV3', script: mergerScript } })
    .complete();

  console.log('Signing transaction...');
  const signedTx = await tx.sign().complete();

  console.log('Submitting to chain...');
  const txHash = await signedTx.submit();

  console.log('\n✅ Reference scripts deployed!');
  console.log(`Transaction: ${txHash}`);
  console.log(`Explorer: https://${network.toLowerCase()}.cexplorer.io/tx/${txHash}`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
