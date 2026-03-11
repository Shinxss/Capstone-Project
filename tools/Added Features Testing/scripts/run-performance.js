#!/usr/bin/env node
const { runEvidence } = require("../utils/runner");
const verbose = process.argv.includes("--verbose") || process.argv.includes("-v");

try {
  const result = runEvidence({ session: "performance", verbose });
  process.exit(result.exitCode);
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(2);
}
