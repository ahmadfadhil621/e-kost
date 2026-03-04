import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  feature?: string;
  help: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { help: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--feature" && args[i + 1]) {
      result.feature = args[++i];
    } else if (args[i] === "--help" || args[i] === "-h") {
      result.help = true;
    }
  }
  return result;
}

function printUsage(): void {
  console.log(`
Usage: tsx scripts/validate-tests.ts [options]

Options:
  --feature <name>   Validate tests for a specific feature (e.g. room-inventory-management)
  --help, -h         Show this help message

When --feature is provided, the script also runs spec traceability checks
against specs/<feature>/requirements.md and specs/<feature>/design.md.
`);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Issue {
  file: string;
  line: number;
  check: string;
  message: string;
  severity: "error" | "warning";
}

interface TestBlock {
  name: string;
  startLine: number;
  endLine: number;
  body: string;
  parentDescribe: string | null;
}

interface DescribeBlock {
  name: string;
  startLine: number;
  children: string[];
}

interface ValidationReport {
  filesScanned: number;
  issues: Issue[];
  passed: boolean;
}

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function globSync(dir: string, pattern: RegExp, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) {return results;}

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      globSync(full, pattern, results);
    } else if (pattern.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function discoverTestFiles(rootDir: string, feature?: string): string[] {
  const files: string[] = [];

  // Vitest test files
  globSync(path.join(rootDir, "src"), /\.(test|spec)\.(ts|tsx)$/, files);

  // Playwright spec files — scope to feature if provided
  const e2eDir = feature
    ? path.join(rootDir, "e2e", feature)
    : path.join(rootDir, "e2e");
  globSync(e2eDir, /\.spec\.(ts|tsx)$/, files);

  return files;
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Find matching closing brace for an opening brace at `start`, accounting
 * for nested braces, template literals, strings, and regex.
 */
function findMatchingBrace(text: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const ch = text[i];

    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") {i++;}
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {i++;}
      i += 2;
      continue;
    }

    // Regex literal detection: `/` not followed by `/` or `*` after a regex-starting token
    if (ch === "/" && text[i + 1] !== "/" && text[i + 1] !== "*") {
      let j = i - 1;
      while (j >= 0 && /\s/.test(text[j])) {j--;}
      const prev = j >= 0 ? text[j] : "\0";
      if ("(,=:[!&|?;{~^%*/+-<>".includes(prev) || j < start) {
        i++;
        while (i < text.length && text[i] !== "/") {
          if (text[i] === "\\") {i++;}
          i++;
        }
        i++;
        while (i < text.length && /[gimsuy]/.test(text[i])) {i++;}
        continue;
      }
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch;
      i++;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === "\\") {i++;}
        i++;
      }
      i++;
      continue;
    }

    if (ch === "{") {depth++;}
    if (ch === "}") {
      depth--;
      if (depth === 0) {return i;}
    }
    i++;
  }
  return -1;
}

function lineNumberAt(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) {
    if (text[i] === "\n") {line++;}
  }
  return line;
}

/**
 * Extract top-level `describe` blocks from a test file and classify
 * their nested children (good cases / bad cases / edge cases).
 */
