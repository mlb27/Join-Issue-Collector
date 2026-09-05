# Demo and acceptance test

This guide verifies the Join Issue Collector against its central user journeys.
Run the automated tests first, then complete the manual checks with the same
Firebase project and n8n workflows used by the demo.

## Preconditions

- Serve the frontend through HTTP or HTTPS, not through a `file://` URL.
- Provide the ignored `components/js/firebase/firebaseConfig.js`.
- Enable Firebase Email/Password and Anonymous authentication.
- Publish the current `firestore.rules`.
- Import, configure and publish both sanitized workflows from
  `n8n/workflows/`.
- Connect all Gmail nodes to the dedicated stakeholder inbox.
- Select the Gmail labels `erledigt` and `zu bearbeiten` in their respective
  nodes.
- Configure the Firebase bot sign-in values only inside n8n.
- Connect a chat model to `Classify request with AI`.
- Add the production status webhook to the ignored local Firebase
  configuration.

Never paste a Firebase bot password, Gmail credential, API key or live token
into a screenshot, issue, commit or workflow export.

## 1. Automated baseline

From the repository root:

```bash
node --test
```

Expected result: every test passes and no test is skipped unexpectedly.

Before committing, also inspect:

```bash
git diff --check
git status --short
```

Only files belonging to the current task should appear.

## 2. Public stakeholder journey

1. Open `index.html`.
2. Choose **Create request** for the stakeholder role.
3. Confirm that the stakeholder page shows:
   - the dedicated email action;
   - the current number of used requests out of ten;
   - an explanation of automatic and manual processing;
   - links to Privacy Policy and Legal notice.
4. Open the email action and verify the recipient:
   `join.issue.collector.mail@gmail.com`.
5. Open `stakeholder.html?limit=reached` to preview the Figma limit state
   without changing the real quota.

Expected result: both views remain usable at 1440 px, 1200 px, 768 px, 480 px,
400 px, 360 px and 320 px. There must be no horizontal page overflow, hidden
navigation or blocked back button.

## 3. Authentication and manual Triage ticket

1. Return to the welcome page and use **Member log in**.
2. Sign in with a test account or use the guest login.
3. Create a manual task containing a title, description, date, priority and
   category.
4. Open the Board.

Expected result:

- the new task appears in **Triage**;
- its detail dialog identifies an internal creator;
- the task can be edited, moved and deleted;
- logging out returns to the welcome page.

## 4. Automated email ticket

Send one new email from a separate stakeholder address:

```text
Subject: Bug: Board search resets cards

Hi team,
the board search sometimes resets after moving a card.
Please treat this as a bug with medium priority and complete it by 12 September 2026.
Thanks
```

Wait for the published Gmail trigger. It polls once per minute, so processing
is not necessarily immediate.

Expected result:

- one new ticket appears in **Triage**, not in another column;
- title, category, priority and explicit deadline match the request;
- the description contains the AI-generation notice;
- the detail dialog identifies the sender as an external creator;
- the sender receives a confirmation email;
- the original message receives the `erledigt` label, leaves `INBOX` and is
  marked as read;
- the current `automationQuota/YYYY-MM-DD` document uses the Europe/Berlin
  date and its `used` value increases by exactly one;
- refreshing the stakeholder page displays the increased count.

Use a unique subject for every run. This makes duplicate tickets and delayed
polling easy to identify.

## 5. Status-change notification

1. Open the automatically generated ticket.
2. Move it from Triage to To do.
3. Wait for the status-notification workflow.

Expected result:

- the board keeps the new status after a reload;
- the external creator receives exactly one email naming the ticket and both
  statuses;
- moving within the same status does not send an email;
- a legacy or guest task without a creator email does not trigger a message.

The browser sends only the task ID and status transition. n8n must load the
recipient from the trusted Firestore document rather than accepting an email
address from the webhook request.

## 6. Limit branch

Perform this check only in a controlled demo project. Setting the quota through
the Firebase Console uses administrator access and is intentionally different
from what the public frontend is allowed to do.

1. Set today's `automationQuota/YYYY-MM-DD` document to `used: 10`.
2. Ensure the n8n workflow-state counter for the same day also represents an
   exhausted limit.
3. Send one new stakeholder email.

Expected result:

- no AI node runs;
- no Firestore task is created;
- the sender receives the daily-limit email;
- the original message receives `zu bearbeiten`, leaves `INBOX` and stays
  unread;
- the stakeholder page renders the limit state and still offers the email
  action for manual review.

Reset test data only after the result has been recorded. Do not weaken or
temporarily publish permissive Firestore rules for this test.

## 7. Processing-error branch

Test failures in an unpublished draft or an isolated demo copy of the workflow.
For example, disconnect the draft model credential or supply deliberately
invalid model output, then execute the draft with one test email.

Expected result:

- no ticket is created;
- the original email receives `zu bearbeiten`, leaves `INBOX` and remains
  unread;
- the sender receives the manual-review notification;
- the execution identifies the failing node;
- restoring the credential returns the happy path to a successful state.

Never invalidate the published bot password merely to demonstrate this branch.

## 8. Final release check

- Both n8n workflows are published and active.
- The email workflow responds automatically without **Execute workflow**.
- The status workflow uses its production webhook, not `webhook-test`.
- The committed workflow JSON files contain placeholders, not live
  credentials or Gmail label IDs.
- The local Firebase configuration and any environment files remain ignored.
- The browser console contains no unhandled errors during the main journeys.
- Keyboard focus, buttons, links and dialogs work at desktop and 320 px mobile.
- The final diff and commit message describe only the completed work.
