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
- [Requirements](#requirements)
- [Quickstart](#quickstart)
- [Firebase Setup](#firebase-setup)
- [n8n Setup](#n8n-setup)
- [Usage](#usage)
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
| Firebase Hosting        | Public deployment of the application                           |
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

## Requirements

- A modern web browser
- A local development server, such as the VS Code Live Server extension
- Node.js when running the automated tests or Firebase CLI commands
- An internet connection for Firebase Authentication and Firestore
- Access to the `join-issue-collector-b5f54` Firebase project for local Firebase setup
- A local or hosted n8n instance for the email collector workflow

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

The configuration must reference the Firebase project
`join-issue-collector-b5f54`. If the project does not appear in
`projects:list`, ask a Firebase project owner to add your Google account.

Without the local configuration file, email/password login, guest login,
Firestore tasks and Firestore contacts are unavailable.

> [!IMPORTANT]
> Never commit passwords, private credentials, service-account files, API
> secrets or admin keys to this repository.

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

The repository contains an importable n8n workflow for the stakeholder email collector:

```text
n8n/workflows/email-to-triage-ticket.json
```

The workflow is inactive by default and contains no secrets. Import it through
**Import from File** in a local or hosted n8n instance. Before activating it:

1. Connect the Gmail nodes to the dedicated stakeholder inbox credential.
2. Connect `Ollama Model` to an Ollama credential or replace it with a compatible
   chat model.
3. Create the dedicated Firebase Authentication user `n8n-bot@join.local`.
4. In `Sign in n8n bot`, replace the Firebase Web API key and bot-password
   placeholders only inside n8n.
5. Publish the repository's `firestore.rules` in the Firebase project.
6. Create the Gmail labels `erledigt` and `zu bearbeiten`, then select the
   `erledigt` label again in `Label processed email`.

The current stakeholder inbox is:

```text
join.issue.collector.mail@gmail.com
```

The workflow watches unread stakeholder emails, extracts sender, subject and
body, enforces the public 10-request daily automation limit, classifies the
request with AI and creates a Firestore ticket in `Triage`. On success it sends
a confirmation, adds the `erledigt` label, removes `INBOX` and marks the original
message as read. The limit branch sends a separate notification.

Credential IDs, the Firebase Web API key, the Firebase bot password and Gmail
label IDs are placeholders in the committed JSON. Configure them only inside
n8n and sanitize every later workflow export before committing it.

## Usage

- Create an account or use the guest login.
- Review task totals and the next deadline on the Summary page.
- Create a task through Add Task or from a Board column.
- Assign contacts, choose a priority and add subtasks.
- Move task cards between the five workflow columns.
- Open a task card to edit its data or complete individual subtasks.
- Search the board by task title or description.
- Manage contacts from the Contacts page.

Guest and authenticated users work with the same shared Firestore data set.

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
|       |-- firebaseAuth.mjs
|       |-- firebaseContacts.mjs
|       |-- firebaseTasks.mjs
|       `-- feature and store modules
|-- tests/
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

Run the complete test suite from the project root:

```bash
node --test
```

## Deployment

The application is prepared for Firebase Hosting. A public deployment URL has
not been configured for this fork yet.

Before a deployment, verify the working tree, run the automated tests and test
the main user stories on desktop and mobile resolutions.

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
