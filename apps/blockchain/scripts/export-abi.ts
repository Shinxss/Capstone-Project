import fs from "node:fs";
import path from "node:path";

function main() {
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "TaskLedger.sol", "TaskLedger.json");
  const outPath = path.join(__dirname, "..", "src", "abi", "TaskLedger.abi.json");

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Hardhat artifact not found. Did you run \`pnpm -C apps/blockchain compile\`?\nMissing: ${artifactPath}`);
  }

  const artifactRaw = fs.readFileSync(artifactPath, "utf8");
  const artifact = JSON.parse(artifactRaw) as { abi?: unknown };

  if (!Array.isArray(artifact.abi)) {
    throw new Error(`Invalid artifact json: expected "abi" array in ${artifactPath}`);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ abi: artifact.abi }, null, 2) + "\n", "utf8");

  // eslint-disable-next-line no-console
  console.log(`Exported ABI -> ${outPath}`);
}

main();

