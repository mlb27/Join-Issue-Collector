const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");


/**
 * Reads one project file as UTF-8 text.
 * @param {string} filePath - Path relative to the project root.
 * @returns {string} Complete file content.
 */
function readProjectFile(filePath) {
  return fs.readFileSync(path.join(projectRoot, filePath), "utf8");
}


/**
 * Loads the stakeholder page script into an isolated test context.
 * @returns {Object} Context containing the stakeholder state helpers.
 */
function loadStakeholderScript() {
  const context = vm.createContext({ URLSearchParams });
  vm.runInContext(
    readProjectFile("components/js/stakeholder/stakeholder.js"),
    context,
  );
  return context;
}


test("registers the public stakeholder route", () => {
  const entryDocument = readProjectFile("stakeholder.html");
  const router = readProjectFile("main.js");

  assert.match(entryDocument, /<body data-page="stakeholder">/);
  assert.match(entryDocument, /components\/js\/stakeholder\/stakeholder\.js/);
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


test("uses the normal stakeholder view by default", () => {
  const { getStakeholderPageState } = loadStakeholderScript();

  assert.deepEqual(
    JSON.parse(JSON.stringify(getStakeholderPageState(""))),
    { limitReached: false, requestCount: 0, view: "default" },
  );
});


test("exposes the daily-limit design through the demo query", () => {
  const { getStakeholderPageState } = loadStakeholderScript();
  const page = readProjectFile("components/html/pages/stakeholder.html");

  assert.deepEqual(
    JSON.parse(JSON.stringify(getStakeholderPageState("?limit=reached"))),
    { limitReached: true, requestCount: 10, view: "limit" },
  );
  assert.match(page, /data-stakeholder-view="limit"/);
  assert.match(page, /The daily 10-request limit has been reached!/);
  assert.match(page, />\s*Send an email\s*</);
});
