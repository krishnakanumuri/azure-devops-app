import client from './client';
import type { PipelineRun, RunState, RunResult, QueueRunPayload } from '../types/devops';

interface BuildListItem {
  id: number;
  buildNumber: string;
  status: string;
  result?: string;
  queueTime: string;
  startTime?: string;
  finishTime?: string;
  sourceBranch?: string;
  requestedFor?: { id: string; displayName: string; uniqueName?: string };
  definition: { id: number; name: string; path: string; url: string };
  variables?: Record<string, { value: string; isSecret?: boolean }>;
}

function mapBuildStatus(status: string): RunState {
  if (status === 'inProgress') return 'inProgress';
  if (status === 'completed') return 'completed';
  if (status === 'cancelling') return 'canceling';
  return 'unknown';
}

function mapBuildResult(result?: string): RunResult | undefined {
  if (!result || result === 'none') return undefined;
  if (result === 'succeeded' || result === 'partiallySucceeded') return 'succeeded';
  if (result === 'failed') return 'failed';
  if (result === 'canceled') return 'canceled';
  return 'unknown';
}

export async function getRuns(project: string, pipelineId: number): Promise<PipelineRun[]> {
  const { data } = await client.get<{ value: BuildListItem[]; count: number }>(
    `/${encodeURIComponent(project)}/_apis/build/builds?definitions=${pipelineId}&$top=50&api-version=7.1`,
  );
  return data.value.map(b => ({
    id: b.id,
    name: b.buildNumber,
    state: mapBuildStatus(b.status),
    result: mapBuildResult(b.result),
    createdDate: b.queueTime,
    finishedDate: b.finishTime,
    pipeline: { id: b.definition.id, name: b.definition.name, folder: b.definition.path, url: b.definition.url },
    requestedFor: b.requestedFor,
    resources: b.sourceBranch
      ? { repositories: { self: { refName: b.sourceBranch } } }
      : undefined,
  }));
}

export async function getRun(
  project: string,
  pipelineId: number,
  runId: number,
): Promise<PipelineRun> {
  const { data } = await client.get<PipelineRun>(
    `/${encodeURIComponent(project)}/_apis/pipelines/${pipelineId}/runs/${runId}?api-version=7.1`,
  );
  return data;
}

export async function queueRun(
  project: string,
  pipelineId: number,
  payload: QueueRunPayload,
): Promise<PipelineRun> {
  const { data } = await client.post<PipelineRun>(
    `/${encodeURIComponent(project)}/_apis/pipelines/${pipelineId}/runs?api-version=7.1`,
    payload,
  );
  return data;
}
