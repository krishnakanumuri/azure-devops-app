import { useState, useCallback } from 'react';
import { getPipelines } from '../api';
import type { Pipeline } from '../types/devops';

export function usePipelines(project: string) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPipelines(project);
      setPipelines(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [project]);

  return { pipelines, loading, error, fetch };
}
