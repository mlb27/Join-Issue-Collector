const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const workflowPath = path.join(
  path.resolve(__dirname, ".."),
  "n8n",
  "workflows",
  "task-status-notification.json",
);


/**
 * Reads the status-notification workflow export.
 * @returns {Object} Parsed n8n workflow.
 */
function readWorkflow() {
  return JSON.parse(fs.readFileSync(workflowPath, "utf8"));
}


test("stores an importable task status notification workflow", () => {
  const workflow = readWorkflow();
  const nodeNames = workflow.nodes.map((node) => node.name);

  assert.equal(workflow.active, false);
  assert.equal(workflow.name, "Task Status Notification");
  assert.ok(nodeNames.includes("Receive status change"));
  assert.ok(nodeNames.includes("Load Firestore task"));
  assert.ok(nodeNames.includes("Send status email"));
});


test("loads trusted creator data from Firestore before sending email", () => {
  const workflow = readWorkflow();
  const validateNode = workflow.nodes.find((node) => node.name === "Validate status change");
  const loadNode = workflow.nodes.find((node) => node.name === "Load Firestore task");
  const prepareNode = workflow.nodes.find((node) => node.name === "Prepare creator email");
  const sendNode = workflow.nodes.find((node) => node.name === "Send status email");

  assert.doesNotMatch(validateNode.parameters.jsCode, /request\.(recipient|email)/);
  assert.match(loadNode.parameters.url, /join-issue-collector-b5f54/);
  assert.match(loadNode.parameters.url, /taskId/);
  assert.match(prepareNode.parameters.jsCode, /fields.creator/);
  assert.match(prepareNode.parameters.jsCode, /storedStatus === request.nextStatus/);
  assert.match(sendNode.parameters.sendTo, /recipient/);
});


test("keeps the status workflow export free of credentials", () => {
  const source = fs.readFileSync(workflowPath, "utf8");
  const workflow = readWorkflow();
  const credentialIds = workflow.nodes.flatMap((node) =>
    Object.values(node.credentials || {}).map((credential) => credential.id),
  );

  assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]+/);
  assert.doesNotMatch(source, /private_key/i);
  assert.match(source, /REPLACE_IN_N8N_FIREBASE_WEB_API_KEY/);
  assert.match(source, /REPLACE_IN_N8N_FIREBASE_BOT_PASSWORD/);
  credentialIds.forEach((id) => assert.equal(id, "REPLACE_IN_N8N"));
});
