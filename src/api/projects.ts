import client from './client';
import type { Project } from '../types/devops';

export async function getProjects(): Promise<Project[]> {
  const { data } = await client.get<{ value: Project[]; count: number }>(
    '/_apis/projects?api-version=7.1&$top=200',
  );
  return data.value;
}
