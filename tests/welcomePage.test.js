const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");


/**
 * Reads one project file as UTF-8 text.
 * @param {string} filePath - Path relative to the project root.
 * @returns {string} Complete file content.
 */
function readProjectFile(filePath) {
  return fs.readFileSync(path.join(projectRoot, filePath), "utf8");
}


test("uses the public welcome page as the application entry", () => {
  const entryDocument = readProjectFile("index.html");
  const loginDocument = readProjectFile("login.html");
  const router = readProjectFile("main.js");

  assert.match(entryDocument, /<body data-page="welcome">/);
  assert.match(loginDocument, /<body data-page="login">/);
  assert.match(router, /welcome:\s*\{[\s\S]*?file: "\.\/index\.html"/);
  assert.match(router, /login:\s*\{[\s\S]*?file: "\.\/login\.html"/);
});


test("offers both role paths and public legal links", () => {
  const welcomePage = readProjectFile("components/html/pages/welcome.html");

  assert.match(welcomePage, />\s*Create request\s*</);
  assert.match(welcomePage, /href="\.\/stakeholder\.html"/);
  assert.match(welcomePage, />\s*Member log in\s*</);
  assert.match(welcomePage, /href="\.\/login\.html"/);
  assert.match(welcomePage, /href="\.\/privacyPolicy\.html"/);
  assert.match(welcomePage, /href="\.\/legalNotice\.html"/);
});
