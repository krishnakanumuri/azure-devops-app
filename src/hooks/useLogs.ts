import { useState, useCallback } from 'react';
import { getLog } from '../api';

export function useLogs(project: string, buildId: number, logId: number) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await getLog(project, buildId, logId);
      setLines(text.split('\n'));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [project, buildId, logId]);

  return { lines, loading, error, fetch };
}
