/**
 * deploy.js — Deploy StellarRemit smart contracts to Stellar Testnet.
 *
 * Deploys both `stellar_remit` (Remittance Protocol) and `remit_token` (SRT token),
 * initializes them, seeds a test corridor (XLMINR at 83.0), and updates .env.local.
 * Uses @stellar/stellar-sdk v13 + Soroban RPC with automatic 503 retry backoff.
 *
 * StellarRemit — Decentralized Cross-Border Micro-Payments & P2P FX Settlement
 * Freighter Wallet: GCMVNWEORWXFEXITRRMFVAZBW65GRZKJA5PQM4OG3X3YSJMZ2PG3MEQD
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const sdk = require("@stellar/stellar-sdk");
const {
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  Operation,
  StrKey,
  Horizon,
  Address,
  Contract,
  nativeToScVal,
} = sdk;

const { Server: RpcServer, Api, assembleTransaction } = sdk.rpc;

const RPC_URL             = "https://soroban-testnet.stellar.org";
const HORIZON_URL         = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE  = Networks.TESTNET;

// Freighter wallet / admin for StellarRemit
const DEFAULT_DEPLOYER_ADDRESS = "GCMVNWEORWXFEXITRRMFVAZBW65GRZKJA5PQM4OG3X3YSJMZ2PG3MEQD";

// WASM build artifact paths
const remitTokenWasmPath = path.join(
  __dirname, "..", "target", "wasm32-unknown-unknown", "release", "remit_token.wasm"
);
const stellarRemitWasmPath = path.join(
  __dirname, "..", "target", "wasm32-unknown-unknown", "release", "stellar_remit.wasm"
);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Helper to wrap Soroban RPC calls with 503 backoff retries */
async function withRetry(fn, retries = 6, delayMs = 3000) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const is503 = err?.message?.includes("503") || err?.status === 503 || err?.code === 503;
      if (is503 && attempt < retries) {
        console.log(`\n⚠️ Soroban RPC rate limit (503), retrying in ${delayMs / 1000}s (attempt ${attempt}/${retries})...`);
        await sleep(delayMs);
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

/** Poll Soroban RPC (with Horizon fallback) until TX is confirmed */
async function waitForTx(rpc, hash, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2500);
    try {
      const status = await withRetry(() => rpc.getTransaction(hash));
      if (status.status === "SUCCESS") {
        return status;
      }
      if (status.status === "FAILED") {
        throw new Error(`Transaction failed on-chain: ${hash}`);
      }
    } catch (err) {
      try {
        const res = await fetch(`${HORIZON_URL}/transactions/${hash}`);
        if (res.ok) {
          const data = await res.json();
          if (data.successful) {
            return { status: "SUCCESS" };
          }
        }
      } catch {
        // ignore horizon fallback error and continue retry loop
      }
      if (i === maxAttempts - 1) throw err;
    }
  }
  throw new Error(`Transaction not confirmed after ${maxAttempts} attempts: ${hash}`);
}

/** Upload WASM and return the code hash */
async function uploadWasm(rpc, horizon, keypair, wasmPath) {
  console.log(`  → Reading WASM: ${path.basename(wasmPath)}`);
  const wasmBuffer = fs.readFileSync(wasmPath);

  const account = await horizon.loadAccount(keypair.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 10).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.uploadContractWasm({ wasm: wasmBuffer }))
    .setTimeout(300)
    .build();

  const sim = await withRetry(() => rpc.simulateTransaction(tx));
  if (Api.isSimulationError(sim)) {
    throw new Error(`Upload simulation failed: ${sim.error}`);
  }

  const assembled = assembleTransaction(tx, sim);
  const signedTx = assembled.build();
  signedTx.sign(keypair);

  const submitResult = await withRetry(() => rpc.sendTransaction(signedTx));
  if (submitResult.status === "ERROR") {
    throw new Error(`Upload submit error: ${JSON.stringify(submitResult)}`);
  }

  console.log(`  → Upload TX: ${submitResult.hash}`);
  await waitForTx(rpc, submitResult.hash);

  const wasmHash = crypto.createHash("sha256").update(wasmBuffer).digest("hex");
  console.log(`  → WASM hash: ${wasmHash}`);
  return { hash: wasmHash, txHash: submitResult.hash };
}

