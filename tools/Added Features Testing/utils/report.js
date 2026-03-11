function escapeTableCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");
}

function makeTable(rows) {
  const header = "| Test Case | Steps (Short) | Expected Result | Actual Result | Pass/Fail | Notes |\n|---|---|---|---|---|---|";
  const body = rows
    .map((row) =>
      [
        row.testCase,
        row.stepsShort,
        row.expectedResult,
        row.actualResult,
        row.passFail,
        row.notes,
      ]
        .map(escapeTableCell)
        .join(" | ")
    )
    .map((line) => `| ${line} |`)
    .join("\n");

  return `${header}\n${body}`;
}

function buildCompactResultsMarkdown(rows) {
  return [
    "Module 12 Results",
    "",
    ...rows.flatMap((row) => {
      const status = row.passFail === "PASS" ? "PASS" : "FAIL";
      return [`[${status}] ${row.testCase}`, `Actual Result: ${row.actualResultCompact || row.actualResult}`, ""];
    }),
    "Done.",
    "",
  ].join("\n");
}

function buildSummaryMarkdown({ generatedAt, runId, environment, performanceRows, securityRows, compact = true }) {
  if (compact) {
    return buildCompactResultsMarkdown([...performanceRows, ...securityRows]);
  }

  return [
    `# Module 12 Evidence Summary`,
    ``,
    `- Run ID: \`${runId}\``,
    `- Generated At: \`${generatedAt}\``,
    `- Node: \`${environment.node}\``,
    `- Platform: \`${environment.platform}\``,
    `- Git Commit: \`${environment.gitCommit || "N/A"}\``,
    ``,
    `## Session 1 - Performance Test Pack`,
    ``,
    makeTable(performanceRows),
    ``,
    `## Session 2 - Security Test Pack`,
    ``,
    makeTable(securityRows),
    ``,
  ].join("\n");
}

function buildPresenterMarkdown({ results, compact = true }) {
  if (compact) {
    return buildCompactResultsMarkdown(results);
  }

  const performance = results.filter((row) => row.session === "performance");
  const security = results.filter((row) => row.session === "security");

  const section = (title, rows) => {
    const header = "| Test Case | Actual Result | Pass/Fail | Evidence |\n|---|---|---|---|";
    const lines = rows
      .map(
        (row) =>
          `| ${row.testCase.replace(/\|/g, "\\|")} | ${row.actualResult.replace(/\|/g, "\\|")} | ${row.passFail} | ${row.rawEvidencePath.replace(
            /\\/g,
            "/"
          )} |`
      )
      .join("\n");
    return [`## ${title}`, "", header, lines, ""].join("\n");
  };

  return [`# Module 12 Presenter Report`, "", section("Session 1 - Performance", performance), section("Session 2 - Security", security)].join(
    "\n"
  );
}

module.exports = {
  buildSummaryMarkdown,
  buildPresenterMarkdown,
};
