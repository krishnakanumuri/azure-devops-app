import client from './client';
import type { BuildTimeline, BuildLog } from '../types/devops';

export interface BuildDetail {
  id: number;
  buildNumber: string;
  definition: { id: number; name: string };
  project: { id: string; name: string };
}

export async function getBuildById(project: string, buildId: number): Promise<BuildDetail> {
  const { data } = await client.get<BuildDetail>(
    `/${encodeURIComponent(project)}/_apis/build/builds/${buildId}?api-version=7.1`,
  );
  return data;
}

export async function getTimeline(project: string, buildId: number): Promise<BuildTimeline> {
  const { data } = await client.get<BuildTimeline>(
    `/${encodeURIComponent(project)}/_apis/build/builds/${buildId}/timeline?api-version=7.1`,
  );
  return data;
}

export async function getLogs(project: string, buildId: number): Promise<BuildLog[]> {
  const { data } = await client.get<{ value: BuildLog[]; count: number }>(
    `/${encodeURIComponent(project)}/_apis/build/builds/${buildId}/logs?api-version=7.1`,
  );
  return data.value;
}

export async function getLog(
  project: string,
  buildId: number,
  logId: number,
): Promise<string> {
  const { data } = await client.get<string>(
    `/${encodeURIComponent(project)}/_apis/build/builds/${buildId}/logs/${logId}?api-version=7.1`,
    { headers: { Accept: 'text/plain' }, responseType: 'text' },
  );
  return data;
}
