import client from './client';
import type { Pipeline } from '../types/devops';

export async function getPipelines(project: string): Promise<Pipeline[]> {
  const { data } = await client.get<{ value: Pipeline[]; count: number }>(
    `/${encodeURIComponent(project)}/_apis/pipelines?api-version=7.1&$top=500`,
  );
  return data.value;
}

export async function getPipeline(project: string, pipelineId: number): Promise<Pipeline> {
  const { data } = await client.get<Pipeline>(
    `/${encodeURIComponent(project)}/_apis/pipelines/${pipelineId}?api-version=7.1`,
  );
  return data;
}
