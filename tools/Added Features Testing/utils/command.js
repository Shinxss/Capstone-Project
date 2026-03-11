const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

function getPnpmCommand() {
  return "pnpm";
}

function runCommand(command, args, options = {}) {
  const isWindows = process.platform === "win32";
  const quoteArg = (value) => {
    const text = String(value);
    if (!/[ \t\"]/.test(text)) return text;
    return `"${text.replace(/"/g, '\\"')}"`;
  };

  const result = isWindows
    ? spawnSync([command, ...args.map(quoteArg)].join(" "), {
        cwd: options.cwd,
        env: options.env,
        encoding: "utf8",
        timeout: options.timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        shell: true,
      })
    : spawnSync(command, args, {
        cwd: options.cwd,
        env: options.env,
        encoding: "utf8",
        timeout: options.timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
      });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const errorText = result.error ? `${result.error.message}` : "";
  const combinedOutput = `${stdout}${stderr ? `\n${stderr}` : ""}${errorText ? `\n${errorText}` : ""}`.trim();

  if (options.logPath) {
    fs.writeFileSync(options.logPath, combinedOutput, "utf8");
  }

  return {
    command,
    args,
    status: result.status,
    signal: result.signal,
    stdout,
    stderr,
    output: combinedOutput,
    error: result.error || null,
  };
}

module.exports = {
  getPnpmCommand,
  runCommand,
};
