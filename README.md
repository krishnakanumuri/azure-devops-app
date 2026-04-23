# Azure DevOps Pipeline Manager

A React Native mobile app (iOS, Android, and Web) for managing Azure DevOps pipelines.

## Features

- **PAT Authentication** — sign in with your Azure DevOps organisation URL and a Personal Access Token; no Azure AD app registration required
- **Browse projects** — list all accessible projects in your organisation
- **Pipeline list** — view all pipelines per project with search/filter
- **Run history** — list all runs for a pipeline with status, branch, and duration
- **Run details** — expandable stage → job → task timeline with status badges
- **Log viewer** — full task log with error lines highlighted in red (`##[error]` prefix)
- **Errors tab** — filtered view of all failed/errored records in a run
- **Queue a run** — choose branch, set key-value variables, select stages to run
- **Retry a run** — re-queue an existing run pre-filled with its branch and variables

## Tech Stack

All libraries are **MIT-licensed** and verified **0 known vulnerabilities** (`npm audit`).

| Library | Purpose |
|---|---|
| `react-native` 0.85 | Core framework |
| `@react-navigation/native-stack` | Screen navigation |
| `zustand` | Global auth state |
| `axios` | Azure DevOps REST API client (PAT Basic auth) |
| `@react-native-async-storage/async-storage` | PAT/org URL persistence |
| `react-native-web` + `webpack` | Web browser target |
| `@react-native-clipboard/clipboard` | Copy logs to clipboard |

## Getting Started

### Prerequisites

- Node.js >= 22
- For Android: Android Studio + emulator or physical device
- For iOS: macOS + Xcode

### Install

```bash
npm install
```

### Generate a PAT in Azure DevOps

1. Open Azure DevOps -> **User Settings** -> **Personal Access Tokens**
2. Create a new token with:
   - **Build**: Read & Execute
   - **Project and Team**: Read
3. Copy the token and paste it into the app login screen

### Run

```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Web browser — http://localhost:3000
npm run web

# Web production bundle -> web-dist/
npm run web:build
```

## Project Structure

```
src/
  api/          Axios client + Azure DevOps REST API functions
  store/        Zustand auth store (persisted to AsyncStorage)
  navigation/   Root / Auth / Main navigators
  screens/      7 screens: Login, Projects, Pipelines, Runs, RunDetails, LogViewer, QueueRun
  components/   Shared UI: StatusBadge, RunCard, TimelineItem, LogLine, etc.
  hooks/        Data-fetching hooks per resource type
  types/        TypeScript types (devops.ts, navigation.ts)
  theme.ts      Colours, spacing, fonts
web/
  index.html    Web entry HTML
  index.js      React Native Web bootstrap
webpack.config.js   Web bundler + CORS dev proxy
```

## CORS Note (Web target)

Azure DevOps blocks direct cross-origin browser requests. The webpack dev server
proxies `/ado/*` to `https://dev.azure.com/*` automatically during development.

For production web deployment you need a reverse proxy, e.g. nginx, Azure API
Management, or Azure Front Door sitting in front of the app.

## Azure DevOps APIs Used (api-version 7.1)

| Feature | Endpoint |
|---|---|
| List projects | `GET /_apis/projects` |
| List pipelines | `GET /{project}/_apis/pipelines` |
| Get pipeline | `GET /{project}/_apis/pipelines/{id}` |
| List runs | `GET /{project}/_apis/pipelines/{id}/runs` |
| Get run | `GET /{project}/_apis/pipelines/{id}/runs/{runId}` |
| Queue / retry run | `POST /{project}/_apis/pipelines/{id}/runs` |
| Build timeline | `GET /{project}/_apis/build/builds/{id}/timeline` |
| Log list | `GET /{project}/_apis/build/builds/{id}/logs` |
| Single log | `GET /{project}/_apis/build/builds/{id}/logs/{logId}` |
