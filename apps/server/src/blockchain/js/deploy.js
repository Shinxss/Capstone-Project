/* eslint-disable no-console */

// Deploy LifelineTaskLedger using solc + ethers (no Remix).
// Supports CHAIN_ENV=ganache | sepolia.

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { ethers } = require("ethers");

function must(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing ${key} in .env`);
  return v;
}

function compileContract() {
  const contractPath = path.join(__dirname, "..", "contracts", "LifelineTaskLedger.sol");
  const source = fs.readFileSync(contractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "LifelineTaskLedger.sol": { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      // Ganache 2.x can fail on newer opcodes (e.g. PUSH0); compile for Paris compatibility.
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors?.length) {
    const fatal = output.errors.filter((e) => e.severity === "error");
    for (const e of output.errors) console.error(e.formattedMessage);
    if (fatal.length) throw new Error("Solidity compilation failed");
  }

  const c = output.contracts["LifelineTaskLedger.sol"].LifelineTaskLedger;
  return { abi: c.abi, bytecode: c.evm.bytecode.object };
}

async function main() {
  const chainEnv = String(process.env.CHAIN_ENV || "ganache").toLowerCase();

  const rpcUrl = must(chainEnv === "ganache" ? "GANACHE_RPC_URL" : "SEPOLIA_RPC_URL");
  const privateKey = must(chainEnv === "ganache" ? "GANACHE_PRIVATE_KEY" : "SEPOLIA_PRIVATE_KEY");

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const net = await provider.getNetwork();

  console.log("Deployer:", wallet.address);
  console.log("Network:", chainEnv, "chainId=", net.chainId.toString());

  const { abi, bytecode } = compileContract();
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  console.log("Deploying LifelineTaskLedger...");
  const contract = await factory.deploy();
  const deployed = await contract.waitForDeployment();
  const addr = await deployed.getAddress();

  const tx = contract.deploymentTransaction();
  const receipt = tx ? await provider.getTransactionReceipt(tx.hash) : null;

  console.log("\n✅ Deployed!");
  console.log("Contract Address:", addr);
  console.log("Tx Hash:", tx?.hash || "—");
  console.log("Block:", receipt?.blockNumber ?? "—");

  console.log("\nAdd these to your server .env:");
  console.log(`TASK_LEDGER_CONTRACT_ADDRESS=${addr}`);
  console.log(`TASK_LEDGER_NETWORK=${chainEnv}`);
}

main().catch((e) => {
  console.error("\n❌ Deploy failed:", e);
  process.exit(1);
});