function extractDescribes(source: string): DescribeBlock[] {
  const blocks: DescribeBlock[] = [];
  const describeRe = /\bdescribe\s*\(\s*(['"`])(.*?)\1/g;
  let match: RegExpExecArray | null;

  while ((match = describeRe.exec(source)) !== null) {
    const nameStart = match.index;

    if (isInsideLineComment(source, nameStart)) {continue;}

    const braceIdx = source.indexOf("{", nameStart + match[0].length);
    if (braceIdx === -1) {continue;}
    const endIdx = findMatchingBrace(source, braceIdx);
    if (endIdx === -1) {continue;}

    const body = source.slice(braceIdx, endIdx + 1);
    const childNames: string[] = [];
    const childRe = /\bdescribe\s*\(\s*(['"`])(.*?)\1/g;
    let childMatch: RegExpExecArray | null;
    while ((childMatch = childRe.exec(body)) !== null) {
      childNames.push(childMatch[2].toLowerCase());
    }

    blocks.push({
      name: match[2],
      startLine: lineNumberAt(source, nameStart),
      children: childNames,
    });
  }
  return blocks;
}

/**
 * Check if a position in the source is inside a line comment (// ...).
 */
function isInsideLineComment(source: string, index: number): boolean {
  let lineStart = source.lastIndexOf("\n", index);
  if (lineStart === -1) {lineStart = 0;}
  const linePrefix = source.slice(lineStart, index);
  return /\/\//.test(linePrefix);
}

/**
 * Extract individual test blocks (it / test) with their body text.
 * Uses `=>` to locate the arrow-function body, skipping destructured params.
 */
function extractTestBlocks(source: string): TestBlock[] {
  const blocks: TestBlock[] = [];
  const testRe = /\b(it|test)\s*\(\s*(['"`])(.*?)\2/g;
  let match: RegExpExecArray | null;

  while ((match = testRe.exec(source)) !== null) {
    const startIdx = match.index;

    if (isInsideLineComment(source, startIdx)) {continue;}

    const afterName = source.slice(startIdx + match[0].length);

    // Find the arrow `=>` of the callback, then the first `{` after it
    const arrowIdx = afterName.indexOf("=>");
    if (arrowIdx === -1) {continue;}
    const braceRelIdx = afterName.indexOf("{", arrowIdx + 2);
    if (braceRelIdx === -1) {continue;}
    const braceIdx = startIdx + match[0].length + braceRelIdx;

    const endIdx = findMatchingBrace(source, braceIdx);
    if (endIdx === -1) {continue;}

    const body = source.slice(braceIdx, endIdx + 1);
    const startLine = lineNumberAt(source, startIdx);
    const endLine = lineNumberAt(source, endIdx);

    // Determine parent describe by finding the innermost describe that contains this block
    let parentDescribe: string | null = null;
    const describeRe2 = /\bdescribe\s*\(\s*(['"`])(.*?)\1/g;
    let dMatch: RegExpExecArray | null;
    let closestDistance = Infinity;
    while ((dMatch = describeRe2.exec(source)) !== null) {
      if (dMatch.index < startIdx) {
        const dist = startIdx - dMatch.index;
        // Only count if this describe's brace scope includes our test
        const dBrace = source.indexOf("{", dMatch.index + dMatch[0].length);
        if (dBrace === -1) {continue;}
        const dEnd = findMatchingBrace(source, dBrace);
        if (dEnd >= endIdx && dist < closestDistance) {
          closestDistance = dist;
          parentDescribe = dMatch[2].toLowerCase();
        }
      }
    }

    blocks.push({ name: match[3], startLine, endLine, body, parentDescribe });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Check 1: Good/Bad/Edge completeness
// ---------------------------------------------------------------------------

function checkGoodBadEdge(source: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const describes = extractDescribes(source);

  if (describes.length === 0) {return issues;}

  // We check the top-level describes that have children (nested describes).
  // A top-level describe should have good/bad/edge children.
  const topLevel = describes.filter((d) => d.children.length > 0);

  // If there are no structured describes at all, check if the file has
  // any test blocks — if so, the file lacks the required structure.
  if (topLevel.length === 0) {
    const testBlocks = extractTestBlocks(source);
    if (testBlocks.length > 0) {
      issues.push({
        file: filePath,
        line: 1,
        check: "good-bad-edge",
        message: "Test file has test blocks but no Good/Bad/Edge describe structure",
        severity: "error",
      });
    }
    return issues;
  }

  for (const d of topLevel) {
    const hasGood = d.children.some((c) => c.includes("good"));
    const hasBad = d.children.some((c) => c.includes("bad"));
    const hasEdge = d.children.some((c) => c.includes("edge"));

    const missing: string[] = [];
    if (!hasGood) {missing.push("good cases");}
    if (!hasBad) {missing.push("bad cases");}
    if (!hasEdge) {missing.push("edge cases");}

    if (missing.length > 0) {
      issues.push({
        file: filePath,
        line: d.startLine,
        check: "good-bad-edge",
        message: `describe('${d.name}') is missing: ${missing.join(", ")}`,
        severity: "error",
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Check 2: Assertion density — every it/test must have at least one expect
// ---------------------------------------------------------------------------

function checkAssertionDensity(source: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const blocks = extractTestBlocks(source);

  for (const block of blocks) {
    const hasExpect = /\bexpect\s*\(/.test(block.body);
    const hasFcAssert = /\bfc\.assert\s*\(/.test(block.body);
    if (!hasExpect && !hasFcAssert) {
      issues.push({
        file: filePath,
        line: block.startLine,
        check: "assertion-density",
        message: `test '${block.name}' has no expect() or fc.assert() call`,
        severity: "error",
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Check 3: Weak assertion flags
// ---------------------------------------------------------------------------

const WEAK_ASSERTIONS = [
  "toBeDefined",
  "toBeTruthy",
  "toBeFalsy",
  "toBeUndefined",
  "toBeNull",
];

function checkWeakAssertions(source: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const blocks = extractTestBlocks(source);

  for (const block of blocks) {
    const expectMatches = block.body.match(/\bexpect\s*\([^)]*\)\s*\.\s*(\w+)\s*\(/g);
    if (!expectMatches) {continue;}

    // Extract assertion method names from this block
    const methods: string[] = [];
    const methodRe = /\bexpect\s*\([^)]*\)\s*\.(?:not\s*\.)?\s*(\w+)\s*\(/g;
    let m: RegExpExecArray | null;
    while ((m = methodRe.exec(block.body)) !== null) {
      methods.push(m[1]);
    }

    const weakCount = methods.filter((method) => WEAK_ASSERTIONS.includes(method)).length;
    const strongCount = methods.length - weakCount;

    if (weakCount > 0 && strongCount === 0) {
      issues.push({
        file: filePath,
        line: block.startLine,
        check: "weak-assertions",
        message: `test '${block.name}' uses only weak assertions (${WEAK_ASSERTIONS.filter((a) => methods.includes(a)).join(", ")}); add specific value checks`,
        severity: "warning",
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Check 4: Property-based test config — fc.assert must have numRuns >= 100
// ---------------------------------------------------------------------------

function checkPropertyTestConfig(source: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const fcAssertRe = /\bfc\.assert\s*\(/g;
  let match: RegExpExecArray | null;

  while ((match = fcAssertRe.exec(source)) !== null) {
    const startIdx = match.index;
    const line = lineNumberAt(source, startIdx);

    // Find the matching `)` of fc.assert( to capture the full call including config
    const parenStart = source.indexOf("(", startIdx + "fc.assert".length);
    if (parenStart === -1) {continue;}

    // Use brace-matching logic adapted for parentheses
    let depth = 0;
    let i = parenStart;
    while (i < source.length) {
      const ch = source[i];
      if (ch === "'" || ch === '"' || ch === "`") {
        const q = ch;
        i++;
        while (i < source.length && source[i] !== q) {
          if (source[i] === "\\") {i++;}
          i++;
        }
      } else if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        depth--;
        if (depth === 0) {break;}
      }
      i++;
    }

    const searchWindow = source.slice(startIdx, i + 1);
    const numRunsMatch = searchWindow.match(/numRuns\s*:\s*(\d+)/);

    if (!numRunsMatch) {
      issues.push({
        file: filePath,
        line,
        check: "property-test-config",
        message: "fc.assert() call is missing { numRuns: 100 } configuration",
        severity: "error",
      });
    } else if (parseInt(numRunsMatch[1], 10) < 100) {
      issues.push({
        file: filePath,
        line,
        check: "property-test-config",
        message: `fc.assert() has numRuns: ${numRunsMatch[1]} (minimum is 100)`,
        severity: "error",
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Check 5: Bad-case assertion type — bad cases must assert on error conditions
// ---------------------------------------------------------------------------

const BAD_CASE_PATTERNS = [
  /rejects\.toThrow/,
  /rejects\.toEqual/,
  /toBe\s*\(\s*false\s*\)/,
  /toBe\s*\(\s*4\d{2}\s*\)/,         // status codes 400-499
  /toEqual\s*\(\s*4\d{2}\s*\)/,
  /toHaveProperty\s*\(\s*['"]error/,
  /getByText\s*\(.*error/i,
  /getByText\s*\(.*required/i,
  /getByText\s*\(.*invalid/i,
  /getByText\s*\(.*already/i,
  /toBeVisible/,                       // E2E: error/validation message visibility
  /toHaveURL\s*\(/,                    // E2E: redirect assertion (e.g. redirect to login)
  /\.success\s*\)\s*\.\s*toBe\s*\(\s*false/,
  /toBeNull/,
  /not\s*\.\s*toBeInTheDocument/,
  /queryByText/,                       // RTL: querying for absence
];

function checkBadCaseAssertions(source: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const blocks = extractTestBlocks(source);

  for (const block of blocks) {
    if (block.parentDescribe !== null && block.parentDescribe.includes("bad")) {
      const hasErrorAssertion = BAD_CASE_PATTERNS.some((p) => p.test(block.body));
      if (!hasErrorAssertion) {
        issues.push({
          file: filePath,
          line: block.startLine,
          check: "bad-case-assertions",
          message: `bad-case test '${block.name}' does not appear to assert on an error condition`,
          severity: "warning",
        });
      }
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Check 6: Spec traceability
// ---------------------------------------------------------------------------

interface SpecItem {
  id: string;
  text: string;
}

function parseRequirements(filePath: string): SpecItem[] {
  if (!fs.existsSync(filePath)) {return [];}
  const content = fs.readFileSync(filePath, "utf-8");
  const items: SpecItem[] = [];

  // Match acceptance criteria numbered items like "1. WHEN ..." or "1." under requirement headings
  const reqHeadingRe = /^### Requirement (\d+):/gm;
  let reqMatch: RegExpExecArray | null;
  const reqNumbers: string[] = [];

  while ((reqMatch = reqHeadingRe.exec(content)) !== null) {
    reqNumbers.push(reqMatch[1]);
  }

  // Match numbered acceptance criteria
  let currentReq = "";
  const lines = content.split("\n");
  let _reqIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^### Requirement (\d+):/);
    if (headingMatch) {
      currentReq = headingMatch[1];
      _reqIdx++;
    }
    const critMatch = lines[i].match(/^(\d+)\.\s+WHEN\b/);
    if (critMatch && currentReq) {
      items.push({
        id: `REQ ${currentReq}.${critMatch[1]}`,
        text: lines[i].trim(),
      });
    }
  }
  return items;
}

function parseCorrectnessProperties(filePath: string): SpecItem[] {
  if (!fs.existsSync(filePath)) {return [];}
  const content = fs.readFileSync(filePath, "utf-8");
  const items: SpecItem[] = [];

  const propRe = /^### Property (\d+):\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = propRe.exec(content)) !== null) {
    items.push({
      id: `PROP ${match[1]}`,
      text: match[2].trim(),
    });
  }
  return items;
}

function checkSpecTraceability(
  testFiles: string[],
  rootDir: string,
  feature: string,
): Issue[] {
  const issues: Issue[] = [];
  const reqPath = path.join(rootDir, "specs", feature, "requirements.md");
  const designPath = path.join(rootDir, "specs", feature, "design.md");

  const requirements = parseRequirements(reqPath);
  const properties = parseCorrectnessProperties(designPath);

  if (requirements.length === 0 && properties.length === 0) {
    issues.push({
      file: `specs/${feature}/`,
      line: 0,
      check: "spec-traceability",
      message: `Could not parse any requirements or properties from specs/${feature}/`,
      severity: "warning",
    });
    return issues;
  }

  // Collect all test file contents and comments
  let allTestContent = "";
  for (const tf of testFiles) {
    allTestContent += fs.readFileSync(tf, "utf-8") + "\n";
  }
  const contentLower = allTestContent.toLowerCase();

  // Check each property is referenced
  for (const prop of properties) {
    const propNum = prop.id.replace("PROP ", "");
    const patterns = [
      `property ${propNum}`,
      `prop ${propNum}`,
      prop.text.toLowerCase().slice(0, 40),
    ];
    const found = patterns.some((p) => contentLower.includes(p.toLowerCase()));
    if (!found) {
      issues.push({
        file: `specs/${feature}/design.md`,
        line: 0,
        check: "spec-traceability",
        message: `${prop.id}: ${prop.text} -- no matching test found`,
        severity: "error",
      });
    }
  }

  // Check requirements coverage (lighter check — look for REQ references or keyword overlap)
  for (const req of requirements) {
    const idPattern = req.id.toLowerCase().replace(" ", "\\s*");
    const idRe = new RegExp(idPattern);
    const found = idRe.test(contentLower) || contentLower.includes(req.id.toLowerCase());
    if (!found) {
      issues.push({
        file: `specs/${feature}/requirements.md`,
        line: 0,
        check: "spec-traceability",
        message: `${req.id} -- no traceability comment found in tests (add // ${req.id} -> ...)`,
        severity: "warning",
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function formatReport(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("╔══════════════════════════════════════════════════════════╗");
  lines.push("║              Test Quality Gate 1: Report                ║");
  lines.push("╚══════════════════════════════════════════════════════════╝");
  lines.push("");
  lines.push(`Files scanned: ${report.filesScanned}`);
  lines.push(`Issues found:  ${report.issues.length}`);

  const errors = report.issues.filter((i) => i.severity === "error");
  const warnings = report.issues.filter((i) => i.severity === "warning");

  lines.push(`  Errors:   ${errors.length}`);
  lines.push(`  Warnings: ${warnings.length}`);
  lines.push("");

  if (report.issues.length === 0) {
    lines.push("  All checks passed.");
    lines.push("");
    return lines.join("\n");
  }

  // Group by check
  const byCheck = new Map<string, Issue[]>();
  for (const issue of report.issues) {
    const group = byCheck.get(issue.check) || [];
    group.push(issue);
    byCheck.set(issue.check, group);
  }

  for (const [check, checkIssues] of byCheck) {
    lines.push(`── ${check} ${"─".repeat(Math.max(0, 52 - check.length))}`)
    for (const issue of checkIssues) {
      const prefix = issue.severity === "error" ? "✗" : "⚠";
      const location = issue.line > 0 ? `${issue.file}:${issue.line}` : issue.file;
      lines.push(`  ${prefix} ${location}`);
      lines.push(`    ${issue.message}`);
    }
    lines.push("");
  }

  lines.push(report.passed ? "Result: PASS" : "Result: FAIL (fix errors to proceed)");
  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const rootDir = process.cwd();
  const testFiles = discoverTestFiles(rootDir, args.feature);

  if (testFiles.length === 0) {
    console.log("No test files found.");
    process.exit(0);
  }

  const allIssues: Issue[] = [];

  for (const filePath of testFiles) {
    const source = fs.readFileSync(filePath, "utf-8");
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");

    allIssues.push(...checkGoodBadEdge(source, relPath));
    allIssues.push(...checkAssertionDensity(source, relPath));
    allIssues.push(...checkWeakAssertions(source, relPath));
    allIssues.push(...checkPropertyTestConfig(source, relPath));
    allIssues.push(...checkBadCaseAssertions(source, relPath));
  }

  // Spec traceability (only when feature is specified)
  if (args.feature) {
    allIssues.push(...checkSpecTraceability(testFiles, rootDir, args.feature));
  }

  const hasErrors = allIssues.some((i) => i.severity === "error");
  const report: ValidationReport = {
    filesScanned: testFiles.length,
    issues: allIssues,
    passed: !hasErrors,
  };

  console.log(formatReport(report));
  process.exit(hasErrors ? 1 : 0);
}

main();