/** Create a contract instance from a WASM hash and return its contract ID */
async function createContract(rpc, horizon, keypair, wasmHash) {
  const saltBytes = crypto.randomBytes(32);
  const account = await horizon.loadAccount(keypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 10).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.createCustomContract({
        address: new Address(keypair.publicKey()),
        wasmHash: Buffer.from(wasmHash, "hex"),
        salt: saltBytes,
      })
    )
    .setTimeout(300)
    .build();

  const sim = await withRetry(() => rpc.simulateTransaction(tx));
  if (Api.isSimulationError(sim)) {
    throw new Error(`Create simulation failed: ${sim.error}`);
  }

  const assembled = assembleTransaction(tx, sim);
  const signedTx = assembled.build();
  signedTx.sign(keypair);

  const submitResult = await withRetry(() => rpc.sendTransaction(signedTx));
  if (submitResult.status === "ERROR") {
    throw new Error(`Create submit error: ${JSON.stringify(submitResult)}`);
  }

  console.log(`  → Create TX: ${submitResult.hash}`);
  await waitForTx(rpc, submitResult.hash);

  // Derive the contract ID from the address + salt
  const contractIdPreimage = xdr.HashIdPreimage.envelopeTypeContractId(
    new xdr.HashIdPreimageContractId({
      networkId: crypto.createHash("sha256").update(NETWORK_PASSPHRASE).digest(),
      contractIdPreimage: xdr.ContractIdPreimage.contractIdPreimageFromAddress(
        new xdr.ContractIdPreimageFromAddress({
          address: new Address(keypair.publicKey()).toScAddress(),
          salt: saltBytes,
        })
      ),
    })
  );

  const contractId = StrKey.encodeContract(
    crypto.createHash("sha256").update(contractIdPreimage.toXDR()).digest()
  );

  return { contractId, txHash: submitResult.hash };
}

