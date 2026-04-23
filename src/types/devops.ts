// ── Projects ──────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description?: string;
  state: string;
  url: string;
}

// ── Pipelines ─────────────────────────────────────────────────────────────────
export interface Pipeline {
  id: number;
  name: string;
  folder: string;
  revision: number;
  url: string;
  configuration?: {
    type: string;
    path?: string;
    repository?: { type: string };
  };
}

// ── Runs ──────────────────────────────────────────────────────────────────────
export type RunState = 'unknown' | 'inProgress' | 'canceling' | 'completed';
export type RunResult = 'unknown' | 'succeeded' | 'failed' | 'canceled';

export interface PipelineRun {
  id: number;
  name: string;
  state: RunState;
  result?: RunResult;
  createdDate: string;
  finishedDate?: string;
  pipeline: { id: number; name: string; folder: string; url: string };
  requestedFor?: { id: string; displayName: string; uniqueName?: string };
  resources?: {
    repositories?: {
      self?: { refName?: string; version?: string };
    };
  };
  variables?: Record<string, { value: string; isSecret?: boolean }>;
  templateParameters?: Record<string, string>;
  _links?: Record<string, { href: string }>;
}

export interface QueueRunPayload {
  resources?: {
    repositories?: {
      self?: { refName?: string };
    };
  };
  stagesToSkip?: string[];
  variables?: Record<string, { value: string; isSecret?: boolean }>;
  templateParameters?: Record<string, string>;
}

// ── Build timeline ────────────────────────────────────────────────────────────
export type TimelineRecordState = 'pending' | 'inProgress' | 'completed';
export type TimelineRecordResult =
  | 'succeeded'
  | 'succeededWithIssues'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'abandoned';
export type TimelineRecordType =
  | 'Stage'
  | 'Phase'
  | 'Job'
  | 'Task'
  | 'Checkpoint'
  | 'DeploymentJob';

export interface TimelineRecord {
  id: string;
  parentId?: string;
  type: TimelineRecordType;
  name: string;
  displayName?: string;
  state: TimelineRecordState;
  result?: TimelineRecordResult;
  startTime?: string;
  finishTime?: string;
  order: number;
  log?: { id: number; url: string };
  errorCount: number;
  warningCount: number;
  issues?: Array<{ type: 'error' | 'warning'; message: string; data?: Record<string, string> }>;
}

export interface BuildTimeline {
  id: string;
  records: TimelineRecord[];
}

// ── Build logs ────────────────────────────────────────────────────────────────
export interface BuildLog {
  id: number;
  type: string;
  url: string;
  createdOn: string;
  lastChangedOn: string;
  lineCount: number;
}
