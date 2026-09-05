const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { loadBrowserScripts } = require("./helpers/scriptContext");
const projectRoot = path.resolve(__dirname, "..");


test("renders Triage as the first board column", () => {
  const boardPage = fs.readFileSync(
    path.join(projectRoot, "components/html/pages/board.html"),
    "utf8",
  );

  assert.ok(boardPage.indexOf('data-board-status="triage"') >= 0);
  assert.ok(
    boardPage.indexOf('data-board-status="triage"') <
      boardPage.indexOf('data-board-status="todo"'),
  );
});


test("offers To do as the next destination from Triage", () => {
  const context = loadBrowserScripts(["components/js/board/boardViewData.js"]);

  assert.deepEqual(
    Array.from(context.getBoardMoveTargets("triage"), (target) => target.value),
    ["todo"],
  );
});


test("offers the adjacent board columns as move targets", () => {
  const context = loadBrowserScripts(["components/js/board/boardViewData.js"]);

  assert.deepEqual(
    Array.from(
      context.getBoardMoveTargets("in-progress"),
      (target) => target.value,
    ),
    ["todo", "feedback"],
  );
});


test("offers Triage before In progress from To do", () => {
  const context = loadBrowserScripts(["components/js/board/boardViewData.js"]);

  assert.deepEqual(
    Array.from(context.getBoardMoveTargets("todo"), (target) => target.value),
    ["triage", "in-progress"],
  );
});


test("uses directional icons relative to the current board column", () => {
  const context = loadBrowserScripts(["components/js/board/boardViewData.js"]);
  const targets = context.getBoardMoveTargets("feedback");

  assert.deepEqual(
    Array.from(targets, (target) => target.icon),
    ["arrow_upward", "arrow_downward"],
  );
});


test("distinguishes internal and external task creators", () => {
  const context = loadBrowserScripts([
    "components/js/core/shared.js",
    "components/js/board/boardViewData.js",
  ]);
  const member = context.getBoardCreatorViewData({
    source: "manual",
    creator: { type: "internal", name: "Ada Lovelace" },
  });
  const stakeholder = context.getBoardCreatorViewData({
    source: "email",
    creator: { name: "Felix Richter", email: "felix@example.com" },
  });

  assert.equal(member.typeLabel, "Member");
  assert.equal(member.emailHref, "");
  assert.equal(stakeholder.typeLabel, "External");
  assert.equal(stakeholder.emailHref, "mailto:felix@example.com");
  assert.equal(context.isBoardTaskAiGenerated({ source: "email" }), true);
});


test("keeps legacy tasks without creator metadata compatible", () => {
  const context = loadBrowserScripts([
    "components/js/core/shared.js",
    "components/js/board/boardViewData.js",
  ]);

  assert.equal(context.getBoardCreatorViewData({ title: "Legacy task" }), null);
  assert.equal(context.isBoardTaskAiGenerated({ source: "manual" }), false);
});


test("renders one column's tasks ordered by creation time, oldest first", () => {
  const taskList = { dataset: { boardStatus: "todo" }, innerHTML: "" };
  const context = loadBrowserScripts(
    ["components/js/tasks/tasks.js", "components/js/board/board.js"],
    {
      getBoardTaskTemplate: (task) => `${task.id};`,
      getBoardTaskViewData: (task) => task,
      getBoardEmptyTemplate: () => "empty",
      formatBoardStatus: (status) => status,
    },
  );
  const tasks = [
    { id: "third", status: "todo", createdAt: "2026-01-03T00:00:00.000Z" },
    { id: "first", status: "todo", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "other-column", status: "done", createdAt: "2026-01-02T00:00:00.000Z" },
    { id: "second", status: "todo", createdAt: "2026-01-02T00:00:00.000Z" },
    { id: "no-timestamp", status: "todo" },
  ];

  context.renderBoardColumn(taskList, tasks);

  assert.equal(taskList.innerHTML, "no-timestamp;first;second;third;");
});


test("renders a moved task immediately and persists its new status", async () => {
  const task = { id: "task-1", status: "todo" };
  const state = { renders: 0, savedStatus: "" };
  const context = loadBrowserScripts(["components/js/board/boardDnd.js"], {
    activeBoardTasks: [task],
    renderBoardColumns: () => { state.renders += 1; },
    initBoardTaskDetails() {},
    updateTaskInStore: async (updatedTask) => {
      state.savedStatus = updatedTask.status;
    },
  });

  await context.moveBoardTaskToStatus(task, "done");

  assert.equal(task.status, "done");
  assert.equal(state.renders, 1);
  assert.equal(state.savedStatus, "done");
});


test("notifies the creator only after the moved task was persisted", async () => {
  const task = { id: "task-1", status: "triage" };
  const state = { events: [] };
  const context = loadBrowserScripts(["components/js/board/boardDnd.js"], {
    activeBoardTasks: [task],
    renderBoardColumns() {},
    initBoardTaskDetails() {},
    updateTaskInStore: async () => { state.events.push("saved"); },
    notifyTaskCreatorOfStatusChange: async (_task, previous, next) => {
      state.events.push(previous + ":" + next);
    },
  });

  await context.moveBoardTaskToStatus(task, "todo");

  assert.deepEqual(state.events, ["saved", "triage:todo"]);
});


test("keeps a persisted move when the creator notification fails", async () => {
  const task = { id: "task-1", status: "todo" };
  const context = loadBrowserScripts(["components/js/board/boardDnd.js"], {
    activeBoardTasks: [task],
    renderBoardColumns() {},
    initBoardTaskDetails() {},
    updateTaskInStore: async () => {},
    notifyTaskCreatorOfStatusChange: async () => { throw new Error("offline"); },
    console: { warn() {} },
  });

  await context.moveBoardTaskToStatus(task, "done");

  assert.equal(task.status, "done");
});
