const assert = require("node:assert/strict");
const test = require("node:test");
const { loadBrowserScripts } = require("./helpers/scriptContext");


/**
 * Loads the notification client with an observable fetch replacement.
 * @param {string} [webhookUrl] - Optional local n8n URL.
 * @returns {Object} Browser context and captured requests.
 */
function createNotificationContext(webhookUrl = "https://n8n.example/webhook/status") {
  const requests = [];
  const window = { joinN8nStatusWebhookUrl: webhookUrl };
  const context = loadBrowserScripts(
    ["components/js/tasks/taskNotifications.js"],
    {
      window,
      URL,
      fetch: async (...args) => { requests.push(args); },
    },
  );
  return { context, requests };
}


test("requests a status notification without exposing the creator email", async () => {
  const { context, requests } = createNotificationContext();
  const task = {
    id: "task-1",
    creator: { type: "external", email: "stakeholder@example.com" },
  };

  const requested = await context.notifyTaskCreatorOfStatusChange(task, "triage", "todo");

  assert.equal(requested, true);
  assert.equal(requests.length, 1);
  const payload = JSON.parse(requests[0][1].body);
  assert.deepEqual(payload, {
    taskId: "task-1",
    previousStatus: "triage",
    nextStatus: "todo",
  });
  assert.doesNotMatch(requests[0][1].body, /stakeholder@example\.com/);
});


test("skips unchanged tasks and creators without an email", async () => {
  const { context, requests } = createNotificationContext();

  assert.equal(
    await context.notifyTaskCreatorOfStatusChange(
      { id: "task-1", creator: { email: "stakeholder@example.com" } },
      "todo",
      "todo",
    ),
    false,
  );
  assert.equal(
    await context.notifyTaskCreatorOfStatusChange(
      { id: "task-2", creator: { email: "" } },
      "todo",
      "done",
    ),
    false,
  );
  assert.equal(requests.length, 0);
});


test("skips notification when the local webhook URL is absent", async () => {
  const { context, requests } = createNotificationContext("");
  const requested = await context.notifyTaskCreatorOfStatusChange(
    { id: "task-1", creator: { email: "stakeholder@example.com" } },
    "todo",
    "done",
  );

  assert.equal(requested, false);
  assert.equal(requests.length, 0);
});