/** Invoke a contract function */
async function invokeContract(rpc, horizon, keypair, contractId, method, args = []) {
  const contract = new Contract(contractId);
  const account = await horizon.loadAccount(keypair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: (parseInt(BASE_FEE) * 20).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  const sim = await withRetry(() => rpc.simulateTransaction(tx));
  if (Api.isSimulationError(sim)) {
    throw new Error(`${method} simulation failed: ${sim.error}`);
  }

  const assembled = assembleTransaction(tx, sim);
  const signedTx = assembled.build();
  signedTx.sign(keypair);

  const submitResult = await withRetry(() => rpc.sendTransaction(signedTx));
  if (submitResult.status === "ERROR") {
    throw new Error(`${method} submit error: ${JSON.stringify(submitResult)}`);
  }

  console.log(`  → ${method} TX: ${submitResult.hash}`);
  await waitForTx(rpc, submitResult.hash);
  return submitResult.hash;
}

/** Update .env.local with deployed contract IDs */
function updateEnvLocal(remitContractId, srtTokenContractId) {
  const envPath = path.join(__dirname, "..", ".env.local");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  const updates = {
    NEXT_PUBLIC_STELLAR_REMIT_CONTRACT_ID: remitContractId,
    NEXT_PUBLIC_SRT_TOKEN_CONTRACT_ID: srtTokenContractId,
  };

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("  → .env.local updated with new contract IDs");
}

/** Update README.md with deployed contract IDs and explorer links */
function updateReadme(remitContractId, srtTokenContractId) {
  const readmePath = path.join(__dirname, "..", "README.md");
  if (!fs.existsSync(readmePath)) return;

  let content = fs.readFileSync(readmePath, "utf8");
  const base = "https://stellar.expert/explorer/testnet/contract";

  content = content
    .replace(/NEXT_PUBLIC_STELLAR_REMIT_CONTRACT_ID=\S+/g, `NEXT_PUBLIC_STELLAR_REMIT_CONTRACT_ID=${remitContractId}`)
    .replace(/NEXT_PUBLIC_SRT_TOKEN_CONTRACT_ID=\S+/g, `NEXT_PUBLIC_SRT_TOKEN_CONTRACT_ID=${srtTokenContractId}`)
    .replace(/\[STELLAR_REMIT_CONTRACT\]/g, `[${remitContractId.slice(0, 10)}...](${base}/${remitContractId})`)
    .replace(/\[SRT_TOKEN_CONTRACT\]/g, `[${srtTokenContractId.slice(0, 10)}...](${base}/${srtTokenContractId})`);

  fs.writeFileSync(readmePath, content);
  console.log("  → README.md updated with explorer links");
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  💸 StellarRemit — Contract Deployment                       ║");
  console.log("║  Decentralized Cross-Border Micro-Payments & P2P FX           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Validate WASM files exist
  if (!fs.existsSync(remitTokenWasmPath)) {
    console.error(`❌ remit_token.wasm not found at: ${remitTokenWasmPath}`);
    console.error("   Build it first with: cargo build --target wasm32-unknown-unknown --release --package remit_token");
    process.exit(1);
  }
  if (!fs.existsSync(stellarRemitWasmPath)) {
    console.error(`❌ stellar_remit.wasm not found at: ${stellarRemitWasmPath}`);
    console.error("   Build it first with: cargo build --target wasm32-unknown-unknown --release --package stellar_remit");
    process.exit(1);
  }

  // Get deployer secret key (or auto-generate & fund via Friendbot if missing)
  let keypair;
  let secretKey = process.env.STELLAR_SECRET_KEY;
  if (secretKey && StrKey.isValidEd25519SecretSeed(secretKey)) {
    keypair = Keypair.fromSecret(secretKey);
    console.log(`🔑 Deployer (from env): ${keypair.publicKey()}`);
  } else {
    console.log("⚠️ STELLAR_SECRET_KEY not set. Auto-generating testnet deployer account...");
    keypair = Keypair.random();
    console.log(`🔑 Auto-generated Deployer Public Key: ${keypair.publicKey()}`);
    console.log(`🔑 Auto-generated Deployer Secret Key: ${keypair.secret()}`);
    console.log("💸 Funding deployer account via Stellar Friendbot...");
    const friendbotRes = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`);
    if (!friendbotRes.ok) {
      throw new Error(`Friendbot funding failed: ${await friendbotRes.text()}`);
    }
    console.log("  ✅ Deployer account funded with 10,000 Testnet XLM!");
    await sleep(3000);
  }
  const deployerAddress = keypair.publicKey();

  const rpc = new RpcServer(RPC_URL);
  const horizon = new Horizon.Server(HORIZON_URL);

  // ── STEP 1: Deploy remit_token (SRT) ─────────────────────────────────────
  console.log("\n📦 STEP 1: Deploy remit_token (SRT Token)");

  const { hash: remitTokenWasmHash } = await uploadWasm(rpc, horizon, keypair, remitTokenWasmPath);
  await sleep(3000);
  const { contractId: srtTokenContractId } = await createContract(rpc, horizon, keypair, remitTokenWasmHash);
  console.log(`  ✅ SRT Token deployed: ${srtTokenContractId}`);

  // ── STEP 2: Initialize remit_token ───────────────────────────────────────
  console.log("\n🔧 STEP 2: Initialize SRT Token");
  await sleep(3000);
  await invokeContract(rpc, horizon, keypair, srtTokenContractId, "initialize", [
    new Address(deployerAddress).toScVal(),
    nativeToScVal("StellarRemit Token", { type: "string" }),
    nativeToScVal("SRT", { type: "string" }),
  ]);
  console.log("  ✅ SRT Token initialized");

  // ── STEP 3: Deploy stellar_remit ─────────────────────────────────────────
  console.log("\n📦 STEP 3: Deploy stellar_remit (Remittance Contract)");
  await sleep(3000);

  const { hash: stellarRemitWasmHash } = await uploadWasm(rpc, horizon, keypair, stellarRemitWasmPath);
  await sleep(3000);
  const { contractId: remitContractId } = await createContract(rpc, horizon, keypair, stellarRemitWasmHash);
  console.log(`  ✅ StellarRemit deployed: ${remitContractId}`);

  // ── STEP 4: Initialize stellar_remit ─────────────────────────────────────
  console.log("\n🔧 STEP 4: Initialize StellarRemit Contract");
  await sleep(3000);
  await invokeContract(rpc, horizon, keypair, remitContractId, "initialize", [
    new Address(deployerAddress).toScVal(),
  ]);
  console.log("  ✅ StellarRemit initialized");

  // ── STEP 5: Link SRT token ────────────────────────────────────────────────
  console.log("\n🔗 STEP 5: Link SRT Token to StellarRemit");
  await sleep(3000);
  await invokeContract(rpc, horizon, keypair, remitContractId, "set_remit_token", [
    new Address(deployerAddress).toScVal(),
    new Address(srtTokenContractId).toScVal(),
  ]);
  console.log("  ✅ SRT Token linked");

  // ── STEP 6: Seed FX corridors ─────────────────────────────────────────────
  console.log("\n🌐 STEP 6: Seed FX Corridors");
  const corridors = [
    { id: "XLMINR", rate: 83_000_000n,  label: "XLM→INR  @ 83.0" },
    { id: "XLMPHP", rate: 56_500_000n,  label: "XLM→PHP  @ 56.5" },
    { id: "XLMUSD", rate:    100_000n,  label: "XLM→USD  @ 0.10" },
    { id: "XLMBDT", rate: 11_000_000n,  label: "XLM→BDT  @ 11.0" },
    { id: "XLMNGN", rate: 160_000_000n, label: "XLM→NGN  @ 160.0" },
    { id: "XLMMXN", rate:  1_700_000n,  label: "XLM→MXN  @ 1.70" },
  ];

  for (const { id, rate, label } of corridors) {
    await sleep(2000);
    await invokeContract(rpc, horizon, keypair, remitContractId, "set_fx_rate", [
      new Address(deployerAddress).toScVal(),
      nativeToScVal(id, { type: "symbol" }),
      nativeToScVal(rate, { type: "i128" }),
    ]);
    console.log(`  ✅ Set corridor ${label}`);
  }

  // ── STEP 7: Update config files ───────────────────────────────────────────
  console.log("\n📝 STEP 7: Updating configuration files");
  updateEnvLocal(remitContractId, srtTokenContractId);
  updateReadme(remitContractId, srtTokenContractId);

  // ── SUCCESS SUMMARY ───────────────────────────────────────────────────────
  const explorerBase = "https://stellar.expert/explorer/testnet/contract";
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ STELLARREMIT DEPLOYMENT COMPLETE                          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\n  🏦 StellarRemit Contract: ${remitContractId}`);
  console.log(`     Explorer: ${explorerBase}/${remitContractId}`);
  console.log(`\n  🪙 SRT Token Contract:    ${srtTokenContractId}`);
  console.log(`     Explorer: ${explorerBase}/${srtTokenContractId}`);
  console.log(`\n  🌐 Active Corridors: ${corridors.length} seeded (XLMINR, XLMPHP, XLMUSD, XLMBDT, XLMNGN, XLMMXN)`);
  console.log(`\n  📋 .env.local updated ✅`);
  console.log(`  📖 README.md updated ✅`);
  console.log("\n  Next steps:");
  console.log("  1. npm run dev — start frontend");
  console.log("  2. Connect Freighter wallet at the UI");
  console.log("  3. Test a remittance on /send page\n");
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err.message || err);
  process.exit(1);
});
