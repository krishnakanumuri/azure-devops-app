import { useState, useCallback } from 'react';
import { getRun, getTimeline } from '../api';
import type { PipelineRun, BuildTimeline } from '../types/devops';

export function useRunDetails(project: string, pipelineId: number, runId: number) {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [timeline, setTimeline] = useState<BuildTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const runData = await getRun(project, pipelineId, runId);
      setRun(runData);
      // run ID == build ID for the builds API
      const timelineData = await getTimeline(project, runData.id);
      setTimeline(timelineData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [project, pipelineId, runId]);

  return { run, timeline, loading, error, fetch };
}
