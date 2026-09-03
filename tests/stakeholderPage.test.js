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


test("registers the public stakeholder route", () => {
  const entryDocument = readProjectFile("stakeholder.html");
  const router = readProjectFile("main.js");

  assert.match(entryDocument, /<body data-page="stakeholder">/);
  assert.match(
    router,
    /stakeholder:\s*\{[\s\S]*?file: "\.\/stakeholder\.html"/,
  );
});


test("explains email ticket creation and provides the public actions", () => {
  const page = readProjectFile("components/html/pages/stakeholder.html");

  assert.match(page, /<main class="stakeholder-page">/);
  assert.match(page, /0 of 10 requests used today/);
  assert.match(page, /Our AI system will automatically generate a ticket/);
  assert.match(page, /href="mailto:/);
  assert.match(page, />\s*Create Email Request\s*</);
  assert.match(page, /data-page="welcome"/);
  assert.match(page, /href="\.\/privacyPolicy\.html"/);
  assert.match(page, /href="\.\/legalNotice\.html"/);
});
