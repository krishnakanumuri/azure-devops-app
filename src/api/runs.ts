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

function mapBuild(b: BuildListItem): PipelineRun {
  return {
    id: b.id,
    name: b.buildNumber,
    state: mapBuildStatus(b.status),
    result: mapBuildResult(b.result),
    createdDate: b.queueTime,
    finishedDate: b.finishTime,
    pipeline: { id: b.definition.id, name: b.definition.name, folder: b.definition.path, url: b.definition.url },
    requestedFor: b.requestedFor,
    variables: b.variables,
    resources: b.sourceBranch
      ? { repositories: { self: { refName: b.sourceBranch } } }
      : undefined,
  };
}

export async function getRuns(project: string, pipelineId: number): Promise<PipelineRun[]> {
  const base = `/${encodeURIComponent(project)}/_apis/build/builds?definitions=${pipelineId}&api-version=7.1`;

  const [activeRes, completedRes] = await Promise.all([
    client.get<{ value: BuildListItem[] }>(`${base}&statusFilter=inProgress,notStarted,cancelling&$top=10`),
    client.get<{ value: BuildListItem[] }>(`${base}&statusFilter=completed&$top=50`),
  ]);

  const seen = new Set<number>();
  const merged: PipelineRun[] = [];
  for (const b of [...activeRes.data.value, ...completedRes.data.value]) {
    if (!seen.has(b.id)) {
      seen.add(b.id);
      merged.push(mapBuild(b));
    }
  }
  return merged;
}

export async function getRun(
  project: string,
  _pipelineId: number,
  runId: number,
): Promise<PipelineRun> {
  const { data } = await client.get<BuildListItem>(
    `/${encodeURIComponent(project)}/_apis/build/builds/${runId}?api-version=7.1`,
  );
  return mapBuild(data);
}

export async function getPipelineRunDetails(
  project: string,
  pipelineId: number,
  runId: number,
): Promise<{ templateParameters?: Record<string, string> }> {
  const { data } = await client.get<{ templateParameters?: Record<string, string> }>(
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
