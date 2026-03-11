#!/usr/bin/env node
const { runEvidence } = require("../utils/runner");

const args = process.argv.slice(2);
const verbose = args.includes("--verbose") || args.includes("-v");
const caseId = args.find((arg) => !arg.startsWith("-"));
if (!caseId) {
  console.error("Usage: node \"tools/Added Features Testing/scripts/run-case.js\" <case-id> [--verbose]");
  process.exit(2);
}

try {
  const result = runEvidence({ session: "all", caseIds: [caseId], verbose });
  process.exit(result.exitCode);
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(2);
}
