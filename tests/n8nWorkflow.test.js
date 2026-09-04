const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");
const workflowPath = path.join(
  projectRoot,
  "n8n",
  "workflows",
  "email-to-triage-ticket.json",
);


/**
 * Reads the email collector workflow JSON from the repository.
 * @returns {Object} Parsed n8n workflow export.
 */
function readWorkflow() {
  return JSON.parse(fs.readFileSync(workflowPath, "utf8"));
}


test("stores an importable n8n email collector workflow", () => {
  const workflow = readWorkflow();
  const nodeNames = workflow.nodes.map((node) => node.name);

  assert.equal(workflow.active, false);
  assert.equal(workflow.name, "Email to Triage Ticket");
  assert.ok(nodeNames.includes("Watch stakeholder inbox"));
  assert.ok(nodeNames.includes("Check daily request limit"));
  assert.ok(nodeNames.includes("Classify request with AI"));
  assert.ok(nodeNames.includes("Create Firestore ticket"));
  assert.ok(nodeNames.includes("Send confirmation email"));
  assert.ok(nodeNames.includes("Send limit email"));
});


test("uses current Gmail send fields for notification nodes", () => {
  const workflow = readWorkflow();
  const confirmationNode = workflow.nodes.find((node) => node.name === "Send confirmation email");
  const limitNode = workflow.nodes.find((node) => node.name === "Send limit email");

  assert.match(confirmationNode.parameters.sendTo, /senderEmail/);
  assert.match(limitNode.parameters.sendTo, /senderEmail/);
  assert.equal(confirmationNode.parameters.to, undefined);
  assert.equal(limitNode.parameters.to, undefined);
});


test("reads Gmail trigger fields with current uppercase names", () => {
  const workflow = readWorkflow();
  const extractNode = workflow.nodes.find((node) => node.name === "Extract email request");

  assert.match(extractNode.parameters.jsCode, /email\.From/);
  assert.match(extractNode.parameters.jsCode, /email\.Subject/);
  assert.match(extractNode.parameters.jsCode, /email\.Snippet/);
});


test("strips markdown fences before parsing AI JSON output", () => {
  const workflow = readWorkflow();
  const prepareNode = workflow.nodes.find((node) => node.name === "Prepare Firestore task");

  assert.match(prepareNode.parameters.jsCode, /stripMarkdownCodeBlock/);
  assert.match(prepareNode.parameters.jsCode, /JSON\.parse\(stripMarkdownCodeBlock\(aiOutput\)\)/);
  assert.ok(prepareNode.parameters.jsCode.includes(".replace(/^```(?:json)?\\s*/i, '')"));
  assert.ok(prepareNode.parameters.jsCode.includes(".replace(/\\s*```$/i, '')"));
});


test("creates Firestore documents with Join task fields", () => {
  const workflow = readWorkflow();
  const createNode = workflow.nodes.find((node) => node.name === "Create Firestore ticket");

  assert.match(createNode.parameters.url, /join-issue-collector-b5f54/);
  assert.match(createNode.parameters.jsonBody, /fields:/);
  assert.match(createNode.parameters.jsonBody, /status: \{ stringValue: \$json\.task\.status \}/);
  assert.match(createNode.parameters.jsonBody, /source: \{ stringValue: \$json\.task\.source \}/);
  assert.match(createNode.parameters.jsonBody, /creator: \{ mapValue:/);
});


test("keeps n8n workflow exports free of committed secrets", () => {
  const workflowSource = fs.readFileSync(workflowPath, "utf8");

  assert.doesNotMatch(workflowSource, /AIza[0-9A-Za-z_-]+/);
  assert.doesNotMatch(workflowSource, /private_key/i);
  assert.doesNotMatch(workflowSource, /password/i);
  assert.match(workflowSource, /REPLACE_IN_N8N/);
});


test("keeps exported n8n credentials as placeholders", () => {
  const workflow = readWorkflow();
  const credentialIds = workflow.nodes.flatMap((node) =>
    Object.values(node.credentials || {}).map((credential) => credential.id),
  );

  assert.ok(credentialIds.length > 0);
  credentialIds.forEach((id) => assert.equal(id, "REPLACE_IN_N8N"));
});
