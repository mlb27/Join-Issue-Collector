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
  assert.ok(nodeNames.includes("Sign in n8n bot"));
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
  assert.ok(prepareNode.parameters.jsCode.includes(".replace(/^```(?:json)?\\s*/i,"));
  assert.ok(prepareNode.parameters.jsCode.includes(".replace(/\\s*```$/i,"));
});


test("signs in as Firebase bot before creating Firestore documents", () => {
  const workflow = readWorkflow();
  const signInNode = workflow.nodes.find((node) => node.name === "Sign in n8n bot");
  const createNode = workflow.nodes.find((node) => node.name === "Create Firestore ticket");
  const prepareConnections = workflow.connections["Prepare Firestore task"].main[0];
  const signInConnections = workflow.connections["Sign in n8n bot"].main[0];

  assert.match(signInNode.parameters.url, /accounts:signInWithPassword/);
  assert.match(signInNode.parameters.url, /REPLACE_IN_N8N_FIREBASE_WEB_API_KEY/);
  assert.match(signInNode.parameters.jsonBody, /n8n-bot@join\.local/);
  assert.match(signInNode.parameters.jsonBody, /REPLACE_IN_N8N_FIREBASE_BOT_PASSWORD/);
  assert.deepEqual(prepareConnections, [{ node: "Sign in n8n bot", type: "main", index: 0 }]);
  assert.deepEqual(signInConnections, [{ node: "Create Firestore ticket", type: "main", index: 0 }]);

  assert.equal(createNode.parameters.authentication, undefined);
  assert.equal(createNode.parameters.genericAuthType, undefined);
  assert.equal(createNode.credentials, undefined);
  assert.equal(createNode.parameters.sendHeaders, true);
  assert.match(createNode.parameters.headerParameters.parameters[0].value, /idToken/);
});


test("creates Firestore documents with Join task fields", () => {
  const workflow = readWorkflow();
  const prepareNode = workflow.nodes.find((node) => node.name === "Prepare Firestore task");
  const createNode = workflow.nodes.find((node) => node.name === "Create Firestore ticket");

  assert.match(createNode.parameters.url, /join-issue-collector-b5f54/);
  assert.match(prepareNode.parameters.jsCode, /const firestoreDocument =/);
  assert.match(prepareNode.parameters.jsCode, /fields:/);
  assert.match(prepareNode.parameters.jsCode, /status: \{ stringValue: task\.status \}/);
  assert.match(prepareNode.parameters.jsCode, /source: \{ stringValue: task\.source \}/);
  assert.match(prepareNode.parameters.jsCode, /creator: \{/);
  assert.match(createNode.parameters.jsonBody, /firestoreDocument/);
});


test("labels, archives and marks successfully processed emails as read", () => {
  const workflow = readWorkflow();
  const labelNode = workflow.nodes.find((node) => node.name === "Label processed email");
  const archiveNode = workflow.nodes.find((node) => node.name === "Archive processed email");
  const markReadNode = workflow.nodes.find((node) => node.name === "Mark processed email as read");

  assert.equal(labelNode.parameters.operation, "addLabels");
  assert.deepEqual(labelNode.parameters.labelIds, ["REPLACE_IN_N8N_GMAIL_DONE_LABEL_ID"]);
  assert.equal(archiveNode.parameters.operation, "removeLabels");
  assert.deepEqual(archiveNode.parameters.labelIds, ["INBOX"]);
  assert.equal(markReadNode.parameters.operation, "markAsRead");
  [labelNode, archiveNode, markReadNode].forEach((node) =>
    assert.match(node.parameters.messageId, /Extract email request/),
  );
  assert.deepEqual(workflow.connections["Send confirmation email"].main[0], [
    { node: "Label processed email", type: "main", index: 0 },
  ]);
  assert.deepEqual(workflow.connections["Label processed email"].main[0], [
    { node: "Archive processed email", type: "main", index: 0 },
  ]);
  assert.deepEqual(workflow.connections["Archive processed email"].main[0], [
    { node: "Mark processed email as read", type: "main", index: 0 },
  ]);
});

test("routes processing errors to manual review", () => {
  const workflow = readWorkflow();
  const failingNodeNames = [
    "Classify request with AI",
    "Prepare Firestore task",
    "Sign in n8n bot",
    "Create Firestore ticket",
    "Send confirmation email",
  ];
  const labelNode = workflow.nodes.find((node) => node.name === "Label failed email");
  const archiveNode = workflow.nodes.find((node) => node.name === "Archive failed email");
  const errorMailNode = workflow.nodes.find((node) => node.name === "Send processing error email");

  failingNodeNames.forEach((name) => {
    const node = workflow.nodes.find((candidate) => candidate.name === name);
    assert.equal(node.onError, "continueErrorOutput");
    assert.deepEqual(workflow.connections[name].main[1], [
      { node: "Label failed email", type: "main", index: 0 },
    ]);
  });
  assert.deepEqual(labelNode.parameters.labelIds, ["REPLACE_IN_N8N_GMAIL_FAILED_LABEL_ID"]);
  assert.deepEqual(archiveNode.parameters.labelIds, ["INBOX"]);
  assert.equal(errorMailNode.parameters.subject, "Join request needs manual review");
  assert.deepEqual(workflow.connections["Label failed email"].main[0], [
    { node: "Archive failed email", type: "main", index: 0 },
  ]);
  assert.deepEqual(workflow.connections["Archive failed email"].main[0], [
    { node: "Send processing error email", type: "main", index: 0 },
  ]);
});

test("keeps n8n workflow exports free of committed secrets", () => {
  const workflowSource = fs.readFileSync(workflowPath, "utf8");

  assert.doesNotMatch(workflowSource, /AIza[0-9A-Za-z_-]+/);
  assert.doesNotMatch(workflowSource, /private_key/i);
  assert.match(workflowSource, /REPLACE_IN_N8N/);
  assert.match(workflowSource, /REPLACE_IN_N8N_FIREBASE_BOT_PASSWORD/);
});


test("keeps exported n8n credentials as placeholders", () => {
  const workflow = readWorkflow();
  const credentialIds = workflow.nodes.flatMap((node) =>
    Object.values(node.credentials || {}).map((credential) => credential.id),
  );

  assert.ok(credentialIds.length > 0);
  credentialIds.forEach((id) => assert.equal(id, "REPLACE_IN_N8N"));
});
