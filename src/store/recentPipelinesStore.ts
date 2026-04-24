import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Pipeline } from '../types/devops';

const RECENT_KEY = 'ado_recent_pipelines';
const MAX_RECENT = 5;

type ByProject = Record<string, Pipeline[]>;

interface RecentPipelinesState {
  recentByProject: ByProject;
  addRecentPipeline: (projectName: string, pipeline: Pipeline) => Promise<void>;
  getRecent: (projectName: string) => Pipeline[];
  loadStored: () => Promise<void>;
}

export const useRecentPipelinesStore = create<RecentPipelinesState>((set, get) => ({
  recentByProject: {},

  addRecentPipeline: async (projectName, pipeline) => {
    const current = get().recentByProject;
    const existing = current[projectName] ?? [];
    const deduped = existing.filter(p => p.id !== pipeline.id);
    const updated = { ...current, [projectName]: [pipeline, ...deduped].slice(0, MAX_RECENT) };
    set({ recentByProject: updated });
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  },

  getRecent: (projectName) => get().recentByProject[projectName] ?? [],

  loadStored: async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      if (raw) set({ recentByProject: JSON.parse(raw) as ByProject });
    } catch {
      // ignore corrupt storage
    }
  },
}));
