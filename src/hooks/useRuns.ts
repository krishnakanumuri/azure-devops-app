import { useState, useCallback } from 'react';
import { getRuns } from '../api';
import type { PipelineRun } from '../types/devops';

export function useRuns(project: string, pipelineId: number) {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRuns(project, pipelineId);
      setRuns(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [project, pipelineId]);

  return { runs, loading, error, fetch };
}
