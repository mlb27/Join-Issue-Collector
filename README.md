<div align="center">

<img src="./components/assets/img/icons/Join%20logo%20vector.svg" height="96" alt="Join logo" />

# Join Issue Collector

</div>

<div align="center">

![Learning project](https://img.shields.io/badge/Learning_Project-Frontend-29ABE2?style=for-the-badge)
![Project status](https://img.shields.io/badge/Status-ready_for_review-2A3647?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge)

</div>

<div align="center">

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" height="40" alt="HTML5 logo" />
<img width="12" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" height="40" alt="CSS3 logo" />
<img width="12" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" height="40" alt="JavaScript logo" />
<img width="12" />
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-original.svg" height="40" alt="Firebase logo" />

</div>

<div align="center">

Join Issue Collector extends the original Join Kanban project with a public
stakeholder entry and a triage-first issue workflow. It remains a responsive
Vanilla JavaScript application with authenticated and guest access to the same
Firebase-backed board, contacts and task data.

</div>

## Live Demo

No public deployment URL is configured for this fork yet.

## Preview

![Join Summary preview](./components/assets/img/icons/preview.png)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Application Architecture](#application-architecture)
- [Architecture and Data Model](#architecture-and-data-model)
- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Firebase Setup](#firebase-setup)
- [n8n Setup](#n8n-setup)
- [Usage](#usage)
- [Demo and Acceptance Test](#demo-and-acceptance-test)
- [Project Structure](#project-structure)
- [Automated Tests](#automated-tests)
- [Deployment](#deployment)
- [Learning Goals](#learning-goals)

## Features

| Feature           | Description                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Authentication    | Sign up and sign in with Firebase Authentication.                                             |
| Guest access      | Test the application anonymously while using the shared task and contact data.                |
| Summary           | View live task totals, status metrics, urgent tasks and the next upcoming deadline.           |
| Add Task          | Create tasks with a title, description, due date, priority, category, assignees and subtasks. |
| Stakeholder entry | Explain external issue creation through a public stakeholder page.                            |
| Email collector   | Turn stakeholder emails into AI-classified tickets in Triage.                                 |
| Cost protection   | Limit automated email tickets to ten per Europe/Berlin calendar day.                          |
| Notifications     | Confirm created tickets and notify creators after board status changes.                       |
| Board             | Organize tasks across Triage, To do, In progress, Await feedback and Done.                    |
| Task editing      | Edit, move and delete existing tasks directly from the board.                                 |
| Subtasks          | Add, edit, remove and complete individual subtasks.                                           |
| Search            | Filter board cards by task title or description.                                              |
| Contacts          | Create, edit and delete contacts and display the signed-in user in the contact list.          |
| Shared data       | Store tasks and contacts centrally in Cloud Firestore.                                        |
| Legal pages       | Switch legal content between English and German while preserving the selected language.       |
| Responsive design | Use the application on desktop, tablet and mobile layouts.                                    |

## Tech Stack

| Technology              | Purpose                                                        |
| ----------------------- | -------------------------------------------------------------- |
| HTML5                   | Semantic page and component structure                          |
| CSS3                    | Responsive layouts, Figma-based styling and interaction states |
| JavaScript ES6+         | Routing, rendering, validation and application logic           |
| Firebase Authentication | Email/password and anonymous guest authentication              |
| Cloud Firestore         | Shared task and contact persistence                            |
| Static web server       | Local development and optional public deployment                |
| n8n                     | Email intake, AI classification and notification workflow       |
| Node.js test runner     | Automated tests for central application logic                  |

## Application Architecture

Join uses a multi-page architecture. The HTML files in the project root are
small route entry documents. `main.js` loads the matching page component and,
for protected pages, the shared application layout.

Visible markup is organized according to Atomic Design:

- `atoms` contain the smallest reusable UI elements.
- `molecules` combine atoms into focused controls.
- `organisms` provide larger reusable interface sections.
- `pages` contain route-specific content.
- `templates` provide shared page layouts.

The JavaScript layer separates rendering, validation, stores, Firebase adapters
and feature-specific interactions into focused files.

## Architecture and Data Model

The complete system flow, trust boundaries, Firestore collections and failure
paths are documented in
[`docs/architecture.md`](./docs/architecture.md).

## Requirements

- A modern web browser
- A local development server, such as the VS Code Live Server extension
- Node.js when running the automated tests or Firebase CLI commands
- An internet connection for Firebase Authentication and Firestore
- A Firebase project with Authentication and Cloud Firestore
- A local or hosted n8n instance for the email collector workflow
- A chat model reachable from n8n for issue classification

When a hosted demo is available, it can be opened without a local installation.

## Quickstart

1. Clone the repository:

```bash
git clone https://github.com/mlb27/Join-Issue-Collector.git
```

2. Open the project directory:

```bash
cd Join-Issue-Collector
```

3. Complete the local [Firebase setup](#firebase-setup).

4. Start a local web server. For example:

```powershell
python -m http.server 5500 --bind localhost
```

5. Open Join in the browser:

```text
http://localhost:5500/index.html
```

Do not open the application directly through a `file://` URL.

## Firebase Setup

Join expects a local Firebase web configuration file at:

```text
components/js/firebase/firebaseConfig.js
```

This file is intentionally ignored by Git and must never be committed. Each
developer creates it locally for the Firebase project
`join-issue-collector-b5f54`.

### Retrieve the configuration with the Firebase CLI

Check Node.js and the current Firebase CLI:

```powershell
node --version
npx -y firebase-tools@latest --version
```

Sign in and select the Issue Collector project:

```powershell
npx -y firebase-tools@latest login
npx -y firebase-tools@latest projects:list
npx -y firebase-tools@latest use join-issue-collector-b5f54
```

List the registered apps and copy the App ID of the `WEB` app:

```powershell
npx -y firebase-tools@latest apps:list --project join-issue-collector-b5f54
$appId = "PASTE_THE_WEB_APP_ID_HERE"
```

Retrieve the SDK configuration and create the ignored local file:

```powershell
$config = (
  npx -y firebase-tools@latest apps:sdkconfig WEB $appId --project join-issue-collector-b5f54 |
  Out-String
).Trim()

"window.joinFirebaseConfig = $config;`r`n" |
  Set-Content -Encoding utf8 .\components\js\firebase\firebaseConfig.js
```

Verify the generated file without printing all configuration values:

```powershell
Test-Path .\components\js\firebase\firebaseConfig.js
node --check .\components\js\firebase\firebaseConfig.js
Select-String -Path .\components\js\firebase\firebaseConfig.js -Pattern "projectId|authDomain"
git check-ignore -v .\components\js\firebase\firebaseConfig.js
```

The checked-in workflow exports target the reference project
`join-issue-collector-b5f54`. When using another Firebase project, update the
project ID in `.firebaserc`, both workflow URLs and the local web
configuration. If the reference project does not appear in `projects:list`,
ask a Firebase project owner to add your Google account.

Without the local configuration file, email/password login, guest login,
Firestore tasks and Firestore contacts are unavailable.

> [!IMPORTANT]
> Never commit passwords, private credentials, service-account files, API
> secrets or admin keys to this repository.

### Configure Firebase services

1. Enable **Email/Password** and **Anonymous** under
   `Authentication` -> `Sign-in method`.
2. Create the Cloud Firestore database in production mode.
3. Deploy the checked-in rules and indexes:

   ```powershell
   npx -y firebase-tools@latest deploy --only firestore --project join-issue-collector-b5f54
   ```

4. Create a dedicated Email/Password Authentication user for n8n. The workflow
   expects the address `n8n-bot@join.local`; its password belongs only in n8n.

The `tasks` and `contacts` collections are created when the application
writes their first documents. The email workflow creates one
`automationQuota/YYYY-MM-DD` document per Europe/Berlin calendar day.
Authenticated team members may manage board data. Only the dedicated n8n user
may create email tickets or increment the quota. The public stakeholder page
can read only the quota documents needed to display the daily usage.

### Troubleshooting: Unauthorized OAuth domain

If the browser console reports that the current domain is not authorized for
OAuth operations, check the address used to open Join. Firebase treats
`localhost` and `127.0.0.1` as different domains.

Use the local address from this guide whenever possible:

```text
http://localhost:5500/index.html
```

If Join must be opened through `127.0.0.1`, add `127.0.0.1` in the Firebase
Console under `Authentication` -> `Settings` -> `Authorized domains`. Enter
only the hostname, without `http://`, a port or a path.

This warning primarily affects OAuth popup and redirect operations. It does
not mean that credentials should be added to the repository.

## n8n Setup

The repository contains two importable n8n workflows:

```text
n8n/workflows/email-to-triage-ticket.json
n8n/workflows/task-status-notification.json
```

The exports are inactive and sanitized. Import them through **Import from
File** in a local or hosted n8n instance. Importing a new export creates a
separate workflow; it does not update an existing live workflow automatically.
Before publishing the email workflow:

1. Connect the Gmail nodes to the dedicated stakeholder inbox credential.
2. Connect `Ollama Model` to an Ollama credential or replace it with a compatible
   chat model.
3. Create the dedicated Firebase Authentication user `n8n-bot@join.local`.
4. In `Sign in n8n bot`, replace the Firebase Web API key and bot-password
   placeholders only inside n8n.
5. Publish the repository's `firestore.rules` in the Firebase project before
   testing `Reserve daily quota slot`.
6. Create the Gmail labels `erledigt` and `zu bearbeiten`, then select the
   matching labels in `Label processed email`, `Label failed email` and
   `Label limited email`.

Keep all three Code nodes in `Run Once for Each Item` mode:

- `Extract email request`
- `Check daily request limit`
- `Prepare Firestore task`

The central success path must be connected in this order:

```text
Watch inbox -> Extract email -> Check limit -> Sign in n8n bot
-> Reserve quota slot -> Classify with AI -> Prepare task
-> Create Firestore ticket -> Confirm -> Label -> Archive -> Mark as read
```

The current stakeholder inbox is:

```text
join.issue.collector.mail@gmail.com
```

The workflow polls unread stakeholder emails once per minute, extracts sender,
subject and body, enforces the 10-request limit, classifies the request with AI
and creates a Firestore ticket in `Triage`. Every Gmail item is processed
independently when one poll returns several messages. A local workflow-state
guard rejects an already exhausted day before authentication or an AI call.
Accepted requests then increment the shared Firestore quota atomically before
classification. The Firestore value drives the public landing-page counter.

On success the workflow sends a confirmation, adds the `erledigt` label,
removes `INBOX` and marks the original message as read. Malformed or incomplete
AI output, invalid deadlines and technical failures are labeled
`zu bearbeiten`, removed from `INBOX`, kept unread and followed by an error
notification. The limit branch sends a separate notification and moves the
unread request to `zu bearbeiten` without creating a ticket.

Credential IDs, the Firebase Web API key, the Firebase bot password and Gmail
label IDs are placeholders in the committed JSON. Configure them only inside
n8n and sanitize every later workflow export before committing it.

Test the imported draft manually before publishing it. The orange
`Execute workflow` button tests the draft; automatic polling and production
webhooks run only after the workflow is published and active.

### Status-change notifications

Import `task-status-notification.json`, connect `Send status email` to the
stakeholder Gmail credential and replace the Firebase Web API key and bot
password placeholders inside `Sign in n8n bot`. Activate the workflow and copy
its production webhook URL.

Add that URL only to the ignored local Firebase configuration file:

```js
window.joinN8nStatusWebhookUrl = "PASTE_N8N_PRODUCTION_WEBHOOK_URL";
```

The board requests this webhook only after a task move was saved. The browser
sends the task id and old/new status, while n8n loads the trusted creator email
from Firestore. Internal and external creators with an email address receive a
notification; guests and legacy tasks without an address are skipped.

## Usage

- Create an account or use the guest login.
- Choose the stakeholder route to open an email addressed to the dedicated
  issue inbox and view the current daily automation usage.
- Review task totals and the next deadline on the Summary page.
- Create a task through Add Task or from a Board column.
- Assign contacts, choose a priority and add subtasks.
- Move task cards between the five workflow columns.
- Open a task card to edit its data or complete individual subtasks.
- Search the board by task title or description.
- Manage contacts from the Contacts page.

Guest and authenticated users work with the same shared Firestore data set.

## Demo and Acceptance Test

The complete manual test sequence is documented in
[`docs/demo-and-acceptance.md`](./docs/demo-and-acceptance.md). It covers the
stakeholder journey, automated and manual Triage tickets, successful and failed
email handling, the daily limit, creator notifications and responsive checks
down to 320 px.

## Project Structure

```text
.
|-- components/
|   |-- assets/
|   |   `-- img/
|   |-- css/
|   |   |-- molecules/
|   |   |-- organisms/
|   |   `-- pages/
|   |-- html/
|   |   |-- atoms/
|   |   |-- molecules/
|   |   |-- organisms/
|   |   |-- pages/
|   |   `-- templates/
|   `-- js/
|       |-- firebase/
|       |   |-- firebaseAuth.mjs
|       |   |-- firebaseContacts.mjs
|       |   `-- firebaseTasks.mjs
|       `-- feature and store modules
|-- tests/
|-- docs/
|   |-- architecture.md
|   `-- demo-and-acceptance.md
|-- n8n/
|   `-- workflows/
|-- addTask.html
|-- board.html
|-- contacts.html
|-- index.html
|-- signup.html
|-- summary.html
|-- base.css
|-- main.js
|-- firebase.json
|-- firestore.rules
`-- README.md
```

## Automated Tests

The repository contains automated tests for important logic paths, including:

- task storage and date normalization
- summary metrics and upcoming deadlines
- board search
- board edit validation
- assignee normalization
- contact names and email validation
- privacy-policy consent
- legal-page language defaults, persistence and synchronization
- asynchronous error handling
- n8n workflow topology, per-item modes and sanitized credentials
- Firestore quota permissions and atomic increments
- repository checks that prevent common credential files and secrets

Run the complete test suite from the project root:

```bash
node --test
```

## Deployment

The repository currently contains Firestore configuration but no Firebase
Hosting target. The static frontend can be served by Firebase Hosting or
another HTTPS-capable static host after its deployment configuration is added.

Before deployment, configure the production domain in Firebase Authentication,
set the production status-webhook URL only in the deployment's untracked
`firebaseConfig.js`, publish both n8n workflows, run the automated tests and
complete the manual acceptance test on desktop and mobile.

## Learning Goals

Join is a team-based frontend learning project. Important practice areas are:

- translating a Figma design into responsive interfaces
- structuring markup with Atomic Design
- writing small and focused JavaScript functions
- separating rendering, persistence and Firebase adapters
- implementing authentication and shared Firestore data
- handling asynchronous errors with clear user feedback
- validating forms and maintaining accessible interactions
- testing central application logic automatically
- collaborating through Git, GitHub and task-based workflows
