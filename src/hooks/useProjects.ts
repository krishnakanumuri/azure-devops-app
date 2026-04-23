import { useState, useCallback } from 'react';
import { getProjects } from '../api';
import type { Project } from '../types/devops';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects([...data].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { projects, loading, error, fetch };
}
