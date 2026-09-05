const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".rules",
  ".svg",
  ".txt",
  ".yaml",
  ".yml",
]);
const extensionlessTextFiles = new Set([".firebaserc", ".gitignore"]);


/**
 * Returns every path currently tracked by Git.
 * @returns {string[]} Repository-relative paths using forward slashes.
 */
function getTrackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: projectRoot,
    encoding: "utf8",
  })
    .split(String.fromCharCode(0))
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, "/"));
}


/**
 * Checks Git's effective ignore rules even when the candidate does not exist.
 * @param {string} candidate - Repository-relative path.
 * @returns {boolean} Whether Git ignores the candidate.
 */
function isIgnored(candidate) {
  return spawnSync(
    "git",
    ["check-ignore", "--quiet", "--no-index", candidate],
    { cwd: projectRoot },
  ).status === 0;
}


test("keeps local Firebase and credential files outside version control", () => {
  const tracked = new Set(getTrackedFiles());
  const forbiddenTrackedPaths = [
    "components/js/firebase/firebaseConfig.js",
    "components/js/firebaseConfig.js",
    ".env",
    "n8n/.env",
  ];

  forbiddenTrackedPaths.forEach((file) => assert.equal(tracked.has(file), false));
  [
    "components/js/firebase/firebaseConfig.js",
    "components/js/firebaseConfig.js",
    ".env",
    ".env.production",
    ".firebase/hosting.cache",
    "firebase-debug.log",
    "firebase-service-account.json",
    "serviceAccount.json",
    "n8n/.env",
    "n8n/credentials/gmail.json",
  ].forEach((file) => assert.equal(isIgnored(file), true, file));
  assert.equal(isIgnored(".env.example"), false);
});


test("does not contain high-confidence secrets in tracked text files", () => {
  const secretPatterns = [
    {
      name: "Firebase or Google API key",
      pattern: /AIzaSy[0-9A-Za-z_-]{30,}/,
    },
    {
      name: "Google OAuth client secret",
      pattern: /GOCSPX-[0-9A-Za-z_-]{20,}/,
    },
    {
      name: "private key",
      pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    },
    {
      name: "GitHub access token",
      pattern: /gh[pousr]_[0-9A-Za-z]{30,}/,
    },
  ];
  const findings = [];

  getTrackedFiles()
    .filter((file) =>
      textExtensions.has(path.extname(file).toLowerCase()) ||
      extensionlessTextFiles.has(path.basename(file)),
    )
    .forEach((file) => {
      const source = fs.readFileSync(path.join(projectRoot, file), "utf8");
      secretPatterns.forEach(({ name, pattern }) => {
        if (pattern.test(source)) findings.push(file + ": " + name);
      });
    });

  assert.deepEqual(findings, []);
});
